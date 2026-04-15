package com.synapse.chat_application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.chat_application.dto.file.FileUploadResponse;
import com.synapse.chat_application.dto.message.MessageRequest;
import com.synapse.chat_application.dto.message.MessageResponse;
import com.synapse.chat_application.entity.*;
import com.synapse.chat_application.exception.BadRequestException;
import com.synapse.chat_application.exception.ResourceNotFoundException;
import com.synapse.chat_application.exception.UnauthorizedException;
import com.synapse.chat_application.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChannelRepository channelRepository;
    private final DirectMessageRepository directMessageRepository;
    private final UserRepository userRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final RedisMessagePublisher redisPublisher;
    private final RedisMessageSubscriber redisSubscriber;
    private final ObjectMapper objectMapper;

    @Transactional
    public MessageResponse sendMessage(String username, MessageRequest request) {
        User sender = findUser(username);

        if (request.getChannelId() == null && request.getDmThreadId() == null) {
            throw new BadRequestException("Either channelId or dmThreadId must be provided");
        }

        Message message = Message.builder()
                .content(request.getContent())
                .sender(sender)
                .build();

        String redisChannel;
        String stompTopic;

        if (request.getChannelId() != null) {
            Channel channel = channelRepository.findById(request.getChannelId())
                    .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

            // Verify user is a guild member
            if (!guildMemberRepository.existsByUserAndGuild(sender, channel.getGuild())) {
                throw new UnauthorizedException("You are not a member of this guild");
            }

            message.setChannel(channel);
            redisChannel = "channel:" + channel.getId();
            stompTopic = "/topic/channel/" + channel.getId();
        } else {
            DirectMessage dmThread = directMessageRepository.findById(request.getDmThreadId())
                    .orElseThrow(() -> new ResourceNotFoundException("DM thread not found"));

            // Verify user is part of this DM
            if (!dmThread.getUser1().getId().equals(sender.getId())
                    && !dmThread.getUser2().getId().equals(sender.getId())) {
                throw new UnauthorizedException("You are not part of this DM thread");
            }

            message.setDmThread(dmThread);
            redisChannel = "dm:" + dmThread.getId();
            stompTopic = "/topic/dm/" + dmThread.getId();
        }

        message = messageRepository.save(message);

        MessageResponse response = toResponse(message, "SEND");

        // Ensure subscription exists, then publish
        redisSubscriber.subscribe(redisChannel, stompTopic);
        publishToRedis(redisChannel, response);

        return response;
    }

    @Transactional
    public MessageResponse editMessage(String username, UUID messageId, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSender().getUsername().equals(username)) {
            throw new UnauthorizedException("You can only edit your own messages");
        }

        message.setContent(newContent);
        message.setEdited(true);
        message = messageRepository.save(message);

        MessageResponse response = toResponse(message, "EDIT");
        publishToTarget(message, response);

        return response;
    }

    @Transactional
    public MessageResponse deleteMessage(String username, UUID messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSender().getUsername().equals(username)) {
            throw new UnauthorizedException("You can only delete your own messages");
        }

        MessageResponse response = toResponse(message, "DELETE");
        messageRepository.delete(message);

        publishToTarget(message, response);

        return response;
    }

    public List<MessageResponse> getChannelMessages(UUID channelId, int page, int size) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

        // Ensure Redis subscription for this channel
        String redisChannel = "channel:" + channelId;
        String stompTopic = "/topic/channel/" + channelId;
        redisSubscriber.subscribe(redisChannel, stompTopic);

        Page<Message> messages = messageRepository.findByChannelOrderByCreatedAtDesc(
                channel, PageRequest.of(page, size));

        return messages.getContent().stream()
                .map(m -> toResponse(m, null))
                .toList();
    }

    public List<MessageResponse> getDmMessages(UUID dmThreadId, int page, int size) {
        DirectMessage dmThread = directMessageRepository.findById(dmThreadId)
                .orElseThrow(() -> new ResourceNotFoundException("DM thread not found"));

        // Ensure Redis subscription for this DM thread
        String redisChannel = "dm:" + dmThreadId;
        String stompTopic = "/topic/dm/" + dmThreadId;
        redisSubscriber.subscribe(redisChannel, stompTopic);

        Page<Message> messages = messageRepository.findByDmThreadOrderByCreatedAtDesc(
                dmThread, PageRequest.of(page, size));

        return messages.getContent().stream()
                .map(m -> toResponse(m, null))
                .toList();
    }

    // ── Helpers ──────────────────────────────────────────────

    private void publishToTarget(Message message, MessageResponse response) {
        String redisChannel;
        if (message.getChannel() != null) {
            redisChannel = "channel:" + message.getChannel().getId();
        } else if (message.getDmThread() != null) {
            redisChannel = "dm:" + message.getDmThread().getId();
        } else {
            return;
        }
        publishToRedis(redisChannel, response);
    }

    private void publishToRedis(String redisChannel, MessageResponse response) {
        try {
            String json = objectMapper.writeValueAsString(response);
            redisPublisher.publish(redisChannel, json);
        } catch (Exception e) {
            log.error("Failed to publish message to Redis", e);
        }
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private MessageResponse toResponse(Message message, String action) {
        MessageResponse.MessageResponseBuilder builder = MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getUsername())
                .senderAvatarUrl(message.getSender().getAvatarUrl())
                .edited(message.isEdited())
                .createdAt(message.getCreatedAt())
                .action(action);

        if (message.getChannel() != null) {
            builder.channelId(message.getChannel().getId());
        }
        if (message.getDmThread() != null) {
            builder.dmThreadId(message.getDmThread().getId());
        }
        if (message.getAttachment() != null) {
            Attachment att = message.getAttachment();
            builder.attachment(FileUploadResponse.builder()
                    .fileUrl(att.getFileUrl())
                    .publicId(att.getPublicId())
                    .fileName(att.getFileName())
                    .fileType(att.getFileType())
                    .fileSize(att.getFileSize())
                    .build());
        }

        return builder.build();
    }
}

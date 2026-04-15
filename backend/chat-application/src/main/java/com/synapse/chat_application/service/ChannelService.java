package com.synapse.chat_application.service;

import com.synapse.chat_application.dto.guild.ChannelRequest;
import com.synapse.chat_application.dto.guild.ChannelResponse;
import com.synapse.chat_application.entity.Channel;
import com.synapse.chat_application.entity.Guild;
import com.synapse.chat_application.entity.User;
import com.synapse.chat_application.exception.BadRequestException;
import com.synapse.chat_application.exception.ResourceNotFoundException;
import com.synapse.chat_application.exception.UnauthorizedException;
import com.synapse.chat_application.repository.ChannelRepository;
import com.synapse.chat_application.repository.GuildMemberRepository;
import com.synapse.chat_application.repository.GuildRepository;
import com.synapse.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChannelResponse createChannel(String username, UUID guildId, ChannelRequest request) {
        User user = findUser(username);
        Guild guild = findGuild(guildId);

        if (!guild.getOwner().getId().equals(user.getId())) {
            throw new UnauthorizedException("Only the guild owner can create channels");
        }

        Channel channel = Channel.builder()
                .name(request.getName())
                .topic(request.getTopic())
                .guild(guild)
                .build();

        channel = channelRepository.save(channel);
        return toResponse(channel);
    }

    public List<ChannelResponse> getChannels(UUID guildId, String username) {
        User user = findUser(username);
        Guild guild = findGuild(guildId);

        if (!guildMemberRepository.existsByUserAndGuild(user, guild)) {
            throw new UnauthorizedException("You are not a member of this guild");
        }

        return channelRepository.findAllByGuild(guild).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteChannel(String username, UUID guildId, UUID channelId) {
        User user = findUser(username);
        Guild guild = findGuild(guildId);

        if (!guild.getOwner().getId().equals(user.getId())) {
            throw new UnauthorizedException("Only the guild owner can delete channels");
        }

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

        if (!channel.getGuild().getId().equals(guildId)) {
            throw new BadRequestException("Channel does not belong to this guild");
        }

        if (channelRepository.countByGuild(guild) <= 1) {
            throw new BadRequestException("Cannot delete the last channel in a guild");
        }

        channelRepository.delete(channel);
    }

    // ── Helpers ──────────────────────────────────────────────

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Guild findGuild(UUID guildId) {
        return guildRepository.findById(guildId)
                .orElseThrow(() -> new ResourceNotFoundException("Guild not found"));
    }

    private ChannelResponse toResponse(Channel channel) {
        return ChannelResponse.builder()
                .id(channel.getId())
                .name(channel.getName())
                .topic(channel.getTopic())
                .guildId(channel.getGuild().getId())
                .build();
    }
}

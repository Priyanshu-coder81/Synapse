package com.synapse.chat_application.service;

import com.synapse.chat_application.dto.dm.DmThreadResponse;
import com.synapse.chat_application.entity.DirectMessage;
import com.synapse.chat_application.entity.Message;
import com.synapse.chat_application.entity.User;
import com.synapse.chat_application.exception.BadRequestException;
import com.synapse.chat_application.exception.ResourceNotFoundException;
import com.synapse.chat_application.repository.DirectMessageRepository;
import com.synapse.chat_application.repository.MessageRepository;
import com.synapse.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DirectMessageService {

    private final DirectMessageRepository dmRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public DmThreadResponse getOrCreateDmThread(String currentUsername, String targetUsername) {
        if (currentUsername.equals(targetUsername)) {
            throw new BadRequestException("Cannot create a DM thread with yourself");
        }

        User currentUser = findUser(currentUsername);
        User targetUser = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUsername));

        DirectMessage dm = dmRepository.findByUsers(currentUser, targetUser)
                .orElseGet(() -> {
                    // Keep consistent ordering: lower UUID = user1
                    User u1, u2;
                    if (currentUser.getId().compareTo(targetUser.getId()) < 0) {
                        u1 = currentUser;
                        u2 = targetUser;
                    } else {
                        u1 = targetUser;
                        u2 = currentUser;
                    }

                    DirectMessage newDm = DirectMessage.builder()
                            .user1(u1)
                            .user2(u2)
                            .build();
                    return dmRepository.save(newDm);
                });

        return toDmThreadResponse(dm, currentUser);
    }

    public List<DmThreadResponse> getDmThreadsForUser(String username) {
        User user = findUser(username);
        return dmRepository.findAllByUser(user).stream()
                .map(dm -> toDmThreadResponse(dm, user))
                .toList();
    }

    // ── Helpers ──────────────────────────────────────────────

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private DmThreadResponse toDmThreadResponse(DirectMessage dm, User currentUser) {
        User otherUser = dm.getUser1().getId().equals(currentUser.getId())
                ? dm.getUser2()
                : dm.getUser1();

        // Get the latest message for preview
        var lastPage = messageRepository.findByDmThreadOrderByCreatedAtDesc(
                dm, PageRequest.of(0, 1));

        String lastMessage = null;
        java.time.Instant lastMessageAt = null;
        if (!lastPage.isEmpty()) {
            Message last = lastPage.getContent().get(0);
            lastMessage = last.getContent();
            lastMessageAt = last.getCreatedAt();
        }

        return DmThreadResponse.builder()
                .id(dm.getId())
                .otherUserId(otherUser.getId())
                .otherUsername(otherUser.getUsername())
                .otherAvatarUrl(otherUser.getAvatarUrl())
                .lastMessage(lastMessage)
                .lastMessageAt(lastMessageAt)
                .build();
    }
}

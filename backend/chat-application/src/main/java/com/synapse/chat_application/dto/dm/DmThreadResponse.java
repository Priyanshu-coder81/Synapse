package com.synapse.chat_application.dto.dm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DmThreadResponse {

    private UUID id;
    private UUID otherUserId;
    private String otherUsername;
    private String otherAvatarUrl;
    private String lastMessage;
    private Instant lastMessageAt;
}

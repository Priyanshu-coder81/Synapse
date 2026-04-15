package com.synapse.chat_application.dto.message;

import com.synapse.chat_application.dto.file.FileUploadResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageResponse {

    private UUID id;
    private String content;
    private UUID senderId;
    private String senderUsername;
    private String senderAvatarUrl;
    private UUID channelId;
    private UUID dmThreadId;
    private boolean edited;
    private Instant createdAt;
    private FileUploadResponse attachment;

    /** Action type for WebSocket events: SEND, EDIT, DELETE */
    private String action;
}

package com.synapse.chat_application.dto.message;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor
public class MessageRequest {

    @NotBlank(message = "Message content is required")
    private String content;

    /** Set for channel messages, null for DMs */
    private UUID channelId;

    /** Set for DM messages, null for channel messages */
    private UUID dmThreadId;
}

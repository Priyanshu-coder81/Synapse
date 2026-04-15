package com.synapse.chat_application.controller;

import com.synapse.chat_application.dto.message.MessageRequest;
import com.synapse.chat_application.dto.message.MessageResponse;
import com.synapse.chat_application.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;

    /**
     * Receives a new message via WebSocket STOMP.
     * Client sends to: /app/chat.send
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload MessageRequest request, Principal principal) {
        messageService.sendMessage(principal.getName(), request);
    }

    /**
     * Edit a message via WebSocket STOMP.
     * Client sends to: /app/chat.edit
     * Payload must include messageId and new content.
     */
    @MessageMapping("/chat.edit")
    public void editMessage(@Payload EditPayload payload, Principal principal) {
        messageService.editMessage(principal.getName(), payload.getMessageId(), payload.getContent());
    }

    /**
     * Delete a message via WebSocket STOMP.
     * Client sends to: /app/chat.delete
     */
    @MessageMapping("/chat.delete")
    public void deleteMessage(@Payload DeletePayload payload, Principal principal) {
        messageService.deleteMessage(principal.getName(), payload.getMessageId());
    }

    // ── Inner payload classes ────────────────────────────────

    @lombok.Data
    public static class EditPayload {
        private UUID messageId;
        private String content;
    }

    @lombok.Data
    public static class DeletePayload {
        private UUID messageId;
    }
}

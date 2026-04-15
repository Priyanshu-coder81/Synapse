package com.synapse.chat_application.controller;

import com.synapse.chat_application.dto.message.MessageResponse;
import com.synapse.chat_application.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessageRestController {

    private final MessageService messageService;

    @GetMapping("/channels/{channelId}/messages")
    public ResponseEntity<List<MessageResponse>> getChannelMessages(
            @PathVariable UUID channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(messageService.getChannelMessages(channelId, page, size));
    }

    @GetMapping("/dm/{threadId}/messages")
    public ResponseEntity<List<MessageResponse>> getDmMessages(
            @PathVariable UUID threadId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(messageService.getDmMessages(threadId, page, size));
    }
}

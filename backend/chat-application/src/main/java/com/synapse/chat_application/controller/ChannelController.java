package com.synapse.chat_application.controller;

import com.synapse.chat_application.dto.guild.ChannelRequest;
import com.synapse.chat_application.dto.guild.ChannelResponse;
import com.synapse.chat_application.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/guilds/{guildId}/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @PostMapping
    public ResponseEntity<ChannelResponse> createChannel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID guildId,
            @Valid @RequestBody ChannelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(channelService.createChannel(userDetails.getUsername(), guildId, request));
    }

    @GetMapping
    public ResponseEntity<List<ChannelResponse>> getChannels(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID guildId) {
        return ResponseEntity.ok(channelService.getChannels(guildId, userDetails.getUsername()));
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID guildId,
            @PathVariable UUID channelId) {
        channelService.deleteChannel(userDetails.getUsername(), guildId, channelId);
        return ResponseEntity.noContent().build();
    }
}

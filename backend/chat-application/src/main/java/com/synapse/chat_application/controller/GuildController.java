package com.synapse.chat_application.controller;

import com.synapse.chat_application.dto.guild.CreateGuildRequest;
import com.synapse.chat_application.dto.guild.GuildMemberResponse;
import com.synapse.chat_application.dto.guild.GuildResponse;
import com.synapse.chat_application.service.GuildService;
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
@RequestMapping("/api/guilds")
@RequiredArgsConstructor
public class GuildController {

    private final GuildService guildService;

    @PostMapping
    public ResponseEntity<GuildResponse> createGuild(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateGuildRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(guildService.createGuild(userDetails.getUsername(), request));
    }

    @GetMapping
    public ResponseEntity<List<GuildResponse>> getMyGuilds(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(guildService.getGuildsForUser(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GuildResponse> getGuild(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(guildService.getGuildById(id, userDetails.getUsername()));
    }

    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<GuildResponse> joinGuild(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String inviteCode) {
        return ResponseEntity.ok(guildService.joinGuild(userDetails.getUsername(), inviteCode));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<GuildMemberResponse>> getMembers(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(guildService.getGuildMembers(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/invite/regenerate")
    public ResponseEntity<GuildResponse> regenerateInvite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(guildService.regenerateInviteCode(id, userDetails.getUsername()));
    }
}

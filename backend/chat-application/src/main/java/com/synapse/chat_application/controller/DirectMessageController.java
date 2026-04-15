package com.synapse.chat_application.controller;

import com.synapse.chat_application.dto.dm.CreateDmRequest;
import com.synapse.chat_application.dto.dm.DmThreadResponse;
import com.synapse.chat_application.service.DirectMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
public class DirectMessageController {

    private final DirectMessageService directMessageService;

    @PostMapping
    public ResponseEntity<DmThreadResponse> createOrGetDm(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateDmRequest request) {
        return ResponseEntity.ok(
                directMessageService.getOrCreateDmThread(
                        userDetails.getUsername(), request.getTargetUsername()));
    }

    @GetMapping
    public ResponseEntity<List<DmThreadResponse>> getMyDmThreads(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                directMessageService.getDmThreadsForUser(userDetails.getUsername()));
    }
}

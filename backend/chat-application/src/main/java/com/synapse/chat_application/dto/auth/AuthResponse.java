package com.synapse.chat_application.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String username;
    private UUID userId;
}

package com.synapse.chat_application.dto.guild;

import com.synapse.chat_application.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GuildMemberResponse {

    private UUID userId;
    private String username;
    private String avatarUrl;
    private Role role;
    private Instant joinedAt;
}

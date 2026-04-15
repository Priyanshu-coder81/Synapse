package com.synapse.chat_application.dto.guild;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChannelResponse {

    private UUID id;
    private String name;
    private String topic;
    private UUID guildId;
}

package com.synapse.chat_application.dto.dm;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateDmRequest {

    @NotBlank(message = "Target username is required")
    private String targetUsername;
}

package com.synapse.chat_application.dto.guild;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateGuildRequest {

    @NotBlank(message = "Guild name is required")
    @Size(min = 2, max = 100, message = "Guild name must be between 2 and 100 characters")
    private String name;

    private String iconUrl;
}

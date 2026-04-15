package com.synapse.chat_application.dto.file;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FileUploadResponse {

    private String fileUrl;
    private String publicId;
    private String fileName;
    private String fileType;
    private Long fileSize;
}

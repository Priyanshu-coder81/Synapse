package com.synapse.chat_application.repository;

import com.synapse.chat_application.entity.Attachment;
import com.synapse.chat_application.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    Optional<Attachment> findByMessage(Message message);
}

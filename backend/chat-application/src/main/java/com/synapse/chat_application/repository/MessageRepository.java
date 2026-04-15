package com.synapse.chat_application.repository;

import com.synapse.chat_application.entity.Channel;
import com.synapse.chat_application.entity.DirectMessage;
import com.synapse.chat_application.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByChannelOrderByCreatedAtDesc(Channel channel, Pageable pageable);

    Page<Message> findByDmThreadOrderByCreatedAtDesc(DirectMessage dmThread, Pageable pageable);
}

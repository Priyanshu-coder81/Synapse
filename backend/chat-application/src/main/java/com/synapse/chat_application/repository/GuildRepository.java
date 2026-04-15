package com.synapse.chat_application.repository;

import com.synapse.chat_application.entity.Guild;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GuildRepository extends JpaRepository<Guild, UUID> {

    Optional<Guild> findByInviteCode(String inviteCode);
}

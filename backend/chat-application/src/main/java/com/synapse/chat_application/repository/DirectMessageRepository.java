package com.synapse.chat_application.repository;

import com.synapse.chat_application.entity.DirectMessage;
import com.synapse.chat_application.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, UUID> {

    @Query("SELECT dm FROM DirectMessage dm WHERE " +
           "(dm.user1 = :u1 AND dm.user2 = :u2) OR (dm.user1 = :u2 AND dm.user2 = :u1)")
    Optional<DirectMessage> findByUsers(@Param("u1") User u1, @Param("u2") User u2);

    @Query("SELECT dm FROM DirectMessage dm WHERE dm.user1 = :user OR dm.user2 = :user")
    List<DirectMessage> findAllByUser(@Param("user") User user);
}

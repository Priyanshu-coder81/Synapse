package com.synapse.chat_application.repository;

import com.synapse.chat_application.entity.Channel;
import com.synapse.chat_application.entity.Guild;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChannelRepository extends JpaRepository<Channel, UUID> {

    List<Channel> findAllByGuild(Guild guild);

    long countByGuild(Guild guild);
}

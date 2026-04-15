package com.synapse.chat_application.repository;

import com.synapse.chat_application.entity.Guild;
import com.synapse.chat_application.entity.GuildMember;
import com.synapse.chat_application.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GuildMemberRepository extends JpaRepository<GuildMember, UUID> {

    Optional<GuildMember> findByUserAndGuild(User user, Guild guild);

    List<GuildMember> findAllByUser(User user);

    List<GuildMember> findAllByGuild(Guild guild);

    boolean existsByUserAndGuild(User user, Guild guild);
}

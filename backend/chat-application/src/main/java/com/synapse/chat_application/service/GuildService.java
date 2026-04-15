package com.synapse.chat_application.service;

import com.synapse.chat_application.dto.guild.CreateGuildRequest;
import com.synapse.chat_application.dto.guild.GuildMemberResponse;
import com.synapse.chat_application.dto.guild.GuildResponse;
import com.synapse.chat_application.entity.*;
import com.synapse.chat_application.exception.BadRequestException;
import com.synapse.chat_application.exception.ResourceNotFoundException;
import com.synapse.chat_application.exception.UnauthorizedException;
import com.synapse.chat_application.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class GuildService {

    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;

    @Transactional
    public GuildResponse createGuild(String username, CreateGuildRequest request) {
        User owner = findUserByUsername(username);

        Guild guild = Guild.builder()
                .name(request.getName())
                .iconUrl(request.getIconUrl())
                .inviteCode(generateInviteCode())
                .owner(owner)
                .build();

        guild = guildRepository.save(guild);

        // Create OWNER membership
        GuildMember ownerMember = GuildMember.builder()
                .user(owner)
                .guild(guild)
                .role(Role.OWNER)
                .build();
        guildMemberRepository.save(ownerMember);

        // Create default "general" channel
        Channel general = Channel.builder()
                .name("general")
                .topic("General discussion")
                .guild(guild)
                .build();
        channelRepository.save(general);

        return toGuildResponse(guild, 1);
    }

    @Transactional
    public GuildResponse joinGuild(String username, String inviteCode) {
        User user = findUserByUsername(username);

        Guild guild = guildRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid invite code"));

        if (guildMemberRepository.existsByUserAndGuild(user, guild)) {
            throw new BadRequestException("You are already a member of this guild");
        }

        GuildMember member = GuildMember.builder()
                .user(user)
                .guild(guild)
                .role(Role.MEMBER)
                .build();
        guildMemberRepository.save(member);

        int memberCount = guildMemberRepository.findAllByGuild(guild).size();
        return toGuildResponse(guild, memberCount);
    }

    public List<GuildResponse> getGuildsForUser(String username) {
        User user = findUserByUsername(username);
        return guildMemberRepository.findAllByUser(user).stream()
                .map(gm -> {
                    Guild guild = gm.getGuild();
                    int memberCount = guildMemberRepository.findAllByGuild(guild).size();
                    return toGuildResponse(guild, memberCount);
                })
                .toList();
    }

    public GuildResponse getGuildById(UUID guildId, String username) {
        User user = findUserByUsername(username);
        Guild guild = guildRepository.findById(guildId)
                .orElseThrow(() -> new ResourceNotFoundException("Guild not found"));

        if (!guildMemberRepository.existsByUserAndGuild(user, guild)) {
            throw new UnauthorizedException("You are not a member of this guild");
        }

        int memberCount = guildMemberRepository.findAllByGuild(guild).size();
        return toGuildResponse(guild, memberCount);
    }

    public List<GuildMemberResponse> getGuildMembers(UUID guildId, String username) {
        User user = findUserByUsername(username);
        Guild guild = guildRepository.findById(guildId)
                .orElseThrow(() -> new ResourceNotFoundException("Guild not found"));

        if (!guildMemberRepository.existsByUserAndGuild(user, guild)) {
            throw new UnauthorizedException("You are not a member of this guild");
        }

        return guildMemberRepository.findAllByGuild(guild).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    @Transactional
    public GuildResponse regenerateInviteCode(UUID guildId, String username) {
        User user = findUserByUsername(username);
        Guild guild = guildRepository.findById(guildId)
                .orElseThrow(() -> new ResourceNotFoundException("Guild not found"));

        if (!guild.getOwner().getId().equals(user.getId())) {
            throw new UnauthorizedException("Only the guild owner can regenerate invite codes");
        }

        guild.setInviteCode(generateInviteCode());
        guild = guildRepository.save(guild);

        int memberCount = guildMemberRepository.findAllByGuild(guild).size();
        return toGuildResponse(guild, memberCount);
    }

    // ── Helpers ──────────────────────────────────────────────

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String generateInviteCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(ThreadLocalRandom.current().nextInt(chars.length())));
        }
        return sb.toString();
    }

    private GuildResponse toGuildResponse(Guild guild, int memberCount) {
        return GuildResponse.builder()
                .id(guild.getId())
                .name(guild.getName())
                .iconUrl(guild.getIconUrl())
                .inviteCode(guild.getInviteCode())
                .ownerUsername(guild.getOwner().getUsername())
                .memberCount(memberCount)
                .build();
    }

    private GuildMemberResponse toMemberResponse(GuildMember gm) {
        return GuildMemberResponse.builder()
                .userId(gm.getUser().getId())
                .username(gm.getUser().getUsername())
                .avatarUrl(gm.getUser().getAvatarUrl())
                .role(gm.getRole())
                .joinedAt(gm.getJoinedAt())
                .build();
    }
}

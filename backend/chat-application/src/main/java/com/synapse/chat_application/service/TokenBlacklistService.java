package com.synapse.chat_application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "bl:";

    private final StringRedisTemplate redisTemplate;

    /**
     * Adds a token to the Redis blocklist.
     * The key auto-expires when the original token would have expired.
     */
    public void blacklist(String token, long remainingTtlMs) {
        redisTemplate.opsForValue().set(
                BLACKLIST_PREFIX + token,
                "1",
                remainingTtlMs,
                TimeUnit.MILLISECONDS
        );
    }

    /**
     * Checks whether a token has been blocklisted.
     */
    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    }
}

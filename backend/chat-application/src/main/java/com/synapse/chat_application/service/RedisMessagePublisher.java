package com.synapse.chat_application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisMessagePublisher {

    private final StringRedisTemplate redisTemplate;

    /**
     * Publishes a serialized message JSON to a Redis channel.
     *
     * @param redisChannel The Redis channel name (e.g., "channel:{uuid}" or "dm:{uuid}")
     * @param messageJson  The serialized MessageResponse JSON
     */
    public void publish(String redisChannel, String messageJson) {
        log.debug("Publishing to Redis channel [{}]: {}", redisChannel, messageJson);
        redisTemplate.convertAndSend(redisChannel, messageJson);
    }
}

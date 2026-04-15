package com.synapse.chat_application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisMessageSubscriber {

    private final RedisMessageListenerContainer listenerContainer;
    private final SimpMessagingTemplate messagingTemplate;

    /** Tracks active subscriptions so we don't double-subscribe */
    private final Map<String, MessageListener> activeListeners = new ConcurrentHashMap<>();

    /**
     * Subscribe to a Redis channel and forward messages to a STOMP topic.
     *
     * @param redisChannel The Redis channel name (e.g., "channel:{uuid}")
     * @param stompTopic   The STOMP destination (e.g., "/topic/channel/{uuid}")
     */
    public void subscribe(String redisChannel, String stompTopic) {
        if (activeListeners.containsKey(redisChannel)) {
            return; // Already subscribed
        }

        MessageListener listener = (message, pattern) -> {
            String messageJson = new String(message.getBody());
            log.debug("Redis → STOMP [{}]: {}", stompTopic, messageJson);
            messagingTemplate.convertAndSend(stompTopic, messageJson);
        };

        listenerContainer.addMessageListener(listener, new ChannelTopic(redisChannel));
        activeListeners.put(redisChannel, listener);
        log.info("Subscribed to Redis channel [{}] → STOMP [{}]", redisChannel, stompTopic);
    }

    /**
     * Unsubscribe from a Redis channel.
     */
    public void unsubscribe(String redisChannel) {
        MessageListener listener = activeListeners.remove(redisChannel);
        if (listener != null) {
            listenerContainer.removeMessageListener(listener);
            log.info("Unsubscribed from Redis channel [{}]", redisChannel);
        }
    }
}

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  private client: Client | null = null;

  connect(token: string, onConnectCallback?: () => void) {
    // Prevent duplicate connections
    if (this.client && this.client.active) return;

    this.client = new Client({
      // Hooking up the SockJS fallback since Spring Boot uses withSockJS()
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (msg) => console.log('STOMP: ' + msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('Successfully connected to STOMP broker.');
      if (onConnectCallback) onConnectCallback();
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  subscribeToChannel(channelId: string, callback: (message: any) => void) {
    // Dynamic channel subscription (e.g. /topic/channel/123)
    if (!this.client || !this.client.connected) {
      console.warn("Cannot subscribe: STOMP client is not connected.");
      return null;
    }
    
    return this.client.subscribe(`/topic/channel/${channelId}`, (msg) => {
      const parsedBody = JSON.parse(msg.body);
      callback(parsedBody);
    });
  }

  sendMessage(channelId: string, content: string) {
    if (!this.client || !this.client.connected) {
      console.warn("Cannot send message: STOMP client is not connected.");
      return;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ channelId, content })
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      console.log("Disconnected from STOMP broker.");
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketService();

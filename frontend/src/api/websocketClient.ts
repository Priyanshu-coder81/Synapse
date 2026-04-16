import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string, onConnectCallback?: () => void) {
    // Prevent duplicate connections inherently
    if (this.socket && this.socket.connected) return;

    this.socket = io('http://localhost:8080', {
      auth: { token }, // Push JWT securely
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Successfully connected to Express Socket.io backend.');
      if (onConnectCallback) onConnectCallback();
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }

  subscribeToChannel(channelId: string, callback: (message: any) => void) {
    if (!this.socket) {
      console.warn("Cannot subscribe: Socket is not connected.");
      return null;
    }
    
    // Explicitly join real-time room array
    this.socket.emit('join_channel', channelId);
    
    const listener = (msg: any) => callback(msg);
    this.socket.on('receive_message', listener);

    return {
      unsubscribe: () => {
        this.socket?.off('receive_message', listener);
      }
    };
  }

  sendMessage(channelId: string, content: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn("Cannot send message: Socket is not connected.");
      return;
    }
    
    // Dispatch identical object directly backwards replacing STOMP
    this.socket.emit('send_message', { channelId, content });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("Disconnected from Socket.io broker.");
    }
  }
}

// Export singleton instance exactly matching original frontend hook implementation
export const wsClient = new WebSocketService();

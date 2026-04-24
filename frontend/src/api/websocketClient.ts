import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string, onConnectCallback?: () => void) {
    if (this.socket) {
      if (this.socket.connected && onConnectCallback) onConnectCallback();
      return;
    }

    this.socket = io('http://localhost:8080', {
      auth: { token },
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Successfully connected to Socket.io backend.');
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
    
    // Join the channel room
    this.socket.emit('join_channel', channelId);
    
    const listener = (msg: any) => callback(msg);
    this.socket.on('receive_message', listener);

    return {
      unsubscribe: () => {
        this.socket?.off('receive_message', listener);
      }
    };
  }

  leaveChannel(channelId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_channel', channelId);
    }
  }

  sendMessage(channelId: string, content: string) {
    if (!this.socket) {
      console.warn("Cannot send message: Socket is null.");
      return;
    }
    
    this.socket.emit('send_message', { channelId, content });
  }

  // Typing Indicators
  sendTypingStart(channelId: string) {
    this.socket?.emit('typing_start', channelId);
  }

  sendTypingStop(channelId: string) {
    this.socket?.emit('typing_stop', channelId);
  }

  onUserTyping(callback: (data: { username: string; channelId: string }) => void) {
    this.socket?.on('user_typing', callback);
    return () => { this.socket?.off('user_typing', callback); };
  }

  onUserStopTyping(callback: (data: { username: string; channelId: string }) => void) {
    this.socket?.on('user_stop_typing', callback);
    return () => { this.socket?.off('user_stop_typing', callback); };
  }

  // Message deletion
  onMessageDeleted(callback: (data: { messageId: string; channelId: string }) => void) {
    this.socket?.on('message_deleted', callback);
    return () => { this.socket?.off('message_deleted', callback); };
  }

  // Online Presence
  onPresenceUpdate(callback: (data: { userId: string; username: string; status: string }) => void) {
    this.socket?.on('presence_update', callback);
    return () => { this.socket?.off('presence_update', callback); };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("Disconnected from Socket.io broker.");
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketService();

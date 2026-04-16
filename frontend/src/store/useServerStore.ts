import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface ServerMember {
  id: string;
  username: string;
}

interface ServerSummary {
  id: string;
  name: string;
  icon: string;
  channelCount: number;
  memberCount: number;
}

interface ServerDetails {
  id: string;
  name: string;
  icon: string;
  channels: Channel[];
  members: ServerMember[];
  ownerId: string;
}

interface DiscoverServer {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  channelCount: number;
  isJoined: boolean;
}

interface ServerState {
  myServers: ServerSummary[];
  currentServer: ServerDetails | null;
  discoverServers: DiscoverServer[];
  loading: boolean;

  fetchMyServers: () => Promise<void>;
  fetchServerDetails: (id: string) => Promise<void>;
  fetchDiscoverServers: () => Promise<void>;
  joinServer: (id: string) => Promise<void>;
  leaveServer: (id: string) => Promise<void>;
  clearCurrentServer: () => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  myServers: [],
  currentServer: null,
  discoverServers: [],
  loading: false,

  fetchMyServers: async () => {
    try {
      const res = await axiosClient.get('/servers/mine');
      set({ myServers: res.data });
    } catch (e) {
      console.error('Failed to fetch my servers:', e);
    }
  },

  fetchServerDetails: async (id: string) => {
    try {
      set({ loading: true });
      const res = await axiosClient.get(`/servers/${id}`);
      set({ currentServer: res.data, loading: false });
    } catch (e) {
      console.error('Failed to fetch server details:', e);
      set({ loading: false });
    }
  },

  fetchDiscoverServers: async () => {
    try {
      const res = await axiosClient.get('/servers/discover');
      set({ discoverServers: res.data });
    } catch (e) {
      console.error('Failed to fetch discover servers:', e);
    }
  },

  joinServer: async (id: string) => {
    try {
      await axiosClient.post(`/servers/${id}/join`);
      await get().fetchMyServers();
      await get().fetchDiscoverServers();
    } catch (e) {
      console.error('Failed to join server:', e);
    }
  },

  leaveServer: async (id: string) => {
    try {
      await axiosClient.post(`/servers/${id}/leave`);
      set({ currentServer: null });
      await get().fetchMyServers();
      await get().fetchDiscoverServers();
    } catch (e) {
      console.error('Failed to leave server:', e);
    }
  },

  clearCurrentServer: () => set({ currentServer: null }),
}));

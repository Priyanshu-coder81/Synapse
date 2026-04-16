# Synapse — Fix Frontend Bugs & Build Structured Backend

## Background

The current app has a **mock-server.js** backend and a React+Vite frontend. The frontend has **hardcoded servers**, non-functional channel navigation, no server join/leave, static members list, and several WebSocket bugs. The goal is to:

1. Fix all frontend bugs
2. Build a proper structured backend with `servers.json` (2 servers), joinable servers, per-channel chat history
3. Remove hardcoded default servers from frontend — load everything from the API

---

## Frontend Bug Audit

### Bug 1 — GuildSidebar: Hardcoded Servers
- [GuildSidebar.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/navigation/GuildSidebar.tsx#L10-L14)
- Servers are hardcoded as a static array: `Spring Boot User Group`, `React Developers`, `Synapse Dev Logs`
- **Fix**: Fetch servers from `GET /api/servers` (user's joined servers)

### Bug 2 — ChannelSidebar: Hardcoded server name & channels
- [ChannelSidebar.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/guild/ChannelSidebar.tsx#L15-L32)
- Server name is hardcoded as `"Spring Boot User Group"`, channels are static HTML (`general`, `announcements`, `backend-help`)
- Channels don't navigate anywhere — clicking them does nothing
- **Fix**: Fetch server details + channels from `GET /api/servers/:guildId`, make channels clickable

### Bug 3 — ChatArea: WebSocket cleanup race condition
- [ChatArea.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/chat/ChatArea.tsx#L37-L49)
- The `onConnectCallback` returns a cleanup function from `wsClient.subscribeToChannel`, but it's returned **inside the callback, not the useEffect** — so React never calls the unsubscribe
- `wsClient.disconnect()` is called on every channelId change, killing the entire socket connection
- **Fix**: Restructure to properly manage subscription lifecycle without disconnecting on channel switch

### Bug 4 — ChatArea: Messages not scoped to channel
- When switching channels, old messages persist because `setMessages([])` is never called on channel change
- The history fetch replaces but WebSocket `receive_message` listener is global — receives all channels' messages
- **Fix**: Clear messages on channel switch; only append messages matching current channelId

### Bug 5 — ChatArea: No channel name resolution
- [ChatArea.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/chat/ChatArea.tsx#L73)
- Displays `channel-{channelId}` as the channel name instead of the actual channel name
- **Fix**: Either pass channel name as context or look it up from the server data

### Bug 6 — MembersList: Completely static/hardcoded
- [MembersList.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/guild/MembersList.tsx)
- Shows hardcoded "Admin", "Yatha", "Java Master" — has zero connection to actual data
- **Fix**: Fetch server members from `GET /api/servers/:guildId/members`

### Bug 7 — DmSidebar: 2-second polling is aggressive
- [DmSidebar.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/dm/DmSidebar.tsx#L30)
- Polls `GET /api/friends` every 2 seconds — unnecessary load. Same in DmHub.
- **Fix**: Increase interval to 15 seconds (acceptable for a mock backend)

### Bug 8 — GuildView: Doesn't pass guildId to children
- [GuildView.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/pages/GuildView.tsx)
- `ChannelSidebar`, `ChatArea`, and `MembersList` receive no props about which guild is active
- **Fix**: Read `guildId` from URL params and pass to children (or use a store)

### Bug 9 — "Add Server" button is non-functional
- [GuildSidebar.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/navigation/GuildSidebar.tsx#L56-L58)
- The `+` button does nothing
- **Fix**: Open a modal/flow to browse and join available servers

### Bug 10 — "Explore Servers" button is non-functional
- Same file, the Compass button does nothing
- **Fix**: Wire up to show discoverable servers

### Bug 11 — App.css is Vite boilerplate
- [App.css](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/App.css) contains leftover Vite template CSS (`.counter`, `.hero`, `#center`, etc.)
- **Fix**: Delete the file / clear its contents

### Bug 12 — UserProfile: Email is fabricated
- [UserProfile.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/pages/UserProfile.tsx#L109)
- Shows `{username}@synapse.com` — not the user's actual email
- **Fix**: Store email in auth state from registration, display it properly

---

## Proposed Changes

### Backend — Complete Restructure

#### [MODIFY] [mock-server.js](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/backend/express-server/mock-server.js)

Complete rewrite to add:

1. **`servers.json`** — Pre-populated with 2 servers:
   - **Synapse Hub** (id: `server_1`) — channels: `general`, `announcements`, `dev-talk`
   - **Gaming Lounge** (id: `server_2`) — channels: `general`, `game-chat`, `memes`

2. **New API Routes**:
   | Method | Route | Description |
   |--------|-------|-------------|
   | `GET` | `/api/servers/discover` | List all servers available to join |
   | `GET` | `/api/servers/mine` | List servers the current user has joined |
   | `GET` | `/api/servers/:id` | Get server details + its channels |
   | `POST` | `/api/servers/:id/join` | Join a server |
   | `POST` | `/api/servers/:id/leave` | Leave a server |
   | `GET` | `/api/servers/:id/members` | Get server members list |
   | `GET` | `/api/channels/:channelId/messages` | *(existing)* Get channel chat history |

3. **Per-channel chat history** — `chats.json` already stores `channelId` per message; the backend correctly filters. No change needed here.

4. **`servers.json` data format**:
```json
{
  "servers": [
    {
      "id": "server_1",
      "name": "Synapse Hub",
      "icon": "S",
      "channels": [
        { "id": "s1_general", "name": "general", "type": "text" },
        { "id": "s1_announcements", "name": "announcements", "type": "text" },
        { "id": "s1_dev_talk", "name": "dev-talk", "type": "text" }
      ],
      "members": [],
      "ownerId": "u2"
    },
    {
      "id": "server_2",
      "name": "Gaming Lounge",
      "icon": "G",
      "channels": [
        { "id": "s2_general", "name": "general", "type": "text" },
        { "id": "s2_game_chat", "name": "game-chat", "type": "text" },
        { "id": "s2_memes", "name": "memes", "type": "text" }
      ],
      "members": [],
      "ownerId": "u2"
    }
  ]
}
```

#### [NEW] [servers.json](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/backend/express-server/servers.json)
The initial server data file as shown above.

---

### Frontend — Component Rewiring

#### [MODIFY] [GuildSidebar.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/navigation/GuildSidebar.tsx)
- Remove hardcoded servers array
- Fetch from `GET /api/servers/mine` on mount
- Add Server (`+`) → open a join server modal/dropdown
- Explore (`Compass`) → shows all discoverable servers

#### [NEW] `frontend/src/store/useServerStore.ts`
- Zustand store for:
  - `myServers` — user's joined servers
  - `currentServer` — active server details (name, channels, members)
  - `fetchMyServers()`, `fetchServerDetails(id)`, `joinServer(id)`, `leaveServer(id)`

#### [NEW] `frontend/src/components/guild/JoinServerModal.tsx`
- A modal that lists discoverable servers with a "Join" button
- Triggered from the `+` button in `GuildSidebar`

#### [MODIFY] [ChannelSidebar.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/guild/ChannelSidebar.tsx)
- Read `guildId` from URL params
- Fetch server details from store → render dynamic server name + channels
- Make each channel clickable → navigate to `/channels/:guildId/:channelId`
- Highlight the active channel

#### [MODIFY] [ChatArea.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/chat/ChatArea.tsx)
- Fix WebSocket subscription lifecycle (no disconnect on channel switch)
- Clear messages on channel change
- Filter incoming messages to current channel only
- Resolve channel name from server store

#### [MODIFY] [MembersList.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/guild/MembersList.tsx)
- Read `guildId` from URL params
- Fetch members from `GET /api/servers/:guildId/members`
- Render dynamically

#### [MODIFY] [GuildView.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/pages/GuildView.tsx)
- Auto-redirect to the first channel if no `channelId` in URL
- Trigger server data fetch on guildId change

#### [MODIFY] [DmSidebar.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/components/dm/DmSidebar.tsx) + [DmHub.tsx](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/pages/DmHub.tsx)
- Change polling interval from 2s to 15s

#### [DELETE] [App.css](file:///d:/Web%20devlopment/2026PBL/Synapse/Synapse/frontend/src/App.css)
- Remove Vite boilerplate CSS (no component references it anyway since all styles use module-specific CSS files)

---

## User Review Required

> [!IMPORTANT]
> **Server Data**: The 2 pre-built servers will be "Synapse Hub" and "Gaming Lounge". Users start with **no servers joined** and must explicitly join via the `+` button. Happy with these names/structure?

> [!IMPORTANT]
> **Join Server Flow**: I'll implement a simple overlay modal triggered by the `+` button that lists all available servers with Join/Leave buttons. No invite-link system. Is that OK?

> [!WARNING]
> **I will NOT touch the existing DM/Friends system** — it's working correctly. Only reducing the polling interval.

---

## Open Questions

1. Should the "Explore" (Compass) button also open the same join-server modal, or do you want it as a separate page?
2. Should users be auto-joined to any server on registration, or always start with zero servers?

---

## Verification Plan

### Automated Tests
- Start the new backend: `node mock-server.js`
- Start the frontend: `npm run dev`
- Test via browser:
  1. Register a new user → should land on DM hub with empty guild sidebar (no servers)
  2. Click `+` → Join Server modal shows 2 servers
  3. Join "Synapse Hub" → appears in sidebar, click it → see channels (general, announcements, dev-talk)
  4. Click `general` → chat area shows with correct channel name, send messages → persisted in chats.json scoped to channel
  5. Switch to `dev-talk` → messages clear, shows separate history
  6. Click `+` → join "Gaming Lounge" → separate channels, separate chat history
  7. Leave a server → disappears from sidebar
  8. Verify DM/Friends still work as before

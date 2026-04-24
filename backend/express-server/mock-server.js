const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const httpServer = createServer(app);

// Allow frontend
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'https://synapse.neuralnote.online', 'http://synapse.neuralnote.online'], credentials: true }));
app.use(express.json());

const JWT_SECRET = 'super_secret_mock_key';
const DB_FILE = path.join(__dirname, 'chats.json');
const FRIENDS_FILE = path.join(__dirname, 'friends.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const SERVERS_FILE = path.join(__dirname, 'servers.json');

// Initialize text DB files
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
if (!fs.existsSync(FRIENDS_FILE)) fs.writeFileSync(FRIENDS_FILE, JSON.stringify([]));

let MOCK_USERS = {
  'priyanshu': { id: 'u2', username: 'priyanshu', password: '1234', email: 'priyanshu@synapse.com' }
};

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(MOCK_USERS, null, 2));
} else {
    try { MOCK_USERS = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch(e) {}
}

// Load servers
let SERVERS_DATA = { servers: [] };
try { SERVERS_DATA = JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf8')); } catch(e) {}

function saveServers() {
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(SERVERS_DATA, null, 2));
}

// Online presence tracking
const onlineUsers = new Map(); // userId -> { username, socketId }

// Simple Mock Auth Middleware
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({message: 'No token'});
    try {
        req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        next();
    } catch(e) {
        res.status(401).json({message: 'Invalid token'});
    }
};

// =======================
// AUTH ROUTES
// =======================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`[AUTH] Login attempt: ${username}`);
  const user = MOCK_USERS[username];
  
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const accessToken = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
  res.status(200).json({ accessToken, refreshToken: 'dummy_refresh', userId: user.id, email: user.email || '' });
});

app.post('/api/auth/register', (req, res) => {
    const { email, username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    if (MOCK_USERS[username]) return res.status(400).json({ message: 'Username already taken' });
    
    MOCK_USERS[username] = {
        id: 'u_' + Date.now(),
        username,
        password,
        email: email || ''
    };
    
    try { 
        fs.writeFileSync(USERS_FILE, JSON.stringify(MOCK_USERS, null, 2)); 
    } catch(e) {
        console.error('[ERROR] Failed to save users.json:', e);
    }
    
    console.log(`[AUTH] New User Registered: ${username}`);
    res.status(201).json({ message: 'Registration successful!' });
});

app.post('/api/auth/refresh', (req, res) => res.json({ accessToken: 'fake_valid_token' }));

// =======================
// CHAT HISTORY ROUTES
// =======================

app.get('/api/channels/:channelId/messages', (req, res) => {
    try {
        const chats = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const channelChats = chats.filter(c => c.channelId === req.params.channelId);
        res.status(200).json(channelChats.reverse());
    } catch(e) {
        res.status(200).json([]);
    }
});

// Delete a message
app.delete('/api/channels/:channelId/messages/:messageId', requireAuth, (req, res) => {
    try {
        let chats = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const msgIdx = chats.findIndex(c => c.id === req.params.messageId && c.channelId === req.params.channelId);
        
        if (msgIdx === -1) return res.status(404).json({ message: 'Message not found' });
        
        const msg = chats[msgIdx];
        if (msg.senderUsername !== req.user.username) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }
        
        chats.splice(msgIdx, 1);
        fs.writeFileSync(DB_FILE, JSON.stringify(chats, null, 2));
        
        // Broadcast deletion to all users in channel
        io.to(`channel_${req.params.channelId}`).emit('message_deleted', {
            messageId: req.params.messageId,
            channelId: req.params.channelId
        });
        
        console.log(`[CHAT] ${req.user.username} deleted message ${req.params.messageId}`);
        res.json({ message: 'Message deleted' });
    } catch(e) {
        res.status(500).json({ message: 'Failed to delete message' });
    }
});

// =======================
// SERVER ROUTES
// =======================

// Discover all servers (for explore page / join modal)
app.get('/api/servers/discover', requireAuth, (req, res) => {
    const userId = req.user.userId;
    const result = SERVERS_DATA.servers.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        memberCount: s.members.length,
        channelCount: s.channels.length,
        isJoined: s.members.includes(userId)
    }));
    res.json(result);
});

// Get servers the current user has joined
app.get('/api/servers/mine', requireAuth, (req, res) => {
    const userId = req.user.userId;
    const myServers = SERVERS_DATA.servers
        .filter(s => s.members.includes(userId))
        .map(s => ({
            id: s.id,
            name: s.name,
            icon: s.icon,
            channelCount: s.channels.length,
            memberCount: s.members.length
        }));
    res.json(myServers);
});

// Get a specific server's details (name, channels, members)
app.get('/api/servers/:id', requireAuth, (req, res) => {
    const server = SERVERS_DATA.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    
    // Resolve member usernames + online status
    const memberDetails = server.members.map(memberId => {
        const user = Object.values(MOCK_USERS).find(u => u.id === memberId);
        const isOnline = onlineUsers.has(memberId);
        return user 
            ? { id: user.id, username: user.username, isOnline } 
            : { id: memberId, username: 'Unknown', isOnline: false };
    });

    res.json({
        id: server.id,
        name: server.name,
        icon: server.icon,
        channels: server.channels,
        members: memberDetails,
        ownerId: server.ownerId
    });
});

// Create a new server
app.post('/api/servers', requireAuth, (req, res) => {
    const { name, icon } = req.body;
    if (!name || name.trim().length === 0) return res.status(400).json({ message: 'Server name is required' });
    if (name.trim().length > 50) return res.status(400).json({ message: 'Server name too long (max 50 chars)' });
    
    const serverId = 'server_' + Date.now();
    const newServer = {
        id: serverId,
        name: name.trim(),
        icon: icon || name.trim().charAt(0).toUpperCase(),
        channels: [
            { id: `${serverId}_general`, name: 'general', type: 'text' },
            { id: `${serverId}_chat`, name: 'chat', type: 'text' }
        ],
        members: [req.user.userId],
        ownerId: req.user.userId
    };
    
    SERVERS_DATA.servers.push(newServer);
    saveServers();
    
    console.log(`[SERVER] ${req.user.username} created server "${name}"`);
    res.status(201).json({ 
        message: `Server "${name}" created!`,
        server: {
            id: newServer.id,
            name: newServer.name,
            icon: newServer.icon,
            channelCount: newServer.channels.length,
            memberCount: newServer.members.length
        }
    });
});

// Join a server
app.post('/api/servers/:id/join', requireAuth, (req, res) => {
    const server = SERVERS_DATA.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    
    const userId = req.user.userId;
    if (server.members.includes(userId)) {
        return res.status(400).json({ message: 'Already a member of this server' });
    }
    
    server.members.push(userId);
    saveServers();
    console.log(`[SERVER] ${req.user.username} joined "${server.name}"`);
    res.json({ message: `Joined ${server.name}!` });
});

// Leave a server
app.post('/api/servers/:id/leave', requireAuth, (req, res) => {
    const server = SERVERS_DATA.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    
    const userId = req.user.userId;
    const idx = server.members.indexOf(userId);
    if (idx === -1) {
        return res.status(400).json({ message: 'Not a member of this server' });
    }
    
    server.members.splice(idx, 1);
    saveServers();
    console.log(`[SERVER] ${req.user.username} left "${server.name}"`);
    res.json({ message: `Left ${server.name}` });
});

// Get server members
app.get('/api/servers/:id/members', requireAuth, (req, res) => {
    const server = SERVERS_DATA.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    
    const memberDetails = server.members.map(memberId => {
        const user = Object.values(MOCK_USERS).find(u => u.id === memberId);
        const isOnline = onlineUsers.has(memberId);
        return user 
            ? { id: user.id, username: user.username, isOnline } 
            : { id: memberId, username: 'Unknown', isOnline: false };
    });
    
    res.json(memberDetails);
});

// =======================
// FRIENDS ROUTES
// =======================

app.get('/api/friends', requireAuth, (req, res) => {
    let friends = [];
    try { friends = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8')); } catch(e){}
    
    const userFriends = friends.filter(f => f.user1Id === req.user.userId || f.user2Id === req.user.userId);
    
    const mapped = userFriends.map(f => {
       const isInitiator = f.user1Id === req.user.userId;
       const otherId = isInitiator ? f.user2Id : f.user1Id;
       const otherUser = Object.values(MOCK_USERS).find(u => u.id === otherId);
       return {
           id: f.id,
           userId: otherUser ? otherUser.id : '',
           username: otherUser ? otherUser.username : 'Unknown',
           status: f.status,
           isIncoming: !isInitiator
       }
    });

    res.json(mapped);
});

app.post('/api/friends', requireAuth, (req, res) => {
    const { targetUsername } = req.body;
    const targetUser = MOCK_USERS[targetUsername];
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser.id === req.user.userId) return res.status(400).json({ message: 'Cannot add yourself' });

    let friends = [];
    try { friends = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8')); } catch(e){}
    
    if(friends.find(f => (f.user1Id === req.user.userId && f.user2Id === targetUser.id) || (f.user1Id === targetUser.id && f.user2Id === req.user.userId))) {
        return res.status(400).json({ message: 'Friend request already exists' });
    }

    friends.push({
        id: Date.now().toString(),
        user1Id: req.user.userId,
        user2Id: targetUser.id,
        status: 'PENDING',
        createdAt: new Date().toISOString()
    });

    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(friends, null, 2));
    res.json({ message: 'Friend request sent!' });
});

app.post('/api/friends/accept', requireAuth, (req, res) => {
    const { requestId } = req.body;
    let friends = [];
    try { friends = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8')); } catch(e){}
    
    const request = friends.find(f => f.id === requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.user2Id !== req.user.userId) return res.status(403).json({ message: 'Not your incoming request to accept' });
    
    request.status = 'ACCEPTED';
    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(friends, null, 2));
    res.json({ message: 'Friend request accepted!' });
});


// =======================
// WEBSOCKETS
// =======================

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://synapse.neuralnote.online', 'http://synapse.neuralnote.online'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Auth failed: No token'));
  try {
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e) {
    next(new Error('Auth failed: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`[WS] User connected: ${socket.user.username}`);
  
  // Track online presence
  onlineUsers.set(socket.user.userId, { 
    username: socket.user.username, 
    socketId: socket.id 
  });
  io.emit('presence_update', { 
    userId: socket.user.userId, 
    username: socket.user.username, 
    status: 'online' 
  });

  socket.on('join_channel', (channelId) => {
    socket.join(`channel_${channelId}`);
    console.log(`[WS] ${socket.user.username} joined channel: ${channelId}`);
  });

  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel_${channelId}`);
  });

  socket.on('send_message', (data) => {
    const { channelId, content } = data;
    const message = {
      id: Date.now().toString(),
      senderUsername: socket.user.username,
      content,
      channelId,
      createdAt: new Date().toISOString()
    };

    let chats = [];
    try { chats = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch(e) {}
    chats.push(message);
    fs.writeFileSync(DB_FILE, JSON.stringify(chats, null, 2));

    io.to(`channel_${channelId}`).emit('receive_message', message);
  });

  // Typing indicator
  socket.on('typing_start', (channelId) => {
    socket.to(`channel_${channelId}`).emit('user_typing', {
      username: socket.user.username,
      channelId
    });
  });

  socket.on('typing_stop', (channelId) => {
    socket.to(`channel_${channelId}`).emit('user_stop_typing', {
      username: socket.user.username,
      channelId
    });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] User disconnected: ${socket.user.username}`);
    onlineUsers.delete(socket.user.userId);
    io.emit('presence_update', { 
      userId: socket.user.userId, 
      username: socket.user.username, 
      status: 'offline' 
    });
  });
});

httpServer.listen(8080, () => {
  console.log('============================================');
  console.log(' SYNAPSE SERVER LIVE ON PORT 8080           ');
  console.log('============================================');
  console.log('Endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET  /api/servers/discover');
  console.log('  GET  /api/servers/mine');
  console.log('  GET  /api/servers/:id');
  console.log('  POST /api/servers          (CREATE)');
  console.log('  POST /api/servers/:id/join');
  console.log('  POST /api/servers/:id/leave');
  console.log('  GET  /api/servers/:id/members');
  console.log('  GET  /api/channels/:id/messages');
  console.log('  DEL  /api/channels/:id/messages/:mid');
  console.log('  GET  /api/friends');
  console.log('  POST /api/friends');
  console.log('  POST /api/friends/accept');
  console.log('  WS   typing_start / typing_stop');
  console.log('  WS   presence_update');
  console.log('============================================');
  console.log('Test user: priyanshu / 1234');
  console.log('============================================');
});

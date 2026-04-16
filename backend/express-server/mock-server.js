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
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

const JWT_SECRET = 'super_secret_mock_key';
const DB_FILE = path.join(__dirname, 'chats.json');
const FRIENDS_FILE = path.join(__dirname, 'friends.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize text DB files
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
if (!fs.existsSync(FRIENDS_FILE)) fs.writeFileSync(FRIENDS_FILE, JSON.stringify([]));

let MOCK_USERS = {
  'priyanshu': { id: 'u2', username: 'priyanshu', password: '1234' }
};

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(MOCK_USERS, null, 2));
} else {
    try { MOCK_USERS = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch(e) {}
}

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
// ROUTES
// =======================

// Fake Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`[AUTH] Login attempt: ${username}`);
  const user = MOCK_USERS[username];
  
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const accessToken = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
  res.status(200).json({ accessToken, refreshToken: 'dummy_refresh', userId: user.id });
});

app.post('/api/auth/register', (req, res) => {
    const { email, username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    if (MOCK_USERS[username]) return res.status(400).json({ message: 'Username already taken' });
    
    // Register the new user dynamically and persist
    MOCK_USERS[username] = {
        id: 'u_' + Date.now(),
        username,
        password
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

app.get('/api/channels/:channelId/messages', (req, res) => {
    try {
        const chats = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const channelChats = chats.filter(c => c.channelId === req.params.channelId);
        res.status(200).json(channelChats.reverse());
    } catch(e) {
        res.status(200).json([]);
    }
});

// === FRIENDS API === //
app.get('/api/friends', requireAuth, (req, res) => {
    let friends = [];
    try { friends = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8')); } catch(e){}
    
    // Find all requests involving this user
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
    origin: ['http://localhost:5173', 'http://localhost:5174'],
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

  socket.on('join_channel', (channelId) => {
    socket.join(`channel_${channelId}`);
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
});

httpServer.listen(8080, () => {
  console.log('============================================');
  console.log(' MOCK SERVER LIVE ON PORT 8080 (No Prisma)  ');
  console.log('============================================');
  console.log('Available limits for testing:');
  console.log('Dynamic Registry LIVE. Feel free to register users via the UI!');
  console.log('1. priyanshu / 1234');
  console.log('============================================');
});

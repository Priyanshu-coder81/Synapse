import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
// Hashing the generic secret slightly differently to generate the Refresh Token signature
const REFRESH_SECRET = JWT_SECRET + '_refresh_rotation';

const generateTokens = (userId: string, username: string) => {
    // 15 minutes of access exactly like the Java backend
    const accessToken = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '15m' });
    // 7 days long-lived refresh token
    const refreshToken = jwt.sign({ userId, username }, REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        
        // Conflict validation check natively with Prisma
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email: email }, { username: username }] }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Generate Bcrypt Hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store natively in DB
        const newUser = await prisma.user.create({
            data: { email, username, password: hashedPassword }
        });

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Resolve target
        const user = await prisma.user.findUnique({ where: { username: username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Validate Hash parity
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Fire rotating token matrix
        const tokens = generateTokens(user.id, user.username);

        res.status(200).json({ 
            accessToken: tokens.accessToken, 
            refreshToken: tokens.refreshToken, 
            userId: user.id 
        });
    } catch (error) {
         console.error("LOGIN ERROR:", error);
         res.status(500).json({ message: 'Internal server error during login' });
    }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ message: 'No root refresh token structure provided' });

        jwt.verify(refreshToken, REFRESH_SECRET, (err: any, decoded: any) => {
            if (err) return res.status(401).json({ message: 'Invalid or expired refresh token' });
            
            // Re-rotate tokens since the refresh hit was valid!
            const tokens = generateTokens(decoded.userId, decoded.username);
            res.status(200).json({ 
                accessToken: tokens.accessToken, 
                refreshToken: tokens.refreshToken
            });
        });
    } catch (error) {
         console.error("REFRESH ERROR:", error);
         res.status(500).json({ message: 'Internal server error during token refresh' });
    }
});

import "dotenv/config";
import prisma from "./config/prisma.js";
import { app } from './app.js';

// ─── Diagnostics & Validation ──────────────────────────────────────
const requiredEnvVars = [
    "DATABASE_URL",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
];

const validateEnv = () => {
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
        console.error("\x1b[31m%s\x1b[0m", "CRITICAL ERROR: Missing required environment variables:");
        missing.forEach(v => console.error(` - ${v}`));
        console.error("\x1b[33m%s\x1b[0m", "Please add these to your environment variables.");
        process.exit(1);
    }
    console.log("\x1b[32m%s\x1b[0m", "✓ Environment variables validated successfully.");
};

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});

// ─── Boot ──────────────────────────────────────────────────────────
validateEnv();

const port = process.env.PORT || 8001;

// Prisma connects automatically on the first query, but we can verify connection here
const startServer = async () => {
    try {
        console.log("Connecting to PostgreSQL via Prisma...");
        await prisma.$connect();
        console.log("\x1b[32m%s\x1b[0m", "✓ Database connection established successfully.");

        app.on("error", (error) => {
            console.error("EXPRESS APP ERROR: ", error);
        });

        app.listen(port, () => {
            console.log(`\x1b[32m%s\x1b[0m`, `Server is running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
};

startServer();
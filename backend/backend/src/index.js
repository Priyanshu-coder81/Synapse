import "dotenv/config";
import connectDB from "./config/db.js";
import {app} from './app.js'

// ─── Diagnostics & Validation ──────────────────────────────────────
const requiredEnvVars = [
    "MONGODB_URL",
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
        console.error("\x1b[33m%s\x1b[0m", "Please add these to your Render / local environment.");
        process.exit(1);
    }
    console.log("\x1b[32m%s\x1b[0m", "✓ Environment variables validated successfully.");
};

// Global error handlers for better logging on Render
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // On Render, we want to know why it crashed
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});

// ─── Boot ──────────────────────────────────────────────────────────
validateEnv();

const port = process.env.PORT || 8001;

connectDB().then(()=> {
    app.on("error" , (error)=> {
        console.error("EXPRESS APP ERROR: ", error);
    })

    app.listen(port, () => {
        console.log(`\x1b[32m%s\x1b[0m`, `Server is running at http://localhost:${port}`);
    })
}).catch((err) => {
    console.error(`MONGODB connection failed:`, err)
    process.exit(1);
});
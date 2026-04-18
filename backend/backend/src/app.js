import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
//import { globalLimiter } from "./middlewares/rateLimiter.middleware.js";


const app = express();



// Must add global Limiter
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
//app.use(globalLimiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));

app.use(hpp());
app.use(compression());
app.use(cookieParser());



// 404 handler (must be last)
app.use((req, res, _next) => {
  console.log(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

export {app};
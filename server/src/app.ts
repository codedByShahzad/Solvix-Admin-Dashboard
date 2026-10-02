import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db";
import router from "./routes";

const app = express();

// Connect to MongoDB
connectDB();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// API routes
app.use("/api/v1", router);

// Unknown API routes → JSON 404 (instead of Express's HTML page)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Errors thrown by middleware (e.g. Multer file type / size limits) → JSON
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "File is too large. Maximum size is 5 MB."
          : err.message,
    });
  }

  if (err.message?.startsWith("Invalid file type")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
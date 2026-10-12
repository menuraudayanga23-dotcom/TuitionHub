const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoModule = require("connect-mongo");
const MongoStore = mongoModule.default || mongoModule;
const helmet = require("helmet");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing.");
    }

    if (
      !process.env.SESSION_SECRET ||
      process.env.SESSION_SECRET.length < 64
    ) {
      throw new Error("Set SESSION_SECRET to your generated secret.");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB connected successfully");

    app.use(helmet());
    app.use(express.json({ limit: "100kb" }));

    // Browser requests that change data must come from our frontend.
    app.use("/api", (req, res, next) => {
      if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
      }

      const origin = req.get("origin");
      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];

      if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({
          success: false,
          message: "Request origin is not allowed.",
        });
      }

      if (!req.is("application/json")) {
        return res.status(415).json({
          success: false,
          message: "Send requests as application/json.",
        });
      }

      next();
    });

    app.use(
      session({
        name: "tuitionhub.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          client: mongoose.connection.getClient(),
          collectionName: "sessions",
        }),
        cookie: {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 8 * 60 * 60 * 1000,
          path: "/",
        },
      })
    );

    app.use("/api/auth", (req, res, next) => {
      res.set("Cache-Control", "no-store");
      next();
    });

    app.use("/api/auth", authRoutes);

    app.get("/api/health", (req, res) => {
      res.json({
        success: true,
        message: "TuitionHub backend is running",
      });
    });

    app.get("/api/health/database", async (req, res) => {
      try {
        if (mongoose.connection.readyState !== 1) {
          throw new Error("Database disconnected");
        }

        await mongoose.connection.db.admin().ping();

        res.json({
          success: true,
          message: "MongoDB is connected",
        });
      } catch {
        res.status(503).json({
          success: false,
          message: "MongoDB is unavailable",
        });
      }
    });

    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });

    app.use((error, req, res, next) => {
      console.error("Request failed:", error.message);

      const status = error.status >= 400 && error.status < 500
        ? error.status
        : 500;

      res.status(status).json({
        success: false,
        message: status === 500
          ? "Server error. Please try again."
          : "Invalid request.",
      });
    });

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`TuitionHub backend: http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
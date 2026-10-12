const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(express.json());

// Preserve the endpoint already used by the frontend.
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "TuitionHub backend is running",
  });
});

// Check the database connection with an actual ping.
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

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB connected successfully");

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`TuitionHub backend: http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
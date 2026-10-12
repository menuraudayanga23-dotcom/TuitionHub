const express = require("express");

const app = express();
const PORT = 5000;

// Allows the backend to read JSON request bodies.
app.use(express.json());

// Checks whether the backend is running.
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "TuitionHub backend is running",
  });
});

// Handles requests to unknown URLs.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Starts the server on this computer.
app.listen(PORT, "127.0.0.1", () => {
  console.log(`TuitionHub backend: http://127.0.0.1:${PORT}`);
});
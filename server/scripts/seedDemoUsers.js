const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const demoUsers = [
  {
    name: "Ms. Perera",
    email: "teacher@example.com",
    role: "teacher",
  },
  {
    name: "Amaya Silva",
    email: "amaya@example.com",
    role: "student",
  },
  {
    name: "Kavin Fernando",
    email: "kavin@example.com",
    role: "student",
  },
];

async function seedDemoUsers() {
  try {
    if (
      process.env.NODE_ENV === "production" ||
      process.env.ALLOW_DEMO_SEED !== "true"
    ) {
      throw new Error("Demo account creation is disabled.");
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing.");
    }

    const password = process.env.DEMO_PASSWORD;

    if (
      !password ||
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      throw new Error("Use a demo password of at least 12 characters and at most 72 bytes.");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    // Wait for the unique email index before creating users.
    await User.init();

    const passwordHash = await bcrypt.hash(password, 12);

    for (const demoUser of demoUsers) {
      const existing = await User.findOne({
        email: demoUser.email,
      });

      if (existing) {
        console.log(`Skipped existing account: ${demoUser.email}`);
        continue;
      }

      await User.create({
        ...demoUser,
        passwordHash,
      });

      console.log(`Created ${demoUser.role}: ${demoUser.email}`);
    }

    console.log("Demo account setup complete.");
  } catch (error) {
    console.error("Demo account setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoUsers();
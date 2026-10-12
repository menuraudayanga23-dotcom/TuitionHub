const express = require("express");
const bcrypt = require("bcryptjs");
const { rateLimit } = require("express-rate-limit");
const User = require("../models/User");

const router = express.Router();

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      email.length > 254 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      active: true,
    }).select("+passwordHash");

    const valid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Replace any old session after successful authentication.
    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.userId = user._id.toString();

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        res.json({
          success: true,
          user: publicUser(user),
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in.",
      });
    }

    const user = await User.findOne({
      _id: req.session.userId,
      active: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please log in.",
      });
    }

    res.json({
      success: true,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("tuitionhub.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
});

module.exports = router;
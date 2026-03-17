const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../prisma");
const { generateAnonymousAlias } = require("../utils/alias");
const { sendPasswordResetEmail } = require("../services/email.service");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function generateUniqueAlias() {
  for (let i = 0; i < 20; i += 1) {
    const alias = generateAnonymousAlias();

    const existing = await prisma.user.findUnique({
      where: { anonymousAlias: alias },
      select: { id: true },
    });

    if (!existing) {
      return alias;
    }
  }

  return `Anonymous${Date.now()}`;
}

function getClientBaseUrl() {
  return process.env.CLIENT_APP_URL || "http://localhost:5173";
}

function buildResetUrl(token) {
  return `${getClientBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

function getAccountBlockedMessage(user) {
  if (!user.isActive) {
    return user.role === "LISTENER"
      ? "This listener account has been deactivated by an admin."
      : "This account has been deactivated by an admin.";
  }

  if (user.role === "LISTENER" && user.listenerStatus === "SUSPENDED") {
    return "This listener account has been suspended by an admin.";
  }

  if (user.suspendedAt) {
    return "This account has been suspended by an admin.";
  }

  return null;
}

router.post("/signup/user", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "fullName, email, and password are required.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const anonymousAlias = await generateUniqueAlias();

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "USER",
        anonymousAlias,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        anonymousAlias: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "User account created successfully.",
      user,
    });
  } catch (error) {
    console.error("POST /auth/signup/user error:", error);
    return res.status(500).json({
      message: "Failed to create user account.",
    });
  }
});

router.post("/login/user", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.role !== "USER") {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const blockedMessage = getAccountBlockedMessage(user);
    if (blockedMessage) {
      return res.status(403).json({ message: blockedMessage });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = signToken(user);

    return res.json({
      message: "User login successful.",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        anonymousAlias: user.anonymousAlias,
      },
    });
  } catch (error) {
    console.error("POST /auth/login/user error:", error);
    return res.status(500).json({
      message: "Failed to login user.",
    });
  }
});

router.post("/signup/listener", async (req, res) => {
  try {
    const { fullName, email, password, language, specialty } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "fullName, email, and password are required.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const listener = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "LISTENER",
        listenerStatus: "PENDING",
        language: language?.trim() || null,
        specialty: specialty?.trim() || null,
        isAvailable: false,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        listenerStatus: true,
        language: true,
        specialty: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Listener application submitted successfully.",
      user: listener,
    });
  } catch (error) {
    console.error("POST /auth/signup/listener error:", error);
    return res.status(500).json({
      message: "Failed to create listener application.",
    });
  }
});

router.post("/login/listener", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required.",
      });
    }

    const listener = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!listener || listener.role !== "LISTENER") {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const blockedMessage = getAccountBlockedMessage(listener);
    if (blockedMessage) {
      return res.status(403).json({ message: blockedMessage });
    }

    const isValidPassword = await bcrypt.compare(password, listener.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (listener.listenerStatus !== "APPROVED") {
      return res.status(403).json({
        message: "Your listener account is not approved yet.",
      });
    }

    const token = signToken(listener);

    return res.json({
      message: "Listener login successful.",
      token,
      user: {
        id: listener.id,
        fullName: listener.fullName,
        email: listener.email,
        role: listener.role,
        listenerStatus: listener.listenerStatus,
        language: listener.language,
        specialty: listener.specialty,
        isAvailable: listener.isAvailable,
      },
    });
  } catch (error) {
    console.error("POST /auth/login/listener error:", error);
    return res.status(500).json({
      message: "Failed to login listener.",
    });
  }
});

router.post("/login/admin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required.",
      });
    }

    const admin = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin || admin.role !== "ADMIN") {
      return res.status(401).json({
        message: "Invalid admin credentials.",
      });
    }

    const blockedMessage = getAccountBlockedMessage(admin);
    if (blockedMessage) {
      return res.status(403).json({ message: blockedMessage });
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid admin credentials.",
      });
    }

    const token = signToken(admin);

    return res.json({
      message: "Admin login successful.",
      token,
      user: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("POST /auth/login/admin error:", error);
    return res.status(500).json({
      message: "Failed to login admin.",
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body?.email?.toLowerCase?.().trim?.();

    if (!email) {
      return res.status(400).json({
        message: "email is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const genericMessage =
      "If an account exists for that email, a password reset email has been sent.";

    if (!user) {
      return res.json({ message: genericMessage });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpiresAt,
      },
    });

    const resetUrl = buildResetUrl(resetToken);

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetUrl,
    });

    if (!emailResult.sent) {
      console.log("\n=== PASSWORD RESET LINK (SMTP FALLBACK) ===");
      console.log(`Email: ${user.email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log("==========================================\n");
    }

    return res.json({
      message: genericMessage,
      devResetUrl:
        process.env.NODE_ENV !== "production" && !emailResult.sent
          ? resetUrl
          : undefined,
    });
  } catch (error) {
    console.error("POST /auth/forgot-password error:", error);
    return res.status(500).json({
      message: "Failed to start password reset.",
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = req.body?.token?.trim?.();
    const newPassword = req.body?.newPassword;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "token and newPassword are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters long.",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return res.json({
      message: "Password reset successful. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("POST /auth/reset-password error:", error);
    return res.status(500).json({
      message: "Failed to reset password.",
    });
  }
});

module.exports = router;
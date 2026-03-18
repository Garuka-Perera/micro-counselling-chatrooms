require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const prisma = require("./prisma");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const chatRoutes = require("./routes/chat.routes");
const { registerChatHandlers } = require("./socket/chat.socket");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

// ✅ REQUIRED for Railway
app.set("trust proxy", 1);

app.use(
  cors({
    origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN.split(","),
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ✅ Health check
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      ok: true,
      backend: true,
      database: true,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      backend: true,
      database: false,
      error: error.message,
    });
  }
});

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/chat", chatRoutes);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN.split(","),
    credentials: true,
  },
});

registerChatHandlers(io);

// ✅ START SERVER (ONLY THIS ONE!)
async function startServer() {
  try {
    await prisma.$connect();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
async function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);
  try {
    await prisma.$disconnect();
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
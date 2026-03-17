const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { moderateText } = require("../services/moderation.service");
const { buildAiReply } = require("../services/aiAssistant.service");
const { getOrCreateAiAssistantUser, AI_EMAIL } = require("../services/systemUser.service");

const onlineUsers = new Map(); // userId -> socketId
const listenerSockets = new Map(); // listenerId -> socketId
const activeUserSessions = new Map(); // userId -> sessionId
const activeListenerSessions = new Map(); // listenerId -> sessionId
const sessionTimeouts = new Map(); // sessionId -> timeout
const sessionWarnings = new Map(); // key -> timeout

const ALLOWED_DURATIONS = [10, 15, 20];

function getTokenFromSocket(socket) {
  const handshakeToken = socket.handshake.auth?.token;
  if (handshakeToken) {
    return handshakeToken.replace(/^Bearer\s+/i, "");
  }

  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader) {
    return authHeader.replace(/^Bearer\s+/i, "");
  }

  return null;
}

function authenticateSocket(socket) {
  const token = getTokenFromSocket(socket);

  if (!token) {
    throw new Error("Missing socket token");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
}

function normalizeDuration(value) {
  const num = Number(value);
  return ALLOWED_DURATIONS.includes(num) ? num : 10;
}

function getAliasForUser(userRecord) {
  if (!userRecord) return "Unknown";

  if (userRecord.role === "USER") {
    return userRecord.anonymousAlias || "Anonymous User";
  }

  if (userRecord.email === AI_EMAIL) {
    return "AI Support Assistant";
  }

  return userRecord.fullName || "Listener";
}

function clearSessionTimers(sessionId) {
  const endTimer = sessionTimeouts.get(sessionId);
  if (endTimer) {
    clearTimeout(endTimer);
    sessionTimeouts.delete(sessionId);
  }

  const twoMin = sessionWarnings.get(`${sessionId}:2m`);
  if (twoMin) {
    clearTimeout(twoMin);
    sessionWarnings.delete(`${sessionId}:2m`);
  }

  const thirtySec = sessionWarnings.get(`${sessionId}:30s`);
  if (thirtySec) {
    clearTimeout(thirtySec);
    sessionWarnings.delete(`${sessionId}:30s`);
  }

  const tickTimer = sessionWarnings.get(`${sessionId}:tick`);
  if (tickTimer) {
    clearInterval(tickTimer);
    sessionWarnings.delete(`${sessionId}:tick`);
  }
}

async function markListenerAvailability(listenerId, isAvailable) {
  await prisma.user.update({
    where: { id: listenerId },
    data: { isAvailable },
  });
}

async function isParticipant(sessionId, userId) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return { allowed: false, session: null };
  }

  const allowed = session.userId === userId || session.listenerId === userId;
  return { allowed, session };
}

async function getLiveSocketUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      anonymousAlias: true,
      listenerStatus: true,
      isAvailable: true,
      isActive: true,
      suspendedAt: true,
      suspendedReason: true,
    },
  });
}

function getBlockedReason(user) {
  if (!user) {
    return "Account not found.";
  }

  if (user.isActive === false) {
    return "This account has been deactivated by an admin.";
  }

  if (user.role === "LISTENER" && user.listenerStatus === "SUSPENDED") {
    return user.suspendedReason || "This listener account has been suspended by an admin.";
  }

  if (user.suspendedAt) {
    return user.suspendedReason || "This account has been suspended by an admin.";
  }

  return null;
}

async function terminateBlockedSocket(io, socket, dbUser, customMessage) {
  const reason = customMessage || getBlockedReason(dbUser) || "Your account is no longer allowed to use chat.";

  try {
    const userId = socket.user?.id;

    if (userId) {
      onlineUsers.delete(userId);
      listenerSockets.delete(userId);
    }

    const activeUserSessionId = userId ? activeUserSessions.get(userId) : null;
    const activeListenerSessionId = userId ? activeListenerSessions.get(userId) : null;
    const sessionId = activeUserSessionId || activeListenerSessionId || null;

    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (session && !["ENDED", "EXPIRED", "CANCELLED"].includes(session.status)) {
        const updated = await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            status: "CANCELLED",
            endedAt: new Date(),
          },
        });

        activeUserSessions.delete(updated.userId);

        if (updated.listenerId) {
          activeListenerSessions.delete(updated.listenerId);

          const listener = await prisma.user.findUnique({
            where: { id: updated.listenerId },
          });

          if (
            listener &&
            listener.role === "LISTENER" &&
            listener.email !== AI_EMAIL &&
            listener.isActive !== false &&
            listener.listenerStatus === "APPROVED"
          ) {
            await markListenerAvailability(updated.listenerId, true);
          }
        }

        clearSessionTimers(sessionId);

        io.to(`session:${sessionId}`).emit("session:warning", {
          sessionId,
          message: reason,
          createdAt: new Date(),
        });

        io.to(`session:${sessionId}`).emit("session:ended", {
          sessionId,
          endedAt: updated.endedAt,
          reason: "ACCOUNT_BLOCKED",
          message: reason,
          session: updated,
        });
      }
    }

    socket.emit("session:warning", {
      message: reason,
      createdAt: new Date(),
    });

    socket.disconnect(true);
  } catch (error) {
    console.error("terminateBlockedSocket error:", error);
    socket.disconnect(true);
  }
}

async function assertSocketAccountAllowed(io, socket, options = {}) {
  const dbUser = await getLiveSocketUser(socket.user.id);
  const reason = getBlockedReason(dbUser);

  if (reason) {
    await terminateBlockedSocket(io, socket, dbUser, reason);
    return { ok: false, user: dbUser, reason };
  }

  if (options.requireListener === true) {
    if (!dbUser || dbUser.role !== "LISTENER") {
      socket.emit("session:warning", {
        message: "Only listeners can perform this action.",
      });
      return { ok: false, user: dbUser, reason: "NOT_LISTENER" };
    }

    if (dbUser.listenerStatus !== "APPROVED") {
      socket.emit("session:warning", {
        message: "Only approved listeners can perform this action.",
      });
      return { ok: false, user: dbUser, reason: "LISTENER_NOT_APPROVED" };
    }
  }

  if (options.requireUser === true) {
    if (!dbUser || dbUser.role !== "USER") {
      socket.emit("session:warning", {
        message: "Only users can perform this action.",
      });
      return { ok: false, user: dbUser, reason: "NOT_USER" };
    }
  }

  return { ok: true, user: dbUser, reason: null };
}

async function findAvailableApprovedListener(topic) {
  const onlineListenerIds = Array.from(listenerSockets.keys());

  if (onlineListenerIds.length === 0) {
    return null;
  }

  const listeners = await prisma.user.findMany({
    where: {
      id: { in: onlineListenerIds },
      role: "LISTENER",
      listenerStatus: "APPROVED",
      isAvailable: true,
      isActive: true,
      suspendedAt: null,
      email: {
        not: AI_EMAIL,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (listeners.length === 0) {
    return null;
  }

  for (const listener of listeners) {
    if (activeListenerSessions.has(listener.id)) {
      continue;
    }

    if (topic && listener.specialty) {
      const topicLower = topic.toLowerCase();
      const specialtyLower = listener.specialty.toLowerCase();
      if (specialtyLower.includes(topicLower) || topicLower.includes(specialtyLower)) {
        return listener;
      }
    }
  }

  return listeners.find((listener) => !activeListenerSessions.has(listener.id)) || null;
}

async function createPeerSession({ userId, listenerId, topic, duration, mode }) {
  const expiresAt = new Date(Date.now() + duration * 60 * 1000);

  return prisma.chatSession.create({
    data: {
      topic,
      mode,
      status: "ACTIVE",
      selectedDurationMin: duration,
      userId,
      listenerId,
      startedAt: new Date(),
      expiresAt,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          anonymousAlias: true,
        },
      },
      listener: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          anonymousAlias: true,
          listenerStatus: true,
          specialty: true,
          language: true,
          isAvailable: true,
          isActive: true,
          suspendedAt: true,
        },
      },
    },
  });
}

async function createAiSession({ userId, topic, duration }) {
  const aiUser = await getOrCreateAiAssistantUser();
  const expiresAt = new Date(Date.now() + duration * 60 * 1000);

  return prisma.chatSession.create({
    data: {
      topic,
      mode: "AI",
      status: "AI_ACTIVE",
      selectedDurationMin: duration,
      userId,
      listenerId: aiUser.id,
      startedAt: new Date(),
      expiresAt,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          anonymousAlias: true,
        },
      },
      listener: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          anonymousAlias: true,
          listenerStatus: true,
          specialty: true,
          language: true,
          isAvailable: true,
          isActive: true,
          suspendedAt: true,
        },
      },
    },
  });
}

async function persistMessage({
  sessionId,
  senderId,
  text,
  maskedText,
  blocked,
  moderationMeta,
  riskLevel,
}) {
  return prisma.message.create({
    data: {
      sessionId,
      senderId,
      text,
      maskedText,
      blocked,
      moderationMeta,
      riskLevel: riskLevel || "NONE",
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          anonymousAlias: true,
        },
      },
    },
  });
}

async function maybeUpdateSessionRisk(sessionId, riskLevel, riskReason) {
  if (!riskLevel || riskLevel === "NONE") {
    return null;
  }

  const updates = {
    riskLevel,
    riskReason: riskReason || null,
    flaggedCount: {
      increment: 1,
    },
  };

  if (riskLevel === "HIGH") {
    updates.highRiskDetected = true;
    updates.status = "FLAGGED";
  }

  return prisma.chatSession.update({
    where: { id: sessionId },
    data: updates,
  });
}

function toFrontendMessage(message, currentUserId) {
  return {
    id: message.id,
    sessionId: message.sessionId,
    senderId: message.senderId,
    senderAlias: getAliasForUser(message.sender),
    text: message.text,
    maskedText: message.maskedText,
    blocked: message.blocked,
    moderationMeta: message.moderationMeta,
    riskLevel: message.riskLevel,
    createdAt: message.createdAt,
    isSelf: message.senderId === currentUserId,
  };
}

async function handleAiReply(io, session, userText) {
  const aiUser = await getOrCreateAiAssistantUser();

  let secondsRemaining = null;
  if (session.expiresAt) {
    secondsRemaining = Math.max(
      0,
      Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
    );
  }

  const replyText = buildAiReply({
    userMessage: userText,
    topic: session.topic,
    riskLevel: session.riskLevel,
    secondsRemaining,
  });

  const aiMessage = await persistMessage({
    sessionId: session.id,
    senderId: aiUser.id,
    text: replyText,
    maskedText: replyText,
    blocked: false,
    moderationMeta: {
      source: "ai-assistant",
    },
    riskLevel: "NONE",
  });

  io.to(`session:${session.id}`).emit("session:message", {
    ...toFrontendMessage(aiMessage, null),
    senderAlias: "AI Support Assistant",
    isSelf: false,
  });
}

async function clearSessionRetention(sessionId) {
  await prisma.message.deleteMany({
    where: { sessionId },
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      chatRetentionCleared: true,
    },
  });
}

async function expireSession(io, sessionId) {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status === "ENDED" || session.status === "EXPIRED") {
      clearSessionTimers(sessionId);
      return;
    }

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "EXPIRED",
        endedAt: new Date(),
      },
    });

    activeUserSessions.delete(updated.userId);

    if (updated.listenerId) {
      activeListenerSessions.delete(updated.listenerId);

      const listener = await prisma.user.findUnique({
        where: { id: updated.listenerId },
      });

      if (
        listener &&
        listener.email !== AI_EMAIL &&
        listener.role === "LISTENER" &&
        listener.isActive !== false &&
        listener.listenerStatus === "APPROVED" &&
        !listener.suspendedAt
      ) {
        await markListenerAvailability(updated.listenerId, true);
      }
    }

    io.to(`session:${sessionId}`).emit("session:ended", {
      sessionId,
      endedAt: updated.endedAt,
      reason: "TIME_LIMIT_REACHED",
      message: "This support session has reached its time limit.",
      session: updated,
    });

    clearSessionTimers(sessionId);

    setTimeout(async () => {
      try {
        await clearSessionRetention(sessionId);
      } catch (error) {
        console.error("clearSessionRetention after expire error:", error);
      }
    }, 3000);
  } catch (error) {
    console.error("expireSession error:", error);
  }
}

function scheduleSessionExpiry(io, session) {
  clearSessionTimers(session.id);

  const expiresAtMs = new Date(session.expiresAt).getTime();
  const now = Date.now();
  const msUntilEnd = Math.max(0, expiresAtMs - now);

  const endTimer = setTimeout(() => {
    expireSession(io, session.id);
  }, msUntilEnd);

  sessionTimeouts.set(session.id, endTimer);

  const tickTimer = setInterval(() => {
    const secondsLeft = Math.max(
      0,
      Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
    );

    io.to(`session:${session.id}`).emit("session:timer", {
      sessionId: session.id,
      secondsLeft,
    });

    if (secondsLeft <= 0) {
      clearInterval(tickTimer);
      sessionWarnings.delete(`${session.id}:tick`);
    }
  }, 1000);

  sessionWarnings.set(`${session.id}:tick`, tickTimer);

  const msUntil2Min = msUntilEnd - 2 * 60 * 1000;
  if (msUntil2Min > 0) {
    const timer2 = setTimeout(() => {
      io.to(`session:${session.id}`).emit("session:warning", {
        sessionId: session.id,
        message: "2 minutes remaining in this session.",
        createdAt: new Date(),
      });
    }, msUntil2Min);

    sessionWarnings.set(`${session.id}:2m`, timer2);
  }

  const msUntil30Sec = msUntilEnd - 30 * 1000;
  if (msUntil30Sec > 0) {
    const timer30 = setTimeout(() => {
      io.to(`session:${session.id}`).emit("session:warning", {
        sessionId: session.id,
        message: "30 seconds remaining in this session.",
        createdAt: new Date(),
      });
    }, msUntil30Sec);

    sessionWarnings.set(`${session.id}:30s`, timer30);
  }
}

function buildSessionPayload(session, currentUserId) {
  return {
    id: session.id,
    topic: session.topic,
    mode: session.mode,
    status: session.status,
    selectedDurationMin: session.selectedDurationMin,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    expiresAt: session.expiresAt,
    selfAlias:
      currentUserId === session.userId
        ? getAliasForUser(session.user)
        : getAliasForUser(session.listener),
    peerAlias:
      currentUserId === session.userId
        ? getAliasForUser(session.listener)
        : getAliasForUser(session.user),
    userId: session.userId,
    listenerId: session.listenerId,
    riskLevel: session.riskLevel || "NONE",
  };
}

function registerChatHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const decoded = authenticateSocket(socket);
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      const dbUser = await getLiveSocketUser(decoded.id);
      const blockedReason = getBlockedReason(dbUser);

      if (blockedReason) {
        return next(new Error(blockedReason));
      }

      next();
    } catch (error) {
      next(new Error(error.message || "Unauthorized socket connection"));
    }
  });

  io.on("connection", (socket) => {
    const currentUser = socket.user;

    onlineUsers.set(currentUser.id, socket.id);

    if (currentUser.role === "LISTENER") {
      listenerSockets.set(currentUser.id, socket.id);
    }

    socket.on("listener:set-availability", async ({ isAvailable }) => {
      try {
        const guard = await assertSocketAccountAllowed(io, socket, {
          requireListener: true,
        });
        if (!guard.ok) return;

        await markListenerAvailability(currentUser.id, !!isAvailable);
        listenerSockets.set(currentUser.id, socket.id);

        socket.emit("listener:availability-updated", {
          isAvailable: !!isAvailable,
        });
      } catch (error) {
        console.error("listener:set-availability error:", error);
        socket.emit("session:warning", {
          message: "Failed to update listener availability.",
        });
      }
    });

    socket.on("session:join-queue", async (payload = {}) => {
      try {
        const guard = await assertSocketAccountAllowed(io, socket, {
          requireUser: true,
        });
        if (!guard.ok) return;

        if (activeUserSessions.has(currentUser.id)) {
          socket.emit("session:warning", {
            message: "You already have an active session.",
          });
          return;
        }

        const topic = (payload.topic || "General Support").trim();
        const requestedMode = payload.mode || "AUTO";
        const duration = normalizeDuration(payload.duration || 10);

        socket.emit("session:queued", {
          message: "Finding the best support room for you...",
          topic,
          mode: requestedMode,
          duration,
        });

        let session = null;
        let matchType = "AI";

        if (requestedMode !== "AI") {
          const availableListener = await findAvailableApprovedListener(topic);

          if (availableListener) {
            session = await createPeerSession({
              userId: currentUser.id,
              listenerId: availableListener.id,
              topic,
              duration,
              mode: requestedMode === "PEER" ? "PEER" : "AUTO",
            });
            matchType = "PEER";

            await markListenerAvailability(availableListener.id, false);
          }
        }

        if (!session) {
          session = await createAiSession({
            userId: currentUser.id,
            topic,
            duration,
          });
          matchType = "AI";
        }

        const room = `session:${session.id}`;
        socket.join(room);

        activeUserSessions.set(session.userId, session.id);

        if (session.listenerId) {
          activeListenerSessions.set(session.listenerId, session.id);
        }

        scheduleSessionExpiry(io, session);

        if (matchType === "PEER" && session.listenerId) {
          const listenerSocketId = listenerSockets.get(session.listenerId);
          const listenerSocket = listenerSocketId
            ? io.sockets.sockets.get(listenerSocketId)
            : null;

          if (listenerSocket) {
            listenerSocket.join(room);
            listenerSocket.emit("session:started", {
              message: "A student has been matched with you.",
              session: buildSessionPayload(session, session.listenerId),
              messages: [],
            });
          }

          socket.emit("session:started", {
            message: "A volunteer listener has joined your session.",
            session: buildSessionPayload(session, session.userId),
            messages: [],
          });
        } else {
          socket.emit("session:started", {
            message: "No listener is available right now. AI support is active.",
            session: buildSessionPayload(session, session.userId),
            messages: [],
          });

          await handleAiReply(io, session, "");
        }
      } catch (error) {
        console.error("session:join-queue error:", error);
        socket.emit("session:warning", {
          message: "Failed to create support session.",
        });
      }
    });

    socket.on("session:send-message", async ({ sessionId, text }) => {
      try {
        const guard = await assertSocketAccountAllowed(io, socket);
        if (!guard.ok) return;

        if (!sessionId || !text || typeof text !== "string") {
          socket.emit("session:warning", {
            message: "sessionId and text are required.",
          });
          return;
        }

        const access = await isParticipant(sessionId, currentUser.id);

        if (!access.allowed || !access.session) {
          socket.emit("session:warning", {
            message: "You are not allowed to send messages in this session.",
          });
          return;
        }

        if (["ENDED", "EXPIRED", "CANCELLED"].includes(access.session.status)) {
          socket.emit("session:warning", {
            message: "This session has already ended.",
          });
          return;
        }

        const moderationResult = await moderateText(text);

        const savedMessage = await persistMessage({
          sessionId,
          senderId: currentUser.id,
          text,
          maskedText: moderationResult.maskedText,
          blocked: moderationResult.blocked,
          moderationMeta: moderationResult.moderationMeta,
          riskLevel: moderationResult.riskLevel,
        });

        if (moderationResult.riskLevel && moderationResult.riskLevel !== "NONE") {
          await maybeUpdateSessionRisk(
            sessionId,
            moderationResult.riskLevel,
            moderationResult.riskReason
          );

          if (moderationResult.riskLevel === "HIGH") {
            io.to(`session:${sessionId}`).emit("session:warning", {
              sessionId,
              message:
                "High-risk content detected. If there is immediate danger, contact emergency services or a trusted person immediately.",
              createdAt: new Date(),
            });
          }
        }

        io.to(`session:${sessionId}`).emit("session:message", {
          ...toFrontendMessage(savedMessage, currentUser.id),
        });

        const aiUser = await getOrCreateAiAssistantUser();
        const isAiSession = access.session.listenerId === aiUser.id;

        if (isAiSession && currentUser.role === "USER") {
          const refreshedSession = await prisma.chatSession.findUnique({
            where: { id: sessionId },
          });

          await handleAiReply(io, refreshedSession || access.session, text);
        }
      } catch (error) {
        console.error("session:send-message error:", error);
        socket.emit("session:warning", {
          message: "Failed to send message.",
        });
      }
    });

    socket.on("session:end", async ({ sessionId }) => {
      try {
        const guard = await assertSocketAccountAllowed(io, socket);
        if (!guard.ok) return;

        const access = await isParticipant(sessionId, currentUser.id);

        if (!access.allowed || !access.session) {
          socket.emit("session:warning", {
            message: "You are not allowed to end this session.",
          });
          return;
        }

        const updated = await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            status: "ENDED",
            endedAt: new Date(),
          },
        });

        activeUserSessions.delete(updated.userId);

        if (updated.listenerId) {
          activeListenerSessions.delete(updated.listenerId);

          const listener = await prisma.user.findUnique({
            where: { id: updated.listenerId },
          });

          if (
            listener &&
            listener.email !== AI_EMAIL &&
            listener.role === "LISTENER" &&
            listener.isActive !== false &&
            listener.listenerStatus === "APPROVED" &&
            !listener.suspendedAt
          ) {
            await markListenerAvailability(updated.listenerId, true);
          }
        }

        clearSessionTimers(sessionId);

        io.to(`session:${sessionId}`).emit("session:ended", {
          sessionId,
          endedAt: updated.endedAt,
          reason: "ENDED_BY_PARTICIPANT",
          message: "Session ended.",
          session: updated,
        });

        setTimeout(async () => {
          try {
            await clearSessionRetention(sessionId);
          } catch (error) {
            console.error("clearSessionRetention after end error:", error);
          }
        }, 3000);
      } catch (error) {
        console.error("session:end error:", error);
        socket.emit("session:warning", {
          message: "Failed to end session.",
        });
      }
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(currentUser.id);

      if (currentUser.role === "LISTENER") {
        listenerSockets.delete(currentUser.id);

        try {
          const sessionId = activeListenerSessions.get(currentUser.id);

          if (!sessionId) {
            const listener = await prisma.user.findUnique({
              where: { id: currentUser.id },
            });

            if (listener && listener.isActive !== false) {
              await prisma.user.update({
                where: { id: currentUser.id },
                data: { isAvailable: false },
              });
            }
          }
        } catch (error) {
          console.error("listener disconnect update error:", error);
        }
      }
    });
  });
}

module.exports = {
  registerChatHandlers,
};
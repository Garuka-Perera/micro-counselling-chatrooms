const bcrypt = require("bcrypt");
const prisma = require("../prisma");

const AI_EMAIL = "ai-assistant@system.local";

async function getOrCreateAiAssistantUser() {
  let aiUser = await prisma.user.findUnique({
    where: { email: AI_EMAIL },
  });

  if (aiUser) {
    return aiUser;
  }

  const passwordHash = await bcrypt.hash("ai-assistant-not-for-login", 10);

  aiUser = await prisma.user.create({
    data: {
      fullName: "AI Support Assistant",
      email: AI_EMAIL,
      passwordHash,
      role: "LISTENER",
      listenerStatus: "APPROVED",
      language: "English",
      specialty: "AI Support",
      isAvailable: true,
    },
  });

  return aiUser;
}

module.exports = {
  getOrCreateAiAssistantUser,
  AI_EMAIL,
};
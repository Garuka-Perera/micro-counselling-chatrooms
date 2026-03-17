const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

module.exports = prisma;
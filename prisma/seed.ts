import "dotenv/config";

import * as argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // =========================
  // ENV
  // =========================

  const username = process.env.ADMIN_INITIAL_USERNAME?.trim();
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!username) {
    throw new Error("ADMIN_INITIAL_USERNAME is not defined");
  }

  if (!password) {
    throw new Error("ADMIN_INITIAL_PASSWORD is not defined");
  }

  // =========================
  // CHECK EXISTING ADMIN
  // =========================

  const existingAdmin = await prisma.admin.findUnique({
    where: {
      id: 1,
    },
  });

  if (existingAdmin) {
    console.log("Admin already exists. Seed skipped.");
    return;
  }

  // =========================
  // HASH PASSWORD
  // =========================

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  // =========================
  // CREATE ADMIN
  // =========================

  await prisma.admin.create({
    data: {
      id: 1,

      username,
      passwordHash,

      displayName: process.env.ADMIN_INITIAL_DISPLAY_NAME?.trim() || null,

      email: process.env.ADMIN_INITIAL_EMAIL?.trim() || null,
    },
  });

  console.log("Initial admin created successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to seed database:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

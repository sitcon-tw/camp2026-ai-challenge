import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { __prisma?: PrismaClient };

export const prisma: PrismaClient =
  g.__prisma ?? (g.__prisma = new PrismaClient());

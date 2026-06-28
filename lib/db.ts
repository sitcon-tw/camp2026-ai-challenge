import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

const g = globalThis as unknown as { __prisma?: PrismaClient };

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const prisma: PrismaClient =
  g.__prisma ?? (g.__prisma = new PrismaClient({ adapter }));

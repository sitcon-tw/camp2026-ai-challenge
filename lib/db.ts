import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/app/generated/prisma/client";
import { prismaDatabaseUrl } from "./database-url";

const g = globalThis as unknown as { __prisma?: PrismaClient };

const adapter = new PrismaMariaDb(prismaDatabaseUrl());

export const prisma: PrismaClient =
  g.__prisma ?? (g.__prisma = new PrismaClient({ adapter }));

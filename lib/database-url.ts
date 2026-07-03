export const DEFAULT_DATABASE_URL =
  "mysql://root:password@localhost:3306/standcon";

export function prismaDatabaseUrl(
  databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
) {
  return databaseUrl.trim().replace(/^mariadb:\/\//i, "mysql://");
}

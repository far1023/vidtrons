import "server-only"

import { createDb } from "@/db/client"

/**
 * App database client. Driver depends on DATABASE_URL (see db/client.ts):
 * Neon HTTP for Neon hosts, node-postgres for local PostgreSQL.
 * Only server/models/ may import this file (docs/BACKEND.md).
 */
export const db = createDb(process.env.DATABASE_URL!)

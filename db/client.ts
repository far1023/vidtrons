import { neon } from "@neondatabase/serverless"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http"
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

export type Db = NodePgDatabase<typeof schema>

const globalForPool = globalThis as unknown as { __pgPool?: Pool }

/**
 * Picks the driver from the connection string host:
 * - Neon host (*.neon.tech): Neon serverless HTTP driver (production, Neon dev branch).
 * - Anything else (local PostgreSQL): node-postgres, for day-to-day development.
 * Both expose the same Drizzle query API; the cast hides the driver-specific type.
 * Not marked `server-only` so the seed script can use it; app code imports `db/index.ts`.
 */
export function createDb(url: string): Db {
  const { hostname } = new URL(url)

  if (hostname.endsWith(".neon.tech")) {
    return drizzleNeon(neon(url), { schema }) as unknown as Db
  }

  // Reuse one pool across Next.js hot reloads in development.
  globalForPool.__pgPool ??= new Pool({ connectionString: url })
  return drizzlePg(globalForPool.__pgPool, { schema })
}

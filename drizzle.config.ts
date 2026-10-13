import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// drizzle-kit runs outside Next.js and does not read Next's env files itself.
config({ path: ".env.local" })

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Required by migrate, push and studio; `generate` works without a database.
    url: process.env.DIRECT_URL!,
  },
})

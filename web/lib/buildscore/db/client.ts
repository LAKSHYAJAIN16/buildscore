import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required (Neon Postgres connection string).");
  }
  return url;
}

// Neon's HTTP driver issues each query as a stateless HTTPS request rather
// than holding a TCP connection -- avoids the classic serverless
// connection-pool-exhaustion problem entirely, which matters here since our
// workload is many short-lived Vercel invocations doing a handful of
// queries each.
export const db = drizzle(neon(connectionString()), { schema });

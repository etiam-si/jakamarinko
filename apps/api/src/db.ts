import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// DATABASE_URL comes from /srv/jakamarinko/.env on the server (infra/README.md, "Postgres").
// Created on first use, so modules that never touch the database don't need it.
let instance: ReturnType<typeof drizzle> | undefined;

export function db() {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const pool = new Pool({ connectionString: url });
    // An idle connection dropping (Postgres restart) would otherwise crash the process.
    pool.on("error", (err) => console.error("postgres pool:", err.message));
    instance = drizzle(pool);
  }
  return instance;
}

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { getDbPool } from "@/src/lib/db/client";

async function runMigrations() {
  const dbPool = getDbPool();
  const migrationsDir = path.join(process.cwd(), "drizzle");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf-8");
    await dbPool.query(sql);
  }
}

runMigrations()
  .then(async () => {
    const dbPool = getDbPool();
    await dbPool.end();
    console.log("Migrations completed.");
  })
  .catch(async (error) => {
    console.error(error);
    const dbPool = getDbPool();
    await dbPool.end();
    process.exit(1);
  });

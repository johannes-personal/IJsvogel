import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "pg";

const run = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL ontbreekt. Stel deze in voordat je db:setup draait.");
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "../../../../");
  const migrationsDir = path.join(repoRoot, "packages", "db", "migrations");

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`Geen SQL migraties gevonden in ${migrationsDir}`);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = await readFile(filePath, "utf8");
      console.log(`Migratie uitvoeren: ${file}`);
      await client.query(sql);
    }

    const health = await client.query("select now() as db_time, version() as db_version");
    const usersTable = await client.query("select to_regclass('public.users') as users_table");

    if (!usersTable.rows[0]?.users_table) {
      throw new Error("Health check mislukt: tabel public.users bestaat niet na migraties.");
    }

    const userCount = await client.query("select count(*)::int as total from users");

    console.log("DB setup succesvol.");
    console.log(`DB tijd: ${health.rows[0].db_time}`);
    console.log(`Users tabel: ${usersTable.rows[0].users_table}`);
    console.log(`Aantal users: ${userCount.rows[0].total}`);
  } finally {
    await client.end();
  }
};

run().catch((error) => {
  console.error("db:setup mislukt:", error.message);
  process.exit(1);
});

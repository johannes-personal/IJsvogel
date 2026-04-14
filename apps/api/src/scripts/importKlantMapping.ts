import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const run = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL ontbreekt");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false }
  });

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const csvPath = path.resolve(scriptDir, "../../../../apps/web/Klantmapping.csv");

  const raw = await readFile(csvPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter(l => l.trim());

  // Skip header row
  // Columns: Klantrekening;Naam;Adres;Plaats;Postcode;Bestemmingscode
  const rows = lines.slice(1).map(line => {
    const cols = line.split(";");
    return {
      number: cols[0]?.trim(),
      name:   cols[1]?.trim(),
      plaats: cols[3]?.trim() || null,
      postcode: cols[4]?.trim() || null,
    };
  }).filter(r => r.number && r.name);

  console.log(`Importing ${rows.length} klantmappings...`);

  let inserted = 0;
  for (const row of rows) {
    await pool.query(
      `insert into client_map (client_number, client_name, postcode, plaats, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (client_number) do update set client_name = excluded.client_name, postcode = excluded.postcode, plaats = excluded.plaats, updated_at = now()`,
      [row.number, row.name, row.postcode, row.plaats]
    );
    inserted++;
  }

  console.log(`Klaar: ${inserted} rijen ingevoerd/bijgewerkt.`);
  await pool.end();
};

run().catch(e => { console.error("Import mislukt:", e.message); process.exit(1); });

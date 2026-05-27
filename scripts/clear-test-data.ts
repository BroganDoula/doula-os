import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM contacts`;
  console.log("Test contacts cleared.");
}

main();

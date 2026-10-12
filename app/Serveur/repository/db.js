import pg from "pg";

const { Pool } = pg;
const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
    throw new Error("La variable d'environnement DATABASE_URL est requise");
}

export const pool = new Pool({ connectionString: DATABASE_URL });

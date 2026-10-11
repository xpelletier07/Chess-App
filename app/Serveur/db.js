import pg from "pg";

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/chess_app";
const pool = new Pool({ connectionString: DATABASE_URL });


export default { pool };
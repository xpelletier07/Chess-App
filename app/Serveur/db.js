const { Pool } = pg;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;


export default { pool };
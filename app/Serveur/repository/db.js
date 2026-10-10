import pg from 'pg';

const { Pool, types } = pg;

const DATABASE_URL = 'postgres://postgres:postgres@db:5432/chess_app'

export const pool = new Pool({ connectionString: DATABASE_URL})


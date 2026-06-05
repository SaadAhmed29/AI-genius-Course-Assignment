const { Pool } = require('pg');

// pg connection pool — reuses connections instead of opening a new one per query
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Quick smoke-test on startup so we know early if the DB is unreachable
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Could not connect to PostgreSQL:', err.message);
    process.exit(1);
  }
  release();
  console.log('✅  PostgreSQL connected');
});

module.exports = pool;

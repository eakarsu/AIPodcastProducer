const bcrypt = require('bcryptjs');
const pool = require('./models/db');

async function bootstrapRuntime() {
  if (String(process.env.MIGRATE_ON_START).toLowerCase() !== 'true') return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role TEXT NOT NULL DEFAULT 'producer',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'producer';
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100),
      entity_table VARCHAR(50),
      entity_id INTEGER,
      result TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const email = process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const name = process.env.PROVISION_ADMIN_NAME || 'Runtime Administrator';
  if (!email || !password) throw new Error('runtime admin credentials are required');
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email, password, name, role)
     VALUES ($1, $2, $3, 'producer')
     ON CONFLICT (email) DO UPDATE
     SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role, updated_at = NOW()`,
    [email, passwordHash, name]
  );
}

module.exports = { bootstrapRuntime };

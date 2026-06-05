require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('../src/config/db');

const SALT_ROUNDS = 12; // higher = slower hash = harder to brute-force

const seedUsers = [
  { email: 'admin@aigenius.com',   password: 'Admin@123',   role: 'Admin'        },
  { email: 'premium@aigenius.com', password: 'Premium@123', role: 'Premium_User' },
  { email: 'free@aigenius.com',    password: 'Free@123',    role: 'Free_User'    },
];

async function seed() {
  console.log('🌱  Seeding database...\n');

  for (const user of seedUsers) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

    await pool.query(
      `INSERT INTO users (email, password, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password,
             role     = EXCLUDED.role`,
      [user.email, hashedPassword, user.role]
    );

    console.log(`  ✅  ${user.role.padEnd(12)} → ${user.email}  (password: ${user.password})`);
  }

  console.log('\n🎉  Seed complete. You can now log in with any of the accounts above.');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

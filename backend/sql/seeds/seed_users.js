const bcrypt = require("bcryptjs");
const { initDb } = require("../../src/config/initDb");
const { query, closePool } = require("../../src/config/db");

const demoUsers = [
  {
    fullName: "Demo User",
    email: "demo@finevision.com",
    password: "demo123",
    avatarColor: "#ef4444",
  },
  {
    fullName: "Rinto Demo",
    email: "rinto@finevision.com",
    password: "rinto123",
    avatarColor: "#2563eb",
  },
];

async function seedUsers() {
  await initDb();

  for (const user of demoUsers) {
    const existing = await query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [user.email],
    );
    if (existing.length) {
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 12);
    await query(
      "INSERT INTO users (full_name, email, password_hash, avatar_color) VALUES (?, ?, ?, ?)",
      [user.fullName, user.email, passwordHash, user.avatarColor],
    );
  }

  console.log("Demo users ready:");
  console.log("* demo@finevision.com / demo123");
  console.log("* rinto@finevision.com / rinto123");
  console.log("Important: These are demo credentials only. Do not use them in production.");
}

if (require.main === module) {
  seedUsers()
    .then(() => closePool())
    .catch(async (error) => {
      console.error("Demo seed failed:", error.message);
      await closePool();
      process.exit(1);
    });
}

module.exports = {
  seedUsers,
  demoUsers,
};

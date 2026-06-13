const { env } = require("../../src/config/env");
const { initDb } = require("../../src/config/initDb");
const { query, closePool } = require("../../src/config/db");
const { seedUsers } = require("./seed_users");

async function resetDemoDb() {
  const confirmed = process.argv.includes("--confirm-reset-demo-db");

  if (env.db.name !== "finevision_users") {
    throw new Error(
      "Refusing to reset because DB_NAME is not finevision_users.",
    );
  }

  if (!confirmed) {
    console.log("This command deletes all rows from finevision_users.users.");
    console.log(
      "Run `npm run db:reset -- --confirm-reset-demo-db` only for a local demo database.",
    );
    return;
  }

  await initDb();
  await query("DELETE FROM users");
  await query("ALTER TABLE users AUTO_INCREMENT = 1");
  await seedUsers();
  console.log("Demo database reset complete.");
}

if (require.main === module) {
  resetDemoDb()
    .then(() => closePool())
    .catch(async (error) => {
      console.error("Demo reset failed:", error.message);
      await closePool();
      process.exit(1);
    });
}

module.exports = {
  resetDemoDb,
};

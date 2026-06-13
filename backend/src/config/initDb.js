const mysql = require("mysql2/promise");
const { env } = require("./env");

function assertSafeIdentifier(value, label) {
  if (!/^[A-Za-z0-9_]+$/.test(String(value || ""))) {
    throw new Error(`${label} must contain only letters, numbers, and underscores.`);
  }
}

function quoteIdentifier(value) {
  assertSafeIdentifier(value, "Database name");
  return `\`${value}\``;
}

const createUsersTableSql = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#ef4444',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
`;

async function createServerConnection() {
  return mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: false,
  });
}

async function createDatabaseConnection() {
  return mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    multipleStatements: false,
  });
}

async function initDb(options = {}) {
  const logger = options.logger || console;
  assertSafeIdentifier(env.db.name, "Database name");

  const serverConnection = await createServerConnection();
  logger.log("MySQL server connected");
  await serverConnection.query(
    `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(env.db.name)}`,
  );
  await serverConnection.end();
  logger.log(`Database ${env.db.name} ready`);

  const dbConnection = await createDatabaseConnection();
  await dbConnection.query(createUsersTableSql);
  await dbConnection.end();
  logger.log("Users table ready");
}

if (require.main === module) {
  initDb().catch((error) => {
    console.error("Database migration failed:", error.message);
    process.exit(1);
  });
}

module.exports = {
  initDb,
  createUsersTableSql,
};

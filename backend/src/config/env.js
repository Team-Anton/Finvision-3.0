const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function numberFromEnv(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function listFromEnv(value, fallback) {
  return String(value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  port: numberFromEnv(process.env.PORT, 5000),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: numberFromEnv(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "finevision_users",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  frontendOrigins: listFromEnv(
    process.env.FRONTEND_ORIGIN,
    "http://localhost:5173,http://localhost:8081",
  ),
};

function requireRuntimeEnv() {
  if (!env.jwt.secret || env.jwt.secret === "replace_with_long_random_secret") {
    throw new Error("JWT_SECRET must be set in backend/.env.");
  }
}

module.exports = {
  env,
  requireRuntimeEnv,
};

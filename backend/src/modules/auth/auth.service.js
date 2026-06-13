const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../../config/db");
const { env } = require("../../config/env");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    name: row.full_name,
    email: row.email,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
}

async function findUserByEmail(email) {
  const rows = await query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [normalizeEmail(email)],
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const rows = await query(
    "SELECT id, full_name, email, avatar_color, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ? toPublicUser(rows[0]) : null;
}

async function createUser({ fullName, email, password }) {
  const cleanName = String(fullName || "").trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");

  if (!cleanName) {
    const error = new Error("Full name is required.");
    error.statusCode = 400;
    throw error;
  }
  if (!isValidEmail(cleanEmail)) {
    const error = new Error("A valid email is required.");
    error.statusCode = 400;
    throw error;
  }
  if (!cleanPassword) {
    const error = new Error("Password is required.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 12);
  const result = await query(
    "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
    [cleanName, cleanEmail, passwordHash],
  );
  const user = await findUserById(result.insertId);
  return {
    token: createToken(user),
    user,
  };
}

async function loginUser({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");

  if (!isValidEmail(cleanEmail) || !cleanPassword) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const row = await findUserByEmail(cleanEmail);
  const validPassword = row
    ? await bcrypt.compare(cleanPassword, row.password_hash)
    : false;
  if (!row || !validPassword) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const user = toPublicUser(row);
  return {
    token: createToken(user),
    user,
  };
}

async function updateUserProfile(userId, { fullName, email }) {
  const cleanName = String(fullName || "").trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanName) {
    const error = new Error("Full name is required.");
    error.statusCode = 400;
    throw error;
  }
  if (!isValidEmail(cleanEmail)) {
    const error = new Error("A valid email is required.");
    error.statusCode = 400;
    throw error;
  }

  const duplicateRows = await query(
    "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
    [cleanEmail, userId],
  );
  if (duplicateRows.length) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  await query(
    "UPDATE users SET full_name = ?, email = ? WHERE id = ?",
    [cleanName, cleanEmail, userId],
  );
  return findUserById(userId);
}

module.exports = {
  createUser,
  loginUser,
  findUserById,
  updateUserProfile,
  normalizeEmail,
  isValidEmail,
  toPublicUser,
};

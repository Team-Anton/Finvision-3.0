# FineVision Users Backend

Minimal Express + MySQL backend for FineVision user signup, login, and profile storage only.

Finance, dashboard, receipt, assistant, group split, shared fund, and budget data remain frontend-local in AsyncStorage/Redux.

## Setup After Pulling

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Set:
   - `DB_USER=root`
   - `DB_PASSWORD=your_mysql_password`
   - `DB_NAME=finevision_users`
   - `JWT_SECRET=your_long_secret`
5. `npm run db:migrate`
6. `npm run db:seed`
7. `npm run dev`

`FRONTEND_ORIGIN` accepts a comma-separated list, such as
`http://localhost:5173,http://localhost:8081`.

## Demo Login Accounts

After seeding:

- `demo@finevision.com` / `demo123`
- `rinto@finevision.com` / `rinto123`

These are demo credentials only. Do not use them in production.

## Scripts

- `npm run dev` starts the backend with Node watch mode.
- `npm start` starts the backend normally.
- `npm run db:migrate` creates the database and users table if missing.
- `npm run db:seed` inserts safe demo users if they do not already exist.
- `npm run db:reset -- --confirm-reset-demo-db` clears and reseeds `finevision_users.users` for local demo use only.

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profile/me`
- `PUT /api/profile/me`

Protected profile routes require:

```text
Authorization: Bearer TOKEN
```

## Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#ef4444',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Passwords are stored as bcrypt hashes. The API never returns `password_hash`.

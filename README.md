# FineVision AI

Expo React Native finance app with a minimal Node.js + Express + MySQL backend for user authentication and profile storage.

Finance, dashboard, receipt, assistant, group split, shared fund, and budget data remain local-first in AsyncStorage/Redux.

## Backend Setup

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

Demo login accounts after seeding:

- `demo@finevision.com` / `demo123`
- `rinto@finevision.com` / `rinto123`

## Frontend Setup

1. Add or update frontend `.env`:

```text
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

2. `npm install`
3. `npx expo start -c --web`

## Verification

1. Start MySQL.
2. Run backend migration: `cd backend && npm run db:migrate`
3. Run backend seed: `npm run db:seed`
4. Open MySQL Workbench and confirm:
   - database `finevision_users` exists
   - table `users` exists
   - demo users exist with `password_hash` values
5. Start backend: `npm run dev`
6. Visit `http://localhost:5000/api/health`
7. Start frontend.
8. Login with `demo@finevision.com` / `demo123`
9. Signup with a new email and confirm a new row appears in `users`.
10. Edit profile and confirm the MySQL row updates.
11. Confirm finance/group features remain local.

The included `start-finvision.bat` starts both the backend and frontend. The
backend `FRONTEND_ORIGIN` setting accepts a comma-separated list when the web
app is served from more than one local port.

## Security

- Do not commit real `.env` files.
- Demo seed users are safe for local development only.
- Passwords are bcrypt hashed.
- JWT secret comes from `backend/.env`.
- Raw MySQL errors are not exposed to the frontend.

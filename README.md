# FinVision AI

FinVision AI is a cross-platform mobile finance app for Bangladeshi students and young professionals. It lets users log expenses by typing natural Bangla or Banglish sentences ("bus vhara 80 taka"), scan grocery receipts with OCR, track budgets with a financial health score, split group costs with automatic settlement, and view spending analytics — all running local-first on the device.

The app is built with **React Native (Expo)** on the frontend. Finance, dashboard, receipt, assistant, group split, shared fund, and budget data live entirely in **AsyncStorage/Redux** on-device, so the core app works fully offline. A minimal **Node.js + Express + MySQL** backend exists only for user authentication and profile storage; it never touches financial data.

## The Problem

Most students and young professionals in Bangladesh manage money through mental notes or informal tracking, which leads to overspending and financial stress — especially for students living away from home who juggle rent, food, transport, and study costs on their own. Popular budgeting apps (Mint, Money Manager, YNAB) are built for Western markets: no Bangla input, no recognition of local categories like rickshaw or CNG fares, and interfaces that feel foreign to local users. Local alternatives tend to be too basic or lack OCR, analytics, and conversational input entirely.

FinVision AI is built specifically around how Bangladeshi users actually think and type about money.

## Key Features

- **AI Assistant (Bangla/Banglish NLP)** — type a sentence like "lunch 150 diyechi" and the assistant detects the expense, categorizes it, logs it, and replies in Bangla with updated budget info. Also handles budget setting, balance checks, affordability questions, and expense history.
- **Receipt OCR Scanner** — photograph or upload a grocery receipt; the OCR.space API extracts the text, which is parsed into itemized expenses (name, quantity, price, discounts, total) that the user can review and edit before saving.
- **Budget Management** — real-time spending tracking against a monthly budget, with a 0–100 financial health score, burn rate, daily average, and month-end projection.
- **Dashboard Analytics** — bar charts for daily spend, line charts for cumulative spend, and pie charts for category breakdowns, plus filters and key stats like biggest expense and top category.
- **Group Expense Splitting** — create groups, log shared costs with equal/custom/percentage splits, and get a minimum-transaction settlement plan so debts are cleared with as few payments as possible.
- **Data Export** — export expense history as CSV or JSON, copy to clipboard, or share via the device share sheet.

## How It Compares

| Feature | Mint | Money Manager | FinVision AI |
|---|---|---|---|
| Bangla / Banglish input | No | No | Yes |
| Natural language entry | No | No | Yes |
| Receipt OCR scanning | No | Limited | Yes |
| Bangladeshi categories | No | No | Yes |
| Group expense splitting | No | No | Yes |
| Financial health score | Yes | No | Yes |
| Offline functionality | Partial | Yes | Yes |
| Data export (CSV/JSON) | Yes | No | Yes |
| Free to use | No | Freemium | Yes |
| Local language support | No | No | Yes |

## Validated by Survey

A feasibility survey of 30 Bangladeshi university students and young professionals (ages 18–26) backed the core design decisions:

- **70%** said natural Bangla/Banglish expense logging would have the biggest positive impact on their daily life — the single highest-ranked feature.
- **80%** said they'd use a receipt scanner that auto-extracts and logs totals.
- **77%** rated group expense splitting 4 or 5 out of 5; **47%** had lost track of shared debts at least a few times.
- **67%** said "too many steps to log an expense" is what stops them from sticking with a budgeting app — directly motivating the one-sentence input and OCR flow.
- **67%** said Banglish support specifically is "very important" to them, since that's how they naturally type.
- **80%** agreed there's a real, unmet gap in the local market for an app like this; **57%** rated their likelihood of using FinVision AI a 4 or 5.

Half of respondents cited forgetting small daily expenses as their #1 financial challenge, and only 33% said they track expenses consistently — confirming a friction problem at the point of logging, not an awareness problem. That insight drove FinVision AI's entire design around minimal-friction entry.

## System Architecture

FinVision AI uses a modular, feature-based architecture: each major feature (Assistant, Receipt, Dashboard, Group Split, Navigation) lives in its own folder with its own components, logic, and utilities, isolated from the others. Modules never import from each other's internal files — they communicate exclusively through the Redux store — so each one can be developed, updated, or replaced independently. This let the five-person team build in parallel without merge conflicts.

**Data flow:**
1. On launch, AsyncStorage loads saved budget and expense data into the Redux store.
2. Components read state via `useSelector`.
3. User actions (add expense, scan receipt, split a cost) dispatch Redux actions.
4. Reducers update the store; subscribed components re-render.
5. Updated state is written back to AsyncStorage for persistence.
6. For OCR specifically: a gallery image is base64-encoded, sent to the OCR.space API, the returned text is parsed into expense items, and those items are dispatched into the store.

## Functional Modules

| Module | Responsibility |
|---|---|
| Assistant | Bangla/Banglish NLP input, intent detection, categorization, AI replies |
| Receipt | Image picking, OCR API call, receipt parsing, item editing |
| Dashboard | Charts, key stats, health score, export panel |
| Group Split | Member management, expense assignment, split calculation, settlement |
| Navigation | Bottom tab navigation across all sections |

## Tech Stack

**Frontend:** React Native (Expo managed workflow), Redux Toolkit, AsyncStorage for local persistence, React Navigation (bottom tabs)
**AI parsing:** Claude API, with a system prompt engineered for structured JSON output and Banglish handling
**OCR:** OCR.space REST API (base64 image input, no native SDK required)
**Backend (auth only):** Node.js, Express, MySQL, JWT, bcrypt

React Native + Expo was chosen over Flutter, native Android/iOS, and Ionic/Capacitor because it let a team with existing JavaScript/React experience ship a single cross-platform codebase quickly, with Expo handling camera, image picker, and sharing out of the box.

## Roadmap

- Migrate from AsyncStorage to Firebase Firestore for multi-device cloud sync
- Add Google Sign-In / phone login as additional auth options
- Push notifications for approaching budget limits
- AI-generated weekly/monthly spending summaries with saving tips in Bangla
- Dark mode
- Bangla voice input via speech-to-text
- bKash/Nagad/bank SMS auto-import

## Team (Team Anton — CSE 4181, UIU)

| Member | ID | Contribution |
|---|---|---|
| Maknun Ahmed Sifat | 0112230192 | Benchmark, technology stack selection, system architecture |
| S.M. Nabiul Islam | 0112230261 | Introduction, survey questionnaire & Google Form |
| Rinto Saha | 0112230276 | Motivation & problem framing, updated project plan |
| Md. Shahriar Islam | 0112230187 | Core features & functional modules documentation, survey analysis |
| Md. Mine Uddin | 0112230237 | System architecture, data flow design, development challenges & conclusion |

---

## Backend Setup

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Set:
   * `DB_USER=root`
   * `DB_PASSWORD=your_mysql_password`
   * `DB_NAME=finevision_users`
   * `JWT_SECRET=your_long_secret`
5. `npm run db:migrate`
6. `npm run db:seed`
7. `npm run dev`

Demo login accounts after seeding:

* `demo@finevision.com` / `demo123`
* `rinto@finevision.com` / `rinto123`

## Frontend Setup

1. Add or update frontend `.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

2. `npm install`
3. `npx expo start -c --web`

## Verification

1. Start MySQL.
2. Run backend migration: `cd backend && npm run db:migrate`
3. Run backend seed: `npm run db:seed`
4. Open MySQL Workbench and confirm:
   * database `finevision_users` exists
   * table `users` exists
   * demo users exist with `password_hash` values
5. Start backend: `npm run dev`
6. Visit `http://localhost:5000/api/health`
7. Start frontend.
8. Login with `demo@finevision.com` / `demo123`
9. Signup with a new email and confirm a new row appears in `users`.
10. Edit profile and confirm the MySQL row updates.
11. Confirm finance/group features remain local.

The included `start-finvision.bat` starts both the backend and frontend. The backend `FRONTEND_ORIGIN` setting accepts a comma-separated list when the web app is served from more than one local port.

## Security

* Do not commit real `.env` files.
* Demo seed users are safe for local development only.
* Passwords are bcrypt hashed.
* JWT secret comes from `backend/.env`.
* Raw MySQL errors are not exposed to the frontend.

# 🏗️ LABOUR CONNECT — STARTUP-GRADE WORKFORCE PLATFORM

Labour Connect is a revolutionary, high-fidelity full-stack workforce ecosystem designed to bring unorganized, skilled, and cooperative labor workers in India into a secure, digital on-demand booking platform—inspired by a hybrid of **Uber, Ola, Rapido, and Urban Company**.

The platform features instant radial worker searches, secure OTP-locked work lifecycles, cooperative labor squad creations, digital UPI-safe wallet ledgers, multilingual welfare eligibility matches, and interactive digital safety academies to protect workers from UPI/online fraud.

---

## 🚀 Key Feature Sets

### 1. 🚰 On-Demand Radial Worker Search & Booking
- **Nearby Scans:** Clients can define search locations and adjust radial limits (2KM to 25KM) to discover online, active specialists.
- **Service Catalog:** Integrated with 10 high-fidelity categories (Plumber, Electrician, Carpenter, Mason, AC Repair, Cleaner, Driver, Welder, Construction Helper).
- **Booking Types:** Supports **Instant Dispatches**, **Scheduled Assignments**, and **SOS Emergency Callouts**.

### 2. 🛡️ OTP-Secured Work Lifecycle
- **Tamper-proof Handshake:** Bookings transition through a strict transactional path (`pending` ➡️ `accepted` ➡️ `started` ➡️ `completed`).
- **Secure PIN Verification:** A 6-digit OTP is generated for the customer. The worker must enter this correct OTP inside their portal upon arrival to unlock the work timer and start the job.
- **Automatic Settlement:** Once the worker marks the job complete, the backend deducts simulated funds from the client's wallet and credits the worker.

### 3. 👥 Cooperative Labor Squads (Labour Groups)
- **Squad Formation:** Workers can create or join democratic cooperative groups with leaders.
- **Democratic Split:** Contractors can hire an entire group for massive projects. Upon job completion, the total budget is split **exactly equally** among all active cooperative members, directly credited to their individual wallets.
- **Squad Attendance:** Leader logs daily masons attendance grids during long-term projects.

### 4. 💳 Digital Wallet & Sandbox Payment Ledger
- **Branded Card Interface:** Beautiful glassmorphic mockup of a "Labour Connect Premium Digital Debit Card".
- **UPI Mock Topups:** Clients can top up their accounts via mock payment presets or custom values to simulate live booking reservations.
- **Chronological Audits:** Every single deposit, debit (client payment), and credit (worker earning) is recorded in a secure transactions ledger.

### 5. 🇮🇳 Multilingual Welfare Portal (Gov Schemes)
- **Three-Language Support:** Instant toggle between **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.
- **Eligibility Wizard:** Workers input their age, monthly earnings, sector (organized vs unorganized un-enrolled), and taxpayer status to instantly check matching welfare programs (e.g., e-Shram Card, Ayushman Bharat health card, PM-SYM Pension, PM-SVANidhi credit, PM-Vishwakarma toolkit grant).

### 6. 🎓 Digital Safety & E-Learning Academy
- **UPI Fraud Warnings:** High-visibility alerts teaching workers about common UPI scams (e.g., "UPI PIN is only for sending money, NEVER for receiving!").
- **Interactive Scenarios Quiz:** Gamified safety questions testing workers on how to respond to fraudulent support calls, fake QR codes, or informal savings schemes.
- **Savings RD Calculator:** Displays compound interest accumulations in safe Post Office Recurring Deposits over time.

### 7. 🤖 Omnipresent AI Assistant Chatbot
- **Conversational Support:** A floating bilingual AI Advisor available on all authenticated screens to answer welfare queries, estimate local average wages, or formulate professional resume descriptions.

---

## 🛠️ System Architecture

The project is structured as a professional, scalable Monorepo:

```
├── /backend
│   ├── /config             # Pool configurations and fallbacks
│   ├── /controllers        # Route handlers (Auth, Bookings, AI, Wallets)
│   ├── /middleware         # JWT auth locks, role restrictors
│   ├── /routes             # REST API routers
│   ├── server.js           # Server boot configuration
│   └── package.json
│
├── /frontend
│   ├── /src
│   │   ├── /components     # Global floating AI chatbot, components
│   │   ├── /pages          # Landing, Login, Dashboards, Wallet, Schemes
│   │   ├── /store          # Zustand global auth and wallet store
│   │   ├── App.jsx         # Routes definition and layout
│   │   └── main.jsx        # Entry point
│   ├── tailwind.config.js  # Branded HSL color palettes and outfit typography
│   └── package.json
│
└── /database
    ├── schema.sql          # Full PostgreSQL tables, constraints, GIN indices, triggers
    └── seeds.sql           # Realistic Pune location-based worker seeds
```

---

## 🔌 Dual-Mode Resilience & Fallback Design

To guarantee 100% out-of-the-box immediate execution in any dev sandbox, the application employs a highly resilient fallback architecture:

1. **Database Fallback:** If `DATABASE_URL` is not configured, the [backend/config/db.js](file:///b:/VS%20CODE/SECOND%20YEAR/SEM%204/FINAL%20PROJECT%20EDI/backend/config/db.js) driver falls back gracefully to a **reactive, in-memory JS database simulation** preloaded with Pune seed datasets. Any wallet transactions, bookings, and chat messages will persist in memory for testing.
2. **AI NLP Fallback:** If no `OPENAI_API_KEY` is present, the [backend/controllers/aiController.js](file:///b:/VS%20CODE/SECOND%20YEAR/SEM%204/FINAL%20PROJECT%20EDI/backend/controllers/aiController.js) driver uses a custom bilingual rule-based NLP parser to handle queries about UPI scams, savings advice, e-Shram cards, or wage estimators, ensuring zero-config bot availability.

---

## 🚀 Setup & Local Execution Guidelines

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- npm / yarn

### Step 1: Clone and Configure Environment
Create a `.env` file in the `/backend` folder. Reference `/backend/.env.example`:
```env
PORT=5000
JWT_SECRET=super_secret_labour_connect_jwt_key
DATABASE_URL=your_supabase_postgresql_connection_string
OPENAI_API_KEY=your_optional_openai_key
```

### Step 2: Set Up Database (Optional for Live Mode)
If you are using a live Postgres database (like Supabase or ElephantSQL), connect via psql or your dashboard query manager and execute:
1. First, run the schema file: [database/schema.sql](file:///b:/VS%20CODE/SECOND%20YEAR/SEM%204/FINAL%20PROJECT%20EDI/database/schema.sql)
2. Next, load the seed data: [database/seeds.sql](file:///b:/VS%20CODE/SECOND%20YEAR/SEM%204/FINAL%20PROJECT%20EDI/database/seeds.sql)

*If omitted, the backend will automatically load the seed datasets in the in-memory mock fallback.*

### Step 3: Run the Backend Server
```bash
cd backend
npm install
npm start
```
*The server will boot on `http://localhost:5000` with active API documentation endpoints.*

### Step 4: Run the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Vite will load the development panel on `http://localhost:5173`. Requests are proxied automatically to `http://localhost:5000`.*

---

## 🛡️ Role-Based Sandbox Accounts

To audit the different dashboards and dashboards interactive systems, use the following pre-seeded sandbox accounts:

| Role | Username / Email | Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Hiring Customer** | `ramesh@sandbox.com` | `password123` | Search, Instant Booking, UPI Wallet Top-up, OTP displays, Track live, Review worker |
| **Skilled Worker** | `sunita@sandbox.com` | `password123` | Active toggle, acceptor alerts, OTP verification, Earnings, Co-op squads creator |
| **Workforce Contractor** | `anil@sandbox.com` | `password123` | Team hires, Project dispatches, attendance grids |
| **System Admin** | `admin@sandbox.com` | `password123` | Pending audits approval board, Platform statistics charts |

---

## 🌐 Production Deployments

### Backend (Railway / Heroku)
1. Link your repository.
2. Define `DATABASE_URL`, `JWT_SECRET`, and `PORT` inside the dashboard variables.
3. Railway will detect the `/backend` folder automatically or use the root buildpacks.

### Frontend (Vercel / Netlify)
1. Set the root folder option to `frontend`.
2. Select **Vite** framework preset.
3. Configure the output directory as `dist` and add standard rewrite rules for Single Page Applications (SPA).

---

Built with pride as a production-grade startup MVP for Indian workforce empowerment. 🇮🇳

# RentalFlow — Rental Car Management SaaS

A cloud-based, multi-tenant rental car management platform for small and medium rental car companies. Manage vehicles, customers, rentals, digital signed agreements, and automated WOF / registration / insurance / service reminders — all in one secure workspace per company.

> **V1 scope:** company signup & login, role-based access, dashboard, vehicle management, customer management, rental creation, car return flow, document-expiry reminders, email/SMS notifications, and digital rental-agreement signing.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Material UI (Vite) |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| File storage | Cloudinary (with local-disk fallback in dev) |
| Email | SendGrid or SMTP via Nodemailer |
| SMS | Twilio |
| Auth | JWT access tokens + rotating refresh tokens |
| PDF | pdfkit (agreement generation) |

---

## Monorepo layout

```
rental-car-saas/
├── server/        # Express + TypeScript API
│   └── src/
│       ├── config/        # env + db connection
│       ├── models/        # Mongoose schemas (multi-tenant)
│       ├── middleware/     # auth, tenant isolation, rbac, errors, uploads
│       ├── controllers/    # request handlers
│       ├── routes/         # express routers
│       ├── services/       # notifications, reminder cron
│       └── utils/          # token, pdf, email, sms, cloudinary helpers
└── client/        # React + Vite + MUI frontend
    └── src/
        ├── api/            # axios client + typed API calls
        ├── context/        # auth context
        ├── components/     # layout, route guards, shared UI
        └── pages/          # login, dashboard, vehicles, customers, rentals, sign
```

---

## Prerequisites

- **Node.js 18+** and **npm**
- A **MongoDB Atlas** connection string (or local MongoDB)
- (Optional for full features) Cloudinary, SendGrid/SMTP, and Twilio accounts

---

## Quick start (local development)

Open two terminals.

### 1. Backend

```bash
cd server
cp .env.example .env        # then edit .env with your values
npm install
npm run dev                  # starts API on http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.example .env         # set VITE_API_URL if not default
npm install
npm run dev                  # starts app on http://localhost:5173
```

Open http://localhost:5173, create a company account, and you're in.

> **Note:** Without Cloudinary/SendGrid/Twilio configured, the app still runs.
> File uploads fall back to local disk, and email/SMS are logged to the console
> instead of being sent. This lets you develop without third-party accounts.

---

## Environment variables

See `server/.env.example` and `client/.env.example` for the full annotated list.
Minimum required to boot the backend: `MONGODB_URI`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`.

---

## Deployment

- **Frontend → Vercel:** set `VITE_API_URL` to your deployed API URL.
- **Backend → Render / Railway:** set all `server/.env` variables; build with
  `npm run build`, start with `npm start`. Set `CLIENT_URL` to your Vercel URL
  (used for CORS and agreement signing links).
- **Database → MongoDB Atlas:** whitelist your backend host and use the SRV URI.

---

## Roadmap (post-V1)

GPS tracking, accounting integrations, AI insights, native mobile app, advanced
invoicing, and expansion into general fleet management (courier, trades,
construction, corporate fleets).

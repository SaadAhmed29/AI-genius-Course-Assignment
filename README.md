# AI-Genius — Auth & RBAC Backend

Secure, stateless authentication and role-based access control (RBAC) for the **AI-Genius** SaaS platform.  
Built with **Node.js / Express**, **PostgreSQL**, and **JSON Web Tokens (JWT)**.

---

## Project Structure

```
ai-genius/
├── src/
│   ├── config/
│   │   └── db.js                  # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # login, refresh, logout logic
│   │   └── aiController.js        # mock AI endpoint handlers
│   ├── middleware/
│   │   ├── authMiddleware.js      # protect + restrictTo
│   │   └── errorHandler.js        # centralized error handler
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── aiRoutes.js
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point
├── scripts/
│   ├── schema.sql                 # DB schema (run once)
│   └── seed.js                    # Seed sample users
├── .env.example                   # Required environment variables (no secrets)
├── thunder-client-collection.json # Import into Thunder Client to test
└── package.json
```

---

## Prerequisites

Make sure these are installed on your machine before starting:

| Tool | Version | Download |
|---|---|---|
| Node.js | 18 or later | https://nodejs.org |
| npm | comes with Node | — |
| PostgreSQL | 14 or later | https://www.postgresql.org/download |

---

## Step-by-Step Setup

### 1. Clone / Open the project

If you have the folder locally, open a terminal inside the `ai-genius/` directory.

### 2. Install dependencies

```bash
npm install
```

### 3. Create the PostgreSQL database

Open a terminal and run:

```bash
psql -U postgres
```

Then inside the psql shell:

```sql
CREATE DATABASE ai_genius;
\q
```

> If your PostgreSQL username is not `postgres`, replace it with the correct one everywhere.

### 4. Apply the database schema

```bash
psql -U postgres -d ai_genius -f scripts/schema.sql
```

You should see output confirming tables were created.

### 5. Create your `.env` file

Copy the example file and fill in your actual values:

```bash
cp .env.example .env
```

Open `.env` and update at minimum:

```env
DB_PASSWORD=your_actual_postgres_password
JWT_SECRET=any_long_random_string_here
JWT_REFRESH_SECRET=another_different_long_random_string
```

> To generate strong secrets, run:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
> Run it twice — use one value for `JWT_SECRET` and one for `JWT_REFRESH_SECRET`.

### 6. Seed sample users

```bash
npm run seed
```

This creates three test accounts:

| Email | Password | Role |
|---|---|---|
| admin@aigenius.com | Admin@123 | Admin |
| premium@aigenius.com | Premium@123 | Premium_User |
| free@aigenius.com | Free@123 | Free_User |

### 7. Start the server

**Development mode** (auto-restarts on file changes):

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

You should see:

```
✅  PostgreSQL connected
🚀  AI-Genius server running on http://localhost:3000
```

---

## API Reference

### Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Log in, receive access token + refresh cookie |
| POST | `/api/auth/refresh` | Get a new access token using the refresh cookie |
| POST | `/api/auth/logout` | Revoke refresh token and clear cookie |

**Login request body:**

```json
{
  "email": "admin@aigenius.com",
  "password": "Admin@123"
}
```

**Login response:**

```json
{
  "status": "success",
  "accessToken": "eyJhbGci...",
  "user": { "id": 1, "email": "admin@aigenius.com", "role": "Admin" }
}
```

---

### AI Endpoints (require `Authorization: Bearer <token>` header)

| Method | Endpoint | Allowed Roles |
|---|---|---|
| GET | `/api/ai/free-model` | Free_User, Premium_User, Admin |
| POST | `/api/ai/premium-model` | Premium_User, Admin |
| DELETE | `/api/ai/purge-cache` | Admin only |

---

## Frontend

A ready-to-use frontend is included as `index.html`. No framework or build step required — just open it directly in your browser.

**How to use:**
1. Make sure the backend is running (`npm run dev`)
2. Double-click `index.html` in File Explorer to open it in your browser
3. Use the **Quick Fill** dropdown to select a test account and click Sign In

**What it includes:**
- Login form with quick-fill for all three test accounts
- Live access token display with a countdown timer showing time until expiry
- One-click buttons to call all three AI endpoints (`/free-model`, `/premium-model`, `/purge-cache`)
- Raw JSON response viewer with colour-coded HTTP status codes (green for 2xx, red for 4xx)
- Refresh Token and Logout buttons

Try logging in as **Free User** and hitting the Premium or Admin endpoints to see the `403 Forbidden` response live.

---

## Testing with Thunder Client (VS Code)

1. Install the **Thunder Client** extension in VS Code.
2. Click the Thunder Client icon in the sidebar.
3. Click **Collections → Import** and select `thunder-client-collection.json`.
4. Run **Login as Admin** first — copy the `accessToken` from the response.
5. Paste it into the `Authorization` header of the AI endpoint requests.

---

## How the Authentication Flow Works

```
Client                          Server
  │                               │
  │  POST /api/auth/login         │
  │  { email, password }  ──────► │  1. bcrypt.compare(password, hash)
  │                               │  2. Sign short-lived Access Token (15m)
  │                               │  3. Sign long-lived Refresh Token (7d)
  │                               │  4. Save Refresh Token in DB whitelist
  │ ◄── { accessToken }           │  5. Set refreshToken httpOnly cookie
  │
  │  GET /api/ai/free-model
  │  Authorization: Bearer <AT>  ►│  6. Middleware verifies JWT signature
  │ ◄── 200 { output }            │
  │
  │  [15 minutes later — AT expires]
  │
  │  POST /api/auth/refresh       │
  │  (cookie sent automatically) ►│  7. Verify Refresh Token signature
  │                               │  8. Check DB whitelist
  │ ◄── { new accessToken }       │  9. Issue new Access Token
  │
  │  POST /api/auth/logout        │
  │  (cookie sent automatically) ►│  10. Delete token from DB whitelist
  │ ◄── { message: "Logged out" } │  11. Clear cookie
```

---

## Security Features Implemented

- **bcrypt password hashing** — passwords are salted with 12 rounds before storage.
- **JWT signature verification** — tokens signed with secrets stored only in `.env`.
- **Refresh token whitelist** — server-side revocation on logout.
- **httpOnly cookies** — refresh token is inaccessible to JavaScript, preventing XSS theft.
- **Timing-safe login** — bcrypt always runs even for non-existent users to prevent user enumeration.
- **RBAC middleware factory** — `restrictTo(...roles)` cleanly separates auth from business logic.
- **Centralized error handling** — no stack traces leak to clients in production.
- **Environment variables** — no hardcoded secrets anywhere in the code.

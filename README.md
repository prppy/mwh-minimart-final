# MWH Minimart

A minimart management app with a React Native (Expo) frontend and an Express + Prisma backend

---

## Project Structure

```
mwh-minimart-final/
├── client/   # Expo (React Native) app
└── server/   # Express API with Prisma + PostgreSQL
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Expo Go](https://expo.dev/go) on your phone, or an iOS/Android simulator
- A `.env` file in `server/` (see below)

---

## Frontend (client/)

### First-time setup

```bash
cd client
npm install
bash scripts/setup-ui.sh   # generates Gluestack UI components
```

> **Prerequisites for `setup-ui.sh`**
> - Node.js **v18 or higher** is required by the Gluestack CLI. If you use nvm, the script will switch automatically; otherwise ensure your active Node version is v18+.
> - If this is the **first time** Gluestack has been set up on your machine, run `npx gluestack-ui init` inside `client/` before the setup script. This is a one-time interactive step that configures the CLI for the project.

### Running the app

```bash
cd client
npm run dev
```

Then scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator / `w` for browser.

### Environment variables

Create `client/.env` with:

```env
BACKEND_URL=http://localhost:3000
```

---

## Backend (server/)

### First-time setup

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
```

### Running the server

```bash
cd server
npm run dev       # development (auto-restarts on change)
npm start         # production
```

The server runs on port `3000` by default.

### Environment variables

Create `server/.env` with:

```env
DATABASE_URL=your_supabase_postgres_connection_string
DIRECT_URL=your_supabase_direct_connection_string

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d
PEPPERED_SECRET=your_pepper_secret
```

`DATABASE_URL` and `DIRECT_URL` can be found in your Supabase project under **Settings → Database → Connection string**.

---

## Adding a new Gluestack UI component

Gluestack UI components are not committed to the repo. To add a new one, use the wrapper script instead of running `npx gluestack-ui add` directly:

```bash
bash client/scripts/add-ui.sh <component>

# Example
bash client/scripts/add-ui.sh toast
```

This installs the component **and** automatically updates `client/scripts/ui-components.txt` so everyone else gets it the next time they run `setup-ui.sh`. Commit `ui-components.txt` after running the script.

```bash
git add client/scripts/ui-components.txt
git commit -m "Add <component> to Gluestack UI components"
```

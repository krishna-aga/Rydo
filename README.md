# Rydo - Real-Time Campus Mobility & Ride Management

---
Project Deck:-https://docs.google.com/presentation/d/1D6U2__dRytR3ZGDtZw-yZmLThc1gtjMDgvWZWdhtMJs/edit?usp=sharing

Demo video : https://drive.google.com/file/d/1rwRnaqsbUfvkUrsvqshuQ85ZxAo4OZHs/view?usp=sharing
## 📝 Project Overview

Rydo is a real-time campus mobility and ride management platform designed for campus transit dispatch scenarios, such as managing e-rickshaw fleets and golf cart operations at IIT Roorkee. 

The system leverages a **Turborepo** monorepo using **pnpm workspaces** and native **ESModules (ESM)** to build modular, typesafe components for real-time driver tracking, ride dispatch workflows, ratings, notifications, and analytics.

---

## 🛠️ Technology Stack

- **Monorepo**: [Turborepo](https://turbo.build/) + [pnpm Workspaces](https://pnpm.io/)
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + Zustand
- **Backend**: Express + TypeScript + Socket.io + tsx
- **Database**: PostgreSQL (hosted on [Neon](https://neon.tech/)) + Prisma ORM
- **Shared Package**: Shared TS Types / DTOs
- **UI Package**: Reusable styling-free Tailwind React Component Library

---

## ✨ Feature List

- **Real-Time Dispatch & Sockets**: Live driver location tracking on Leaflet maps and instant request/accept synchronization using Socket.io.
- **Restricted Campus Vehicles & Flat Fares**: Restricted strictly to environment-friendly campus vehicles: **E-Rickshaw** (flat rate of ₹10) and **Golf Cart** (flat rate of ₹8).
- **Advanced Ride Scheduling**: Book future campus transits using date-time selectors, dispatched dynamically via server background minute cron tasks.
- **Interactive Map Selection**: Choose coordinates/landmarks directly by clicking on the campus Leaflet Map canvas or trigger GPS geolocation.
- **Navbar Notification Center**: Access a persistent dropdown panel of unread and history notifications inside the header, with options to mark read and clear all.
- **Analytics & Admin Console**: Integrated Recharts statistics dashboards for drivers/passengers and an interactive driver credentials approval verification queue for admins.
- **Swagger Documentation**: Production-ready API endpoints interactive sandbox fully documented at `/api-docs`.

---

## 📁 Repository Structure

```text
/
├── apps/
│   ├── web/                     # Vite + React 18 + TS + Tailwind CSS (Port 3000)
│   └── backend/                 # Express + TS + Socket.io + dotenv (Port 5000)
├── packages/
│   ├── db/                      # Prisma ORM setup + Prisma Client exports
│   ├── shared/                  # Shared TypeScript interfaces & models
│   └── ui/                      # Reusable React components (Tailwind classes)
├── docs/                        # Project Specifications & Documentation
│   ├── db_schema.md             # Detailed database model definitions
│   ├── api_doc.md               # API endpoint documentation
│   ├── project_status.md        # Monorepo completion state tracking
│   └── PROJECT_ROADMAP.md       # Development phase roadmaps
├── .env.example                 # Root environment variables template
├── package.json                 # Monorepo scripts and dependency definitions
├── pnpm-workspace.yaml          # pnpm workspace configuration
└── turbo.json                   # Turborepo task pipeline configuration
```

---

## ⚙️ Setup Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed.

### 1. Installation
Install all project and package dependencies at the workspace root:
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Open `.env` and fill in your **Neon PostgreSQL** database string:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@your-neon-host.aws.neon.tech/neondb?sslmode=require"
```

### 3. Generate Prisma Client
Generate the local Prisma Client schemas and typescript types:
```bash
pnpm db:generate
```

### 4. Setup Database Tables (Neon)
Sync your Prisma schemas to your live Neon database:
```bash
pnpm db:push
```

### 5. Build Workspace
Build all packages and applications:
```bash
pnpm build
```

---

## 🚀 Running the Application

### Start Development Servers
Run the development environment concurrently in watch mode:
```bash
pnpm dev
```
Once started:
- **Web Client**: [http://localhost:3000](http://localhost:3000)
- **Express Server API**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Docs**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

*Note: Monorepo watch compilers will compile any active changes inside `@rydo/shared` and `@rydo/ui` automatically.*

---

## 🌐 Live Deployments

- **Frontend Client App (Vercel)**: [https://rydo-web.vercel.app/](https://rydo-web.vercel.app/)
- **Backend Express Server (Render)**: [https://rydo-k1l4.onrender.com](https://rydo-k1l4.onrender.com)
- **API Swagger Documentation**: [https://rydo-k1l4.onrender.com/api-docs](https://rydo-k1l4.onrender.com/api-docs)

---

## 🔑 Admin Console & Production Configuration

The **Admin Control Panel** is integrated directly into the core React client package (`apps/web`). It is fully client-side driven and routes/views are automatically deployed whenever you deploy the frontend to Vercel.

### 1. Accessing the Admin Console
To access the verification queue and admin metrics dashboard:
1. Navigate to the deployed client url (e.g. `https://rydo-web.vercel.app/`).
2. Log in using an account that has its `role` set to `ADMIN` (such as `admin@rydo.com`).
3. The platform will automatically redirect you to the Admin Console view instead of standard passenger/driver sidebars.

### 2. Creating or Upgrading an Admin User
If you want to grant admin access to another account, you can update its database role:
- **Local Database / Studio**:
  Run Prisma Studio from your root directory to view and edit tables:
  ```bash
  npx prisma studio --schema=packages/db/prisma/schema.prisma
  ```
  Find the target user row in the `User` table, modify its `role` column to `ADMIN`, and click **Save 1 change**.
- **Neon Console (Production)**:
  Execute a direct SQL query against your database cluster in the Neon SQL Editor:
  ```sql
  UPDATE "User" SET role = 'ADMIN' WHERE email = 'target-email@example.com';
  ```

### 3. Deploying & Environment Variable Configuration
To ensure real-time socket connections and API fetches resolve successfully across your production sites, configure the following variables on their respective hosting platforms:

#### A. Frontend Configuration (Vercel)
Set these custom environment variables under your Vercel Project Settings:
- `VITE_API_URL`: The production API server address (e.g., `https://rydo-k1l4.onrender.com/api`).
- `VITE_SOCKET_URL`: The production real-time socket server address (e.g., `https://rydo-k1l4.onrender.com`).

#### B. Backend CORS Configuration (Render)
To resolve CORS blocks from your client domain, configure these variables in your Render Web Service settings:
- `CLIENT_URL`: A comma-separated list of origins permitted to communicate with your backend. (e.g., `https://rydo-web.vercel.app,http://localhost:3000`).
- `PORT`: Configured by Render (defaulting to port `5000` locally).
- `DATABASE_URL`: Your live Neon PostgreSQL connection string.


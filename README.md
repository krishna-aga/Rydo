# Rydo - Real-Time Campus Mobility & Ride Management

Rydo is a real-time campus mobility and ride management platform (designed for campus scenarios such as e-rickshaw dispatch systems at IIT Roorkee).

Built as a **Turborepo** monorepo using **pnpm workspaces** and native **ESModules (ESM)**.

---

## 🛠️ Technology Stack

- **Monorepo**: [Turborepo](https://turbo.build/) + [pnpm Workspaces](https://pnpm.io/)
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + Zustand
- **Backend**: Express + TypeScript + Socket.io + tsx
- **Database**: PostgreSQL (hosted on [Neon](https://neon.tech/)) + Prisma ORM
- **Shared Package**: Shared TS Types / DTOs
- **UI Package**: Reusable styling-free Tailwind React Component Library

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

## 🚀 Setup & Execution Instructions

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

### 6. Start Development Servers
Run the development environment concurrently:
```bash
pnpm dev
```
- Web Client: [http://localhost:3000](http://localhost:3000)
- Express Server API: [http://localhost:5000](http://localhost:5000)
- Watch compiles active changes in `@rydo/shared` and `@rydo/ui` on the fly.

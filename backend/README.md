# Backend Setup

## Prerequisites

- Node.js 18+
- npm 9+
- Docker (optional, for local PostgreSQL)

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL (optional, provided via Docker Compose)**
   ```bash
   npm run db:start
   ```
   This spins up a `postgres:15` container with credentials matching the default
   `DATABASE_URL` defined in `env.sample`.

3. **Configure environment variables**
   - Duplicate `env.sample` to `.env`
   - Adjust any values as needed (e.g. change `DATABASE_URL` if you use another instance)

4. **Run migrations & seed data**
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Start the API**
   ```bash
   npm run dev
   ```

## Helpful Commands

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `npm run db:start`   | Start local PostgreSQL via Docker Compose  |
| `npm run db:stop`    | Stop the PostgreSQL container              |
| `npm run db:reset`   | Stop and remove PG container + data volume |
| `npm run prisma:studio` | Open Prisma Studio to inspect data      |

## Default Accounts

Seed script creates several farmer accounts:

| Phone       | Password  | Role   |
| ----------- | --------- | ------ |
| 18800000001 | farmer123 | farmer |
| 18800000002 | farmer123 | farmer |
| 18800000003 | farmer123 | farmer |

Use these credentials to log in via the Expo app once the backend is running.

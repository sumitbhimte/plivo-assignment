# Status Page Application

A multi-tenant status page application similar to StatusPage, Cachet, Betterstack, or Openstatus. This application allows organizations to manage and display the status of their services, incidents, and maintenance windows.

## 📋 Project Status

**Phase 1 Complete ✅** - Project setup and foundation established. See [PLAN.md](./PLAN.md) for detailed implementation plan.

## 🎯 Features

- ✅ User Authentication (via Clerk)
- ✅ Team Management (via Clerk Organizations)
- ✅ Multi-tenant Organization Support
- ✅ Service Management (CRUD operations)
- ✅ Incident Management
- ✅ Maintenance Scheduling
- ✅ Real-time Status Updates (WebSocket)
- ✅ Public Status Page

## 🚀 Implementation Plan

This project will be implemented in 8 phases:

1. **Phase 1:** Project Setup & Foundation ✅
2. **Phase 2:** Database Schema & Authentication (Next)
3. **Phase 3:** Service Management (CRUD)
4. **Phase 4:** Incident Management
5. **Phase 5:** Maintenance Management
6. **Phase 6:** Public Status Page
7. **Phase 7:** Real-time Updates (WebSocket)
8. **Phase 8:** Polish & Deployment

See [PLAN.md](./PLAN.md) for detailed breakdown of each phase.

## 🛠️ Tech Stack

- **Frontend (Client):** Next.js 14, React, TypeScript, ShadcnUI, Tailwind CSS
- **Backend (Server):** Express.js, Node.js, TypeScript
- **Database:** MongoDB with Prisma ORM (shared)
- **Authentication:** Clerk
- **Real-time:** Socket.io
- **Deployment:** 
  - Frontend: Vercel
  - Backend: Railway/Render/Heroku

## 📖 Documentation

- [Implementation Plan](./PLAN.md) - Detailed step-by-step implementation plan
- [Environment Setup](./ENV_SETUP.md) - Environment variables and setup instructions

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```
   Or install separately:
   ```bash
   npm install              # Root dependencies
   cd client && npm install # Client dependencies
   cd ../server && npm install # Server dependencies
   ```

2. **Set Up Environment Variables**
   - Create `.env.local` in the root directory (see [ENV_SETUP.md](./ENV_SETUP.md))
   - Configure your database URL and Clerk keys

3. **Set Up Database**
   ```bash
   npm run db:generate  # Generate Prisma client
   npm run db:push      # Push schema to database
   ```

4. **Run Development Servers**
   ```bash
   npm run dev  # Runs both client and server concurrently
   ```
   Or run separately:
   ```bash
   npm run dev:server  # Terminal 1: Express server on :3001
   npm run dev:client  # Terminal 2: Next.js client on :3000
   ```

5. **Access the Application**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:3001](http://localhost:3001)
   - **Health Check:** [http://localhost:3001/health](http://localhost:3001/health)

## 📁 Project Structure

```
plivo-assignment/
├── client/                 # Next.js Frontend
│   ├── app/               # Next.js app directory
│   │   ├── (auth)/       # Authentication routes
│   │   ├── (public)/     # Public routes (status page)
│   │   └── (dashboard)/  # Protected dashboard routes
│   ├── components/       # React components
│   │   ├── ui/          # ShadcnUI components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── public/      # Public page components
│   │   └── shared/      # Shared components
│   ├── lib/             # Client utilities
│   └── hooks/          # Custom React hooks
│
├── server/                 # Express.js Backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── lib/         # Server utilities (Prisma, etc.)
│   │   └── index.ts     # Server entry point
│   └── package.json
│
├── prisma/                 # Database (shared)
│   └── schema.prisma     # Prisma schema
│
└── package.json           # Root package.json (monorepo)
```

---

**Status:** Phase 1 complete. Ready to begin Phase 2.
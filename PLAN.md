# Status Page Application - Implementation Plan

## 🎯 Project Overview

A multi-tenant status page application allowing organizations to manage and display the status of their services, incidents, and maintenance windows.

## 🏗️ Architecture Overview

### Tech Stack Selection

**Frontend:**
- **Framework:** Next.js 14 (App Router) - React framework with SSR/SSG capabilities
- **UI Library:** ShadcnUI + Tailwind CSS - Clean, minimalistic design similar to Linear
- **State Management:** React Query (TanStack Query) for server state + Zustand for client state
- **Real-time:** Socket.io-client for WebSocket connections

**Backend:**
- **Framework:** Express.js (separate server)
- **Database:** PostgreSQL with Prisma ORM (shared between client and server)
- **Authentication:** Clerk Express middleware
- **Real-time:** Socket.io for WebSocket server
- **Validation:** Zod for schema validation

**Deployment:**
- **Frontend:** Vercel (optimal for Next.js)
- **Backend:** Railway/Render/Heroku (Express.js server)
- **Database:** Supabase (PostgreSQL) or Railway PostgreSQL

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (Next.js - Client)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Public Page  │  │ Admin Panel  │  │ Auth (Clerk) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │ HTTP/REST
                          │ WebSocket
                    ┌─────┴─────┐
                    │           │
            ┌───────▼──────┐ ┌──▼──────────┐
            │ REST API     │ │ WebSocket   │
            │ (Express.js) │ │ (Socket.io) │
            └───────┬──────┘ └──┬──────────┘
                    │           │
            ┌───────▼───────────▼──────┐
            │   Prisma ORM             │
            │   (Shared)               │
            └───────┬──────────────────┘
                    │
            ┌───────▼──────┐
            │  PostgreSQL  │
            └──────────────┘
```

## 📋 Database Schema Design

### Core Entities

1. **Organization** (Multi-tenant)
   - id, name, slug, createdAt, updatedAt
   - Clerk organization integration

2. **Service**
   - id, organizationId, name, description, status, createdAt, updatedAt
   - Status enum: OPERATIONAL, DEGRADED, PARTIAL_OUTAGE, MAJOR_OUTAGE

3. **Incident**
   - id, organizationId, title, description, status, impact, createdAt, updatedAt, resolvedAt
   - Status enum: INVESTIGATING, IDENTIFIED, MONITORING, RESOLVED
   - Impact enum: NONE, MINOR, MAJOR, CRITICAL

4. **IncidentUpdate**
   - id, incidentId, status, message, createdAt

5. **Maintenance**
   - id, organizationId, title, description, scheduledStart, scheduledEnd, status, createdAt, updatedAt
   - Status enum: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

6. **ServiceIncident** (Many-to-Many)
   - incidentId, serviceId

7. **ServiceMaintenance** (Many-to-Many)
   - maintenanceId, serviceId

8. **StatusHistory** (Audit trail)
   - id, serviceId, status, changedAt, changedBy

## 🚀 Implementation Phases

### Phase 1: Project Setup & Foundation
**Goal:** Set up the project structure and basic configuration

**Tasks:**
1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS and ShadcnUI
3. Configure Prisma with PostgreSQL
4. Set up Clerk authentication
5. Create basic folder structure
6. Set up environment variables

**Deliverables:**
- Working Next.js app with basic UI
- Database connection established
- Clerk authentication integrated

---

### Phase 2: Database Schema & Authentication
**Goal:** Create database schema and implement authentication flow

**Tasks:**
1. Design and implement Prisma schema
2. Create database migrations
3. Set up Clerk middleware for protected routes
4. Implement organization context (multi-tenant)
5. Create user roles/permissions structure

**Deliverables:**
- Complete database schema
- Authentication working
- Multi-tenant context established

---

### Phase 3: Service Management (CRUD)
**Goal:** Implement service management functionality

**Tasks:**
1. Create API routes for service CRUD operations
2. Build admin UI for service management
3. Implement service status updates
4. Add status history tracking
5. Create service list/detail views

**Deliverables:**
- Full CRUD for services
- Status update functionality
- Admin UI for managing services

---

### Phase 4: Incident Management
**Goal:** Implement incident creation and management

**Tasks:**
1. Create API routes for incident CRUD
2. Build incident creation/editing UI
3. Implement incident updates (status changes, messages)
4. Associate incidents with services
5. Create incident timeline view

**Deliverables:**
- Incident management system
- Service-incident associations
- Incident update system

---

### Phase 5: Maintenance Management
**Goal:** Implement scheduled maintenance functionality

**Tasks:**
1. Create API routes for maintenance CRUD
2. Build maintenance scheduling UI
3. Implement maintenance status tracking
4. Associate maintenances with services
5. Create maintenance calendar view

**Deliverables:**
- Maintenance scheduling system
- Service-maintenance associations

---

### Phase 6: Public Status Page
**Goal:** Create public-facing status page

**Tasks:**
1. Design public status page layout
2. Fetch and display all services with current status
3. Show active incidents and maintenances
4. Create status timeline/history view
5. Implement status page customization (org-specific)

**Deliverables:**
- Public status page
- Service status display
- Incident/maintenance visibility

---

### Phase 7: Real-time Updates (WebSocket)
**Goal:** Implement real-time status updates

**Tasks:**
1. Set up Socket.io server
2. Implement WebSocket connection on frontend
3. Broadcast status changes in real-time
4. Update UI automatically on status changes
5. Handle connection errors and reconnection

**Deliverables:**
- Real-time status updates
- WebSocket integration
- Auto-updating UI

---

### Phase 8: Polish & Deployment
**Goal:** Finalize and deploy the application

**Tasks:**
1. Add error handling and loading states
2. Implement responsive design
3. Add loading skeletons
4. Optimize performance
5. Set up deployment on Vercel
6. Configure production database
7. Add environment-specific configurations
8. Create comprehensive README

**Deliverables:**
- Production-ready application
- Deployed to Vercel
- Complete documentation

---

## 📁 Project Structure

```
plivo-assignment/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── sign-in/
│   │   ├── (public)/
│   │   │   └── status/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── services/
│   │   │   ├── incidents/
│   │   │   └── maintenance/
│   │   └── api/
│   │       ├── services/
│   │       ├── incidents/
│   │       ├── maintenance/
│   │       └── websocket/
│   ├── components/
│   │   ├── ui/          # ShadcnUI components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── public/      # Public page components
│   │   └── shared/      # Shared components
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── clerk.ts
│   │   ├── socket.ts
│   │   └── utils.ts
│   └── hooks/
│       └── use-socket.ts
├── public/
├── .env.local
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🔑 Key Design Decisions

1. **Multi-tenancy:** Using Clerk organizations for tenant isolation
2. **Real-time:** Socket.io for bidirectional communication
3. **State Management:** React Query for server state, Zustand for client state
4. **Styling:** ShadcnUI + Tailwind for consistent, modern UI
5. **Database:** PostgreSQL for relational data with Prisma for type safety
6. **API:** Next.js API routes for simplicity (can be extracted later if needed)

## 🎨 UI/UX Considerations

- **Design Language:** Minimalistic, clean (Linear-inspired)
- **Color Scheme:** 
  - Operational: Green
  - Degraded: Yellow
  - Partial Outage: Orange
  - Major Outage: Red
- **Responsive:** Mobile-first approach
- **Accessibility:** WCAG 2.1 AA compliance

## 📝 Next Steps

1. Review and approve this plan
2. Start with Phase 1: Project Setup & Foundation
3. Iterate through phases step by step
4. Test each phase before moving to the next

---

**Ready to proceed?** Let's start with Phase 1 when you're ready!


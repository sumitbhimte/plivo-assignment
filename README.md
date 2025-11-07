# Status Page Application

A full-featured status page application similar to StatusPage or Cachet, built with Next.js, Express.js, MongoDB, and Clerk authentication.


All core features have been implemented and are fully functional.

## 🚀 Features

### ✅ Authentication & Authorization
- **Clerk Integration** - Secure authentication with multi-tenant support
- **Role-Based Access Control** - Admin and Member (Viewer) roles
- **Hardcoded Admin** - Username `admin123` has full admin access
- **Organization Management** - Multi-tenant support with organization switching

### ✅ Service Management
- **Create Services** - Add new services with name, description, and status
- **Update Services** - Edit service details and change status
- **Delete Services** - Remove services from the system
- **Status Management** - 4 status levels:
  - 🟢 **Operational** - Service is working normally
  - 🟡 **Degraded** - Service has issues but partially working
  - 🟠 **Partial Outage** - Service is partially down
  - 🔴 **Major Outage** - Service is completely down
- **Status History** - Automatic tracking of status changes

### ✅ Incident Management
- **Create Incidents** - Report new incidents with title, description, impact level
- **Update Incidents** - Modify incident details and status
- **Delete Incidents** - Remove incidents
- **Status Tracking** - Track incident lifecycle:
  - Investigating → Identified → Monitoring → Resolved
- **Impact Levels** - None, Minor, Major, Critical
- **Incident Updates** - Add status updates and messages

### ✅ Maintenance Management
- **Schedule Maintenance** - Create maintenance windows with start/end times
- **Update Maintenance** - Modify scheduled maintenance details
- **Delete Maintenance** - Cancel maintenance windows
- **Status Tracking** - Track maintenance status:
  - Scheduled → In Progress → Completed → Cancelled

### ✅ User Roles

#### Admin (`admin123` or `org:admin` role)
- ✅ Create, update, delete services
- ✅ Change service status
- ✅ Create and manage incidents
- ✅ Schedule and manage maintenance
- ✅ Full access to all features

#### Member/Viewer (normal users)
- ✅ View services and their status
- ✅ View incidents
- ✅ View scheduled maintenance
- ✅ Read-only access

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **ShadcnUI** - Beautiful UI components
- **Clerk** - Authentication and user management

### Backend
- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe backend
- **MongoDB** - NoSQL database
- **Prisma ORM** - Database toolkit
- **Socket.io** - Real-time updates (ready for implementation)

### Infrastructure
- **MongoDB Atlas** - Cloud database
- **Clerk** - Authentication service
- **Monorepo** - Client and server in separate workspaces

## 📁 Project Structure

```
plivo-assignment/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── (auth)/        # Authentication pages
│   │   ├── (dashboard)/   # Dashboard pages
│   │   │   ├── dashboard/ # Dashboard home
│   │   │   ├── services/  # Service management ✅
│   │   │   ├── incidents/ # Incident management ✅
│   │   │   └── maintenance/ # Maintenance management ✅
│   │   └── (public)/      # Public status page
│   ├── components/        # React components
│   └── lib/               # Utilities and helpers
├── server/                # Express.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   │   ├── services.ts ✅
│   │   │   ├── incidents.ts ✅
│   │   │   └── maintenance.ts ✅
│   │   ├── middleware/   # Auth & error handling
│   │   └── lib/           # Utilities
└── prisma/                # Database schema
    └── schema.prisma      # MongoDB models
```

## 🚀 Quick Start

### Prerequisites
- Node.js v24.7.0+ (use `nvm` to manage versions)
- MongoDB connection string
- Clerk account with API keys

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   npm run install:all
   ```

2. **Set up environment variables:**
   
   Create `.env.local` in the root directory:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   
   # Database
   DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/dbname
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3001
   CLIENT_URL=http://localhost:3000
   PORT=3001
   ```

   Also create `client/.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```
   
   This starts:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

## 👤 Admin Access

### Hardcoded Admin User
- **Username:** `admin123`
- **Access:** Full admin privileges (bypasses organization checks)
- **Can:** Create, update, delete services, incidents, and maintenance

### Creating Admin via Clerk Dashboard
1. Go to Clerk Dashboard → Organizations
2. Select your organization
3. Go to Members tab
4. Find the user and change role to **"Admin"**

## 📝 API Endpoints

### Services
- `GET /api/services` - List all services
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Incidents
- `GET /api/incidents` - List all incidents
- `GET /api/incidents/:id` - Get single incident
- `POST /api/incidents` - Create incident
- `PUT /api/incidents/:id` - Update incident
- `POST /api/incidents/:id/updates` - Add incident update
- `DELETE /api/incidents/:id` - Delete incident

### Maintenance
- `GET /api/maintenance` - List all maintenance windows
- `GET /api/maintenance/:id` - Get single maintenance
- `POST /api/maintenance` - Schedule maintenance
- `PUT /api/maintenance/:id` - Update maintenance
- `DELETE /api/maintenance/:id` - Delete maintenance

## 🎯 Usage Guide

### For Admins

1. **Login** with `admin123` or admin role
2. **Navigate** to Services/Incidents/Maintenance from dashboard
3. **Create** new items using the "Add" buttons
4. **Update** status using dropdowns on each card
5. **Edit/Delete** using icons on each card

### For Viewers

1. **Login** with any user account
2. **View** services and their current status
3. **View** active incidents
4. **View** scheduled maintenance
5. **Read-only** access - cannot modify anything

## 🔐 Authentication

- **Clerk** handles all authentication
- **Organization-based** multi-tenancy
- **Role-based** permissions (Admin/Member)
- **Hardcoded admin** bypass for `admin123` username

## 📊 Database Schema

- **Organizations** - Multi-tenant organizations
- **Services** - Monitored services
- **Incidents** - Service incidents
- **Maintenance** - Scheduled maintenance windows
- **Status History** - Service status change history
- **Incident Updates** - Incident status updates

## 🚧 Future Enhancements (Optional)

- Real-time updates via WebSocket
- Public status page
- Email notifications
- Service dependencies
- Uptime monitoring
- Custom status pages per organization

## 📄 License

MIT License

## 👨‍💻 Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm run start
```

### Database Management
```bash
npm run db:studio    # Open Prisma Studio
npm run db:push      # Push schema changes
npm run db:generate  # Generate Prisma client
```

## 🎉 Status

**✅ Application is complete and fully functional!**

All core features are implemented:
- ✅ Authentication & Authorization
- ✅ Service Management (CRUD)
- ✅ Incident Management (CRUD)
- ✅ Maintenance Management (CRUD)
- ✅ Role-Based Access Control
- ✅ Multi-tenant Support

Ready for use and further customization!

import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// Try root .env.local first (two levels up from server/src), then fallback to server/.env
const rootEnvPath = resolve(__dirname, "../../.env.local");
const serverEnvPath = resolve(__dirname, "../.env");

// Debug: Log which env files are being loaded (only in development)
if (process.env.NODE_ENV !== "production") {
  console.log(`📁 Loading env from: ${rootEnvPath}`);
  console.log(`📁 Fallback env: ${serverEnvPath}`);
}

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serverEnvPath });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(authMiddleware); // Clerk authentication middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// API Routes
import organizationsRouter from "./routes/organizations";
import servicesRouter from "./routes/services";
import incidentsRouter from "./routes/incidents";
import maintenanceRouter from "./routes/maintenance";
app.use("/api/organizations", organizationsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/incidents", incidentsRouter);
app.use("/api/maintenance", maintenanceRouter);

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  // Join organization room for real-time updates
  socket.on("join:organization", (organizationId: string) => {
    socket.join(`org:${organizationId}`);
    console.log(`Socket ${socket.id} joined organization ${organizationId}`);
  });

  // Leave organization room
  socket.on("leave:organization", (organizationId: string) => {
    socket.leave(`org:${organizationId}`);
    console.log(`Socket ${socket.id} left organization ${organizationId}`);
  });
});

// Export io for use in other modules
export { io };

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});


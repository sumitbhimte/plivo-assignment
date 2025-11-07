import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";

// Load environment variables
// Try root .env.local first, then fallback to server/.env
dotenv.config({ path: "../.env.local" });
dotenv.config({ path: ".env" });

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
app.get("/health", (req, res) => {
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


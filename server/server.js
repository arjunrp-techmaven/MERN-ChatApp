import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

import { setupSocket } from "./controller/socket.controller.js";
setupSocket(io);

app.use("/api", userRoutes);
app.use("/api", chatRoutes(io));
app.use("/api/uploads", express.static("uploads"));

// --- Socket.IO ---

server.listen(PORT, () => {
  connectDB();
  console.log("Server running on http://localhost:5000");
});
export { io };

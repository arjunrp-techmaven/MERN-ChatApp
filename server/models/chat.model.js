import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  from: String, // userId
  to: String, // userId
  message: String,
  fileUrl: String,
  fileName: String,
  fileType: String,
  timestamp: { type: Date, default: Date.now },
  deletedBy: [String],
});

const chatRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);
const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);

export { Message, ChatRequest };

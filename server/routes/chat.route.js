import express from "express";
import {
  checkContact,
  clearChatHistory,
  deleteMessage,
  getChatRequests,
  getMessages,
  respondChatRequest,
  sendChatRequest,
  uploadFile,
} from "../controller/chat.controller.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/chats/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

export default function chatRoutes(io) {
  const router = express.Router();

  router.get("/messages/:userId1/:userId2", getMessages);
  router.get("/check-contact", checkContact);
  router.post("/chat-request", (req, res) => sendChatRequest(req, res, io));
  router.get("/chat-requests/:userId", getChatRequests);
  router.post("/chat-request/respond", (req, res) =>
    respondChatRequest(req, res, io)
  );
  router.patch("/messages/:messageId/delete", deleteMessage);
  router.patch("/messages/clear", clearChatHistory);
  router.post("/upload", upload.single("file"), (req, res) =>
    uploadFile(req, res, io)
  );

  return router;
}

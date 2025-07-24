import { Message, ChatRequest } from "../models/chat.model.js";
import User from "../models/user.model.js";

// Get chat history between two users
export const getMessages = async (req, res) => {
  const { userId1, userId2 } = req.params;
  const user1 = await User.findById(userId1);
  if (!user1.contacts.includes(userId2)) {
    return res.json([]);
    // return res
    //   .status(403)
    //   .json({ error: "You are not contacts. Send a chat request first." });
  }
  const messages = await Message.find({
    $or: [
      { from: userId1, to: userId2 },
      { from: userId2, to: userId1 },
    ],
    deletedBy: { $ne: userId1 },
  }).sort({ timestamp: 1 });
  res.json(messages || []);
};

export const checkContact = async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2)
    return res.status(400).json({ error: "Missing user IDs" });

  // Check if already contacts
  const user = await User.findById(user1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const isContact = user.contacts.map((id) => id.toString()).includes(user2);

  if (isContact) {
    return res.json({ isContact: true, requestStatus: "none" });
  }

  // Check if user1 sent a pending request to user2
  const sent = await ChatRequest.findOne({
    from: user1,
    to: user2,
    status: "pending",
  });
  if (sent) {
    return res.json({ isContact: false, requestStatus: "pending" });
  }

  // Check if user2 sent a pending request to user1
  const received = await ChatRequest.findOne({
    from: user2,
    to: user1,
    status: "pending",
  });
  if (received) {
    return res.json({
      isContact: false,
      requestStatus: "received",
      requestId: received._id,
    });
  }

  // No contact, no pending requests
  return res.json({ isContact: false, requestStatus: "none" });
};

// Send chat request
export const sendChatRequest = async (req, res, io) => {
  const { from, to } = req.body;
  if (from === to)
    return res.status(400).json({ error: "Cannot send request to yourself" });

  // Check if already contacts
  const fromUser = await User.findById(from);
  if (fromUser.contacts.includes(to))
    return res.status(400).json({ error: "Already contacts" });

  // Check if request already exists
  const existing = await ChatRequest.findOne({ from, to, status: "pending" });
  if (existing) return res.status(400).json({ error: "Request already sent" });

  await ChatRequest.create({ from, to });
  // Notify both users via Socket.IO

  const toUser = await User.findById(to);
  if (fromUser.socketId) {
    console.log("Emitting chat request from", fromUser.socketId);
    io.to(fromUser.socketId).emit("contacts_updated");
  }
  if (toUser.socketId) {
    console.log("Emitting chat request to", fromUser.socketId);
    io.to(toUser.socketId).emit("contacts_updated");
  }
  res.json({ message: "Chat request sent" });
};

// Incoming chat request
export const getChatRequests = async (req, res) => {
  const requests = await ChatRequest.find({
    to: req.params.userId,
    status: "pending",
  }).populate("from", "fullname username");
  res.json(requests);
};

// Accept/reject chat request
export const respondChatRequest = async (req, res, io) => {
  const { requestId, accept } = req.body;
  const request = await ChatRequest.findById(requestId);
  if (!request) return res.status(404).json({ error: "Request not found" });

  if (accept) {
    request.status = "accepted";
    await request.save();
    // Add each other as contacts
    await User.findByIdAndUpdate(request.from, {
      $addToSet: { contacts: request.to },
    });
    await User.findByIdAndUpdate(request.to, {
      $addToSet: { contacts: request.from },
    });
    // Notify both users via Socket.IO
    const fromUser = await User.findById(request.from);
    const toUser = await User.findById(request.to);
    if (fromUser.socketId) {
      console.log("Emitting chat request accepted from", fromUser.socketId);
      io.to(fromUser.socketId).emit("chat_request_accepted", {
        userId: request.to,
      });
      io.to(fromUser.socketId).emit("contacts_updated");
    }
    if (toUser.socketId) {
      console.log("Emitting chat request accepted to", toUser.socketId);
      io.to(toUser.socketId).emit("chat_request_accepted", {
        userId: request.from,
      });
      io.to(toUser.socketId).emit("contacts_updated");
    }
    res.json({ message: "Chat request accepted" });
  } else {
    request.status = "rejected";
    await request.save();
    res.json({ message: "Chat request rejected" });
  }
};
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  const msg = await Message.findById(messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });

  // Add userId to deletedBy if not already present
  if (!msg.deletedBy.includes(userId)) {
    msg.deletedBy.push(userId);
    await msg.save();
  }

  res.json({ success: true });
};
export const clearChatHistory = async (req, res) => {
  const { userId, toUserId } = req.body;

  // Find all messages between userId and toUserId
  await Message.updateMany(
    {
      $or: [
        { from: userId, to: toUserId },
        { from: toUserId, to: userId },
      ],
      deletedBy: { $ne: userId },
    },
    { $push: { deletedBy: userId } }
  );

  res.json({ success: true });
};

export const uploadFile = async (req, res, io) => {
  const { from, to } = req.body;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // Save message with file info
  const msg = await Message.create({
    from,
    to,
    message: req.body.message || "",
    fileUrl: `/uploads/chats/${req.file.filename}`,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
  });

  // emit via Socket.IO here
  const toUser = await User.findById(to);
  const message = {
    from,
    message: msg.message || "",
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    fileType: msg.fileType,
  };
  if (toUser && toUser.socketId) {
    io.to(toUser.socketId).emit("private_message", { from, message });
  }
  res.json(msg);
};
export const markReadMessages = async (req, res, io) => {
  const { from, to } = req.body;
  await Message.updateMany({ from, to, read: false }, { $set: { read: true } });
  const fromUser = await User.findById(request.from);
  io.to(fromUser.socketId).emit("contacts_updated");
  res.json({ success: true });
};

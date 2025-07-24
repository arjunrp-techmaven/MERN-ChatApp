import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { ChatRequest, Message } from "../models/chat.model.js";

const email = process.env.EMAIL_USER || "info.chatapp@gmail.com";
const password = process.env.EMAIL_PASS || "";
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email provider
  auth: {
    user: email,
    pass: password,
  },
});

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register
export const registerUser = async (req, res) => {
  const { fullname, username, password } = req.body;
  if (!fullname || !username || !password)
    return res
      .status(400)
      .json({ error: "Full name, email, and password required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username))
    return res.status(400).json({ error: "Invalid email address" });

  const existing = await User.findOne({ username });
  if (existing)
    return res.status(400).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);
  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Try to send the email first
  try {
    await transporter.sendMail({
      from: '"ChatApp" <info.chatapp@gmail.com>',
      to: username,
      subject: "Your ChatApp Verification Code",
      html: `<p>Hello ${fullname},</p>
             <p>Your verification code is: <b>${code}</b></p>
             <p>This code will expire in 10 minutes.</p>`,
    });

    // Only create the user if email sent successfully
    const user = await User.create({
      fullname,
      username,
      password: hash,
      emailVerified: false,
      verificationCode: code,
      verificationCodeExpires: expires,
    });

    res.json({
      message:
        "Registration successful! Please check your email for the verification code.",
      userId: user._id,
    });
  } catch (err) {
    console.error("Error sending email:", err);
    res
      .status(500)
      .json({ error: "Failed to send verification email. Please try again." });
  }
};
export const verifyCode = async (req, res) => {
  const { userId, code } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(400).json({ error: "User not found" });
  if (user.emailVerified)
    return res.status(400).json({ error: "Email already verified" });
  if (!user.verificationCode || !user.verificationCodeExpires)
    return res
      .status(400)
      .json({ error: "No code found. Please register again." });

  if (user.verificationCode !== code)
    return res.status(400).json({ error: "Invalid code" });
  if (user.verificationCodeExpires < new Date())
    return res.status(400).json({ error: "Code expired" });

  user.emailVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  res.json({ message: "Email verified! You can now log in." });
};
export const resendCode = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(400).json({ error: "User not found" });
  if (user.emailVerified)
    return res.status(400).json({ error: "Email already verified" });
  if (!user.verificationCode || !user.verificationCodeExpires)
    return res
      .status(400)
      .json({ error: "No code found. Please register again." });
  const code = generateCode();

  try {
    await transporter.sendMail({
      from: '"ChatApp" <info.chatapp@gmail.com>',
      to: user.username,
      subject: "Your ChatApp Verification Code",
      html: `<p>Hello ${user.fullname},</p>
             <p>Your verification code is: <b>${code}</b></p>
             <p>This code will expire in 10 minutes.</p>`,
    });
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();
    res.json({
      message:
        "Verification code resent successfully. Please check your email.",
    });
  } catch (err) {
    console.error("Error sending email:", err);
    res
      .status(500)
      .json({ error: "Failed to send verification email. Please try again." });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Email and password required" });

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  if (!user.emailVerified)
    return res.status(400).json({
      error: "Please verify your email before logging in.",
      userId: user._id,
    });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid credentials" });

  res.json({
    userId: user._id,
    username: user.username,
    fullname: user.fullname,
  });
};

// Get all users
export const getAllUsers = async (req, res) => {
  const users = await User.find({}, "_id username fullname profilePic");
  res.json(
    users.map((u) => ({
      userId: u._id,
      username: u.username,
      fullname: u.fullname,
      profilePic: u.profilePic,
    }))
  );
};

export const getContacts = async (req, res) => {
  const user = await User.findById(req.params.userId).populate(
    "contacts",
    "_id username fullname profilePic"
  );
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json(
    user.contacts.map((u) => ({
      userId: u._id,
      username: u.username,
      fullname: u.fullname,
      profilePic: u.profilePic,
    }))
  );
};
export const chatContacts = async (req, res) => {
  const userId = req.params.userId;

  // 1. Get accepted contacts
  const user = await User.findById(userId).populate(
    "contacts",
    "_id username fullname profilePic"
  );
  const contacts = user.contacts.map((u) => ({
    userId: u._id,
    username: u.username,
    fullname: u.fullname,
    profilePic: u.profilePic,
    status: "contact",
  }));

  // 2. Get pending chat requests (sent or received)
  const pendingRequests = await ChatRequest.find({
    $or: [{ from: userId }, { to: userId }],
    status: "pending",
  });

  // For each pending request, get the other user
  const pendingUserIds = [];
  const pendingStatus = [];
  for (const req of pendingRequests) {
    let otherUserId, status;
    if (req.from.toString() === userId) {
      otherUserId = req.to;
      status = "pending_sent";
    } else {
      otherUserId = req.from;
      status = "pending_received";
    }
    pendingUserIds.push(otherUserId);
    pendingStatus.push({ id: otherUserId.toString(), status });
  }

  // Remove users already in contacts
  const contactIds = user.contacts.map((u) => u._id.toString());
  const uniquePendingUserIds = pendingUserIds.filter(
    (id) => !contactIds.includes(id.toString())
  );

  // Get user info for pending users
  const pendingUsers = await User.find(
    { _id: { $in: uniquePendingUserIds } },
    "_id username fullname profilePic"
  );

  // Attach status to each pending user
  const pendingUsersWithStatus = pendingUsers.map((u) => {
    const stat = pendingStatus.find((s) => s.id === u._id.toString());
    return {
      userId: u._id,
      username: u.username,
      fullname: u.fullname,
      profilePic: u.profilePic,
      status: stat ? stat.status : "pending",
    };
  });

  // --- Add last message, time, and unread count for contacts ---
  const contactsWithLastMsg = await Promise.all(
    contacts.map(async (contact) => {
      // Last message between user and contact
      const lastMsg = await Message.findOne({
        $or: [
          { from: userId, to: contact.userId },
          { from: contact.userId, to: userId },
        ],
      })
        .sort({ timestamp: -1 })
        .lean();

      // Unread count (messages sent to userId, not read)
      const unreadCount = await Message.countDocuments({
        from: contact.userId,
        to: userId,
        read: false, // You need a 'read' field in your Message schema
      });
      console.log("Unread count for", contact.fullname, ":", unreadCount);
      return {
        ...contact,
        lastMsg: lastMsg ? lastMsg.message : "",
        lastMsgTime: lastMsg ? lastMsg.timestamp : null,
        unreadCount,
      };
    })
  );

  // For pending users, you can leave lastMsg, lastMsgTime, unreadCount empty or null
  const pendingUsersWithMsg = pendingUsersWithStatus.map((u) => ({
    ...u,
    lastMsg: "",
    lastMsgTime: null,
    unreadCount: 0,
  }));

  // Combine and return
  res.json([...contactsWithLastMsg, ...pendingUsersWithMsg]);
};

// Get user profile
export const getProfile = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    userId: user._id,
    username: user.username,
    fullname: user.fullname,
    profilePic: user.profilePic,
  });
};
export const uploadProfilePicture = async (req, res) => {
  const { userId } = req.body;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const user = await User.findByIdAndUpdate(
    userId,
    { profilePic: `/uploads/profile/${req.file.filename}` },
    { new: true }
  );
  res.json({ profilePic: user.profilePic });
};
export const deleteProfilePicture = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (user && user.profilePic) {
    // Remove the file from the server
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "profile",
      path.basename(user.profilePic)
    );
    fs.unlink(filePath, (err) => {
      // Ignore error if file doesn't exist
      if (err && err.code !== "ENOENT") {
        console.error("Failed to delete profile picture:", err);
      }
    });
  }

  // Remove profilePic from user document
  user.profilePic = null;
  await user.save();

  res.json({ success: true });
};

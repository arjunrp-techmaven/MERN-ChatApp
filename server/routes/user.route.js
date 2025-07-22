import express from "express";
import {
  chatContacts,
  deleteProfilePicture,
  getAllUsers,
  getContacts,
  getProfile,
  loginUser,
  registerUser,
  resendCode,
  uploadProfilePicture,
  verifyCode,
} from "../controller/user.controller.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profile/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-code", verifyCode);
router.post("/login", loginUser);
router.get("/users", getAllUsers);
router.get("/users/contacts/:userId", getContacts);
router.get("/profile/:userId", getProfile);
router.get("/users/chats/:userId", chatContacts);
router.post("/resend-code", resendCode);
router.post(
  "/profile/upload",
  upload.single("profilePic"),
  uploadProfilePicture
);
router.post("/profile/remove-pic", deleteProfilePicture);

export default router;

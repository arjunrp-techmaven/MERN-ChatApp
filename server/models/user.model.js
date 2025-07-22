import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: String,
  username: { type: String, unique: true }, // email
  password: String,
  emailVerified: { type: Boolean, default: false },
  verificationCode: String,
  verificationCodeExpires: Date,
  socketId: String,
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // accepted contacts
  profilePic: String,
});
const User = mongoose.model("User", userSchema);

export default User;

// import { io } from "../server.js";
import User from "../models/user.model.js";
import { Message } from "../models/chat.model.js";

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    // console.log("New client connected", socket.id);
    socket.on("login", async ({ userId }) => {
      // Update socketId
      await User.findByIdAndUpdate(userId, { socketId: socket.id });

      // Find the user and populate contacts
      const user = await User.findById(userId).populate(
        "contacts",
        "_id username fullname"
      );
      if (!user) return;

      // Prepare contacts list
      const contacts = user.contacts.map((u) => ({
        userId: u._id,
        username: u.username,
        fullname: u.fullname,
      }));
      //   console.log(contacts, "contacts");
      // Emit only to the logged-in user's socket
      socket.emit("user_list", contacts);
    });

    socket.on("private_message", async ({ from, to, message }) => {
      await Message.create({ from, to, message });
      const toUser = await User.findById(to);
      if (toUser && toUser.socketId) {
        io.to(toUser.socketId).emit("private_message", { from, message });
      }
    });

    socket.on("disconnect", async () => {
      await User.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
      const users = await User.find({}, "_id username fullname");
      io.emit(
        "user_list",
        users.map((u) => ({
          userId: u._id,
          username: u.username,
          fullname: u.fullname,
        }))
      );
    });
  });
};

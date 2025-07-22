# Fullstack Real-Time Chat App

A modern, responsive real-time chat application built with React, Node.js, Express, MongoDB, and Socket.IO.  
Features include one-to-one messaging, chat requests, file sharing, profile picture upload, and more—styled like WhatsApp/Telegram Web.

---

## Features

- User Registration & Login (with email verification via OTP)
- Profile with Full Name, Email, and Profile Picture
- Profile Picture Upload, Resize, and Remove
- One-to-One Messaging (only after chat request is accepted)
- Chat Requests (accept/reject, real-time updates)
- Chat List (shows contacts and pending requests)
- File Sharing (images, documents, with preview)
- Delete Message ("Delete for me") and Clear Chat
- Responsive UI (mobile-friendly, sidebar hides on mobile)
- Real-Time Updates (Socket.IO)
- Loading Animations (profile picture upload, etc.)

---

## Screenshots

(Add screenshots/gifs here if you have them!)

---

## Tech Stack

- Frontend: React, React Router, CSS
- Backend: Node.js, Express, Socket.IO
- Database: MongoDB (Mongoose)
- File Uploads: Multer
- Image Compression: browser-image-compression (frontend)
- Email: Nodemailer (for OTP verification)

---

## Getting Started

### 1. Clone the repository

    git clone https://github.com/yourusername/your-chat-app.git
    cd your-chat-app

### 2. Setup the Backend

    cd server
    npm install

- Create a `.env` file in `/server` with:

      MONGODB_URI=your_mongodb_connection_string
      PORT=5000
      EMAIL_USER=your_email@gmail.com
      EMAIL_PASS=your_app_password

- Start the backend:

      npm start

### 3. Setup the Frontend

    cd ../client
    npm install

- Create a `.env` file in `/client` with:

      REACT_APP_API_URL=http://localhost:5000/api
      REACT_APP_SOCKET_URL = http://192.168.1.2:5000

- Start the frontend:

      npm start

---

## Folder Structure

    server/
      models/
      routes/
      controllers/
      uploads/
      config/
      socket.js
      server.js
    client/
      src/
        components/
        App.js
        api.js
        App.css
      .env

---

## Usage

- Register with your email and full name.
- Verify your email with the OTP sent to your inbox.
- Login and set your profile picture.
- Search users, send chat requests, accept/reject requests.
- Start chatting, send files, delete messages, and clear chat.
- Responsive design: works on desktop and mobile.

---

## Customization

- Change the color theme in `App.css`.
- Update email templates in the backend.
- Add group chat, message reactions, or more features as needed!

---

## License

MIT

---

## Credits

- React
- Node.js
- Socket.IO
- MongoDB
- Multer
- browser-image-compression
- Nodemailer

---

Happy chatting! 🚀

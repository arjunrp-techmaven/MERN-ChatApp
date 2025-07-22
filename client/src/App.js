import React, { useState, useEffect, use } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import io from "socket.io-client";
import Login from "./components/Login";
import Profile from "./components/Profile";
import ChatList from "./components/ChatList";
import SingleChat from "./components/SingleChat";
import "./App.css";
import { SOCKET_URL, API_URL } from "./api";

const socket = io(SOCKET_URL);

function MainLayout({ user, users, setUser, allUsers }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHeader, setChatHeader] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.innerWidth <= 900 && location.pathname.startsWith("/chat/")) {
      setSidebarOpen(false);
      setChatHeader(true);
    }
  }, [location.pathname]);
  useEffect(() => {
    // Highlight selected chat in sidebar
    if (location.pathname.startsWith("/chat/")) {
      setSelectedUserId(location.pathname.split("/chat/")[1]);
    } else {
      setSelectedUserId(null);
    }
  }, [location]);
  const isMobile = window.innerWidth <= 900;
  return (
    <div className="app-container">
      {/* Mobile Navbar */}
      {isMobile && chatHeader && (
        <div className="mobile-navbar">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.6em",
              marginRight: 16,
              cursor: "pointer",
            }}
          >
            &#9776;
          </button>
          ChatApp
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`sidebar${isMobile ? (sidebarOpen ? " open" : "") : ""}`}
        style={
          isMobile
            ? {
                display: sidebarOpen ? "block" : "none",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 100,
                background: "#fff",
                width: "100vw",
                height: "100vh",
                borderRight: "none",
                borderBottom: "1px solid #ddd",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }
            : {}
        }
      >
        <div className="sidebar-header">
          <span>ChatApp</span>
          <span>
            <a
              href={`/profile/${user.userId}`}
              style={{ color: "#fff", textDecoration: "none" }}
            >
              <b>{user.fullname}</b>
            </a>
          </span>
        </div>
        <ChatList
          user={user}
          users={users}
          allUsers={allUsers}
          selectedUserId={selectedUserId}
          onSelectUser={(uid) => {
            setSelectedUserId(uid);
            navigate(`/chat/${uid}`);
            if (isMobile) setSidebarOpen(false); // Hide sidebar after selecting a chat on mobile
          }}
        />
      </div>

      {/* Main Chat Area */}
      <div className="main">
        <Routes>
          <Route
            path="/profile/:userId"
            element={
              <Profile
                onLogout={() => {
                  setUser(null);
                  localStorage.removeItem("user");
                }}
              />
            }
          />
          <Route
            path="/chat/:userId"
            element={
              <SingleChat
                user={user}
                setUser={setUser}
                onOpenSidebar={() => setSidebarOpen(true)}
                setChatHeader={(val) => {
                  setChatHeader(val);
                }}
              />
            }
          />
          <Route
            path="*"
            element={
              <div
                style={{ margin: "auto", textAlign: "center", color: "#888" }}
              >
                <h2>Welcome, {user.fullname}</h2>
                <p>Select a user to start chatting.</p>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (!user) return;
    if (user) {
      socket.emit("login", { userId: user.userId });
    }
    const fetchUsers = () => {
      fetch(`${API_URL}/users/chats/${user.userId}`)
        .then((res) => res.json())
        .then(setUsers);
    };
    const fetchAllUsers = () => {
      fetch(`${API_URL}/users`)
        .then((res) => res.json())
        .then(setAllUsers);
    };
    fetchAllUsers();
    fetchUsers();
    const handleContactUpdated = () => {
      console.log("Contacts updated, fetching users again");
      fetchAllUsers();
      fetchUsers();
    };
    socket.on("user_list", handleContactUpdated);
    socket.on("contacts_updated", handleContactUpdated);
    return () => {
      socket.off("user_list", handleContactUpdated);
      socket.off("contacts_updated", handleContactUpdated);
    };
  }, [user]);

  if (!user) return <Login setUser={setUser} />;
  // console.log(users, "users");
  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <MainLayout
              user={user}
              users={users}
              setUser={setUser}
              allUsers={allUsers}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

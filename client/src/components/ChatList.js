import React, { useState } from "react";
import { API_URL } from "../api";

export default function ChatList({
  user,
  users, // contacts
  allUsers, // all registered users
  selectedUserId,
  onSelectUser,
}) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const sortedUsers = [...users].sort((a, b) => {
    // If both have lastMsgTime, sort by it
    if (a.lastMsgTime && b.lastMsgTime) {
      return new Date(b.lastMsgTime) - new Date(a.lastMsgTime);
    }
    // If only one has lastMsgTime, put that one first
    if (a.lastMsgTime) return -1;
    if (b.lastMsgTime) return 1;
    // Otherwise, keep original order
    return 0;
  });
  // Filter contacts for chat list
  const filteredContacts = sortedUsers
    .filter((u) => u.userId !== user.userId)
    .filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.fullname.toLowerCase().includes(search.toLowerCase())
    );

  // Filter all users for dropdown (exclude self and already contacts)
  const contactIds = users.map((u) => u.userId);
  const filteredAllUsers = allUsers.filter(
    (u) =>
      u.userId !== user.userId &&
      !contactIds.includes(u.userId) &&
      search === ""
        ? true
        : u.username.toLowerCase() === search.toLowerCase()
    //(u.username.toLowerCase().includes(search.toLowerCase()) ||
    // u.fullname.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="search-box" style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          name="search"
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(e.target.value.length > 0);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // hide dropdown after click
          onFocus={() => setShowDropdown(search.length > 0)}
        />
        {showDropdown && filteredAllUsers.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #ddd",
              borderTop: "none",
              zIndex: 10,
              maxHeight: 200,
              overflowY: "auto",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {filteredAllUsers.map((u) => (
              <li
                key={u.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                }}
                onClick={() => {
                  setShowDropdown(false);
                  setSearch("");
                  onSelectUser(u.userId);
                }}
              >
                {u.profilePic ? (
                  <img
                    src={`${API_URL}${u.profilePic}`}
                    alt={u.fullname}
                    className="user-avatar"
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${u.fullname}`}
                    alt={u.fullname}
                    className="user-avatar"
                  />
                )}
                <div>
                  <p style={{ fontWeight: 500, marginBottom: 0 }}>
                    {u.fullname}
                  </p>
                  {/* <br /> */}
                  <p style={{ fontSize: "0.9em", color: "#888", marginTop: 0 }}>
                    {u.username}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="user-list">
        {filteredContacts.length === 0 && (
          <li style={{ color: "#888" }}>No contacts found.</li>
        )}
        {filteredContacts.map((u) => (
          <li
            key={u.userId}
            className={selectedUserId === u.userId ? "active" : ""}
            onClick={() => onSelectUser(u.userId)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              cursor: "pointer",
              borderBottom: "1px solid #f0f0f0",
              background: selectedUserId === u.userId ? "#e0f2f1" : "#fff",
            }}
          >
            {/* Avatar */}
            <div style={{ marginRight: 12 }}>
              {u.profilePic ? (
                <img
                  src={`${API_URL}${u.profilePic}`}
                  alt={u.fullname}
                  className="user-avatar"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${u.fullname}`}
                  alt={u.fullname}
                  className="user-avatar"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: "1.05em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.fullname}
                </span>
                {/* Time */}
                {u.lastMsgTime && (
                  <span
                    style={{ fontSize: "0.85em", color: "#888", marginLeft: 8 }}
                  >
                    {new Date(u.lastMsgTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* Last message */}
                <span
                  style={{
                    color: "#888",
                    fontSize: "0.97em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 160,
                  }}
                >
                  {u.lastMsg}
                  {u.status === "pending_sent" && (
                    <span
                      style={{
                        color: "#888",
                        fontSize: "0.9em",
                        marginLeft: 8,
                      }}
                    >
                      (Request sent)
                    </span>
                  )}
                  {u.status === "pending_received" && (
                    <span
                      style={{
                        color: "#43cea2",
                        fontSize: "0.9em",
                        marginLeft: 8,
                      }}
                    >
                      (Request received)
                    </span>
                  )}
                </span>
                {/* Unread count */}
                {u.unreadCount > 0 && (
                  <span
                    style={{
                      background: "#43cea2",
                      color: "#fff",
                      borderRadius: "50%",
                      minWidth: 22,
                      height: 22,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9em",
                      marginLeft: 8,
                      padding: "0 6px",
                    }}
                  >
                    {u.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

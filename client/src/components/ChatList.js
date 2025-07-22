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

  // Filter contacts for chat list
  const filteredContacts = users
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
            {u.fullname}
            {u.status === "pending_sent" && (
              <span style={{ color: "#888", fontSize: "0.9em", marginLeft: 8 }}>
                (Request sent)
              </span>
            )}
            {u.status === "pending_received" && (
              <span
                style={{ color: "#43cea2", fontSize: "0.9em", marginLeft: 8 }}
              >
                (Request received)
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

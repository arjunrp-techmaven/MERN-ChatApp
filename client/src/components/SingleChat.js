import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import { API_URL, SOCKET_URL } from "../api";
import backIcon from "../assets/icons/back-button.svg";
import deleteIcon from "../assets/icons/trash-solid.svg";

const socket = io(SOCKET_URL);

export default function SingleChat({
  user,
  setUser,
  onOpenSidebar,
  setChatHeader,
}) {
  const { userId: toUserId } = useParams();
  const [toUser, setToUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const chatEndRef = useRef(null);
  const [isContact, setIsContact] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setChatHeader(false);
  }, []);
  useEffect(() => {
    // Fetch if user is contact
    const fetchContactStatus = async () => {
      fetch(`${API_URL}/check-contact?user1=${user.userId}&user2=${toUserId}`)
        .then((res) => res.json())
        .then((data) => {
          setIsContact(data.isContact);
          setRequestStatus(data.requestStatus); // 'none', 'pending', 'received'
          setRequestId(data.requestId);
        });
    };
    fetchContactStatus();
    const handleContactUpdated = () => {
      fetchContactStatus();
    };
    socket.emit("contact_updated", handleContactUpdated);
    return () => {
      socket.off("contact_updated", handleContactUpdated);
    };
  }, [socket, user.userId, toUserId]);

  const sendChatRequest = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/chat-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: user.userId, to: toUserId }),
    });
    const data = await res.json();
    if (data.error) setStatus(data.error);
    else setStatus("Request sent!");
    setRequestStatus("pending");
    setLoading(false);
  };

  const handleAccept = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/chat-request/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: requestId, accept: true }),
    });
    const data = await res.json();
    onRespond("Your request has been accepted", true);
    alert(data.message);
  };

  const handleReject = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/chat-request/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: requestId, accept: false }),
    });
    const data = await res.json();
    onRespond("Your request has been rejected", false);
    alert(data.message);
  };

  const onRespond = (staus, isContact) => {
    setRequestStatus("none");
    setIsContact(isContact);
    setStatus(staus);
    setLoading(false);
    // setUser();
  };
  useEffect(() => {
    // Handler for socket event
    console.log("Socket connected for chat requests");
    const handleChatRequestAccepted = ({ userId }) => {
      // Only update if the accepted user is the one you're chatting with
      if (userId === toUserId) {
        console.log("Chat request accepted by:", userId);
        setRequestStatus("none");
        setIsContact(true);
        setStatus("Chat request accepted! You can now chat.");
      }
    };

    socket.on("chat_request_accepted", handleChatRequestAccepted);

    return () => {
      socket.off("chat_request_accepted", handleChatRequestAccepted);
    };
  }, [toUserId, socket]);

  const fetchChat = () => {
    setChatHeader(false);
    fetch(`${API_URL}/messages/${user.userId}/${toUserId}`)
      .then((res) => res.json())
      .then((messages) => {
        if (messages.error) {
          setChat([]);
          return;
        }
        // console.log(messages, "messages");
        setChat(
          messages?.map((m) => ({
            from: m.from,
            message: m.message,
            fileUrl: m.fileUrl,
            fileName: m.fileName,
            fileType: m.fileType,
            id: m._id,
          }))
        );
      });
  };
  useEffect(() => {
    fetch(`${API_URL}/profile/${toUserId}`)
      .then((res) => res.json())
      .then(setToUser);

    fetchChat();

    socket.emit("login", { userId: user.userId });

    const handler = ({ from, message }) => {
      if (from === toUserId) {
        // setChat((prev) => [...prev, { from, message, id }]);
        fetchChat();
      }
    };
    socket.on("private_message", handler);
    return () => socket.off("private_message", handler);
  }, [toUserId, user.userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);
  const [loading, setLoading] = useState(false);
  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === "" && !file) {
      setLoading(false);
      return;
    }
    if (loading) return; // Prevent multiple submissions
    setLoading(true);

    // setChat((prev) => [...prev, { from: user.userId, message }]);
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("from", user.userId);
      formData.append("to", toUserId);
      formData.append("message", message);

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        setLoading(false);
      } else {
        // onSend(data); // Add to chat
        setFile(null);
        setFilePreview(null);
        setMessage("");
        setLoading(false);
      }
    } else {
      setLoading(false);
      socket.emit("private_message", {
        from: user.userId,
        to: toUserId,
        message,
      });
    }
    fetchChat();
    setMessage("");
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message for you?")) return;
    const res = await fetch(`${API_URL}/messages/${messageId}/delete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId }),
    });
    const data = await res.json();
    if (data.success) {
      //   setChat((prev) => prev.filter((msg) => msg.id !== messageId));
      fetchChat();
    } else {
      alert(data.error || "Failed to delete message");
    }
  };
  const handleClearMessages = async () => {
    if (!window.confirm("Clear all messages for you?")) return;
    const res = await fetch(`${API_URL}/messages/clear`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, toUserId }),
    });
    const data = await res.json();
    if (data.success) {
      setChat([]);
    } else {
      alert(data.error || "Failed to clear messages");
    }
  };
  const [file, setFile] = useState(null);

  const fileInputRef = useRef();

  // Preview for image files
  const [filePreview, setFilePreview] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected && selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  if (!toUser) return <div className="chat-header">Loading...</div>;
  //   console.log(chat, "chat");
  return (
    <>
      <div className="chat-header">
        {/* {window.innerWidth <= 900 && (
          <button
            onClick={onOpenSidebar}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.5em",
              marginRight: 12,
              cursor: "pointer",
            }}
            title="Open chat list"
          >
            &#9776;
          </button>
        )} */}

        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => {
              if (window.innerWidth <= 900) {
                setChatHeader(true);
                // onOpenSidebar();
                navigate("/chats");
              } else {
                navigate("/chats");
              }
            }}
            style={{ marginRight: 16, background: "none", border: "none" }}
            title="Back to Chats"
          >
            <img
              src={backIcon}
              alt="Back"
              style={{
                width: 20,
                height: 20,
                filter: "invert(100%) brightness(200%)",
                cursor: "pointer",
              }}
            />
          </button>
          {toUser.profilePic ? (
            <img
              src={`${API_URL}${toUser.profilePic}`}
              alt={toUser.fullname}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                marginRight: 12,
                objectFit: "cover",
                cursor: "pointer",
              }}
              onClick={() => {
                setModalOpen(true);
                setFilePreviewUrl(`${API_URL}${toUser.profilePic}`);
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                marginRight: 12,
                fontSize: "1.5em",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ccc",
              }}
            >
              {toUser.fullname
                ? toUser.fullname.charAt(0).toUpperCase()
                : toUser.username.charAt(0).toUpperCase()}
            </div>
          )}

          <span>{toUser.fullname || toUser.username}</span>
        </div>
        <button
          onClick={handleClearMessages}
          style={{
            marginLeft: 16,
            background: "none",
            border: "none",
            color: "#e53935",
            cursor: "pointer",
            fontSize: "1.1em",
          }}
          title="Clear chat"
        >
          🧹 Clear Chat
        </button>
      </div>
      <div ref={chatEndRef} />
      <div className="chat-messages">
        {[...chat].reverse().map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`message-row${msg.from === user.userId ? " me" : ""}`}
            style={{ position: "relative" }}
          >
            <div style={{ flexDirection: "row-reverse", display: "flex" }}>
              <button
                onClick={() => handleDeleteMessage(msg.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Delete for me"
              >
                <img
                  src={deleteIcon}
                  alt="Delete"
                  style={{ width: 16, height: 16 }}
                />
              </button>
              <div className="message-bubble">
                {msg.fileUrl && (
                  <div style={{ marginTop: 8 }}>
                    {msg.fileType.startsWith("image/") ? (
                      //   <a
                      //     href={`${API_URL}${msg.fileUrl}`}
                      //     target="_blank"
                      //     rel="noopener noreferrer"
                      //   >
                      <img
                        src={`${API_URL}${msg.fileUrl}`}
                        alt={msg.fileName}
                        style={{
                          maxWidth: 200,
                          borderRadius: 8,
                          width: "100%",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setModalOpen(true);
                          setFilePreviewUrl(`${API_URL}${msg.fileUrl}`);
                        }}
                      />
                    ) : (
                      //   </a>
                      <a
                        href={`${API_URL}${msg.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {msg.fileName}
                      </a>
                    )}
                  </div>
                )}
                {msg.message}
              </div>
            </div>
          </div>
        ))}
        {/* Show chat request/accept/reject UI if not contacts */}
        {!isContact && (
          <div className="chat-request-info">
            {requestStatus === "none" && (
              <div>
                <div
                  style={{ color: "#888", fontWeight: 500, marginBottom: 10 }}
                >
                  Send a chat request to{" "}
                  <span style={{ color: "#e53935", fontWeight: 600 }}>
                    {toUser.fullname}
                  </span>{" "}
                  to start chatting.
                </div>
                {loading ? (
                  <div
                    className="chat-action-btn send"
                    style={{ display: "inline-block" }}
                  >
                    Loading...
                  </div>
                ) : (
                  <button
                    className="chat-action-btn send"
                    onClick={sendChatRequest}
                  >
                    Send Chat Request
                  </button>
                )}
              </div>
            )}
            {requestStatus === "pending" && (
              <div style={{ color: "#888", fontWeight: 500 }}>
                Request Sent. Waiting for acceptance.
              </div>
            )}
            {requestStatus === "received" && (
              <>
                <div
                  style={{ color: "#888", fontWeight: 500, marginBottom: 10 }}
                >
                  <span style={{ color: "#e53935", fontWeight: 600 }}>
                    {toUser.fullname}
                  </span>{" "}
                  has sent you a chat request. Please accept for start chatting.
                </div>
                {loading ? (
                  <div
                    className="chat-action-btn accept"
                    style={{ display: "inline-block" }}
                  >
                    Loading...
                  </div>
                ) : (
                  <>
                    <button
                      className="chat-action-btn accept"
                      onClick={handleAccept}
                      style={{ marginRight: 10 }}
                    >
                      Accept
                    </button>
                    <button
                      className="chat-action-btn reject"
                      onClick={handleReject}
                    >
                      Reject
                    </button>
                  </>
                )}
              </>
            )}
            {status && (
              <div style={{ marginTop: 10, color: "#43cea2", fontWeight: 500 }}>
                {status}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Only show input if contacts */}
      {isContact && (
        <form
          className="chat-input-area"
          onSubmit={sendMessage}
          style={{ alignItems: "center" }}
        >
          {/* File preview */}
          {file && (
            <div
              style={{ marginBottom: 8, display: "flex", alignItems: "center" }}
            >
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="preview"
                  style={{
                    maxHeight: 60,
                    maxWidth: 60,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                />
              ) : (
                <span style={{ marginRight: 8 }}>{file.name}</span>
              )}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFilePreview(null);
                  fileInputRef.current.value = "";
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e53935",
                  fontSize: "1.2em",
                  cursor: "pointer",
                }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          )}
          {/* File icon */}
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5em",
              cursor: "pointer",
              marginRight: 8,
            }}
            title="Attach file"
          >
            📎
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: 10 }}
          />
          {loading ? (
            <button
              type="button"
              style={{
                background: "#075e54",
                color: "#fff",
                border: "none",
                borderRadius: 20,
                padding: "10px 20px",
                fontSize: "1em",
                marginLeft: 8,
              }}
            >
              Sending...
            </button>
          ) : (
            <button
              type="submit"
              style={{
                background: "#075e54",
                color: "#fff",
                border: "none",
                borderRadius: 20,
                padding: "10px 20px",
                fontSize: "1em",
                marginLeft: 8,
              }}
              disabled={message.trim() === "" && !file}
            >
              Send
            </button>
          )}
        </form>
      )}
      {/* Modal for profile picture */}
      {modalOpen && (
        <div
          className="profile-modal-backdrop"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="profile-modal-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
          >
            <button
              className="profile-modal-close"
              onClick={() => setModalOpen(false)}
              title="Close"
            >
              ✕
            </button>
            <img src={filePreviewUrl} alt="Profile Large" />
          </div>
        </div>
      )}
    </>
  );
}

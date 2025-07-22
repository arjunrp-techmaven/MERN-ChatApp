import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { API_URL } from "../api";

export default function Profile({ onLogout }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/profile/${userId}`)
      .then((res) => res.json())
      .then(setProfile);
  }, [userId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      // Compress/resize image before upload
      const options = {
        maxSizeMB: 1, // Max size in MB
        maxWidthOrHeight: 600, // Max width or height in px
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(file, options);
        setPreview(URL.createObjectURL(compressedFile));
        handleUpload(compressedFile);
      } catch (error) {
        alert("Image compression failed!");
        setLoading(false);
      }
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("profilePic", file);
    formData.append("userId", userId);

    const res = await fetch(`${API_URL}/profile/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.profilePic) {
      setProfile((prev) => ({ ...prev, profilePic: data.profilePic }));
      setPreview(null);
    }
    setLoading(false);
  };

  // Remove profile picture
  const handleRemoveProfilePic = async () => {
    setLoading(true);
    if (!profile || !profile.profilePic) return;
    const res = await fetch(`${API_URL}/profile/remove-pic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.success) {
      setProfile((prev) => ({ ...prev, profilePic: null }));
      setPreview(null);
      setLoading(false);
    } else {
      alert("Failed to remove profile picture");
      setLoading(false);
    }
  };

  if (!profile) return <div className="profile-container">Loading...</div>;
  return (
    <div>
      <div className="profile-container">
        <h2>Profile</h2>
        <div style={{ marginBottom: 16 }}>
          <div className="profile-picture">
            <img
              src={
                preview
                  ? preview
                  : profile.profilePic
                  ? `${API_URL}${profile.profilePic}`
                  : "https://ui-avatars.com/api/?name=" + profile.fullname
              }
              alt="Profile"
              className="profile-img"
              onClick={() => profile.profilePic && setModalOpen(true)}
            />
            {loading && <div className="profile-spinner"></div>}
            <button
              onClick={() => fileInputRef.current.click()}
              className="upload-btn"
              title="Change profile picture"
            >
              📷
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {profile.profilePic && (
              <button
                onClick={handleRemoveProfilePic}
                className="remove-btn"
                title="Remove profile picture"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <p>
          <b>Full Name:</b> {profile.fullname}
        </p>
        <p>
          <b>Email:</b> {profile.username}
        </p>
        <button
          className="logout-btn"
          onClick={() => {
            if (onLogout) onLogout();
            navigate("/");
          }}
        >
          Logout
        </button>
      </div>
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
            <img src={`${API_URL}${profile.profilePic}`} alt="Profile Large" />
          </div>
        </div>
      )}
    </div>
  );
}

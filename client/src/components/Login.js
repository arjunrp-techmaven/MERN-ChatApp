import React, { useState } from "react";
import "./Auth.css";
import { API_URL } from "../api";

export default function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    if (loading) return; // Prevent multiple submissions
    setLoading(true);
    if (isRegister) {
      if (!fullname) return setErr("Full name is required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username))
        return setErr("Enter a valid email");
    }
    const url = isRegister ? "/register" : "/login";
    const res = await fetch(`${API_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isRegister ? { fullname, username, password } : { username, password }
      ),
    });
    const data = await res.json();
    if (data.error) {
      setErr(data.error);
      if (data.userId) {
        setPendingUserId(data.userId);
        setShowCode(true);
      }
      setLoading(false);
    } else if (isRegister) {
      setInfo(data.message);
      setShowCode(true);
      setPendingUserId(data.userId);
      setLoading(false);
    } else {
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    if (loading) return; // Prevent multiple submissions
    setLoading(true);
    const res = await fetch(`${API_URL}/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: pendingUserId, code }),
    });
    const data = await res.json();
    if (data.error) {
      setErr(data.error);
      setLoading(false);
    } else {
      setInfo(data.message);
      setShowCode(false);
      setIsRegister(false);
      setFullname("");
      setUsername("");
      setPassword("");
      setCode("");
      setPendingUserId("");
      setLoading(false);
    }
  };
  const handleResendCode = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/resend-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: pendingUserId }),
    });
    const data = await res.json();
    if (data.error) {
      setErr(data.error);
      setLoading(false);
    } else {
      setInfo(data.message);
      setErr("");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegister ? "Register" : "Login"}</h2>
        {!showCode ? (
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <input
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Full Name"
                autoComplete="name"
              />
            )}
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            {err && <div className="error">{err}</div>}
            {info && <div className="info">{info}</div>}
            {loading ? (
              <button type="button">Loading...</button>
            ) : (
              <button type="submit">{isRegister ? "Register" : "Login"}</button>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter verification code"
              autoComplete="one-time-code"
            />
            {err && <div className="error">{err}</div>}
            {info && <div className="info">{info}</div>}
            <a
              className="error"
              onClick={handleResendCode}
              style={{ cursor: "pointer" }}
            >
              Resend code?
            </a>
            {loading ? (
              <button type="button">Loading...</button>
            ) : (
              <button type="submit">Verify Code</button>
            )}
          </form>
        )}
        <button
          className="switch-btn"
          onClick={() => {
            setIsRegister(!isRegister);
            setShowCode(false);
            setErr("");
            setInfo("");
          }}
        >
          {isRegister
            ? "Already have an account? Login"
            : "No account? Register"}
        </button>
      </div>
    </div>
  );
}

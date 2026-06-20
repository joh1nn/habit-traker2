import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Email va parolni kiriting");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signErr } = await supabase.auth.signUp({ email, password });
        if (signErr) throw signErr;
        setInfo("✅ Ro'yxatdan o'tdingiz! Endi kirishingiz mumkin.");
        setMode("login");
      } else {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) throw signErr;
        onLoggedIn();
      }
    } catch (err) {
      const msg = err?.message || "Xatolik yuz berdi";
      if (msg.includes("Invalid login credentials")) setError("Email yoki parol noto'g'ri");
      else if (msg.includes("already registered")) setError("Bu email allaqachon ro'yxatdan o'tgan");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0c0c1a", color: "#e0e0f0",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter','SF Pro Display',-apple-system,sans-serif", padding: 20
    }}>
      <div style={{
        width: "100%", maxWidth: 380, background: "#16162a", borderRadius: 22,
        padding: "32px 28px", border: "1px solid #2a2a3e"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
            <span style={{ color: "#7C6EFA" }}>◆</span> HabitFlow
          </div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
            {mode === "login" ? "Hisobingizga kiring" : "Yangi hisob yarating"}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={lbl}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="email@misol.com"
            style={inputStyle}
          />

          <label style={lbl}>Parol</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Kamida 6 ta belgi"
            style={{ ...inputStyle, marginBottom: 20 }}
          />

          {error && (
            <div style={{
              background: "#FF6B6B15", border: "1px solid #FF6B6B44", borderRadius: 10,
              padding: "10px 14px", fontSize: 12, color: "#FF8B8B", marginBottom: 16
            }}>{error}</div>
          )}
          {info && (
            <div style={{
              background: "#3ECFAC15", border: "1px solid #3ECFAC44", borderRadius: 10,
              padding: "10px 14px", fontSize: 12, color: "#3ECFAC", marginBottom: 16
            }}>{info}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: 14, background: "#7C6EFA", color: "#fff", border: "none",
            borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Yuklanmoqda..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#666" }}>
          {mode === "login" ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }}
            style={{ background: "none", border: "none", color: "#9C8EFA", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            {mode === "login" ? "Ro'yxatdan o'ting" : "Kiring"}
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: 11, color: "#666", marginBottom: 6, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" };
const inputStyle = {
  background: "#0f0f1a", border: "1.5px solid #2a2a3e", borderRadius: 12,
  padding: "12px 14px", color: "#e0e0f0", fontSize: 14, outline: "none",
  width: "100%", boxSizing: "border-box", marginBottom: 16
};

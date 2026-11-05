
"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [citizen, setCitizen] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(e) {
    e.preventDefault();
    setError("");
    setCitizen(null);

    const clean = username.trim().replace(/^@/, "").toLowerCase();

    if (!/^[a-z0-9._]{2,24}$/.test(clean)) {
      setError("Проверь правильность TikTok Username.");
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setError("Ошибка подключения. Попробуй позже.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${url}/rest/v1/rpc/register_citizen`,
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            p_tiktok_username: clean
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message = data.message || "";

        if (message.includes("USERNAME_ALREADY_REGISTERED")) {
          throw new Error("Этот TikTok Username уже зарегистрирован.");
        }

        if (message.includes("INVALID_TIKTOK_USERNAME")) {
          throw new Error("Неправильный формат Username.");
        }

        throw new Error("Не удалось зарегистрироваться. Попробуй ещё раз.");
      }

      setCitizen(data[0]);
    } catch (err) {
      setError(err.message || "Произошла ошибка.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <div className="emblem">♛</div>
        <div className="eyebrow">THE NEW REPUBLIC</div>
        <h1>BECOME A CITIZEN</h1>
        <p className="subtitle">
          One million citizens. One nation. One future.
        </p>

        {!citizen ? (
          <form onSubmit={register}>
            <label>TIKTOK USERNAME</label>
            <div className="username-input">
              <span>@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                maxLength={25}
                required
              />
            </div>

            <p className="hint">
              Введи только имя пользователя TikTok.
            </p>

            {error && <div className="error">{error}</div>}

            <button disabled={loading}>
              {loading ? "REGISTERING..." : "BECOME A CITIZEN →"}
            </button>
          </form>
        ) : (
          <div className="passport">
            <div className="passport-top">DIGITAL CITIZEN PASSPORT</div>
            <div className="flag">🌐</div>
            <h2>THE NEW REPUBLIC</h2>
            <div className="passport-line">
              <span>TIKTOK USERNAME</span>
              <strong>{citizen.tiktok_username}</strong>
            </div>
            <div className="passport-line">
              <span>CITIZEN ID</span>
              <strong>{citizen.citizen_id}</strong>
            </div>
            <div className="passport-line">
              <span>DATE OF JOINING</span>
              <strong>
                {new Date(citizen.joined_at).toLocaleDateString("ru-RU")}
              </strong>
            </div>
            <div className="passport-bottom">
              UNITY • PROGRESS • FUTURE
            </div>
            <p className="success">
              WELCOME, CITIZEN!
            </p>
          </div>
        )}

        <a className="back" href="/">← BACK TO HOME</a>
        <p className="disclaimer">
          THE NEW REPUBLIC is a digital community project.
          Registration does not constitute legal citizenship
          or verify ownership of a TikTok account.
        </p>
      </div>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          background: radial-gradient(circle at top, #183452, #07111f 65%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px 16px;
          font-family: Arial, sans-serif;
        }
        .register-card {
          width: 100%;
          max-width: 480px;
          padding: 36px 25px;
          background: rgba(12, 29, 49, .94);
          border: 1px solid #b9954b;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 20px 70px #0008;
        }
        .emblem { color: #d6ad50; font-size: 48px; }
        .eyebrow { color: #d6ad50; letter-spacing: 4px; font-size: 12px; }
        h1 { font-size: 27px; margin: 18px 0 10px; }
        .subtitle { color: #aab8c8; font-size: 13px; margin-bottom: 35px; }
        form { text-align: left; }
        label { color: #d6ad50; font-size: 11px; letter-spacing: 2px; }
        .username-input {
          display: flex; align-items: center; gap: 8px;
          background: #07111f; border: 1px solid #53677d;
          border-radius: 9px; padding: 0 14px; margin-top: 10px;
        }
        .username-input span { color: #d6ad50; font-size: 19px; }
        input {
          width: 100%; background: transparent; border: 0;
          outline: none; color: white; padding: 16px 0; font-size: 16px;
        }
        .hint { color: #899bad; font-size: 12px; }
        button {
          width: 100%; padding: 16px; margin-top: 20px;
          background: linear-gradient(110deg, #b58b3c, #f0d38a);
          border: 0; border-radius: 8px; color: #07111f;
          font-weight: bold; letter-spacing: 1px; cursor: pointer;
        }
        button:disabled { opacity: .6; }
        .error { color: #ff8585; font-size: 13px; margin-top: 12px; }
        .passport {
          border: 1px solid #d6ad50; border-radius: 12px;
          padding: 22px 15px; background: #101f31;
        }
        .passport-top, .passport-bottom {
          color: #d6ad50; letter-spacing: 2px; font-size: 10px;
        }
        .flag { font-size: 48px; margin-top: 20px; }
        .passport h2 { color: #d6ad50; font-size: 20px; }
        .passport-line {
          text-align: left; padding: 12px 0;
          border-bottom: 1px solid #34465a;
        }
        .passport-line span { display: block; color: #91a2b5; font-size: 10px; }
        .passport-line strong { display: block; margin-top: 5px; }
        .passport-bottom { margin-top: 20px; }
        .success { color: #e5c77d; font-weight: bold; margin-bottom: 0; }
        .back { display: inline-block; color: #d6ad50; margin-top: 25px; font-size: 12px; }
        .disclaimer { color: #74869a; font-size: 10px; line-height: 1.6; margin-top: 25px; }
      `}</style>
    </main>
  );
}

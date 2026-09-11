import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { supabase } from "./supabaseClient";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter admin email.");
      return;
    }

    if (!password) {
      setError("Please enter admin password.");
      return;
    }

    try {
      setLoading(true);

      // ==========================================
      // SUPABASE AUTH LOGIN
      // ==========================================

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data?.user) {
        throw new Error(
          "Administrator login failed."
        );
      }

      // ==========================================
      // CHECK PROFILE
      // ==========================================

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      // ==========================================
      // ADMIN ONLY
      // ==========================================

      const role = String(
        profile?.role || ""
      )
        .trim()
        .toLowerCase();

      if (
        role !== "admin" &&
        role !== "administrator"
      ) {
        await supabase.auth.signOut();

        throw new Error(
          "This account is not authorized for Administrator access."
        );
      }

      // ==========================================
      // SAVE ADMIN SESSION INFO
      // ==========================================

      localStorage.setItem(
        "timbermart_admin",
        "true"
      );

      localStorage.setItem(
        "timbermart_admin_user",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email || "",
          name:
            profile?.name ||
            profile?.full_name ||
            data.user.user_metadata
              ?.full_name ||
            "Administrator",
          role: "admin",
        })
      );

      // ==========================================
      // OPEN YOUR EXISTING ADMIN DASHBOARD
      // ==========================================

      navigate("/admin", {
        replace: true,
      });

    } catch (err) {
      console.error(
        "Admin login error:",
        err
      );

      setError(
        err?.message ||
          "Invalid admin email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <style>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(
              circle at top,
              rgba(30, 116, 72, 0.35),
              transparent 40%
            ),
            linear-gradient(
              135deg,
              #031109 0%,
              #0a2617 50%,
              #103b24 100%
            );
          font-family: Arial, sans-serif;
        }

        .admin-login-card {
          width: 100%;
          max-width: 430px;
          background: #fff;
          border-radius: 24px;
          padding: 34px;
          box-shadow:
            0 30px 90px rgba(0,0,0,.35);
        }

        .admin-login-icon {
          width: 78px;
          height: 78px;
          margin: 0 auto 18px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          background: #eaf7ef;
          color: #087343;
        }

        .admin-login-card h1 {
          text-align: center;
          margin: 0;
          color: #163b27;
          font-size: 29px;
          font-weight: 900;
        }

        .admin-login-subtitle {
          text-align: center;
          color: #76857c;
          font-size: 14px;
          margin: 8px 0 28px;
        }

        .admin-error {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #fff1f1;
          border: 1px solid #ffd1d1;
          color: #bd2929;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-field {
          margin-bottom: 18px;
        }

        .admin-field label {
          display: block;
          margin-bottom: 7px;
          color: #294436;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-input {
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #dce8df;
          border-radius: 13px;
          padding: 13px 14px;
          background: #fff;
        }

        .admin-input:focus-within {
          border-color: #087343;
          box-shadow:
            0 0 0 3px rgba(8,115,67,.10);
        }

        .admin-input input {
          width: 100%;
          border: 0;
          outline: 0;
          font-size: 14px;
          background: transparent;
        }

        .admin-password-toggle {
          border: 0;
          background: transparent;
          padding: 0;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: #65786d;
        }

        .admin-submit {
          width: 100%;
          min-height: 52px;
          border: 0;
          border-radius: 13px;
          background: #087343;
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .admin-submit:disabled {
          opacity: .7;
          cursor: wait;
        }

        .admin-back {
          width: 100%;
          margin-top: 18px;
          border: 0;
          background: transparent;
          color: #64776c;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
        }

        .admin-security-note {
          margin-top: 22px;
          text-align: center;
          font-size: 11px;
          color: #829087;
          line-height: 1.5;
        }

        @keyframes admin-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .admin-spin {
          animation: admin-spin 1s linear infinite;
        }
      `}</style>

      <div className="admin-login-card">

        <div className="admin-login-icon">
          <ShieldCheck size={42} />
        </div>

        <h1>Administrator Login</h1>

        <p className="admin-login-subtitle">
          TimberMart Admin Control Center
        </p>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div className="admin-field">
            <label>
              Admin Email
            </label>

            <div className="admin-input">
              <Mail
                size={19}
                color="#6d8275"
              />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter admin email"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="admin-field">
            <label>
              Admin Password
            </label>

            <div className="admin-input">
              <Lock
                size={19}
                color="#6d8275"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter admin password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (v) => !v
                  )
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={19}
                  className="admin-spin"
                />
                Checking Admin...
              </>
            ) : (
              <>
                <ShieldCheck size={19} />
                Login to Admin Dashboard
              </>
            )}
          </button>

        </form>

        <button
          type="button"
          className="admin-back"
          onClick={() =>
            navigate("/roles")
          }
        >
          <ArrowLeft size={15} />
          Back to Role Selection
        </button>

        <div className="admin-security-note">
          Restricted to authorized TimberMart administrators.
        </div>

      </div>
    </div>
  );
}
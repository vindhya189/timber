import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  Loader2,
  Lock,
  Mail,
  Moon,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../supabaseClient";
import "./Settings.css";
import TreeLoader from "../components/TreeLoader";

/* =========================================================
   APPLY THEME GLOBALLY
   ========================================================= */

function applyDarkMode(enabled) {
  const isDark = Boolean(enabled);

  // HTML
  document.documentElement.classList.toggle("timber-dark", isDark);

  // BODY
  document.body.classList.toggle("timber-dark-body", isDark);

  // Save locally so every page can remember it
  localStorage.setItem(
    "timbermart_dark_mode",
    isDark ? "true" : "false"
  );

  // Tell the whole React app that theme changed
  window.dispatchEvent(
    new CustomEvent("timbermart-theme-change", {
      detail: {
        darkMode: isDark,
      },
    })
  );
}

/* =========================================================
   GET SAVED ROLE
   ========================================================= */

function getSavedRole(profileRole) {
  const role =
    profileRole ||
    localStorage.getItem("timbermart_selected_role") ||
    "farmer";

  const validRoles = [
    "farmer",
    "merchant",
    "sawmill",
    "carpenter",
    "worker",
    "buyer",
  ];

  return validRoles.includes(role) ? role : "farmer";
}

/* =========================================================
   SETTINGS COMPONENT
   ========================================================= */

export default function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    notifications: true,
    email_notifications: true,
    privacy: true,
    dark_mode: false,
  });

  /* =========================================================
     LOAD SETTINGS
     ========================================================= */

  useEffect(() => {
    loadSettings();
  }, []);

  /* =========================================================
     GLOBAL THEME INITIALIZER

     This is important.

     Even when user opens another page directly,
     the saved dark mode is applied.
     ========================================================= */

  useEffect(() => {
    const localDarkMode =
      localStorage.getItem("timbermart_dark_mode") === "true";

    document.documentElement.classList.toggle(
      "timber-dark",
      localDarkMode
    );

    document.body.classList.toggle(
      "timber-dark-body",
      localDarkMode
    );
  }, []);

  /* =========================================================
     LOAD USER + SETTINGS
     ========================================================= */

  async function loadSettings() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(session.user);

      /* -----------------------------------------------
         LOAD PROFILE
      ----------------------------------------------- */

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile(profileData);

      /* -----------------------------------------------
         ROLE
      ----------------------------------------------- */

      const role = getSavedRole(profileData?.role);

      localStorage.setItem(
        "timbermart_selected_role",
        role
      );

      /* -----------------------------------------------
         LOAD USER SETTINGS
      ----------------------------------------------- */

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Settings load error:", error);
        alert(error.message);
        return;
      }

      if (data) {
        const loadedSettings = {
          notifications: data.notifications ?? true,
          email_notifications:
            data.email_notifications ?? true,
          privacy: data.privacy ?? true,
          dark_mode: data.dark_mode ?? false,
        };

        setSettings(loadedSettings);

        /* Apply immediately */
        applyDarkMode(loadedSettings.dark_mode);
      } else {
        /* -----------------------------------------------
           First time user

           Check local storage before defaulting to false
        ----------------------------------------------- */

        const localDark =
          localStorage.getItem(
            "timbermart_dark_mode"
          ) === "true";

        setSettings((previous) => ({
          ...previous,
          dark_mode: localDark,
        }));

        applyDarkMode(localDark);
      }
    } catch (error) {
      console.error("Settings error:", error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     TOGGLE SETTING
     ========================================================= */

  function toggleSetting(key) {
    setSettings((previous) => {
      const updated = {
        ...previous,
        [key]: !previous[key],
      };

      /* -----------------------------------------------
         Dark Mode changes immediately
      ----------------------------------------------- */

      if (key === "dark_mode") {
        applyDarkMode(updated.dark_mode);
      }

      return updated;
    });

    /* Remove old saved message */
    setSaved(false);
  }

  /* =========================================================
     SAVE SETTINGS
     ========================================================= */

  async function saveSettings() {
    if (!user) return;

    try {
      setSaving(true);
      setSaved(false);

      const { error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            notifications: settings.notifications,
            email_notifications:
              settings.email_notifications,
            privacy: settings.privacy,
            dark_mode: settings.dark_mode,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) {
        console.error("Settings save error:", error);
        alert(error.message);
        return;
      }

      /* Make sure theme is still applied */
      applyDarkMode(settings.dark_mode);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     CHANGE PASSWORD
     ========================================================= */

  async function changePassword() {
    if (!user?.email) {
      alert("Email address not available.");
      return;
    }

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          user.email,
          {
            redirectTo:
              `${window.location.origin}/login`,
          }
        );

      if (error) {
        alert(error.message);
        return;
      }

      alert(
        "Password reset link has been sent to your email."
      );
    } catch (error) {
      console.error(error);
      alert("Unable to send password reset email.");
    }
  }

  /* =========================================================
     BACK TO CORRECT DASHBOARD
     ========================================================= */

  function goBack() {
    const role = getSavedRole(profile?.role);

    navigate(`/dashboard/${role}`);
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <TreeLoader text="Growing your settings..." />
    );
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="settings-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="settings-header">

        <button
          className="settings-back"
          onClick={goBack}
          type="button"
        >
          <ArrowLeft size={19} />
          <span>Back to Dashboard</span>
        </button>

        <div className="settings-header-title">

          <div className="settings-title-icon">
            <SettingsIcon size={21} />
          </div>

          <div>
            <h1>Settings</h1>

            <p>
              Manage your TimberMart preferences
            </p>
          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="settings-container">

        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Bell size={20} />
            </div>

            <div>
              <h2>Notifications</h2>

              <p>
                Choose how TimberMart keeps you informed.
              </p>
            </div>

          </div>

          <SettingRow
            icon={<Bell size={18} />}
            title="Push Notifications"
            description="Receive important TimberMart activity notifications."
            enabled={settings.notifications}
            onChange={() =>
              toggleSetting("notifications")
            }
          />

          <SettingRow
            icon={<Mail size={18} />}
            title="Email Notifications"
            description="Receive updates and account notifications by email."
            enabled={settings.email_notifications}
            onChange={() =>
              toggleSetting("email_notifications")
            }
          />

        </section>

        {/* ===================================================
            PRIVACY
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2>Privacy</h2>

              <p>
                Control how other TimberMart users
                interact with you.
              </p>
            </div>

          </div>

          <SettingRow
            icon={<Lock size={18} />}
            title="Public Profile"
            description="Allow other users to view your profile information."
            enabled={settings.privacy}
            onChange={() =>
              toggleSetting("privacy")
            }
          />

        </section>

        {/* ===================================================
            APPEARANCE
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon appearance-icon">
              {settings.dark_mode ? (
                <Moon size={20} />
              ) : (
                <Sun size={20} />
              )}
            </div>

            <div>
              <h2>Appearance</h2>

              <p>
                Choose how TimberMart looks on your device.
              </p>
            </div>

          </div>

          <SettingRow
            icon={
              settings.dark_mode ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )
            }
            title="Dark Mode"
            description={
              settings.dark_mode
                ? "Dark mode is currently enabled."
                : "Use a darker appearance for TimberMart."
            }
            enabled={settings.dark_mode}
            onChange={() =>
              toggleSetting("dark_mode")
            }
          />

        </section>

        {/* ===================================================
            ACCOUNT SECURITY
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Lock size={20} />
            </div>

            <div>
              <h2>Account Security</h2>

              <p>
                Manage your TimberMart account security.
              </p>
            </div>

          </div>

          <div className="settings-account-row">

            <div className="settings-account-info">

              <span>ACCOUNT EMAIL</span>

              <strong>
                {user?.email || "Not available"}
              </strong>

            </div>

            <button
              className="settings-password-button"
              onClick={changePassword}
              type="button"
            >
              <Lock size={15} />
              Change Password
            </button>

          </div>

        </section>

        {/* ===================================================
            SAVE
        =================================================== */}

        <div className="settings-save-area">

          {saved && (
            <div className="settings-success">
              <Check size={17} />
              Settings saved successfully
            </div>
          )}

          <button
            className="settings-save-button"
            onClick={saveSettings}
            disabled={saving}
            type="button"
          >
            {saving ? (
              <>
                <Loader2
                  size={18}
                  className="settings-spin"
                />

                Saving...
              </>
            ) : (
              <>
                <Save size={18} />

                Save Settings
              </>
            )}
          </button>

        </div>

      </main>
    </div>
  );
}

/* ============================================================
   REUSABLE SETTING ROW
   ============================================================ */

function SettingRow({
  icon,
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="settings-row">

      <div className="settings-row-left">

        <div className="settings-row-icon">
          {icon}
        </div>

        <div className="settings-row-text">

          <h3>{title}</h3>

          <p>{description}</p>

        </div>

      </div>

      <button
        type="button"
        className={`settings-switch ${
          enabled ? "on" : ""
        }`}
        onClick={onChange}
        aria-pressed={enabled}
      >
        <span />
      </button>

    </div>
  );
}
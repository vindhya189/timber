import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Bell,
  Check,
  Mail,
  Moon,
  Save,
  Shield,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase } from "../supabaseClient";

const defaultSettings = {
  notifications: true,
  emailNotifications: true,
  darkMode: false,
  privateProfile: false,
};

export default function Settings() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(null);

  const [settings, setSettings] =
    useState(defaultSettings);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/roles", {
          replace: true,
        });
        return;
      }

      setUser(session.user);

      const key =
        `timbermart_settings_${session.user.id}`;

      const saved =
        localStorage.getItem(key);

      if (saved) {
        try {
          setSettings({
            ...defaultSettings,
            ...JSON.parse(saved),
          });
        } catch {
          setSettings(
            defaultSettings
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggle(name) {
    setSettings((old) => ({
      ...old,
      [name]: !old[name],
    }));

    setMessage("");
  }

  function saveSettings() {
    if (!user?.id) return;

    setSaving(true);

    const key =
      `timbermart_settings_${user.id}`;

    localStorage.setItem(
      key,
      JSON.stringify(settings)
    );

    setTimeout(() => {
      setSaving(false);
      setMessage(
        "Settings saved successfully."
      );
    }, 400);
  }

  if (loading) {
    return (
      <div className="tm-loading-page">
        <div className="tm-loader" />
        <p>
          Loading Settings...
        </p>
      </div>
    );
  }

  return (
    <div className="tm-simple-page">

      <header className="tm-simple-header">

        <button
          className="tm-back-page"
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="tm-simple-logo">
          🌲 TimberMart
        </div>

      </header>

      <main className="tm-simple-content">

        <div className="tm-page-title">

          <span>
            ⚙️ Account
          </span>

          <h1>
            Settings
          </h1>

          <p>
            Manage your TimberMart account
            preferences.
          </p>

        </div>

        {message && (
          <div className="tm-profile-alert success">
            <Check size={17} />
            {message}
          </div>
        )}

        <div className="tm-settings-card">

          <SettingRow
            icon={<Bell size={20} />}
            title="Notifications"
            description="Receive important TimberMart notifications."
            enabled={
              settings.notifications
            }
            onClick={() =>
              toggle("notifications")
            }
          />

          <SettingRow
            icon={<Mail size={20} />}
            title="Email Notifications"
            description="Receive account updates through email."
            enabled={
              settings.emailNotifications
            }
            onClick={() =>
              toggle(
                "emailNotifications"
              )
            }
          />

          <SettingRow
            icon={<Moon size={20} />}
            title="Dark Mode"
            description="Use dark appearance for your account."
            enabled={
              settings.darkMode
            }
            onClick={() =>
              toggle("darkMode")
            }
          />

          <SettingRow
            icon={<Shield size={20} />}
            title="Private Profile"
            description="Control how your profile information is displayed."
            enabled={
              settings.privateProfile
            }
            onClick={() =>
              toggle(
                "privateProfile"
              )
            }
          />

        </div>

        <button
          className="tm-save-settings"
          onClick={saveSettings}
          disabled={saving}
        >
          <Save size={18} />

          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>

      </main>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  description,
  enabled,
  onClick,
}) {
  return (
    <div className="tm-setting-row-new">

      <div className="tm-setting-icon-new">
        {icon}
      </div>

      <div className="tm-setting-content-new">
        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>
      </div>

      <button
        type="button"
        className={`tm-switch ${
          enabled ? "on" : ""
        }`}
        onClick={onClick}
        aria-label={title}
      >
        <span />
      </button>

    </div>
  );
}
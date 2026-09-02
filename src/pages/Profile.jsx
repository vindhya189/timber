import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Profile() {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [sessionUser, setSessionUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
    photo_url: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        /*
         * IMPORTANT:
         * Do NOT use localStorage user here.
         * Use Supabase authenticated user.
         */
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "Session error:",
            sessionError
          );
        }

        /*
         * If no session, show page instead of
         * sending user back to role page.
         */
        if (!session?.user) {
          if (mounted) {
            setSessionUser(null);
            setLoading(false);
            setError(
              "Your login session is not available. Please login again."
            );
          }
          return;
        }

        if (!mounted) return;

        setSessionUser(session.user);

        /*
         * Get profile from Supabase
         */
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile fetch error:",
            profileError
          );

          if (mounted) {
            setError(
              profileError.message ||
                "Unable to load profile."
            );
          }

          return;
        }

        const fallbackName =
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "User";

        if (mounted) {
          setForm({
            name:
              profile?.name ||
              fallbackName,

            phone:
              profile?.phone || "",

            location:
              profile?.location || "",

            bio:
              profile?.bio || "",

            photo_url:
              profile?.photo_url || "",
          });
        }
      } catch (err) {
        console.error(
          "Profile loading error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Something went wrong while loading profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((old) => ({
      ...old,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  /*
   * PHOTO UPLOAD
   *
   * For now image is converted to a data URL and
   * saved inside profiles.photo_url.
   */
  function handlePhoto(e) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select an image file."
      );
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError(
        "Please select an image smaller than 3 MB."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setForm((old) => ({
        ...old,
        photo_url: reader.result,
      }));

      setMessage("");
      setError("");
    };

    reader.readAsDataURL(file);
  }

  /*
   * SAVE PROFILE
   */
  async function handleSave(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!sessionUser?.id) {
      setError(
        "Login session not found."
      );
      return;
    }

    if (!form.name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        error: saveError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: sessionUser.id,

            name:
              form.name.trim(),

            phone:
              form.phone.trim(),

            location:
              form.location.trim(),

            bio:
              form.bio.trim(),

            photo_url:
              form.photo_url || "",

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (saveError) {
        throw saveError;
      }

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Save profile error:",
        err
      );

      setError(
        err?.message ||
          "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <div className="tm-profile-loading">
        <div className="tm-profile-spinner" />

        <h3>
          Loading Profile...
        </h3>

        <p>
          Please wait.
        </p>
      </div>
    );
  }

  /*
   * PROFILE PAGE
   */
  return (
    <div className="tm-profile-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="tm-profile-header">

        <button
          type="button"
          className="tm-profile-back"
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="tm-profile-brand">
          <span className="tm-profile-brand-icon">
            🌲
          </span>

          <strong>
            TimberMart
          </strong>
        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="tm-profile-container">

        <div className="tm-profile-heading">

          <div className="tm-profile-heading-icon">
            👤
          </div>

          <div>
            <span>
              TimberMart Account
            </span>

            <h1>
              My Profile
            </h1>

            <p>
              Manage your personal information,
              location and profile photo.
            </p>
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="tm-profile-message tm-profile-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div className="tm-profile-message tm-profile-success">
            <Check size={17} />
            {message}
          </div>
        )}

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <form
          className="tm-profile-main-card"
          onSubmit={handleSave}
        >

          {/* PHOTO */}

          <section className="tm-profile-photo-box">

            <div className="tm-profile-avatar-large">

              {form.photo_url ? (
                <img
                  src={form.photo_url}
                  alt="Profile"
                />
              ) : (
                <User size={48} />
              )}

            </div>

            <div className="tm-profile-photo-info">

              <h2>
                Profile Photo
              </h2>

              <p>
                Add your photo so other
                TimberMart users can identify
                your account.
              </p>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhoto}
              />

              <button
                type="button"
                className="tm-upload-photo"
                onClick={() =>
                  fileInput.current?.click()
                }
              >
                <Camera size={17} />
                Choose Photo
              </button>

            </div>

          </section>

          <div className="tm-profile-line" />

          {/* NAME */}

          <div className="tm-profile-field">

            <label>
              Full Name *
            </label>

            <div className="tm-profile-input-wrap">

              <User size={18} />

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />

            </div>

          </div>

          {/* PHONE */}

          <div className="tm-profile-field">

            <label>
              Phone Number
            </label>

            <div className="tm-profile-input-wrap">

              <Phone size={18} />

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />

            </div>

          </div>

          {/* LOCATION */}

          <div className="tm-profile-field">

            <label>
              Location
            </label>

            <div className="tm-profile-input-wrap">

              <MapPin size={18} />

              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Village / City / District"
              />

            </div>

          </div>

          {/* BIO */}

          <div className="tm-profile-field">

            <label>
              About You
            </label>

            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={5}
              placeholder="Tell other TimberMart users about yourself..."
            />

          </div>

          {/* SAVE */}

          <div className="tm-profile-save-row">

            <button
              type="submit"
              className="tm-profile-save"
              disabled={saving}
            >
              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save Profile"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}
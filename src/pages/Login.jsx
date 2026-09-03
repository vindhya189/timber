import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../supabaseClient";

import "./Login.css";

/* =========================================================
   ROLE INFORMATION
   ========================================================= */

const ROLE_INFO = {
  farmer: {
    emoji: "🌳",
    title: "Farmer",
    description: "Sell your timber and connect with buyers.",
  },

  merchant: {
    emoji: "🪵",
    title: "Timber Merchant",
    description: "Buy and sell timber products.",
  },

  sawmill: {
    emoji: "🏭",
    title: "Sawmill / Wood Business",
    description: "Manage timber, workers and job opportunities.",
  },

  carpenter: {
    emoji: "🛠️",
    title: "Carpenter / Service Provider",
    description: "Show your skills and find work.",
  },

  worker: {
    emoji: "👷",
    title: "Worker / Job Seeker",
    description: "Find suitable timber industry jobs.",
  },

  buyer: {
    emoji: "🏠",
    title: "Buyer / Homeowner",
    description: "Find timber, carpenters and services.",
  },
};

/* =========================================================
   NORMALIZE ROLE
   ========================================================= */

function normalizeRole(role) {
  if (!role) return null;

  let value = String(role).toLowerCase().trim();

  try {
    const parsed = JSON.parse(value);

    if (typeof parsed === "string") {
      value = parsed.toLowerCase().trim();
    } else if (parsed?.role) {
      value = String(parsed.role).toLowerCase().trim();
    } else if (parsed?.id) {
      value = String(parsed.id).toLowerCase().trim();
    }
  } catch {
    // Normal string
  }

  const roleMap = {
    farmer: "farmer",
    farmers: "farmer",

    merchant: "merchant",
    "timber merchant": "merchant",
    timbermerchant: "merchant",

    sawmill: "sawmill",
    "sawmill / wood business": "sawmill",
    woodbusiness: "sawmill",

    carpenter: "carpenter",
    "carpenter / service provider": "carpenter",
    serviceprovider: "carpenter",

    worker: "worker",
    "worker / job seeker": "worker",
    "worker / labor": "worker",
    jobseeker: "worker",

    buyer: "buyer",
    "buyer / homeowner": "buyer",
    homeowner: "buyer",
  };

  return roleMap[value] || null;
}

/* =========================================================
   GET ROLE FROM URL FIRST
   ========================================================= */

function getRoleFromUrl(search) {
  const params = new URLSearchParams(search);

  return normalizeRole(
    params.get("role")
  );
}

/* =========================================================
   GET ROLE FROM LOCAL STORAGE
   ========================================================= */

function getRoleFromStorage() {
  const keys = [
    "timbermart_selected_role",
    "selectedRole",
    "selected_role",
    "timbermart_role",
  ];

  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (!value) continue;

    const role = normalizeRole(value);

    if (role) {
      return role;
    }
  }

  return null;
}

/* =========================================================
   LOGIN COMPONENT
   ========================================================= */

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  /* -------------------------------------------------------
     MODE
     ------------------------------------------------------- */

  const [mode, setMode] = useState("login");

  /* -------------------------------------------------------
     SELECTED ROLE
     ------------------------------------------------------- */

  const [selectedRole, setSelectedRole] = useState(null);

  /* -------------------------------------------------------
     FORM
     ------------------------------------------------------- */

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  /* -------------------------------------------------------
     STATES
     ------------------------------------------------------- */

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [forgotMode, setForgotMode] = useState(false);

  /* =======================================================
     LOAD SELECTED ROLE
     ======================================================= */

  useEffect(() => {
    // First priority = URL
    const urlRole = getRoleFromUrl(
      location.search
    );

    // Second priority = localStorage
    const savedRole = getRoleFromStorage();

    const role = urlRole || savedRole;

    if (!role) {
      navigate("/roles", {
        replace: true,
      });

      return;
    }

    // Save selected role
    localStorage.setItem(
      "timbermart_selected_role",
      role
    );

    setSelectedRole(role);
  }, [
    location.search,
    navigate,
  ]);

  /* =======================================================
     CLEAR MESSAGES
     ======================================================= */

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  /* =======================================================
     SAVE PROFILE TO SUPABASE
     ======================================================= */

  const saveProfile = async (
    user,
    role,
    extra = {}
  ) => {
    const normalizedRole =
      normalizeRole(role);

    if (!user?.id) {
      throw new Error(
        "User information is missing."
      );
    }

    if (!normalizedRole) {
      throw new Error(
        "Invalid TimberMart role."
      );
    }

    const metadata =
      user.user_metadata || {};

    const finalName =
      extra.name ||
      metadata.full_name ||
      metadata.name ||
      user.email?.split("@")[0] ||
      "TimberMart User";

    const finalPhone =
      extra.phone ||
      metadata.phone ||
      "";

    const photo =
      metadata.avatar_url ||
      metadata.picture ||
      null;

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          name: finalName,
          role: normalizedRole,
          phone: finalPhone,
          location:
            extra.location || null,
          bio: extra.bio || null,
          photo_url: photo,
        },
        {
          onConflict: "id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error(
        "Profile error:",
        error
      );

      throw new Error(
        error.message
      );
    }

    return data;
  };

  /* =======================================================
     SAVE LOCAL USER
     ======================================================= */

  const saveLocalUser = (
    user,
    profile
  ) => {
    const localUser = {
      id: user.id,

      email:
        user.email || "",

      name:
        profile?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "",

      phone:
        profile?.phone || "",

      role:
        profile?.role || "",

      location:
        profile?.location || "",

      bio:
        profile?.bio || "",

      photo_url:
        profile?.photo_url ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        "",
    };

    localStorage.setItem(
      "timbermart_current_user",
      JSON.stringify(localUser)
    );

    localStorage.setItem(
      "timbermart_selected_role",
      profile?.role ||
        selectedRole ||
        ""
    );
  };

  /* =======================================================
     OPEN DASHBOARD
     ======================================================= */

  const openDashboard = (
    profile,
    user
  ) => {
    const role =
      normalizeRole(
        profile?.role
      );

    if (!role) {
      throw new Error(
        "User role is missing."
      );
    }

    saveLocalUser(
      user,
      profile
    );

    navigate(
      `/dashboard/${role}`,
      {
        replace: true,
      }
    );
  };

  /* =======================================================
     EMAIL LOGIN
     ======================================================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    if (!selectedRole) {
      setError(
        "Please select your role."
      );
      return;
    }

    try {
      setLoading(true);

      /* ---------------------------------------------------
         SUPABASE LOGIN
         --------------------------------------------------- */

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: email.trim(),
            password,
          }
        );

      if (loginError) {
        throw loginError;
      }

      if (!data?.user) {
        throw new Error(
          "Login failed."
        );
      }

      const user = data.user;

      /* ---------------------------------------------------
         GET PROFILE
         --------------------------------------------------- */

      let {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Profile fetch error:",
          profileError
        );
      }

      /* ---------------------------------------------------
         CREATE PROFILE IF NOT EXISTS
         --------------------------------------------------- */

      if (!profile) {
        profile =
          await saveProfile(
            user,
            selectedRole,
            {
              name:
                user.user_metadata
                  ?.full_name ||
                user.user_metadata
                  ?.name ||
                user.email?.split(
                  "@"
                )[0],

              phone:
                user.user_metadata
                  ?.phone || "",
            }
          );
      }

      /* ---------------------------------------------------
         IMPORTANT:
         LOGIN ROLE SHOULD BE SELECTED ROLE
         --------------------------------------------------- */

      const profileRole =
        normalizeRole(
          profile?.role
        );

      /* ---------------------------------------------------
         ADMIN ACCOUNTS ARE NEVER CHANGED TO THE SELECTED
         NORMAL USER ROLE.
         --------------------------------------------------- */

      if (
        profileRole !== "admin" &&
        profileRole &&
        profileRole !== selectedRole
      ) {
        /*
          User selected a different role.

          Update profile role to the role
          selected on the Role Select page.
        */

        const {
          data: updatedProfile,
          error: updateError,
        } =
          await supabase
            .from("profiles")
            .update({
              role: selectedRole,
            })
            .eq("id", user.id)
            .select()
            .single();

        if (updateError) {
          throw updateError;
        }

        profile =
          updatedProfile;
      }

      /* ---------------------------------------------------
         FALLBACK FOR OLD/INCOMPLETE PROFILES
         --------------------------------------------------- */

      if (!normalizeRole(profile?.role)) {
        profile = {
          ...profile,
          role: selectedRole,
        };
      }

      /* ---------------------------------------------------
         ADMIN DIRECT LOGIN
         ---------------------------------------------------
         Admin role comes from Supabase profiles.role.
         Never overwrite it with the Role Select value.
         --------------------------------------------------- */

      if (normalizeRole(profile?.role) === "admin") {
        const adminProfile = {
          ...profile,
          role: "admin",
        };

        saveLocalUser(user, adminProfile);

        setMessage("Admin login successful!");

        setTimeout(() => {
          navigate("/admin", { replace: true });
        }, 300);

        return;
      }

      /* ---------------------------------------------------
         SAVE LOCAL USER
         --------------------------------------------------- */

      saveLocalUser(
        user,
        profile
      );

      setMessage(
        "Login successful!"
      );

      /* ---------------------------------------------------
         OPEN SELECTED DASHBOARD
         --------------------------------------------------- */

      setTimeout(() => {
        openDashboard(
          profile,
          user
        );
      }, 500);

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err?.message ||
        "Invalid email or password."
      );

    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     SIGNUP
     ======================================================= */

  const handleSignup = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!selectedRole) {
      setError(
        "Please select your role first."
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      /* ---------------------------------------------------
         CREATE SUPABASE ACCOUNT
         --------------------------------------------------- */

      const {
        data,
        error: signupError,
      } =
        await supabase.auth.signUp({
          email: email.trim(),

          password,

          options: {
            data: {
              full_name:
                name.trim(),

              name:
                name.trim(),

              phone:
                phone.trim(),

              role:
                selectedRole,
            },
          },
        });

      if (signupError) {
        throw signupError;
      }

      if (!data?.user) {
        throw new Error(
          "Account creation failed."
        );
      }

      /* ---------------------------------------------------
         EMAIL CONFIRMATION
         --------------------------------------------------- */

      if (!data.session) {
        setMessage(
          "Account created! Please check your email and confirm your account."
        );

        setMode("login");

        setPassword("");

        return;
      }

      /* ---------------------------------------------------
         CREATE PROFILE
         --------------------------------------------------- */

      const profile =
        await saveProfile(
          data.user,
          selectedRole,
          {
            name:
              name.trim(),

            phone:
              phone.trim(),
          }
        );

      /* ---------------------------------------------------
         SAVE LOCAL USER
         --------------------------------------------------- */

      saveLocalUser(
        data.user,
        profile
      );

      setMessage(
        "Account created successfully!"
      );

      /* ---------------------------------------------------
         OPEN DASHBOARD
         --------------------------------------------------- */

      setTimeout(() => {
        openDashboard(
          profile,
          data.user
        );
      }, 500);

    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      const errorMessage = String(err?.message || "");

      if (
        errorMessage.toLowerCase().includes("user already registered")
      ) {
        setError(
          "This email is already registered. Please switch to Login and use your existing password."
        );
        setMode("login");
        setPassword("");
      } else {
        setError(
          errorMessage ||
          "Unable to create account."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     GOOGLE LOGIN
     ======================================================= */

  const handleGoogleLogin = async () => {
    clearMessages();

    if (!selectedRole) {
      setError(
        "Please select a role first."
      );
      return;
    }

    try {
      setGoogleLoading(true);

      /* ---------------------------------------------------
         SAVE ROLE BEFORE GOOGLE REDIRECT
         --------------------------------------------------- */

      localStorage.setItem(
        "timbermart_selected_role",
        selectedRole
      );

      /* ---------------------------------------------------
         GOOGLE REDIRECT
         --------------------------------------------------- */

      const redirectTo =
        `${window.location.origin}/login?role=${selectedRole}`;

      const {
        error,
      } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "google",

            options: {
              redirectTo,

              queryParams: {
                prompt:
                  "select_account",
              },
            },
          }
        );

      if (error) {
        throw error;
      }

    } catch (err) {
      console.error(
        "Google error:",
        err
      );

      setError(
        err?.message ||
        "Unable to connect with Google."
      );

      setGoogleLoading(false);
    }
  };

  /* =======================================================
     GOOGLE CALLBACK
     ======================================================= */

  useEffect(() => {
    let active = true;

    const processGoogleLogin =
      async () => {
        try {
          const {
            data: {
              session,
            },
          } =
            await supabase.auth.getSession();

          if (!session?.user) {
            return;
          }

          const user =
            session.user;

          /* ------------------------------------------------
             CHECK GOOGLE CALLBACK
             ------------------------------------------------ */

          const params =
            new URLSearchParams(
              window.location.search
            );

          const hasCode =
            params.has("code");

          const hasOAuthError =
            params.has(
              "error"
            );

          if (
            !hasCode &&
            !hasOAuthError
          ) {
            return;
          }

          if (!active) return;

          setGoogleLoading(true);

          clearMessages();

          /* ------------------------------------------------
             GET SELECTED ROLE
             ------------------------------------------------ */

          const role =
            getRoleFromUrl(
              window.location.search
            ) ||
            getRoleFromStorage() ||
            normalizeRole(
              user.user_metadata
                ?.role
            );

          if (!role) {
            navigate(
              "/roles",
              {
                replace: true,
              }
            );

            return;
          }

          /* ------------------------------------------------
             SAVE ROLE
             ------------------------------------------------ */

          localStorage.setItem(
            "timbermart_selected_role",
            role
          );

          /* ------------------------------------------------
             GET PROFILE
             ------------------------------------------------ */

          let {
            data: profile,
          } =
            await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();

          /* ------------------------------------------------
             CREATE PROFILE
             ------------------------------------------------ */

          if (!profile) {
            profile =
              await saveProfile(
                user,
                role,
                {
                  name:
                    user.user_metadata
                      ?.full_name ||
                    user.user_metadata
                      ?.name ||
                    user.email?.split(
                      "@"
                    )[0] ||
                    "TimberMart User",

                  phone: "",
                }
              );
          } else {
            /* ----------------------------------------------
               Google selected role
               ---------------------------------------------- */

            const updateData = {};

            const googleName =
              user.user_metadata
                ?.full_name ||
              user.user_metadata
                ?.name ||
              user.email?.split(
                "@"
              )[0];

            const googlePhoto =
              user.user_metadata
                ?.avatar_url ||
              user.user_metadata
                ?.picture ||
              null;

            if (
              !profile.name &&
              googleName
            ) {
              updateData.name =
                googleName;
            }

            if (
              !profile.photo_url &&
              googlePhoto
            ) {
              updateData.photo_url =
                googlePhoto;
            }

            /*
              Role selected from Role Select
              should be used.
            */

            const existingGoogleRole =
              normalizeRole(profile?.role);

            /*
              Never change an existing Admin account to a normal
              selected role after Google authentication.
            */
            if (
              existingGoogleRole !== "admin" &&
              existingGoogleRole !== role
            ) {
              updateData.role = role;
            }

            if (
              Object.keys(
                updateData
              ).length > 0
            ) {
              const {
                data: updated,
                error,
              } =
                await supabase
                  .from(
                    "profiles"
                  )
                  .update(
                    updateData
                  )
                  .eq(
                    "id",
                    user.id
                  )
                  .select()
                  .single();

              if (error) {
                throw error;
              }

              if (updated) {
                profile =
                  updated;
              }
            }
          }

          /* ------------------------------------------------
             FALLBACK FOR INCOMPLETE GOOGLE PROFILES
             ------------------------------------------------ */

          if (!normalizeRole(profile?.role)) {
            profile = {
              ...profile,
              role,
            };
          }

          /* ------------------------------------------------
             SAVE LOCAL USER
             ------------------------------------------------ */

          saveLocalUser(
            user,
            profile
          );

          /* ------------------------------------------------
             CLEAN URL
             ------------------------------------------------ */

          window.history.replaceState(
            {},
            document.title,
            `/login?role=${role}`
          );

          /* ------------------------------------------------
             ADMIN DIRECT GOOGLE LOGIN
             ------------------------------------------------ */

          if (normalizeRole(profile?.role) === "admin") {
            setMessage("Admin login successful!");

            setTimeout(() => {
              if (!active) return;

              navigate("/admin", {
                replace: true,
              });
            }, 300);

            return;
          }

          setMessage(
            "Google login successful!"
          );

          /* ------------------------------------------------
             OPEN NORMAL DASHBOARD
             ------------------------------------------------ */

          setTimeout(() => {
            if (!active) return;

            openDashboard(
              profile,
              user
            );
          }, 500);

        } catch (err) {
          console.error(
            "Google callback error:",
            err
          );

          if (active) {
            setError(
              err?.message ||
              "Google login completed but profile setup failed."
            );
          }

        } finally {
          if (active) {
            setGoogleLoading(false);
          }
        }
      };

    processGoogleLogin();

    return () => {
      active = false;
    };
  }, [navigate]);

  /* =======================================================
     FORGOT PASSWORD
     ======================================================= */

  const handleForgotPassword =
    async (e) => {
      e.preventDefault();

      clearMessages();

      if (!email.trim()) {
        setError(
          "Enter your email address first."
        );
        return;
      }

      try {
        setLoading(true);

        const {
          error,
        } =
          await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
                `${window.location.origin}/login`,
            }
          );

        if (error) {
          throw error;
        }

        setMessage(
          "Password reset link sent to your email."
        );

      } catch (err) {
        console.error(
          "Reset password error:",
          err
        );

        setError(
          err?.message ||
          "Unable to send reset email."
        );

      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     LOADING
     ======================================================= */

  if (!selectedRole) {
    return (
      <div className="login-loading-page">

        <Loader2
          size={34}
          className="login-spin"
        />

        <p>
          Loading TimberMart...
        </p>

      </div>
    );
  }

  const role =
    ROLE_INFO[selectedRole];

  /* =======================================================
     FORGOT PASSWORD PAGE
     ======================================================= */

  if (forgotMode) {
    return (
      <div className="login-page">

        <header className="login-navbar">

          <button
            type="button"
            className="login-brand"
            onClick={() =>
              navigate("/")
            }
          >
            <span className="login-brand-icon">
              🌳
            </span>

            <span>
              TimberMart
            </span>
          </button>

          <button
            type="button"
            className="change-role-btn"
            onClick={() =>
              navigate("/roles")
            }
          >
            <ArrowLeft size={17} />

            Change Role
          </button>

        </header>

        <main className="forgot-container">

          <div className="forgot-card">

            <div className="forgot-icon">
              🔐
            </div>

            <h1>
              Reset Password
            </h1>

            <p>
              Enter your registered email
              address. We'll send you a
              password reset link.
            </p>

            {error && (
              <div className="alert alert-error">

                <AlertCircle size={18} />

                <span>
                  {error}
                </span>

              </div>
            )}

            {message && (
              <div className="alert alert-success">

                <CheckCircle2 size={18} />

                <span>
                  {message}
                </span>

              </div>
            )}

            <form
              onSubmit={
                handleForgotPassword
              }
            >

              <label>
                Email Address
              </label>

              <div className="input-box">

                <Mail size={19} />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                />

              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="login-spin"
                    />

                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link

                    <ArrowRight
                      size={18}
                    />
                  </>
                )}

              </button>

            </form>

            <button
              type="button"
              className="back-login-btn"
              onClick={() => {
                clearMessages();
                setForgotMode(false);
              }}
            >
              <ArrowLeft size={17} />

              Back to Login
            </button>

          </div>

        </main>

      </div>
    );
  }

  /* =======================================================
     MAIN LOGIN PAGE
     ======================================================= */

  return (
    <div className="login-page">

      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <header className="login-navbar">

        <button
          type="button"
          className="login-brand"
          onClick={() =>
            navigate("/")
          }
        >

          <span className="login-brand-icon">
            🌳
          </span>

          <span>
            TimberMart
          </span>

        </button>

        <button
          type="button"
          className="change-role-btn"
          onClick={() =>
            navigate("/roles")
          }
        >
          <ArrowLeft size={17} />

          Change Role
        </button>

      </header>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="login-main">

        {/* ===================================================
            LEFT SIDE
            =================================================== */}

        <section className="login-left">

          <div className="selected-role-icon">
            {role.emoji}
          </div>

          <div className="selected-label">
            SELECTED ROLE
          </div>

          <h1>
            Welcome,
            <br />

            <span>
              {role.title}
            </span>
          </h1>

          <p className="role-description">
            {role.description}
          </p>

          <div className="benefit-list">

            <div className="benefit-item">

              <CheckCircle2
                size={19}
              />

              <span>
                Connect with the
                timber community
              </span>

            </div>

            <div className="benefit-item">

              <CheckCircle2
                size={19}
              />

              <span>
                Create your own
                listings
              </span>

            </div>

            <div className="benefit-item">

              <CheckCircle2
                size={19}
              />

              <span>
                Find opportunities
                and requirements
              </span>

            </div>

          </div>

        </section>

        {/* ===================================================
            LOGIN CARD
            =================================================== */}

        <section className="login-right">

          <div className="login-card">

            {/* CARD HEADER */}

            <div className="login-card-header">

              <div className="login-card-logo">
                🌳
              </div>

              <div>

                <h2>
                  {mode === "login"
                    ? "Welcome Back"
                    : "Create Account"}
                </h2>

                <p>
                  {mode === "login"
                    ? "Login to your TimberMart account"
                    : "Join TimberMart and get started"}
                </p>

              </div>

            </div>

            {/* ALERT */}

            {error && (
              <div className="alert alert-error">

                <AlertCircle
                  size={18}
                />

                <span>
                  {error}
                </span>

              </div>
            )}

            {message && (
              <div className="alert alert-success">

                <CheckCircle2
                  size={18}
                />

                <span>
                  {message}
                </span>

              </div>
            )}

            {/* GOOGLE */}

            <button
              type="button"
              className="google-btn"
              onClick={
                handleGoogleLogin
              }
              disabled={
                googleLoading ||
                loading
              }
            >

              {googleLoading ? (
                <Loader2
                  size={20}
                  className="login-spin"
                />
              ) : (
                <span className="google-letter">
                  G
                </span>
              )}

              <span>
                {googleLoading
                  ? "Connecting..."
                  : "Continue with Google"}
              </span>

            </button>

            {/* DIVIDER */}

            <div className="or-divider">

              <span />

              <b>
                OR
              </b>

              <span />

            </div>

            {/* FORM */}

            <form
              onSubmit={
                mode === "login"
                  ? handleLogin
                  : handleSignup
              }
            >

              {/* NAME */}

              {mode === "signup" && (
                <>
                  <label>
                    Full Name
                  </label>

                  <div className="input-box">

                    <User size={19} />

                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <label>
                    Phone Number
                  </label>

                  <div className="input-box">

                    <Phone size={19} />

                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                        )
                      }
                    />

                  </div>
                </>
              )}

              {/* EMAIL */}

              <label>
                Email Address
              </label>

              <div className="input-box">

                <Mail size={19} />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  autoComplete="email"
                />

              </div>

              {/* PASSWORD */}

              <label>
                Password
              </label>

              <div className="input-box">

                <Lock size={19} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={
                    mode === "signup"
                      ? "Create a password"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
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

              {/* FORGOT PASSWORD */}

              {mode === "login" && (
                <div className="forgot-row">

                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setForgotMode(
                        true
                      );
                    }}
                  >
                    Forgot password?
                  </button>

                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="primary-btn"
                disabled={
                  loading ||
                  googleLoading
                }
              >

                {loading ? (
                  <>
                    <Loader2
                      size={19}
                      className="login-spin"
                    />

                    {mode === "login"
                      ? "Logging in..."
                      : "Creating account..."}
                  </>
                ) : (
                  <>
                    {mode === "login"
                      ? "Login"
                      : "Create Account"}

                    <ArrowRight
                      size={19}
                    />
                  </>
                )}

              </button>

            </form>

            {/* SWITCH LOGIN / SIGNUP */}

            <div className="switch-account">

              {mode === "login" ? (
                <>
                  <span>
                    Don't have an account?
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode(
                        "signup"
                      );
                    }}
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  <span>
                    Already have an account?
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode(
                        "login"
                      );
                    }}
                  >
                    Login
                  </button>
                </>
              )}

            </div>

            {/* SELECTED ROLE */}

            <div className="role-bottom">

              <div className="role-bottom-icon">
                {role.emoji}
              </div>

              <div className="role-bottom-text">

                <small>
                  Continuing as
                </small>

                <strong>
                  {role.title}
                </strong>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/roles")
                }
              >
                Change
              </button>

            </div>

            {/* PRIVACY */}

            <p className="privacy-text">
              By continuing, you agree to
              use TimberMart responsibly and
              provide accurate account
              information.
            </p>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="login-footer">

        <strong>
          🌳 TimberMart
        </strong>

        <span>
          Connecting the timber community
        </span>

      </footer>

    </div>
  );
}
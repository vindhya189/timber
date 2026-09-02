import React, { useEffect, useState } from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus,
  Phone,
  KeyRound,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { supabase } from "../supabaseClient";

/* =========================================================
   ROLE DETAILS
========================================================= */

const roles = {
  farmer: {
    icon: "🌳",
    title: "Farmer",
    description:
      "Sell timber and connect with timber buyers.",
  },

  merchant: {
    icon: "🪵",
    title: "Timber Merchant",
    description:
      "Buy, sell and manage timber business requirements.",
  },

  sawmill: {
    icon: "🏭",
    title: "Sawmill / Wood Business",
    description:
      "Manage wood processing and business opportunities.",
  },

  carpenter: {
    icon: "🛠️",
    title: "Carpenter / Service Provider",
    description:
      "Offer carpentry and wood-related services.",
  },

  worker: {
    icon: "👷",
    title: "Worker / Job Seeker",
    description:
      "Find jobs and connect with employers.",
  },

  buyer: {
    icon: "🏠",
    title: "Buyer / Homeowner",
    description:
      "Find timber, wood products and services.",
  },
};


/* =========================================================
   SAVE USER FOR OLD DASHBOARDS
========================================================= */

function syncLegacyUser(
  user,
  profile,
  fallbackRole
) {
  if (!user?.id) {
    return;
  }

  const finalRole =
    profile?.role ||
    user.user_metadata?.role ||
    fallbackRole ||
    "buyer";

  const finalName =
    profile?.name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const finalPhone =
    profile?.phone ||
    user.user_metadata?.phone ||
    "";

  const legacyUser = {
    id: user.id,

    name: finalName,

    email:
      user.email || "",

    phone: finalPhone,

    role: finalRole,

    location:
      profile?.location || "",

    bio:
      profile?.bio || "",

    photo_url:
      profile?.photo_url || "",

    createdAt:
      profile?.created_at ||
      new Date().toISOString(),
  };


  /* =======================================================
     CURRENT USER
  ======================================================= */

  localStorage.setItem(
    "timbermart_current_user",
    JSON.stringify(legacyUser)
  );


  /* =======================================================
     USERS LIST
  ======================================================= */

  let oldUsers = [];

  try {
    oldUsers = JSON.parse(
      localStorage.getItem(
        "timbermart_users"
      ) || "[]"
    );

    if (!Array.isArray(oldUsers)) {
      oldUsers = [];
    }
  } catch {
    oldUsers = [];
  }


  const existingIndex =
    oldUsers.findIndex(
      (item) =>
        item.id === user.id ||
        item.email === user.email
    );


  if (existingIndex >= 0) {
    oldUsers[existingIndex] = {
      ...oldUsers[existingIndex],
      ...legacyUser,
    };
  } else {
    oldUsers.push(
      legacyUser
    );
  }


  localStorage.setItem(
    "timbermart_users",
    JSON.stringify(oldUsers)
  );


  console.log(
    "✅ Legacy user synced:",
    legacyUser
  );

  return legacyUser;
}


/* =========================================================
   CREATE / UPDATE PROFILE
========================================================= */

async function createProfile(
  user,
  profileRole,
  profileName,
  profilePhone
) {
  if (!user?.id) {
    return null;
  }

  const finalRole =
    roles[profileRole]
      ? profileRole
      : "buyer";

  const finalName =
    profileName?.trim() ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const finalPhone =
    profilePhone?.trim() ||
    user.user_metadata?.phone ||
    "";


  const profileData = {
    id: user.id,

    name: finalName,

    role: finalRole,

    phone: finalPhone,

    location: "",

    bio: "",

    photo_url: "",
  };


  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .upsert(
      profileData,
      {
        onConflict: "id",
      }
    )
    .select()
    .single();


  if (error) {
    console.error(
      "❌ Profile creation error:",
      error
    );

    return null;
  }


  console.log(
    "✅ Profile created:",
    data
  );

  return data;
}


/* =========================================================
   LOGIN COMPONENT
========================================================= */

export default function Login() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();


  const selectedRole =
    searchParams.get("role");


  const role =
    roles[selectedRole] ||
    roles.buyer;


  const [mode, setMode] =
    useState("login");


  const [name, setName] =
    useState("");


  const [email, setEmail] =
    useState("");


  const [phone, setPhone] =
    useState("");


  const [password, setPassword] =
    useState("");


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");


  const [info, setInfo] =
    useState("");


  /* =======================================================
     CHECK SELECTED ROLE
  ======================================================= */

  useEffect(() => {
    if (
      !selectedRole ||
      !roles[selectedRole]
    ) {
      navigate(
        "/roles",
        {
          replace: true,
        }
      );
    }
  }, [
    selectedRole,
    navigate,
  ]);


  /* =======================================================
     SWITCH MODE
  ======================================================= */

  function switchMode(
    newMode
  ) {
    setMode(newMode);

    setError("");

    setInfo("");

    setPassword("");
  }


  /* =======================================================
     PHONE VALIDATION
  ======================================================= */

  function cleanPhoneNumber(
    value
  ) {
    return value
      .replace(/\D/g, "")
      .slice(0, 12);
  }


  function isValidPhone(
    value
  ) {
    const phoneNumber =
      cleanPhoneNumber(value);

    return (
      phoneNumber.length >= 10 &&
      phoneNumber.length <= 12
    );
  }


  /* =======================================================
     LOGIN
  ======================================================= */

  async function handleLogin() {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    if (!cleanEmail) {
      setError(
        "Email enter cheyyandi."
      );

      return;
    }


    if (!password) {
      setError(
        "Password enter cheyyandi."
      );

      return;
    }


    setLoading(true);

    setError("");

    setInfo("");


    try {

      /* ===================================================
         SUPABASE LOGIN
      =================================================== */

      const {
        data,
        error:
          loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              cleanEmail,

            password:
              password,
          }
        );


      if (loginError) {
        console.error(
          "❌ LOGIN ERROR:",
          loginError
        );

        throw loginError;
      }


      if (!data?.user) {
        throw new Error(
          "Login session create avvaledu."
        );
      }


      console.log(
        "✅ LOGIN SUCCESS:",
        data.user
      );


      /* ===================================================
         GET PROFILE
      =================================================== */

      let {
        data: profile,
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "id",
            data.user.id
          )
          .maybeSingle();


      if (profileError) {
        console.error(
          "❌ PROFILE FETCH ERROR:",
          profileError
        );
      }


      /* ===================================================
         PROFILE NOT FOUND
      =================================================== */

      if (!profile) {

        const metadata =
          data.user
            .user_metadata ||
          {};


        const profileRole =
          metadata.role &&
          roles[
            metadata.role
          ]
            ? metadata.role
            : selectedRole;


        const profileName =
          metadata.name ||
          data.user.email?.split(
            "@"
          )[0] ||
          "User";


        const profilePhone =
          metadata.phone ||
          "";


        profile =
          await createProfile(
            data.user,
            profileRole,
            profileName,
            profilePhone
          );


        /*
         * If profile still unavailable,
         * create local fallback.
         */

        if (!profile) {
          profile = {
            id:
              data.user.id,

            name:
              profileName,

            role:
              roles[
                profileRole
              ]
                ? profileRole
                : "buyer",

            phone:
              profilePhone,

            location:
              "",

            bio:
              "",

            photo_url:
              "",
          };
        }
      }


      /* ===================================================
         DETERMINE DASHBOARD ROLE
      =================================================== */

      let dashboardRole =
        profile?.role;


      if (
        !dashboardRole ||
        !roles[dashboardRole]
      ) {
        dashboardRole =
          selectedRole &&
          roles[selectedRole]
            ? selectedRole
            : "buyer";
      }


      console.log(
        "🎯 Dashboard role:",
        dashboardRole
      );


      /* ===================================================
         SYNC OLD DASHBOARD USER
      =================================================== */

      syncLegacyUser(
        data.user,
        profile,
        dashboardRole
      );


      /* ===================================================
         FINAL SESSION CHECK
      =================================================== */

      const {
        data:
          sessionData,
      } =
        await supabase.auth.getSession();


      console.log(
        "🔐 Final session:",
        sessionData?.session
      );


      if (
        !sessionData?.session
      ) {
        throw new Error(
          "Login successful but browser session save avvaledu. Please refresh and login again."
        );
      }


      /* ===================================================
         GO TO DASHBOARD
      =================================================== */

      console.log(
        "🚀 Opening dashboard:",
        `/dashboard/${dashboardRole}`
      );


      navigate(
        `/dashboard/${dashboardRole}`,
        {
          replace: true,
        }
      );

    } catch (
      submitError
    ) {

      console.error(
        "❌ AUTH ERROR:",
        submitError
      );


      let message =
        submitError?.message ||
        "Login failed.";


      const lower =
        message.toLowerCase();


      if (
        lower.includes(
          "invalid login credentials"
        )
      ) {
        message =
          "Email or password incorrect. Supabase Authentication lo same email/password use cheyyandi.";
      }


      if (
        lower.includes(
          "email not confirmed"
        )
      ) {
        message =
          "Email confirmation required. Supabase Authentication → Users lo confirmation status check cheyyandi.";
      }


      setError(
        message
      );

    } finally {

      setLoading(false);
    }
  }


  /* =======================================================
     SIGNUP
  ======================================================= */

  async function handleSignup() {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    const cleanPhone =
      cleanPhoneNumber(
        phone
      );


    if (!name.trim()) {
      setError(
        "Full name enter cheyyandi."
      );

      return;
    }


    if (!cleanEmail) {
      setError(
        "Email enter cheyyandi."
      );

      return;
    }


    if (!isValidPhone(phone)) {
      setError(
        "Valid 10 digit phone number enter cheyyandi."
      );

      return;
    }


    if (!password) {
      setError(
        "Password enter cheyyandi."
      );

      return;
    }


    if (
      password.length < 6
    ) {
      setError(
        "Password minimum 6 characters undali."
      );

      return;
    }


    setLoading(true);

    setError("");

    setInfo("");


    try {

      /* ===================================================
         SIGNUP
      =================================================== */

      const {
        data,
        error:
          signupError,
      } =
        await supabase.auth.signUp(
          {
            email:
              cleanEmail,

            password:
              password,

            options: {
              data: {
                name:
                  name.trim(),

                role:
                  selectedRole,

                phone:
                  cleanPhone,
              },
            },
          }
        );


      if (signupError) {
        console.error(
          "❌ SIGNUP ERROR:",
          signupError
        );

        throw signupError;
      }


      if (!data?.user) {
        throw new Error(
          "Account create avvaledu."
        );
      }


      console.log(
        "✅ SIGNUP SUCCESS:",
        data.user
      );


      /* ===================================================
         CREATE PROFILE
      =================================================== */

      let profile =
        await createProfile(
          data.user,
          selectedRole,
          name,
          cleanPhone
        );


      /* ===================================================
         SESSION AVAILABLE
      =================================================== */

      if (data.session) {

        if (!profile) {
          profile = {
            id:
              data.user.id,

            name:
              name.trim(),

            role:
              selectedRole,

            phone:
              cleanPhone,

            location:
              "",

            bio:
              "",

            photo_url:
              "",
          };
        }


        /* Save compatibility user */

        syncLegacyUser(
          data.user,
          profile,
          selectedRole
        );


        setInfo(
          "Account created successfully! Dashboard opening..."
        );


        setTimeout(() => {

          navigate(
            `/dashboard/${selectedRole}`,
            {
              replace: true,
            }
          );

        }, 400);


        return;
      }


      /* ===================================================
         EMAIL CONFIRMATION
      =================================================== */

      setInfo(
        "Account created successfully. Please login with the same email and password."
      );


      setMode(
        "login"
      );

      setPassword("");

    } catch (
      submitError
    ) {

      console.error(
        "❌ SIGNUP ERROR:",
        submitError
      );


      let message =
        submitError?.message ||
        "Account creation failed.";


      const lower =
        message.toLowerCase();


      if (
        lower.includes(
          "user already registered"
        )
      ) {
        message =
          "This email already registered. Please login.";
      }


      setError(
        message
      );

    } finally {

      setLoading(false);
    }
  }


  /* =======================================================
     FORM SUBMIT
  ======================================================= */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    setInfo("");


    if (
      mode === "login"
    ) {
      await handleLogin();
    } else {
      await handleSignup();
    }
  }


  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  async function handleForgotPassword() {

    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    if (!cleanEmail) {
      setError(
        "Password reset kosam email enter cheyyandi."
      );

      return;
    }


    setLoading(true);

    setError("");

    setInfo("");


    try {

      const redirectUrl =
        `${window.location.origin}/login?role=${selectedRole}`;


      const {
        error:
          resetError,
      } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              redirectUrl,
          }
        );


      if (resetError) {
        throw resetError;
      }


      setInfo(
        "Password reset link mee email ki pampincham."
      );

    } catch (
      resetError
    ) {

      console.error(
        "❌ RESET ERROR:",
        resetError
      );


      setError(
        resetError?.message ||
        "Password reset failed."
      );

    } finally {

      setLoading(false);
    }
  }


  /* =======================================================
     BACK
  ======================================================= */

  function goBack() {
    navigate("/roles");
  }


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="tm-auth-page">

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div className="tm-auth-topbar">

        <button
          type="button"
          className="tm-back-btn"
          onClick={goBack}
        >
          <ArrowLeft size={18} />

          Back
        </button>


        <div className="tm-logo">

          <div className="tm-logo-mark">
            🌲
          </div>

          <span>
            TimberMart
          </span>

        </div>

      </div>


      {/* ===================================================
          LOGIN CARD
      =================================================== */}

      <div className="tm-login-card">

        {/* ROLE */}

        <div className="tm-login-role">

          <div className="tm-role-emoji">
            {role.icon}
          </div>

          <div>

            <strong>
              {role.title}
            </strong>

            <span>
              {role.description}
            </span>

          </div>

        </div>


        {/* HEADING */}

        <div className="tm-auth-heading">

          <h1>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p>
            {mode === "login"
              ? "Login to continue to your TimberMart dashboard."
              : "Create your TimberMart account and get started."}
          </p>

        </div>


        {/* ERROR */}

        {error && (
          <div className="tm-error">
            {error}
          </div>
        )}


        {/* INFO */}

        {info && (
          <div className="tm-info-box">
            {info}
          </div>
        )}


        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
          className="tm-login-form"
        >

          {/* =================================================
              NAME
          ================================================= */}

          {mode === "signup" && (
            <div className="tm-form-group">

              <label>
                Full Name
              </label>

              <div className="tm-input-icon-wrap">

                <UserPlus
                  size={18}
                />

                <input
                  className="tm-input"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                />

              </div>

            </div>
          )}


          {/* =================================================
              PHONE
          ================================================= */}

          {mode === "signup" && (
            <div className="tm-form-group">

              <label>
                Phone Number
              </label>

              <div className="tm-input-icon-wrap">

                <Phone
                  size={18}
                />

                <input
                  className="tm-input"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      cleanPhoneNumber(
                        event.target.value
                      )
                    )
                  }
                  placeholder="Enter 10 digit phone number"
                  autoComplete="tel"
                  inputMode="numeric"
                />

              </div>

            </div>
          )}


          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="tm-form-group">

            <label>
              Email
            </label>

            <div className="tm-input-icon-wrap">

              <Mail
                size={18}
              />

              <input
                className="tm-input"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your email"
                autoComplete="email"
              />

            </div>

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="tm-form-group">

            <label>
              Password
            </label>

            <div className="tm-password-wrap">

              <LockKeyhole
                size={18}
              />

              <input
                className="tm-input"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
              />


              <button
                type="button"
                className="tm-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {showPassword ? (
                  <EyeOff
                    size={18}
                  />
                ) : (
                  <Eye
                    size={18}
                  />
                )}

              </button>

            </div>

          </div>


          {/* =================================================
              FORGOT PASSWORD
          ================================================= */}

          {mode === "login" && (
            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "flex-end",

                marginTop:
                  "-6px",

                marginBottom:
                  "4px",
              }}
            >

              <button
                type="button"
                className="tm-link"
                onClick={
                  handleForgotPassword
                }
                disabled={
                  loading
                }
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  gap:
                    "6px",

                  background:
                    "none",

                  border:
                    "none",

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",

                  padding: 0,
                }}
              >

                <KeyRound
                  size={15}
                />

                Forgot Password?

              </button>

            </div>
          )}


          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="tm-btn tm-btn-primary tm-full-btn"
            disabled={
              loading
            }
          >

            {loading ? (
              <>
                <span className="tm-spinner" />

                Please wait...
              </>
            ) : mode ===
              "login" ? (
              <>
                <LogIn
                  size={18}
                />

                Login
              </>
            ) : (
              <>
                <UserPlus
                  size={18}
                />

                Create Account
              </>
            )}

          </button>

        </form>


        {/* =================================================
            SWITCH
        ================================================= */}

        <div className="tm-switch-auth">

          {mode === "login" ? (
            <>
              Don't have an account?

              <button
                type="button"
                className="tm-link"
                onClick={() =>
                  switchMode(
                    "signup"
                  )
                }
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?

              <button
                type="button"
                className="tm-link"
                onClick={() =>
                  switchMode(
                    "login"
                  )
                }
              >
                Login
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  );
}
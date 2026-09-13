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

/*
  TimberMart Login / Create Account

  AUTHENTICATION:
  - Supabase Auth for actual account/session authentication
  - Gmail addresses only
  - Custom 6-digit Gmail OTP verification through TimberMart API
  - Phone number stored in profiles
  - No phone OTP
  - Password login
  - Registered role in profiles is authoritative
  - One browser/device can be associated with one email
*/

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

  admin: {
    emoji: "🛡️",
    title: "Administrator",
    description: "Manage TimberMart platform operations.",
  },
};

/* -------------------------------------------------------
   ROLE HELPERS
------------------------------------------------------- */

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
    admin: "admin",
    administrator: "admin",

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

function getRoleFromUrl(search) {
  const params = new URLSearchParams(search);
  return normalizeRole(params.get("role"));
}

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

    if (role) return role;
  }

  return null;
}

/* -------------------------------------------------------
   EMAIL / PHONE HELPERS
------------------------------------------------------- */

function isGmailAddress(value) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(
    String(value || "").trim()
  );
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanPhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

/* -------------------------------------------------------
   DEVICE HELPERS
------------------------------------------------------- */

function getDeviceId() {
  const KEY = "timbermart_device_id";

  let deviceId = localStorage.getItem(KEY);

  if (!deviceId) {
    deviceId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    localStorage.setItem(KEY, deviceId);
  }

  return deviceId;
}

function getDeviceOwnerEmail() {
  return cleanEmail(
    localStorage.getItem("timbermart_device_owner_email") || ""
  );
}

function setDeviceOwnerEmail(email) {
  localStorage.setItem(
    "timbermart_device_owner_email",
    cleanEmail(email)
  );
}

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  /* ------------------------------
     Main state
  ------------------------------ */

  const [mode, setMode] = useState("login");
  const [selectedRole, setSelectedRole] = useState(null);

  /* ------------------------------
     Signup
  ------------------------------ */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  const [emailVerificationSent, setEmailVerificationSent] =
    useState(false);

  const [emailVerified, setEmailVerified] = useState(false);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  /* ------------------------------
     Loading / messages
  ------------------------------ */

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* ------------------------------
     Forgot password
  ------------------------------ */

  const [forgotMode, setForgotMode] = useState(false);

  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpVerified, setForgotOtpVerified] =
    useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* -------------------------------------------------------
     ROLE INITIALIZATION
  ------------------------------------------------------- */

  useEffect(() => {
    const urlRole = getRoleFromUrl(location.search);
    const savedRole = getRoleFromStorage();

    const role = urlRole || savedRole;

    if (!role) {
      navigate("/roles", {
        replace: true,
      });

      return;
    }

    localStorage.setItem(
      "timbermart_selected_role",
      role
    );

    setSelectedRole(role);
  }, [location.search, navigate]);

  /* -------------------------------------------------------
     MESSAGE HELPERS
  ------------------------------------------------------- */

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  /* -------------------------------------------------------
     API
  ------------------------------------------------------- */

  const API_BASE = (
    import.meta.env.VITE_API_BASE || "/api"
  ).replace(/\/+$/, "");

  const parseApiResponse = async (response) => {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        message:
          text.trim() ||
          `Request failed (${response.status})`,
      };
    }
  };

  /* -------------------------------------------------------
     SAVE PROFILE
  ------------------------------------------------------- */

  const saveProfile = async (
    user,
    role,
    extra = {}
  ) => {
    const normalizedRole = normalizeRole(role);

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

    const metadata = user.user_metadata || {};

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
      error: profileError,
    } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          name: finalName,
          role: normalizedRole,
          phone: finalPhone,
          location: extra.location || null,
          bio: extra.bio || null,
          photo_url: photo,
        },
        {
          onConflict: "id",
        }
      )
      .select()
      .single();

    if (profileError) {
      console.error(
        "Profile error:",
        profileError
      );

      throw new Error(
        profileError.message
      );
    }

    return data;
  };

  /* -------------------------------------------------------
     SAVE LOCAL USER
  ------------------------------------------------------- */

  const saveLocalUser = (user, profile) => {
    const localUser = {
      id: user.id,
      email: user.email || "",

      name:
        profile?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "",

      phone:
        profile?.phone || "",

      role:
        normalizeRole(profile?.role) || "",

      location:
        profile?.location || "",

      bio:
        profile?.bio || "",

      photo_url:
        profile?.photo_url ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        "",

      device_id: getDeviceId(),
    };

    localStorage.setItem(
      "timbermart_current_user",
      JSON.stringify(localUser)
    );

    localStorage.setItem(
      "timbermart_selected_role",
      normalizeRole(profile?.role) ||
        selectedRole ||
        ""
    );

    setDeviceOwnerEmail(
      user.email || ""
    );
  };

  /* -------------------------------------------------------
     OPEN DASHBOARD
  ------------------------------------------------------- */

  const openDashboard = (
    profile,
    user
  ) => {
    const role = normalizeRole(
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

    if (role === "admin") {
      navigate("/admin", {
        replace: true,
      });

      return;
    }

    navigate(
      `/dashboard/${role}`,
      {
        replace: true,
      }
    );
  };

  /* -------------------------------------------------------
     DEVICE OWNER CHECK
  ------------------------------------------------------- */

  const checkDeviceOwner = (
    loginEmail
  ) => {
    const emailValue =
      cleanEmail(loginEmail);

    const owner =
      getDeviceOwnerEmail();

    if (
      owner &&
      owner !== emailValue
    ) {
      throw new Error(
        `This device is already linked to ${owner}. Please logout/remove the existing account from this browser before using another Gmail account.`
      );
    }
  };

  /* =======================================================
     EMAIL OTP
  ======================================================= */

  /* -------------------------------------------------------
     SEND EMAIL OTP
  ------------------------------------------------------- */

  const handleSendEmailVerification =
    async () => {
      clearMessages();

      const emailValue =
        cleanEmail(email);

      if (
        !isGmailAddress(emailValue)
      ) {
        setError(
          "Please use a Gmail address ending with @gmail.com."
        );

        return;
      }

      if (!name.trim()) {
        setError(
          "Please enter your name first."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE}/email/send-code`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email: emailValue,
                name: name.trim(),
              }),
            }
          );

        const result =
          await parseApiResponse(
            response
          );

        console.log(
          "SEND OTP RESPONSE:",
          result
        );

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              "Unable to send verification code."
          );
        }

        setEmailVerificationSent(
          true
        );

        setEmailVerified(false);

        setEmailOtp("");

        setMessage(
          "6-digit verification code sent to your Gmail. Please check Inbox/Spam."
        );
      } catch (err) {
        console.error(
          "Send email OTP error:",
          err
        );

        setError(
          err?.message ||
            "Unable to send the verification code."
        );
      } finally {
        setLoading(false);
      }
    };

  /* -------------------------------------------------------
     VERIFY EMAIL OTP
     
     IMPORTANT:
     Backend expects:
       {
         email,
         code
       }

     NOT:
       {
         email,
         name
       }
  ------------------------------------------------------- */

  const handleCheckEmailVerification =
    async () => {
      clearMessages();

      const emailValue =
        cleanEmail(email);

      const codeValue =
        String(emailOtp || "")
          .replace(/\D/g, "")
          .trim();

      console.log(
        "VERIFY EMAIL:",
        emailValue
      );

      console.log(
        "VERIFY CODE:",
        codeValue
      );

      console.log(
        "VERIFY CODE LENGTH:",
        codeValue.length
      );

      if (
        !isGmailAddress(emailValue)
      ) {
        setError(
          "Please use a Gmail address ending with @gmail.com."
        );

        return;
      }

      if (!/^\d{6}$/.test(codeValue)) {
        setError(
          "Please enter the 6-digit verification code."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE}/email/verify-code`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email: emailValue,

                /* FIXED */
                code: codeValue,
              }),
            }
          );

        const result =
          await parseApiResponse(
            response
          );

        console.log(
          "VERIFY OTP RESPONSE:",
          result
        );

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              `Server error (${response.status})`
          );
        }

        setEmailVerified(true);

        setMessage(
          "Gmail verified successfully. You can now create your account."
        );
      } catch (err) {
        console.error(
          "Verify email OTP error:",
          err
        );

        setEmailVerified(false);

        setError(
          err?.message ||
            "Invalid or expired verification code."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    clearMessages();

    const emailValue =
      cleanEmail(email);

    if (
      !isGmailAddress(emailValue)
    ) {
      setError(
        "Please use a Gmail address ending with @gmail.com."
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

      checkDeviceOwner(
        emailValue
      );

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: emailValue,
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

      if (!user.email_confirmed_at) {
        await supabase.auth.signOut();

        throw new Error(
          "Please verify your Gmail address before logging in."
        );
      }

      let {
        data: profile,
        error: profileError,
      } = await supabase
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

      /* --------------------------------
         Create profile if missing
      -------------------------------- */

      if (!profile) {
        const metadataRole =
          normalizeRole(
            user.user_metadata?.role
          );

        if (!metadataRole) {
          await supabase.auth.signOut();

          throw new Error(
            "Your account does not have a registered role. Please create the account again from Role Select."
          );
        }

        if (
          metadataRole !==
            "admin" &&
          metadataRole !==
            selectedRole
        ) {
          await supabase.auth.signOut();

          throw new Error(
            `This account is registered as "${ROLE_INFO[metadataRole]?.title || metadataRole}". Please select that role and login again.`
          );
        }

        profile =
          await saveProfile(
            user,
            metadataRole,
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
                  ?.phone ||
                "",
            }
          );
      }

      const profileRole =
        normalizeRole(
          profile?.role
        );

      if (!profileRole) {
        await supabase.auth.signOut();

        throw new Error(
          "Your account does not have a registered role. Please contact support."
        );
      }

      /* --------------------------------
         Role security
      -------------------------------- */

      if (
        profileRole !== "admin" &&
        profileRole !== selectedRole
      ) {
        await supabase.auth.signOut();

        throw new Error(
          `This account is registered as "${ROLE_INFO[profileRole]?.title || profileRole}". Please select "${ROLE_INFO[profileRole]?.title || profileRole}" from Role Select and login again.`
        );
      }

      saveLocalUser(
        user,
        profile
      );

      setMessage(
        profileRole === "admin"
          ? "Admin login successful!"
          : "Login successful!"
      );

      setTimeout(() => {
        openDashboard(
          profile,
          user
        );
      }, 300);
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      const text =
        String(
          err?.message || ""
        ).toLowerCase();

      if (
        text.includes(
          "email not confirmed"
        )
      ) {
        setError(
          "Please verify your Gmail address first. Check your Gmail inbox or spam folder."
        );
      } else if (
        text.includes(
          "invalid login credentials"
        )
      ) {
        setError(
          "Invalid Gmail or password."
        );
      } else {
        setError(
          err?.message ||
            "Unable to login."
        );
      }
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

    const emailValue =
      cleanEmail(email);

    const phoneValue =
      cleanPhone(phone);

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

    if (
      !isGmailAddress(emailValue)
    ) {
      setError(
        "Please use a Gmail address ending with @gmail.com."
      );

      return;
    }

    if (!emailVerified) {
      setError(
        "Please verify your Gmail first. Enter the 6-digit verification code sent to your Gmail and click Verify Code."
      );

      return;
    }

    if (
      !/^[6-9]\d{9}$/.test(
        phoneValue
      )
    ) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
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

      checkDeviceOwner(
        emailValue
      );

      const {
        data,
        error: signupError,
      } =
        await supabase.auth.signUp(
          {
            email: emailValue,

            password,

            options: {
              data: {
                full_name:
                  name.trim(),

                name:
                  name.trim(),

                phone:
                  phoneValue,

                role:
                  selectedRole,

                custom_email_verified:
                  true,
              },
            },
          }
        );

      if (signupError) {
        throw signupError;
      }

      if (!data?.user) {
        throw new Error(
          "Account creation failed."
        );
      }

      /*
        IMPORTANT:
        Supabase Email Confirmation
        should be OFF if you want only
        our custom 6-digit OTP flow.
      */

      const profile =
        await saveProfile(
          data.user,
          selectedRole,
          {
            name:
              name.trim(),

            phone:
              phoneValue,
          }
        );

      saveLocalUser(
        data.user,
        profile
      );

      setMessage(
        "Account created successfully!"
      );

      setTimeout(() => {
        openDashboard(
          profile,
          data.user
        );
      }, 300);
    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      const text =
        String(
          err?.message || ""
        ).toLowerCase();

      if (
        text.includes(
          "user already registered"
        ) ||
        text.includes(
          "already registered"
        )
      ) {
        setError(
          "This Gmail is already registered. Please switch to Login."
        );

        setMode("login");

        setPassword("");
      } else {
        setError(
          err?.message ||
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

  const handleGoogleLogin =
    async () => {
      clearMessages();

      if (!selectedRole) {
        setError(
          "Please select a role first."
        );

        return;
      }

      try {
        setGoogleLoading(true);

        const owner =
          getDeviceOwnerEmail();

        if (owner) {
          setError(
            `This device is already linked to ${owner}. Login with that Gmail instead.`
          );

          setGoogleLoading(false);

          return;
        }

        localStorage.setItem(
          "timbermart_selected_role",
          selectedRole
        );

        const redirectTo =
          `${window.location.origin}/login?role=${selectedRole}`;

        const {
          error: oauthError,
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

        if (oauthError) {
          throw oauthError;
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

          const params =
            new URLSearchParams(
              window.location.search
            );

          const hasCode =
            params.has("code");

          const hasOAuthError =
            params.has("error");

          if (
            !hasCode &&
            !hasOAuthError
          ) {
            return;
          }

          if (!active) {
            return;
          }

          setGoogleLoading(
            true
          );

          clearMessages();

          if (
            !isGmailAddress(
              user.email
            )
          ) {
            await supabase.auth.signOut();

            throw new Error(
              "Please use a Gmail account ending with @gmail.com."
            );
          }

          checkDeviceOwner(
            user.email
          );

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

          localStorage.setItem(
            "timbermart_selected_role",
            role
          );

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
              "Google profile fetch error:",
              profileError
            );
          }

          /* --------------------------------
             Create missing profile
          -------------------------------- */

          if (!profile) {
            const metadataRole =
              normalizeRole(
                user.user_metadata
                  ?.role
              );

            const profileRole =
              metadataRole || role;

            profile =
              await saveProfile(
                user,
                profileRole,
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
                      ?.phone ||
                    "",
                }
              );
          } else {
            const existingRole =
              normalizeRole(
                profile.role
              );

            if (!existingRole) {
              await supabase.auth.signOut();

              throw new Error(
                "This account has no registered role."
              );
            }

            if (
              existingRole !==
                "admin" &&
              existingRole !== role
            ) {
              await supabase.auth.signOut();

              throw new Error(
                `This Google account is registered as "${ROLE_INFO[existingRole]?.title || existingRole}". Please select the same role to continue.`
              );
            }

            const updateData =
              {};

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

            if (
              Object.keys(
                updateData
              ).length > 0
            ) {
              const {
                data: updated,
                error:
                  updateError,
              } =
                await supabase
                  .from("profiles")
                  .update(
                    updateData
                  )
                  .eq(
                    "id",
                    user.id
                  )
                  .select()
                  .single();

              if (updateError) {
                throw updateError;
              }

              if (updated) {
                profile =
                  updated;
              }
            }
          }

          const profileRole =
            normalizeRole(
              profile?.role
            );

          if (!profileRole) {
            await supabase.auth.signOut();

            throw new Error(
              "Your account does not have a registered role."
            );
          }

          saveLocalUser(
            user,
            profile
          );

          window.history.replaceState(
            {},
            document.title,
            `/login?role=${profileRole}`
          );

          setMessage(
            profileRole === "admin"
              ? "Admin login successful!"
              : "Google login successful!"
          );

          setTimeout(() => {
            if (!active) {
              return;
            }

            openDashboard(
              profile,
              user
            );
          }, 300);
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
            setGoogleLoading(
              false
            );
          }
        }
      };

    processGoogleLogin();

    return () => {
      active = false;
    };
  }, [navigate]);

  /* =======================================================
     FORGOT PASSWORD - SEND OTP
  ======================================================= */

  const handleSendForgotOtp =
    async (e) => {
      e.preventDefault();

      clearMessages();

      const emailValue =
        cleanEmail(email);

      if (
        !isGmailAddress(emailValue)
      ) {
        setError(
          "Please enter your registered Gmail address."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE}/password/send-code`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email: emailValue,
              }),
            }
          );

        const result =
          await parseApiResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Unable to send verification code."
          );
        }

        setForgotOtpSent(
          true
        );

        setForgotOtpVerified(
          false
        );

        setForgotOtp("");

        setNewPassword("");

        setConfirmPassword("");

        setMessage(
          "6-digit password reset code sent to your Gmail. Please check Inbox/Spam."
        );
      } catch (err) {
        console.error(
          "Forgot password OTP error:",
          err
        );

        setError(
          err?.message ||
            "Unable to send password reset code."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     FORGOT PASSWORD - VERIFY OTP
  ======================================================= */

  const handleVerifyForgotOtp =
    async () => {
      clearMessages();

      const emailValue =
        cleanEmail(email);

      const codeValue =
        String(forgotOtp || "")
          .replace(/\D/g, "")
          .trim();

      if (
        !isGmailAddress(emailValue)
      ) {
        setError(
          "Please enter your registered Gmail address."
        );

        return;
      }

      if (!/^\d{6}$/.test(codeValue)) {
        setError(
          "Please enter the 6-digit verification code."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE}/password/verify-code`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email: emailValue,
                code: codeValue,
              }),
            }
          );

        const result =
          await parseApiResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Invalid verification code."
          );
        }

        setForgotOtpVerified(
          true
        );

        setMessage(
          "Code verified successfully. You can now create a new password."
        );
      } catch (err) {
        console.error(
          "Forgot password verification error:",
          err
        );

        setForgotOtpVerified(
          false
        );

        setError(
          err?.message ||
            "Invalid or expired verification code."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     FORGOT PASSWORD - CHANGE
  ======================================================= */

  const handleChangeForgotPassword =
    async (e) => {
      e.preventDefault();

      clearMessages();

      const emailValue =
        cleanEmail(email);

      if (
        !isGmailAddress(emailValue)
      ) {
        setError(
          "Please enter your registered Gmail address."
        );

        return;
      }

      if (!forgotOtpVerified) {
        setError(
          "Please verify the 6-digit OTP first."
        );

        return;
      }

      if (
        newPassword.length < 6
      ) {
        setError(
          "New password must contain at least 6 characters."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setError(
          "New password and confirm password do not match."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE}/password/change`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email: emailValue,

                code: forgotOtp,

                newPassword,
              }),
            }
          );

        const result =
          await parseApiResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Unable to change password."
          );
        }

        setMessage(
          "Password changed successfully. You can now login with your new password."
        );

        setForgotMode(false);

        setForgotOtp("");

        setForgotOtpSent(false);

        setForgotOtpVerified(
          false
        );

        setNewPassword("");

        setConfirmPassword("");

        setPassword("");
      } catch (err) {
        console.error(
          "Change password error:",
          err
        );

        setError(
          err?.message ||
            "Unable to change password."
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
    ROLE_INFO[selectedRole] ||
    ROLE_INFO.buyer;

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
            <ArrowLeft
              size={17}
            />

            Change Role
          </button>
        </header>

        <main className="forgot-container">
          <div className="forgot-card forgot-otp-card">
            <div className="forgot-icon">
              🔐
            </div>

            <h1>
              Forgot Password?
            </h1>

            <p>
              Reset your TimberMart
              password securely
              using a 6-digit Gmail
              verification code.
            </p>

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

            <label>
              Gmail Address
            </label>

            <div className="input-box">
              <Mail
                size={19}
              />

              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(
                    e.target.value
                  );

                  setForgotOtp("");

                  setForgotOtpSent(
                    false
                  );

                  setForgotOtpVerified(
                    false
                  );

                  setNewPassword("");

                  setConfirmPassword(
                    ""
                  );
                }}
                autoComplete="email"
              />
            </div>

            {!forgotOtpVerified && (
              <button
                type="button"
                className="primary-btn forgot-action-btn"
                onClick={
                  handleSendForgotOtp
                }
                disabled={
                  loading ||
                  !isGmailAddress(
                    email
                  )
                }
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="login-spin"
                    />

                    Sending Code...
                  </>
                ) : (
                  <>
                    {forgotOtpSent
                      ? "Resend Verification Code"
                      : "Send Verification Code"}

                    <ArrowRight
                      size={18}
                    />
                  </>
                )}
              </button>
            )}

            {forgotOtpSent &&
              !forgotOtpVerified && (
                <div className="forgot-otp-section">
                  <label>
                    6-Digit Verification Code
                  </label>

                  <div className="forgot-otp-row">
                    <input
                      className="forgot-otp-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={forgotOtp}
                      onChange={(e) =>
                        setForgotOtp(
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              6
                            )
                        )
                      }
                    />

                    <button
                      type="button"
                      className="verify-otp-btn forgot-verify-btn"
                      onClick={
                        handleVerifyForgotOtp
                      }
                      disabled={
                        loading ||
                        forgotOtp.length !==
                          6
                      }
                    >
                      {loading
                        ? "Verifying..."
                        : "Verify Code"}
                    </button>
                  </div>

                  <div className="phone-verified forgot-info-row">
                    <Mail
                      size={17}
                    />

                    <span>
                      Enter the
                      6-digit code
                      sent to your
                      Gmail.
                    </span>
                  </div>
                </div>
              )}

            {forgotOtpVerified && (
              <form
                onSubmit={
                  handleChangeForgotPassword
                }
                className="forgot-password-form"
              >
                <div className="phone-verified forgot-success-row">
                  <CheckCircle2
                    size={17}
                  />

                  <span>
                    Gmail verification
                    successful
                  </span>
                </div>

                <label>
                  New Password
                </label>

                <div className="input-box">
                  <Lock
                    size={19}
                  />

                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    autoComplete="new-password"
                  />
                </div>

                <label>
                  Confirm New Password
                </label>

                <div className="input-box">
                  <Lock
                    size={19}
                  />

                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    autoComplete="new-password"
                  />
                </div>

                <small className="field-hint">
                  Password must contain
                  at least 6 characters.
                </small>

                <button
                  type="submit"
                  className="primary-btn forgot-action-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="login-spin"
                      />

                      Changing Password...
                    </>
                  ) : (
                    <>
                      Change Password

                      <CheckCircle2
                        size={18}
                      />
                    </>
                  )}
                </button>
              </form>
            )}

            <button
              type="button"
              className="back-login-btn"
              onClick={() => {
                clearMessages();

                setForgotMode(
                  false
                );

                setForgotOtp("");

                setForgotOtpSent(
                  false
                );

                setForgotOtpVerified(
                  false
                );

                setNewPassword("");

                setConfirmPassword(
                  ""
                );
              }}
            >
              <ArrowLeft
                size={17}
              />

              Back to Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* =======================================================
     MAIN LOGIN / SIGNUP PAGE
  ======================================================= */

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
          <ArrowLeft
            size={17}
          />

          Change Role
        </button>
      </header>

      <main className="login-main">
        {/* ===============================================
            LEFT SIDE
        =============================================== */}

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

        {/* ===============================================
            RIGHT SIDE
        =============================================== */}

        <section className="login-right">
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-card-logo">
                🌳
              </div>

              <div>
                <h2>
                  {mode ===
                  "login"
                    ? "Welcome Back"
                    : "Create Account"}
                </h2>

                <p>
                  {mode ===
                  "login"
                    ? "Login to your TimberMart account"
                    : "Join TimberMart and get started"}
                </p>
              </div>
            </div>

            {/* ERROR */}

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

            {/* SUCCESS */}

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

            {/* OR */}

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
                mode ===
                "login"
                  ? handleLogin
                  : handleSignup
              }
            >
              {/* =========================================
                  SIGNUP FIELDS
              ========================================= */}

              {mode ===
                "signup" && (
                <>
                  {/* NAME */}

                  <label>
                    Full Name
                  </label>

                  <div className="input-box">
                    <User
                      size={19}
                    />

                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      autoComplete="name"
                    />
                  </div>

                  {/* EMAIL */}

                  <label>
                    Gmail Address
                  </label>

                  <div className="input-box">
                    <Mail
                      size={19}
                    />

                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(
                          e.target.value
                        );

                        /* Reset OTP when email changes */
                        setEmailOtp(
                          ""
                        );

                        setEmailVerified(
                          false
                        );

                        setEmailVerificationSent(
                          false
                        );

                        clearMessages();
                      }}
                      autoComplete="email"
                    />
                  </div>

                  {/* EMAIL OTP SEND */}

                  <div className="email-verification-row">
                    <button
                      type="button"
                      className="otp-btn"
                      onClick={
                        handleSendEmailVerification
                      }
                      disabled={
                        loading ||
                        !isGmailAddress(
                          email
                        ) ||
                        !name.trim()
                      }
                    >
                      {loading &&
                      !emailVerified
                        ? "Sending Code..."
                        : emailVerificationSent
                        ? "Resend Code"
                        : "Send Verification Code"}
                    </button>
                  </div>

                  {/* EMAIL OTP INPUT */}

                  {emailVerificationSent &&
                    !emailVerified && (
                      <div className="otp-section">
                        <div className="otp-input-box">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            value={emailOtp}
                            onChange={(e) => {
                              const value =
                                e.target.value
                                  .replace(
                                    /\D/g,
                                    ""
                                  )
                                  .slice(
                                    0,
                                    6
                                  );

                              setEmailOtp(
                                value
                              );

                              /* Clear old OTP error while typing */
                              if (
                                error
                              ) {
                                setError(
                                  ""
                                );
                              }
                            }}
                          />

                          <button
                            type="button"
                            className="verify-otp-btn"
                            onClick={
                              handleCheckEmailVerification
                            }
                            disabled={
                              loading ||
                              emailOtp.length !==
                                6
                            }
                          >
                            {loading
                              ? "Verifying..."
                              : "Verify Code"}
                          </button>
                        </div>

                        <div className="phone-verified">
                          <Mail
                            size={17}
                          />

                          <span>
                            Enter the
                            6-digit code
                            sent to your
                            Gmail.
                          </span>
                        </div>
                      </div>
                    )}

                  {/* VERIFIED */}

                  {emailVerified && (
                    <div className="phone-verified">
                      <CheckCircle2
                        size={17}
                      />

                      <span>
                        Gmail verified
                        successfully
                      </span>
                    </div>
                  )}

                  {/* PHONE */}

                  <label>
                    Phone Number
                  </label>

                  <div className="input-box">
                    <Phone
                      size={19}
                    />

                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={phone}
                      maxLength={10}
                      onChange={(e) =>
                        setPhone(
                          cleanPhone(
                            e.target.value
                          )
                        )
                      }
                      autoComplete="tel"
                    />
                  </div>

                  <small className="field-hint">
                    Phone number is saved
                    to your TimberMart
                    profile. No SMS OTP
                    is required.
                  </small>
                </>
              )}

              {/* =========================================
                  LOGIN EMAIL
              ========================================= */}

              {mode ===
                "login" && (
                <>
                  <label>
                    Gmail Address
                  </label>

                  <div className="input-box">
                    <Mail
                      size={19}
                    />

                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      autoComplete="email"
                    />
                  </div>
                </>
              )}

              {/* =========================================
                  PASSWORD
              ========================================= */}

              <label>
                Password
              </label>

              <div className="input-box">
                <Lock
                  size={19}
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={
                    mode ===
                    "signup"
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
                    mode ===
                    "signup"
                      ? "new-password"
                      : "current-password"
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value
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
                      size={19}
                    />
                  ) : (
                    <Eye
                      size={19}
                    />
                  )}
                </button>
              </div>

              {mode ===
                "signup" && (
                <small className="field-hint">
                  Password must contain
                  at least 6 characters.
                </small>
              )}

              {/* FORGOT PASSWORD */}

              {mode ===
                "login" && (
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

                    {mode ===
                    "login"
                      ? "Logging in..."
                      : "Creating account..."}
                  </>
                ) : (
                  <>
                    {mode ===
                    "login"
                      ? "Login"
                      : "Create Account"}

                    <ArrowRight
                      size={19}
                    />
                  </>
                )}
              </button>
            </form>

            {/* =========================================
                SWITCH LOGIN / SIGNUP
            ========================================= */}

            <div className="switch-account">
              {mode ===
              "login" ? (
                <>
                  <span>
                    Don't have an
                    account?
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();

                      setMode(
                        "signup"
                      );

                      setPassword(
                        ""
                      );

                      setEmailOtp(
                        ""
                      );

                      setEmailVerified(
                        false
                      );

                      setEmailVerificationSent(
                        false
                      );
                    }}
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  <span>
                    Already have an
                    account?
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();

                      setMode(
                        "login"
                      );

                      setPassword(
                        ""
                      );

                      setEmailOtp(
                        ""
                      );

                      setEmailVerified(
                        false
                      );

                      setEmailVerificationSent(
                        false
                      );
                    }}
                  >
                    Login
                  </button>
                </>
              )}
            </div>

            {/* =========================================
                ROLE
            ========================================= */}

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
                  navigate(
                    "/roles"
                  )
                }
              >
                Change
              </button>
            </div>

            <p className="privacy-text">
              By continuing, you
              agree to use TimberMart
              responsibly and provide
              accurate account
              information.
            </p>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <strong>
          🌳 TimberMart
        </strong>

        <span>
          Connecting the timber
          community
        </span>
      </footer>
    </div>
  );
}
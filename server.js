// ============================================================
// TIMBERMART - EMAIL OTP + PASSWORD RESET BACKEND
// Express + Resend + Supabase Admin
// ============================================================

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// ENV
// ============================================================

dotenv.config({
  path: ".env.local",
});

const app = express();

const PORT = Number(process.env.PORT || 5000);

const RESEND_API_KEY =
  process.env.RESEND_API_KEY;

const RESEND_FROM =
  process.env.RESEND_FROM ||
  "TimberMart <noreply@timbermart.co.in>";

const OTP_SECRET =
  process.env.OTP_SECRET ||
  "timbermart-super-secret-otp-key";

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// CHECK ENV
// ============================================================

if (!RESEND_API_KEY) {
  console.error(
    "❌ RESEND_API_KEY is missing in .env.local"
  );
}

if (!SUPABASE_URL) {
  console.error(
    "❌ SUPABASE_URL is missing in .env.local"
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY is missing in .env.local"
  );
}

// ============================================================
// RESEND
// ============================================================

const resend =
  new Resend(RESEND_API_KEY);

// ============================================================
// SUPABASE ADMIN
// IMPORTANT:
// SERVICE ROLE KEY MUST NEVER BE USED IN FRONTEND
// ============================================================

const supabaseAdmin =
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// ============================================================
// OTP STORAGE
// ============================================================

// Account Gmail verification OTPs
const emailOtpStore = new Map();

// Forgot password OTPs
const passwordOtpStore = new Map();

// ============================================================
// HELPERS
// ============================================================

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isGmail(email) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(
    String(email || "").trim()
  );
}

function generateOTP() {
  return String(
    crypto.randomInt(100000, 1000000)
  );
}

function hashOTP(email, otp) {
  return crypto
    .createHash("sha256")
    .update(
      `${normalizeEmail(email)}:${otp}:${OTP_SECRET}`
    )
    .digest("hex");
}

function isExpired(record) {
  return (
    !record ||
    Date.now() > record.expiresAt
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// FIND SUPABASE USER
// ============================================================

async function findUserByEmail(email) {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin configuration is missing."
    );
  }

  const normalizedEmail =
    normalizeEmail(email);

  let page = 1;

  while (true) {
    const {
      data,
      error,
    } =
      await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

    if (error) {
      throw error;
    }

    const users = data?.users || [];

    const foundUser = users.find(
      (user) =>
        normalizeEmail(user.email) ===
        normalizedEmail
    );

    if (foundUser) {
      return foundUser;
    }

    if (users.length < 1000) {
      return null;
    }

    page += 1;
  }
}

// ============================================================
// EMAIL TEMPLATE - ACCOUNT VERIFICATION
// ============================================================

function createVerificationEmail({
  name,
  otp,
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>TimberMart Verification Code</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f7f5;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:600px;
      margin:40px auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 8px 30px rgba(0,0,0,0.08);
    "
  >

    <!-- HEADER -->

    <div
      style="
        background:#174c35;
        padding:30px 25px;
        text-align:center;
        color:#ffffff;
      "
    >

      <div
        style="
          font-size:42px;
          margin-bottom:10px;
        "
      >
        🌳
      </div>

      <h1
        style="
          margin:0;
          font-size:28px;
        "
      >
        TimberMart
      </h1>

      <p
        style="
          margin:8px 0 0;
          font-size:14px;
        "
      >
        Connecting the timber community
      </p>

    </div>

    <!-- CONTENT -->

    <div
      style="
        padding:35px 30px;
      "
    >

      <h2
        style="
          margin:0 0 15px;
          color:#222222;
        "
      >
        Verify your Gmail
      </h2>

      <p
        style="
          color:#555555;
          font-size:15px;
          line-height:1.6;
        "
      >
        Hello ${escapeHtml(name)},
      </p>

      <p
        style="
          color:#555555;
          font-size:15px;
          line-height:1.6;
        "
      >
        Use the following 6-digit verification
        code to verify your Gmail address for
        your TimberMart account.
      </p>

      <!-- OTP -->

      <div
        style="
          margin:30px 0;
          padding:25px;
          background:#f1f7f3;
          border:1px solid #d9eadf;
          border-radius:12px;
          text-align:center;
        "
      >

        <div
          style="
            color:#666666;
            font-size:13px;
            margin-bottom:10px;
          "
        >
          YOUR VERIFICATION CODE
        </div>

        <div
          style="
            font-size:38px;
            font-weight:bold;
            letter-spacing:10px;
            color:#174c35;
          "
        >
          ${otp}
        </div>

      </div>

      <p
        style="
          color:#777777;
          font-size:14px;
          line-height:1.6;
        "
      >
        This code is valid for
        <strong>10 minutes</strong>.
      </p>

      <p
        style="
          color:#777777;
          font-size:14px;
          line-height:1.6;
        "
      >
        If you did not request this code,
        you can safely ignore this email.
      </p>

    </div>

    <!-- FOOTER -->

    <div
      style="
        padding:20px 30px;
        background:#f7f7f7;
        text-align:center;
        color:#888888;
        font-size:12px;
      "
    >

      <strong>
        🌳 TimberMart
      </strong>

      <br>

      Connecting the timber community

    </div>

  </div>

</body>
</html>
`;
}

// ============================================================
// EMAIL TEMPLATE - PASSWORD RESET
// ============================================================

function createPasswordResetEmail({
  otp,
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>TimberMart Password Reset</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f7f5;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:600px;
      margin:40px auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 8px 30px rgba(0,0,0,0.08);
    "
  >

    <!-- HEADER -->

    <div
      style="
        background:#174c35;
        padding:30px 25px;
        text-align:center;
        color:#ffffff;
      "
    >

      <div
        style="
          font-size:42px;
          margin-bottom:10px;
        "
      >
        🔐
      </div>

      <h1
        style="
          margin:0;
          font-size:28px;
        "
      >
        TimberMart
      </h1>

      <p
        style="
          margin:8px 0 0;
          font-size:14px;
        "
      >
        Password Reset Verification
      </p>

    </div>

    <!-- CONTENT -->

    <div
      style="
        padding:35px 30px;
      "
    >

      <h2
        style="
          margin:0 0 15px;
          color:#222222;
        "
      >
        Reset your password
      </h2>

      <p
        style="
          color:#555555;
          font-size:15px;
          line-height:1.6;
        "
      >
        We received a request to change
        your TimberMart password.
      </p>

      <p
        style="
          color:#555555;
          font-size:15px;
          line-height:1.6;
        "
      >
        Enter this 6-digit verification code
        in TimberMart to continue.
      </p>

      <!-- OTP -->

      <div
        style="
          margin:30px 0;
          padding:25px;
          background:#f1f7f3;
          border:1px solid #d9eadf;
          border-radius:12px;
          text-align:center;
        "
      >

        <div
          style="
            color:#666666;
            font-size:13px;
            margin-bottom:10px;
          "
        >
          PASSWORD RESET CODE
        </div>

        <div
          style="
            font-size:38px;
            font-weight:bold;
            letter-spacing:10px;
            color:#174c35;
          "
        >
          ${otp}
        </div>

      </div>

      <p
        style="
          color:#777777;
          font-size:14px;
          line-height:1.6;
        "
      >
        This code is valid for
        <strong>10 minutes</strong>.
      </p>

      <p
        style="
          color:#777777;
          font-size:14px;
          line-height:1.6;
        "
      >
        If you did not request a password reset,
        please ignore this email.
      </p>

    </div>

    <!-- FOOTER -->

    <div
      style="
        padding:20px 30px;
        background:#f7f7f7;
        text-align:center;
        color:#888888;
        font-size:12px;
      "
    >

      <strong>
        🌳 TimberMart
      </strong>

      <br>

      Connecting the timber community

    </div>

  </div>

</body>
</html>
`;
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      message:
        "TimberMart Email OTP Server is running",
      port: PORT,
    });
  }
);

// ============================================================
// SEND ACCOUNT VERIFICATION OTP
// POST /api/email/send-code
// ============================================================

app.post(
  "/api/email/send-code",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      const name =
        String(
          req.body?.name || ""
        ).trim() ||
        "TimberMart User";

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Gmail address is required.",
        });
      }

      if (!isGmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a Gmail address ending with @gmail.com.",
        });
      }

      if (!RESEND_API_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "RESEND_API_KEY is missing in server configuration.",
        });
      }

      const existing =
        emailOtpStore.get(email);

      if (
        existing &&
        existing.lastSentAt &&
        Date.now() -
          existing.lastSentAt <
          60000
      ) {
        const remaining =
          Math.ceil(
            (
              60000 -
              (
                Date.now() -
                existing.lastSentAt
              )
            ) / 1000
          );

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${remaining} seconds before requesting another code.`,
        });
      }

      const otp =
        generateOTP();

      const otpHash =
        hashOTP(
          email,
          otp
        );

      emailOtpStore.set(
        email,
        {
          otpHash,
          expiresAt:
            Date.now() +
            10 * 60 * 1000,
          attempts: 0,
          lastSentAt:
            Date.now(),
        }
      );

      const html =
        createVerificationEmail({
          name,
          otp,
        });

      const {
        data,
        error,
      } =
        await resend.emails.send({
          from: RESEND_FROM,
          to: [email],
          subject:
            `${otp} is your TimberMart verification code`,
          html,
        });

      if (error) {
        console.error(
          "❌ Resend error:",
          error
        );

        emailOtpStore.delete(
          email
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            "Failed to send verification email.",
        });
      }

      console.log(
        `✅ Account OTP sent to ${email}`
      );

      console.log(
        "Resend ID:",
        data?.id || "N/A"
      );

      return res.json({
        success: true,
        message:
          "6-digit verification code sent to your Gmail.",
      });

    } catch (error) {
      console.error(
        "❌ Send account OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to send verification code.",
      });
    }
  }
);

// ============================================================
// VERIFY ACCOUNT EMAIL OTP
// POST /api/email/verify-code
// ============================================================

app.post(
  "/api/email/verify-code",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      const code =
        String(
          req.body?.code || ""
        ).trim();

      if (
        !email ||
        !isGmail(email)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      if (
        !/^\d{6}$/.test(code)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter the 6-digit verification code.",
        });
      }

      const record =
        emailOtpStore.get(email);

      if (!record) {
        return res.status(400).json({
          success: false,
          message:
            "No verification code found. Please request a new code.",
        });
      }

      if (
        isExpired(record)
      ) {
        emailOtpStore.delete(
          email
        );

        return res.status(400).json({
          success: false,
          message:
            "Verification code expired. Please request a new code.",
        });
      }

      if (
        record.attempts >= 5
      ) {
        emailOtpStore.delete(
          email
        );

        return res.status(429).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new code.",
        });
      }

      const submittedHash =
        hashOTP(
          email,
          code
        );

      if (
        submittedHash !==
        record.otpHash
      ) {
        record.attempts += 1;

        emailOtpStore.set(
          email,
          record
        );

        const remaining =
          Math.max(
            0,
            5 -
              record.attempts
          );

        return res.status(400).json({
          success: false,
          message:
            `Invalid verification code. ${remaining} attempts remaining.`,
        });
      }

      emailOtpStore.delete(
        email
      );

      console.log(
        `✅ Gmail verified: ${email}`
      );

      return res.json({
        success: true,
        verified: true,
        message:
          "Gmail verified successfully.",
      });

    } catch (error) {
      console.error(
        "❌ Verify account OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to verify code.",
      });
    }
  }
);

// ============================================================
// RESEND ACCOUNT OTP
// POST /api/email/resend-code
// ============================================================

app.post(
  "/api/email/resend-code",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      const name =
        String(
          req.body?.name || ""
        ).trim() ||
        "TimberMart User";

      if (
        !email ||
        !isGmail(email)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      const existing =
        emailOtpStore.get(email);

      if (
        existing &&
        existing.lastSentAt &&
        Date.now() -
          existing.lastSentAt <
          60000
      ) {
        const remaining =
          Math.ceil(
            (
              60000 -
              (
                Date.now() -
                existing.lastSentAt
              )
            ) / 1000
          );

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${remaining} seconds before requesting another code.`,
        });
      }

      const otp =
        generateOTP();

      const otpHash =
        hashOTP(
          email,
          otp
        );

      emailOtpStore.set(
        email,
        {
          otpHash,
          expiresAt:
            Date.now() +
            10 * 60 * 1000,
          attempts: 0,
          lastSentAt:
            Date.now(),
        }
      );

      const html =
        createVerificationEmail({
          name,
          otp,
        });

      const {
        data,
        error,
      } =
        await resend.emails.send({
          from: RESEND_FROM,
          to: [email],
          subject:
            `${otp} is your new TimberMart verification code`,
          html,
        });

      if (error) {
        emailOtpStore.delete(
          email
        );

        console.error(
          "❌ Resend error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            "Failed to resend verification code.",
        });
      }

      console.log(
        `✅ Account OTP resent to ${email}`
      );

      console.log(
        "Resend ID:",
        data?.id || "N/A"
      );

      return res.json({
        success: true,
        message:
          "New 6-digit verification code sent to your Gmail.",
      });

    } catch (error) {
      console.error(
        "❌ Resend account OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to resend verification code.",
      });
    }
  }
);

// ============================================================
// FORGOT PASSWORD - SEND OTP
// POST /api/password/send-code
// ============================================================

app.post(
  "/api/password/send-code",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Gmail address is required.",
        });
      }

      if (!isGmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a Gmail address ending with @gmail.com.",
        });
      }

      if (!RESEND_API_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "RESEND_API_KEY is missing in server configuration.",
        });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          message:
            "Supabase Admin configuration is missing.",
        });
      }

      // ------------------------------------------
      // Check if account exists
      // ------------------------------------------

      const user =
        await findUserByEmail(
          email
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "No TimberMart account found with this Gmail.",
        });
      }

      // ------------------------------------------
      // Cooldown
      // ------------------------------------------

      const existing =
        passwordOtpStore.get(
          email
        );

      if (
        existing &&
        existing.lastSentAt &&
        Date.now() -
          existing.lastSentAt <
          60000
      ) {
        const remaining =
          Math.ceil(
            (
              60000 -
              (
                Date.now() -
                existing.lastSentAt
              )
            ) / 1000
          );

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${remaining} seconds before requesting another code.`,
        });
      }

      // ------------------------------------------
      // Generate OTP
      // ------------------------------------------

      const otp =
        generateOTP();

      const otpHash =
        hashOTP(
          email,
          otp
        );

      passwordOtpStore.set(
        email,
        {
          otpHash,

          expiresAt:
            Date.now() +
            10 * 60 * 1000,

          attempts: 0,

          lastSentAt:
            Date.now(),

          verified: false,
        }
      );

      // ------------------------------------------
      // Email
      // ------------------------------------------

      const html =
        createPasswordResetEmail({
          otp,
        });

      const {
        data,
        error,
      } =
        await resend.emails.send({
          from: RESEND_FROM,
          to: [email],
          subject:
            `${otp} is your TimberMart password reset code`,
          html,
        });

      if (error) {
        passwordOtpStore.delete(
          email
        );

        console.error(
          "❌ Password reset Resend error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            "Failed to send password reset code.",
        });
      }

      console.log(
        `🔐 Password reset OTP sent to ${email}`
      );

      console.log(
        "Resend ID:",
        data?.id || "N/A"
      );

      return res.json({
        success: true,
        message:
          "6-digit password reset code sent to your Gmail.",
      });

    } catch (error) {
      console.error(
        "❌ Password reset send error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to send password reset code.",
      });
    }
  }
);

// ============================================================
// FORGOT PASSWORD - VERIFY OTP
// POST /api/password/verify-code
// ============================================================

app.post(
  "/api/password/verify-code",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      const code =
        String(
          req.body?.code || ""
        ).trim();

      if (
        !email ||
        !isGmail(email)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      if (
        !/^\d{6}$/.test(code)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter the 6-digit verification code.",
        });
      }

      const record =
        passwordOtpStore.get(
          email
        );

      if (!record) {
        return res.status(400).json({
          success: false,
          message:
            "No password reset code found. Please request a new code.",
        });
      }

      if (
        isExpired(record)
      ) {
        passwordOtpStore.delete(
          email
        );

        return res.status(400).json({
          success: false,
          message:
            "Password reset code expired. Please request a new code.",
        });
      }

      if (
        record.attempts >= 5
      ) {
        passwordOtpStore.delete(
          email
        );

        return res.status(429).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new code.",
        });
      }

      const submittedHash =
        hashOTP(
          email,
          code
        );

      if (
        submittedHash !==
        record.otpHash
      ) {
        record.attempts += 1;

        passwordOtpStore.set(
          email,
          record
        );

        const remaining =
          Math.max(
            0,
            5 -
              record.attempts
          );

        return res.status(400).json({
          success: false,
          message:
            `Invalid verification code. ${remaining} attempts remaining.`,
        });
      }

      // ------------------------------------------
      // Mark verified
      // ------------------------------------------

      record.verified = true;

      passwordOtpStore.set(
        email,
        record
      );

      console.log(
        `✅ Password reset OTP verified: ${email}`
      );

      return res.json({
        success: true,
        verified: true,
        message:
          "Password reset code verified successfully.",
      });

    } catch (error) {
      console.error(
        "❌ Password reset verify error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to verify password reset code.",
      });
    }
  }
);

// ============================================================
// FORGOT PASSWORD - CHANGE PASSWORD
// POST /api/password/change
// ============================================================

app.post(
  "/api/password/change",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      const code =
        String(
          req.body?.code || ""
        ).trim();

      const newPassword =
        String(
          req.body?.newPassword || ""
        );

      // ------------------------------------------
      // Validation
      // ------------------------------------------

      if (
        !email ||
        !isGmail(email)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      if (
        !/^\d{6}$/.test(code)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification code.",
        });
      }

      if (
        newPassword.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters.",
        });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          message:
            "Supabase Admin configuration is missing.",
        });
      }

      // ------------------------------------------
      // Get verified OTP
      // ------------------------------------------

      const record =
        passwordOtpStore.get(
          email
        );

      if (!record) {
        return res.status(400).json({
          success: false,
          message:
            "Password reset session not found. Please request a new code.",
        });
      }

      if (
        isExpired(record)
      ) {
        passwordOtpStore.delete(
          email
        );

        return res.status(400).json({
          success: false,
          message:
            "Password reset code expired. Please request a new code.",
        });
      }

      if (
        !record.verified
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please verify the OTP first.",
        });
      }

      // ------------------------------------------
      // Verify code again
      // ------------------------------------------

      const submittedHash =
        hashOTP(
          email,
          code
        );

      if (
        submittedHash !==
        record.otpHash
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification code.",
        });
      }

      // ------------------------------------------
      // Find Supabase user
      // ------------------------------------------

      const user =
        await findUserByEmail(
          email
        );

      if (!user) {
        passwordOtpStore.delete(
          email
        );

        return res.status(404).json({
          success: false,
          message:
            "TimberMart account not found.",
        });
      }

      // ------------------------------------------
      // Update Supabase Auth password
      // ------------------------------------------

      const {
        data,
        error,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            password:
              newPassword,
          }
        );

      if (error) {
        console.error(
          "❌ Supabase password update error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            "Unable to update password.",
        });
      }

      // ------------------------------------------
      // Delete used OTP
      // ------------------------------------------

      passwordOtpStore.delete(
        email
      );

      console.log(
        `✅ Password changed successfully: ${email}`
      );

      return res.json({
        success: true,
        message:
          "Password changed successfully.",
      });

    } catch (error) {
      console.error(
        "❌ Password change error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to change password.",
      });
    }
  }
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API endpoint not found.",
      path:
        req.originalUrl,
    });
  }
);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "❌ Server error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Internal server error.",
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  () => {
    console.log("");

    console.log(
      "=============================================="
    );

    console.log(
      "🌳 TIMBERMART EMAIL OTP SERVER"
    );

    console.log(
      "=============================================="
    );

    console.log(
      `🚀 Server running on: http://localhost:${PORT}`
    );

    console.log(
      `❤️ Health check: http://localhost:${PORT}/api/health`
    );

    console.log(
      `📧 Email sender: ${RESEND_FROM}`
    );

    console.log(
      "🔐 Account OTP validity: 10 minutes"
    );

    console.log(
      "🔐 Password OTP validity: 10 minutes"
    );

    console.log(
      "=============================================="
    );

    console.log("");
  }
);
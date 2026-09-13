// ============================================================
// TIMBERMART - NETLIFY SERVERLESS API
// Gmail OTP + Password Reset OTP + Razorpay Premium
// Express + Resend + Supabase Admin
// ============================================================

import express from "express";
import cors from "cors";
import crypto from "crypto";
import serverless from "serverless-http";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

// ============================================================
// APP
// ============================================================

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const RESEND_FROM =
  process.env.RESEND_FROM ||
  process.env.RESEND_FROM_EMAIL ||
  "TimberMart <noreply@timbermart.co.in>";

const OTP_SECRET =
  process.env.OTP_SECRET ||
  "timbermart-super-secret-otp-key-change-this";

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID;

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET;

// ============================================================
// CLIENTS
// ============================================================

const resend = RESEND_API_KEY
  ? new Resend(RESEND_API_KEY)
  : null;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
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

const razorpay =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      })
    : null;

// ============================================================
// OTP STORAGE
// ============================================================

const emailOtpStore = new Map();
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
  return !record || Date.now() > record.expiresAt;
}

function safeError(error) {
  return (
    error?.message ||
    error?.error?.message ||
    "Something went wrong."
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
// FIND USER BY EMAIL
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
    const { data, error } =
      await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

    if (error) {
      throw error;
    }

    const users = data?.users || [];

    const found = users.find(
      (user) =>
        normalizeEmail(user.email) ===
        normalizedEmail
    );

    if (found) {
      return found;
    }

    if (users.length < 1000) {
      return null;
    }

    page += 1;
  }
}

// ============================================================
// VERIFICATION EMAIL
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
<meta name="viewport"
      content="width=device-width, initial-scale=1.0">
<title>TimberMart Verification</title>
</head>

<body style="
margin:0;
padding:0;
background:#f4f7f5;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:600px;
margin:40px auto;
background:#ffffff;
border-radius:16px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,0.08);
">

<div style="
background:#174c35;
padding:30px;
text-align:center;
color:white;
">

<div style="
font-size:42px;
margin-bottom:10px;
">🌳</div>

<h1 style="
margin:0;
font-size:28px;
">TimberMart</h1>

<p style="
margin:8px 0 0;
font-size:14px;
">
Connecting the timber community
</p>

</div>

<div style="padding:35px 30px;">

<h2 style="
margin:0 0 15px;
color:#222;
">
Verify your Gmail
</h2>

<p style="
color:#555;
font-size:15px;
line-height:1.6;
">
Hello ${escapeHtml(name)},
</p>

<p style="
color:#555;
font-size:15px;
line-height:1.6;
">
Use this 6-digit code to verify your Gmail
address for your TimberMart account.
</p>

<div style="
margin:30px 0;
padding:25px;
background:#f1f7f3;
border:1px solid #d9eadf;
border-radius:12px;
text-align:center;
">

<div style="
color:#666;
font-size:13px;
margin-bottom:10px;
">
YOUR VERIFICATION CODE
</div>

<div style="
font-size:38px;
font-weight:bold;
letter-spacing:10px;
color:#174c35;
">
${otp}
</div>

</div>

<p style="
color:#777;
font-size:14px;
line-height:1.6;
">
This code is valid for <strong>10 minutes</strong>.
</p>

<p style="
color:#777;
font-size:14px;
line-height:1.6;
">
If you did not request this code,
you can safely ignore this email.
</p>

</div>

<div style="
padding:20px 30px;
background:#f7f7f7;
text-align:center;
color:#888;
font-size:12px;
">
<strong>🌳 TimberMart</strong><br>
Connecting the timber community
</div>

</div>

</body>
</html>
`;
}

// ============================================================
// PASSWORD RESET EMAIL
// ============================================================

function createPasswordResetEmail({
  otp,
}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width, initial-scale=1.0">
<title>TimberMart Password Reset</title>
</head>

<body style="
margin:0;
padding:0;
background:#f4f7f5;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:600px;
margin:40px auto;
background:white;
border-radius:16px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,0.08);
">

<div style="
background:#174c35;
padding:30px;
text-align:center;
color:white;
">

<div style="
font-size:42px;
margin-bottom:10px;
">🔐</div>

<h1 style="
margin:0;
font-size:28px;
">
TimberMart
</h1>

<p style="
margin:8px 0 0;
font-size:14px;
">
Password Reset Verification
</p>

</div>

<div style="padding:35px 30px;">

<h2 style="
margin:0 0 15px;
color:#222;
">
Reset your password
</h2>

<p style="
color:#555;
font-size:15px;
line-height:1.6;
">
We received a request to change
your TimberMart password.
</p>

<p style="
color:#555;
font-size:15px;
line-height:1.6;
">
Enter this 6-digit verification code
to continue.
</p>

<div style="
margin:30px 0;
padding:25px;
background:#f1f7f3;
border:1px solid #d9eadf;
border-radius:12px;
text-align:center;
">

<div style="
color:#666;
font-size:13px;
margin-bottom:10px;
">
PASSWORD RESET CODE
</div>

<div style="
font-size:38px;
font-weight:bold;
letter-spacing:10px;
color:#174c35;
">
${otp}
</div>

</div>

<p style="
color:#777;
font-size:14px;
line-height:1.6;
">
This code is valid for <strong>10 minutes</strong>.
</p>

<p style="
color:#777;
font-size:14px;
line-height:1.6;
">
If you did not request a password reset,
please ignore this email.
</p>

</div>

<div style="
padding:20px 30px;
background:#f7f7f7;
text-align:center;
color:#888;
font-size:12px;
">
<strong>🌳 TimberMart</strong><br>
Connecting the timber community
</div>

</div>

</body>
</html>
`;
}

// ============================================================
// HEALTH
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "TimberMart API is running",
    resendConfigured: Boolean(resend),
    supabaseConfigured: Boolean(supabaseAdmin),
    razorpayConfigured: Boolean(razorpay),
  });
});

// ============================================================
// SEND ACCOUNT OTP
// POST /api/email/send-code
// ============================================================

app.post(
  "/api/email/send-code",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(req.body?.email);

      const name =
        String(req.body?.name || "").trim() ||
        "TimberMart User";

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Gmail address is required.",
        });
      }

      if (!isGmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a Gmail address ending with @gmail.com.",
        });
      }

      if (!resend) {
        return res.status(500).json({
          success: false,
          message:
            "RESEND_API_KEY is missing in Netlify environment variables.",
        });
      }

      const existing =
        emailOtpStore.get(email);

      if (
        existing?.lastSentAt &&
        Date.now() - existing.lastSentAt < 60000
      ) {
        const remaining = Math.ceil(
          (
            60000 -
            (Date.now() - existing.lastSentAt)
          ) / 1000
        );

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${remaining} seconds before requesting another code.`,
        });
      }

      const otp = generateOTP();

      emailOtpStore.set(email, {
        otpHash: hashOTP(email, otp),
        expiresAt:
          Date.now() + 10 * 60 * 1000,
        attempts: 0,
        lastSentAt: Date.now(),
      });

      const html =
        createVerificationEmail({
          name,
          otp,
        });

      const { data, error } =
        await resend.emails.send({
          from: RESEND_FROM,
          to: [email],
          subject:
            `${otp} is your TimberMart verification code`,
          html,
        });

      if (error) {
        emailOtpStore.delete(email);

        console.error(
          "Resend send error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            "Failed to send verification email.",
        });
      }

      console.log(
        "ACCOUNT OTP SENT:",
        email,
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
        "Account OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: safeError(error),
      });
    }
  }
);

// ============================================================
// VERIFY ACCOUNT OTP
// POST /api/email/verify-code
// ============================================================

app.post(
  "/api/email/verify-code",
  async (req, res) => {
    try {
      const email =
        normalizeEmail(req.body?.email);

      const code =
        String(req.body?.code || "").trim();

      if (!isGmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      if (!/^\d{6}$/.test(code)) {
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

      if (isExpired(record)) {
        emailOtpStore.delete(email);

        return res.status(400).json({
          success: false,
          message:
            "Verification code expired. Please request a new code.",
        });
      }

      if (record.attempts >= 5) {
        emailOtpStore.delete(email);

        return res.status(429).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new code.",
        });
      }

      const submittedHash =
        hashOTP(email, code);

      if (
        submittedHash !== record.otpHash
      ) {
        record.attempts += 1;

        emailOtpStore.set(
          email,
          record
        );

        const remaining =
          Math.max(0, 5 - record.attempts);

        return res.status(400).json({
          success: false,
          message:
            `Invalid verification code. ${remaining} attempts remaining.`,
        });
      }

      emailOtpStore.delete(email);

      return res.json({
        success: true,
        verified: true,
        message:
          "Gmail verified successfully.",
      });
    } catch (error) {
      console.error(
        "Verify account OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: safeError(error),
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
        normalizeEmail(req.body?.email);

      const name =
        String(req.body?.name || "").trim() ||
        "TimberMart User";

      if (!isGmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      if (!resend) {
        return res.status(500).json({
          success: false,
          message:
            "RESEND_API_KEY is missing in Netlify environment variables.",
        });
      }

      const existing =
        emailOtpStore.get(email);

      if (
        existing?.lastSentAt &&
        Date.now() - existing.lastSentAt < 60000
      ) {
        const remaining = Math.ceil(
          (
            60000 -
            (Date.now() - existing.lastSentAt)
          ) / 1000
        );

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${remaining} seconds before requesting another code.`,
        });
      }

      const otp = generateOTP();

      emailOtpStore.set(email, {
        otpHash: hashOTP(email, otp),
        expiresAt:
          Date.now() + 10 * 60 * 1000,
        attempts: 0,
        lastSentAt: Date.now(),
      });

      const html =
        createVerificationEmail({
          name,
          otp,
        });

      const { data, error } =
        await resend.emails.send({
          from: RESEND_FROM,
          to: [email],
          subject:
            `${otp} is your new TimberMart verification code`,
          html,
        });

      if (error) {
        emailOtpStore.delete(email);

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            "Failed to resend verification code.",
        });
      }

      console.log(
        "ACCOUNT OTP RESENT:",
        email,
        data?.id || ""
      );

      return res.json({
        success: true,
        message:
          "New 6-digit verification code sent to your Gmail.",
      });
    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: safeError(error),
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
        normalizeEmail(req.body?.email);

      if (!isGmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      if (!resend) {
        return res.status(500).json({
          success: false,
          message:
            "RESEND_API_KEY is missing in Netlify environment variables.",
        });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          message:
            "Supabase Admin configuration is missing.",
        });
      }

      const user =
        await findUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "No TimberMart account found with this Gmail.",
        });
      }

      const existing =
        passwordOtpStore.get(email);

      if (
        existing?.lastSentAt &&
        Date.now() - existing.lastSentAt < 60000
      ) {
        const remaining = Math.ceil(
          (
            60000 -
            (Date.now() - existing.lastSentAt)
          ) / 1000
        );

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${remaining} seconds before requesting another code.`,
        });
      }

      const otp = generateOTP();

      passwordOtpStore.set(email, {
        otpHash: hashOTP(email, otp),
        expiresAt:
          Date.now() + 10 * 60 * 1000,
        attempts: 0,
        lastSentAt: Date.now(),
        verified: false,
      });

      const html =
        createPasswordResetEmail({
          otp,
        });

      const { data, error } =
        await resend.emails.send({
          from: RESEND_FROM,
          to: [email],
          subject:
            `${otp} is your TimberMart password reset code`,
          html,
        });

      if (error) {
        passwordOtpStore.delete(email);

        console.error(
          "Password reset email error:",
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
        "PASSWORD OTP SENT:",
        email,
        data?.id || ""
      );

      return res.json({
        success: true,
        message:
          "6-digit password reset code sent to your Gmail.",
      });
    } catch (error) {
      console.error(
        "Password OTP send error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: safeError(error),
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
        normalizeEmail(req.body?.email);

      const code =
        String(req.body?.code || "").trim();

      if (!isGmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter the 6-digit verification code.",
        });
      }

      const record =
        passwordOtpStore.get(email);

      if (!record) {
        return res.status(400).json({
          success: false,
          message:
            "No password reset code found. Please request a new code.",
        });
      }

      if (isExpired(record)) {
        passwordOtpStore.delete(email);

        return res.status(400).json({
          success: false,
          message:
            "Password reset code expired. Please request a new code.",
        });
      }

      if (record.attempts >= 5) {
        passwordOtpStore.delete(email);

        return res.status(429).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new code.",
        });
      }

      const submittedHash =
        hashOTP(email, code);

      if (
        submittedHash !== record.otpHash
      ) {
        record.attempts += 1;

        passwordOtpStore.set(
          email,
          record
        );

        const remaining =
          Math.max(
            0,
            5 - record.attempts
          );

        return res.status(400).json({
          success: false,
          message:
            `Invalid verification code. ${remaining} attempts remaining.`,
        });
      }

      record.verified = true;

      passwordOtpStore.set(
        email,
        record
      );

      return res.json({
        success: true,
        verified: true,
        message:
          "Password reset code verified successfully.",
      });
    } catch (error) {
      console.error(
        "Password OTP verify error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: safeError(error),
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
        normalizeEmail(req.body?.email);

      const code =
        String(req.body?.code || "").trim();

      const newPassword =
        String(req.body?.newPassword || "");

      if (!isGmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            "Please use a valid Gmail address.",
        });
      }

      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification code.",
        });
      }

      if (newPassword.length < 6) {
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

      const record =
        passwordOtpStore.get(email);

      if (!record) {
        return res.status(400).json({
          success: false,
          message:
            "Password reset session not found. Please request a new code.",
        });
      }

      if (isExpired(record)) {
        passwordOtpStore.delete(email);

        return res.status(400).json({
          success: false,
          message:
            "Password reset code expired. Please request a new code.",
        });
      }

      if (!record.verified) {
        return res.status(400).json({
          success: false,
          message:
            "Please verify the OTP first.",
        });
      }

      const submittedHash =
        hashOTP(email, code);

      if (
        submittedHash !== record.otpHash
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification code.",
        });
      }

      const user =
        await findUserByEmail(email);

      if (!user) {
        passwordOtpStore.delete(email);

        return res.status(404).json({
          success: false,
          message:
            "TimberMart account not found.",
        });
      }

      const { error } =
        await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            password: newPassword,
          }
        );

      if (error) {
        console.error(
          "Supabase password update error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message ||
            "Unable to update password.",
        });
      }

      passwordOtpStore.delete(email);

      return res.json({
        success: true,
        message:
          "Password changed successfully.",
      });
    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: safeError(error),
      });
    }
  }
);

// ============================================================
// RAZORPAY CREATE ORDER
// POST /api/payment/create-order
// ============================================================

app.post(
  "/api/payment/create-order",
  async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(500).json({
          success: false,
          message:
            "Razorpay configuration is missing.",
        });
      }

      const amount =
        Number(req.body?.amount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid payment amount.",
        });
      }

      const amountInPaise =
        Math.round(amount * 100);

      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt:
          `tm_${Date.now()}_${crypto
            .randomBytes(4)
            .toString("hex")}`,
      };

      const order =
        await razorpay.orders.create(
          options
        );

      console.log(
        "RAZORPAY ORDER CREATED:",
        order.id,
        amount
      );

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error(
        "Razorpay order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.error?.description ||
          error?.message ||
          "Unable to create Razorpay order.",
      });
    }
  }
);

// ============================================================
// PART 2 END
// ============================================================
// ============================================================
// RAZORPAY VERIFY PAYMENT + PREMIUM ACTIVATION
// POST /api/payment/verify
// ============================================================

app.post(
  "/api/payment/verify",
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // 1. GET PAYMENT DETAILS FROM RAZORPAY
      // --------------------------------------------------------

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body || {};

      console.log(
        "Razorpay verification request received:",
        {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          hasSignature: Boolean(
            razorpay_signature
          ),
          planId: req.body?.planId,
        }
      );

      // --------------------------------------------------------
      // 2. CHECK REQUIRED PAYMENT DETAILS
      // --------------------------------------------------------

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          verified: false,
          activated: false,
          message:
            "Payment verification details are missing.",
        });
      }

      // --------------------------------------------------------
      // 3. CHECK RAZORPAY CONFIGURATION
      // --------------------------------------------------------

      if (!RAZORPAY_KEY_ID) {
        return res.status(500).json({
          success: false,
          verified: false,
          activated: false,
          message:
            "Razorpay Key ID is missing.",
        });
      }

      if (!RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          verified: false,
          activated: false,
          message:
            "Razorpay secret is missing.",
        });
      }

      // --------------------------------------------------------
      // 4. CHECK SUPABASE ADMIN CONFIGURATION
      // --------------------------------------------------------

      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Supabase Admin configuration is missing.",
        });
      }

      // --------------------------------------------------------
      // 5. GENERATE RAZORPAY SIGNATURE
      // --------------------------------------------------------

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",
            RAZORPAY_KEY_SECRET
          )
          .update(
            `${razorpay_order_id}|${razorpay_payment_id}`
          )
          .digest("hex");

      const expectedBuffer =
        Buffer.from(
          generatedSignature,
          "utf8"
        );

      const receivedBuffer =
        Buffer.from(
          String(razorpay_signature),
          "utf8"
        );

      // --------------------------------------------------------
      // 6. SAFE SIGNATURE COMPARISON
      // --------------------------------------------------------

      if (
        expectedBuffer.length !==
        receivedBuffer.length
      ) {
        console.error(
          "Razorpay signature length mismatch."
        );

        return res.status(400).json({
          success: false,
          verified: false,
          activated: false,
          message:
            "Payment verification failed.",
        });
      }

      const signatureValid =
        crypto.timingSafeEqual(
          expectedBuffer,
          receivedBuffer
        );

      if (!signatureValid) {
        console.error(
          "Invalid Razorpay payment signature."
        );

        return res.status(400).json({
          success: false,
          verified: false,
          activated: false,
          message:
            "Payment verification failed.",
        });
      }

      console.log(
        "Razorpay signature verified successfully:",
        razorpay_payment_id
      );

      // --------------------------------------------------------
      // 7. GET USER ACCESS TOKEN
      // --------------------------------------------------------

      const authorization =
        req.headers.authorization || "";

      const accessToken =
        authorization
          .replace(
            /^Bearer\s+/i,
            ""
          )
          .trim();

      if (!accessToken) {
        return res.status(401).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Login session is missing. Please login again.",
        });
      }

      // --------------------------------------------------------
      // 8. IDENTIFY LOGGED-IN SUPABASE USER
      // --------------------------------------------------------

      const {
        data: authData,
        error: authError,
      } =
        await supabaseAdmin.auth.getUser(
          accessToken
        );

      if (
        authError ||
        !authData?.user?.id
      ) {
        console.error(
          "Supabase user identification error:",
          authError
        );

        return res.status(401).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Payment verified, but user session could not be identified.",
        });
      }

      const user =
        authData.user;

      const userId =
        user.id;

      console.log(
        "Logged-in user identified:",
        userId
      );

      // --------------------------------------------------------
      // 9. GET PLAN ID
      // --------------------------------------------------------

      const planId =
        String(
          req.body?.planId || ""
        ).trim();

      // --------------------------------------------------------
      // 10. SERVER-SIDE PREMIUM PLANS
      // --------------------------------------------------------

      const PLAN_DETAILS = {
        premium_monthly: {
          name: "Premium Monthly",
          amount: 199,
          months: 1,
        },

        premium_3_months: {
          name: "Premium 3 Months",
          amount: 499,
          months: 3,
        },

        premium_yearly: {
          name: "Premium Yearly",
          amount: 1499,
          months: 12,
        },
      };

      const plan =
        PLAN_DETAILS[planId];

      if (!plan) {
        return res.status(400).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Invalid Premium plan.",
        });
      }

      console.log(
        "Selected Premium plan:",
        plan
      );

      // --------------------------------------------------------
      // 11. FETCH RAZORPAY ORDER
      // --------------------------------------------------------

      if (!razorpay) {
        return res.status(500).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Razorpay configuration is missing.",
        });
      }

      let razorpayOrder;

      try {
        razorpayOrder =
          await razorpay.orders.fetch(
            razorpay_order_id
          );
      } catch (orderError) {
        console.error(
          "Razorpay order fetch error:",
          orderError
        );

        return res.status(500).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Payment verified, but Razorpay order could not be confirmed.",
        });
      }

      // --------------------------------------------------------
      // 12. VERIFY ORDER AMOUNT
      // --------------------------------------------------------

      const expectedAmount =
        Math.round(
          plan.amount * 100
        );

      const actualOrderAmount =
        Number(
          razorpayOrder?.amount
        );

      if (
        actualOrderAmount !==
        expectedAmount
      ) {
        console.error(
          "Payment amount mismatch:",
          {
            planId,
            expectedAmount,
            actualOrderAmount,
          }
        );

        return res.status(400).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Payment amount does not match the selected Premium plan.",
        });
      }

      // --------------------------------------------------------
      // 13. CHECK ORDER CURRENCY
      // --------------------------------------------------------

      if (
        razorpayOrder?.currency &&
        razorpayOrder.currency !== "INR"
      ) {
        return res.status(400).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Invalid payment currency.",
        });
      }

      // --------------------------------------------------------
      // 14. CHECK IF THIS PAYMENT WAS ALREADY ACTIVATED
      // --------------------------------------------------------

      const {
        data: existingPayment,
        error: existingPaymentError,
      } =
        await supabaseAdmin
          .from("user_subscriptions")
          .select(
            "id,plan_id,plan_name,amount,status,started_at,expires_at,payment_id,order_id"
          )
          .eq(
            "payment_id",
            razorpay_payment_id
          )
          .maybeSingle();

      if (existingPaymentError) {
        console.warn(
          "Existing payment lookup warning:",
          existingPaymentError.message
        );
      }

      if (existingPayment) {
        console.log(
          "Payment already activated:",
          razorpay_payment_id
        );

        return res.json({
          success: true,
          verified: true,
          activated: true,
          alreadyActivated: true,
          message:
            "Payment already verified and Premium is active.",
          paymentId:
            razorpay_payment_id,
          orderId:
            razorpay_order_id,
          planId:
            existingPayment.plan_id,
          planName:
            existingPayment.plan_name,
          amount:
            existingPayment.amount,
          subscription:
            existingPayment,
        });
      }

      // --------------------------------------------------------
      // 15. CALCULATE PREMIUM DATES
      // --------------------------------------------------------

      const startedAt =
        new Date();

      const expiresAt =
        new Date(startedAt);

      expiresAt.setMonth(
        expiresAt.getMonth() +
          plan.months
      );

      // --------------------------------------------------------
      // 16. EXPIRE OLD ACTIVE SUBSCRIPTIONS
      // --------------------------------------------------------

      const {
        error: deactivateError,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .update({
            status: "expired",
          })
          .eq(
            "user_id",
            userId
          )
          .eq(
            "status",
            "active"
          );

      if (deactivateError) {
        console.warn(
          "Previous subscription could not be expired:",
          deactivateError.message
        );
      }

      // --------------------------------------------------------
      // 17. SAVE NEW PREMIUM SUBSCRIPTION
      // --------------------------------------------------------

      const {
  data: subscription,
  error: subscriptionError,
} =
  await supabaseAdmin
    .from("user_subscriptions")
    .insert({
      user_id: userId,

      // REQUIRED DATABASE COLUMN
      plan_code: planId,

      // EXISTING COLUMNS
      plan_id: planId,
      plan_name: plan.name,

      amount: plan.amount,
      status: "active",

      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),

      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,

      // DATABASE HAS THESE AS NOT NULL
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(
      "id,user_id,plan_code,plan_id,plan_name,amount,status,started_at,expires_at,payment_id,order_id"
    )
    .single();

      if (subscriptionError) {
        console.error(
          "Premium activation database error:",
          subscriptionError
        );

        return res.status(500).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Payment verified, but Premium activation could not be saved.",
          error:
            subscriptionError.message,
        });
      }

      // --------------------------------------------------------
      // 18. SUCCESS
      // --------------------------------------------------------

      console.log(
        "=========================================="
      );

      console.log(
        "PREMIUM ACTIVATED SUCCESSFULLY"
      );

      console.log(
        "User:",
        userId
      );

      console.log(
        "Plan:",
        plan.name
      );

      console.log(
        "Amount:",
        plan.amount
      );

      console.log(
        "Payment:",
        razorpay_payment_id
      );

      console.log(
        "Expires:",
        expiresAt.toISOString()
      );

      console.log(
        "=========================================="
      );

      return res.json({
        success: true,
        verified: true,
        activated: true,

        message:
          "Payment verified and Premium activated successfully.",

        paymentId:
          razorpay_payment_id,

        orderId:
          razorpay_order_id,

        planId:
          planId,

        planName:
          plan.name,

        amount:
          plan.amount,

        subscription:
          subscription,
      });

    } catch (error) {
      console.error(
        "Razorpay verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        verified: false,
        activated: false,
        message:
          error?.message ||
          "Unable to verify payment.",
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
      "GLOBAL SERVER ERROR:",
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
// NETLIFY SERVERLESS HANDLER
// ============================================================

export const handler =
  serverless(app);
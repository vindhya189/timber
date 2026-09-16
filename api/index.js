// ============================================================
// TIMBERMART - NETLIFY SERVERLESS API
// Gmail OTP + Password Reset OTP + Razorpay Premium
// Express + Resend + Supabase Admin
// ============================================================

import express from "express";
import cors from "cors";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

// ============================================================
// APP
// ============================================================

// ============================================================
// SECURITY: INPUT VALIDATION
// ============================================================

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254);

const otpSchema = z
  .string()
  .trim()
  .regex(
    /^\d{6}$/,
    "OTP must be exactly 6 digits."
  );

const passwordSchema = z
  .string()
  .min(
    8,
    "Password must contain at least 8 characters."
  )
  .max(
    128,
    "Password is too long."
  );

const emailVerifySchema = z
  .object({
    email: emailSchema,
    code: otpSchema,
  })
  .strict();

const emailSendSchema = z
  .object({
    email: emailSchema,

    name: z
      .string()
      .trim()
      .min(
        2,
        "Name must contain at least 2 characters."
      )
      .max(
        100,
        "Name is too long."
      ),
  })
  .strict();

const emailResendSchema = z
  .object({
    email: emailSchema,

    name: z
      .string()
      .trim()
      .min(
        2,
        "Name must contain at least 2 characters."
      )
      .max(
        100,
        "Name is too long."
      )
      .optional(),
  })
  .strict();

const passwordResetSendSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

const passwordVerifySchema = z
  .object({
    email: emailSchema,
    code: otpSchema,
  })
  .strict();

const passwordChangeSchema = z
  .object({
    email: emailSchema,
    code: otpSchema,
    newPassword: passwordSchema,
  })
  .strict();

const paymentCreateOrderSchema = z
  .object({
    planId: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .regex(
        /^premium_(monthly|3_months|yearly)$/,
        "Invalid Premium plan."
      ),
  })
  .strict();

const razorpayVerifySchema = z
  .object({
    razorpay_order_id: z
      .string()
      .trim()
      .min(10)
      .max(100)
      .regex(
        /^order_[A-Za-z0-9]+$/,
        "Invalid Razorpay order ID."
      ),

    razorpay_payment_id: z
      .string()
      .trim()
      .min(10)
      .max(100)
      .regex(
        /^pay_[A-Za-z0-9]+$/,
        "Invalid Razorpay payment ID."
      ),

    razorpay_signature: z
      .string()
      .trim()
      .length(64)
      .regex(
        /^[a-fA-F0-9]{64}$/,
        "Invalid Razorpay signature."
      ),
  })
  .strict();

const validateBody = (schema) => {
  return (req, res, next) => {
    const result =
      schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid request data.",

        errors:
          result.error.issues.map(
            (issue) => ({
              field:
                issue.path.join("."),

              message:
                issue.message,
            })
          ),
      });
    }

    req.body = result.data;

    next();
  };
};

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// RATE LIMIT SETTINGS
// ============================================================

const RATE_LIMIT_WINDOW_MS =
  Number(
    process.env.RATE_LIMIT_WINDOW_MS ||
      15 * 60 * 1000
  );

const OTP_SEND_MAX =
  Number(
    process.env.OTP_SEND_MAX || 5
  );

const OTP_VERIFY_MAX =
  Number(
    process.env.OTP_VERIFY_MAX || 10
  );

const PASSWORD_RESET_MAX =
  Number(
    process.env.PASSWORD_RESET_MAX || 5
  );

const PAYMENT_CREATE_MAX =
  Number(
    process.env.PAYMENT_CREATE_MAX || 10
  );

const PAYMENT_VERIFY_MAX =
  Number(
    process.env.PAYMENT_VERIFY_MAX || 15
  );

// ============================================================
// GENERAL API LIMITER
// ============================================================

const generalLimiter =
  rateLimit({
    windowMs:
      RATE_LIMIT_WINDOW_MS,

    limit: 120,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many requests. Please try again later.",
    },
  });

// ============================================================
// OTP SEND LIMITER
// ============================================================

const otpSendLimiter =
  rateLimit({
    windowMs:
      RATE_LIMIT_WINDOW_MS,

    limit:
      OTP_SEND_MAX,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many verification requests. Please try again later.",
    },
  });

// ============================================================
// OTP VERIFY LIMITER
// ============================================================

const otpVerifyLimiter =
  rateLimit({
    windowMs:
      RATE_LIMIT_WINDOW_MS,

    limit:
      OTP_VERIFY_MAX,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many verification attempts. Please try again later.",
    },
  });

// ============================================================
// PASSWORD RESET LIMITER
// ============================================================

const passwordResetLimiter =
  rateLimit({
    windowMs:
      RATE_LIMIT_WINDOW_MS,

    limit:
      PASSWORD_RESET_MAX,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many password reset requests. Please try again later.",
    },
  });

// ============================================================
// PAYMENT CREATE LIMITER
// ============================================================

const paymentCreateLimiter =
  rateLimit({
    windowMs:
      RATE_LIMIT_WINDOW_MS,

    limit:
      PAYMENT_CREATE_MAX,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many payment requests. Please try again later.",
    },
  });

// ============================================================
// PAYMENT VERIFY LIMITER
// ============================================================

const paymentVerifyLimiter =
  rateLimit({
    windowMs:
      RATE_LIMIT_WINDOW_MS,

    limit:
      PAYMENT_VERIFY_MAX,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many payment verification attempts. Please try again later.",
    },
  });

// ============================================================
// APPLY GENERAL API LIMITER
// ============================================================

app.use(
  "/api/",
  generalLimiter
);

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "https://timbermart.co.in",
  "https://www.timbermart.co.in",
];

app.use(
  cors({
    origin:
      function (
        origin,
        callback
      ) {
        // Allow server-to-server / same-origin requests
        if (!origin) {
          return callback(
            null,
            true
          );
        }

        if (
          allowedOrigins.includes(
            origin
          )
        ) {
          return callback(
            null,
            true
          );
        }

        return callback(
          new Error(
            "CORS policy: Origin not allowed."
          )
        );
      },

    credentials: true,
  })
);

// ============================================================
// JSON BODY
// ============================================================

app.use(
  express.json({
    limit: "1mb",
  })
);

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const RESEND_API_KEY =
  process.env.RESEND_API_KEY;

const RESEND_FROM =
  process.env.RESEND_FROM ||
  process.env.RESEND_FROM_EMAIL ||
  "TimberMart <noreply@timbermart.co.in>";

const OTP_SECRET =
  process.env.OTP_SECRET;

if (
  !OTP_SECRET ||
  OTP_SECRET.length < 32
) {
  throw new Error(
    "OTP_SECRET is not configured securely."
  );
}

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID;

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET;

// ============================================================
// CLIENTS
// ============================================================

const resend =
  RESEND_API_KEY
    ? new Resend(
        RESEND_API_KEY
      )
    : null;

const supabaseAdmin =
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken:
              false,

            persistSession:
              false,
          },
        }
      )
    : null;

const razorpay =
  RAZORPAY_KEY_ID &&
  RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id:
          RAZORPAY_KEY_ID,

        key_secret:
          RAZORPAY_KEY_SECRET,
      })
    : null;

// ============================================================
// OTP STORAGE
// ============================================================

const emailOtpStore =
  new Map();

const passwordOtpStore =
  new Map();

// ============================================================
// PREMIUM PLANS
// ============================================================

const PLAN_DETAILS = {
  premium_monthly: {
    name:
      "Premium Monthly",

    amount:
      199,

    months:
      1,
  },

  premium_3_months: {
    name:
      "Premium 3 Months",

    amount:
      499,

    months:
      3,
  },

  premium_yearly: {
    name:
      "Premium Yearly",

    amount:
      1499,

    months:
      12,
  },
};

// ============================================================
// HELPERS
// ============================================================

function normalizeEmail(
  email
) {
  return String(
    email || ""
  )
    .trim()
    .toLowerCase();
}

function isGmail(
  email
) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(
    String(
      email || ""
    ).trim()
  );
}

function generateOTP() {
  return String(
    crypto.randomInt(
      100000,
      1000000
    )
  );
}

function hashOTP(
  email,
  otp
) {
  return crypto
    .createHash(
      "sha256"
    )
    .update(
      `${normalizeEmail(
        email
      )}:${otp}:${OTP_SECRET}`
    )
    .digest("hex");
}

function isExpired(
  record
) {
  return (
    !record ||
    Date.now() >
      record.expiresAt
  );
}

function safeError(
  error
) {
  console.error(
    "Internal API error:",
    error
  );

  return (
    "Something went wrong. Please try again later."
  );
}

function escapeHtml(
  value
) {
  return String(
    value || ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

// ============================================================
// AUTH TOKEN HELPER
// ============================================================

async function getAuthenticatedUser(
  req
) {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin configuration is missing."
    );
  }

  const authorization =
    req.headers.authorization ||
    "";

  const accessToken =
    authorization
      .replace(
        /^Bearer\s+/i,
        ""
      )
      .trim();

  if (!accessToken) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken
    );

  if (
    error ||
    !data?.user
  ) {
    console.error(
      "Authentication error:",
      error
    );

    return null;
  }

  return data.user;
}

// ============================================================
// FIND USER BY EMAIL
// ============================================================

async function findUserByEmail(
  email
) {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin configuration is missing."
    );
  }

  const normalizedEmail =
    normalizeEmail(
      email
    );

  let page = 1;

  while (true) {
    const {
      data,
      error,
    } =
      await supabaseAdmin.auth.admin.listUsers(
        {
          page,

          perPage:
            1000,
        }
      );

    if (error) {
      throw error;
    }

    const users =
      data?.users || [];

    const found =
      users.find(
        (user) =>
          normalizeEmail(
            user.email
          ) ===
          normalizedEmail
      );

    if (found) {
      return found;
    }

    if (
      users.length <
      1000
    ) {
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

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>
TimberMart Verification
</title>

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
">
🌳
</div>

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
Connecting the timber community
</p>

</div>

<div style="
padding:35px 30px;
">

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
Hello ${escapeHtml(
    name
  )},
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
This code is valid for
<strong>10 minutes</strong>.
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

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>
TimberMart Password Reset
</title>

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
">
🔐
</div>

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

<div style="
padding:35px 30px;
">

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
This code is valid for
<strong>10 minutes</strong>.
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
// HEALTH
// ============================================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,

      message:
        "TimberMart API is running",

      resendConfigured:
        Boolean(resend),

      supabaseConfigured:
        Boolean(
          supabaseAdmin
        ),

      razorpayConfigured:
        Boolean(
          razorpay
        ),
    });
  }
);

// ============================================================
// SEND ACCOUNT OTP
// POST /api/email/send-code
// ============================================================

app.post(
  "/api/email/send-code",

  otpSendLimiter,

  validateBody(
    emailSendSchema
  ),

  async (
    req,
    res
  ) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      const name =
        String(
          req.body?.name ||
            ""
        ).trim() ||
        "TimberMart User";

      if (!email) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Gmail address is required.",
          });
      }

      if (!isGmail(email)) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Please use a Gmail address ending with @gmail.com.",
          });
      }

      if (!resend) {
        return res
          .status(500)
          .json({
            success: false,

            message:
              "RESEND_API_KEY is missing in Netlify environment variables.",
          });
      }

      const existing =
        emailOtpStore.get(
          email
        );

      if (
        existing &&
        !isExpired(existing)
      ) {
        return res
          .status(429)
          .json({
            success: false,

            message:
              "A verification code was already sent. Please check your email.",
          });
      }

      const otp =
        generateOTP();

      const otpHash =
        hashOTP(
          email,
          otp
        );

      const expiresAt =
        Date.now() +
        10 * 60 * 1000;

      emailOtpStore.set(
        email,
        {
          hash:
            otpHash,

          otpHash:
            otpHash,

          expiresAt,

          attempts:
            0,

          name,

          lastSentAt:
            Date.now(),
        }
      );

      const html =
        createVerificationEmail(
          {
            name,
            otp,
          }
        );

      const {
        data,
        error,
      } =
        await resend.emails.send(
          {
            from:
              RESEND_FROM,

            to: [email],

            subject:
              `${otp} is your TimberMart verification code`,

            html,
          }
        );

      if (error) {
        emailOtpStore.delete(
          email
        );

        console.error(
          "Resend send error:",
          error
        );

        return res
          .status(500)
          .json({
            success: false,

            message:
              "Unable to send verification email. Please try again later.",
          });
      }

      console.log(
        "ACCOUNT OTP SENT:",
        email,
        "Resend ID:",
        data?.id ||
          "N/A"
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

      return res
        .status(500)
        .json({
          success: false,

          message:
            safeError(error),
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
  otpVerifyLimiter,
  validateBody(emailVerifySchema),
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
        message:
          safeError(error),
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
  otpSendLimiter,
  validateBody(emailResendSchema),
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

      emailOtpStore.set(email, {
        otpHash:
          hashOTP(
            email,
            otp
          ),

        expiresAt:
          Date.now() +
          10 * 60 * 1000,

        attempts: 0,

        lastSentAt:
          Date.now(),
      });

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
          from:
            RESEND_FROM,

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
          "Resend OTP email error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to resend verification code. Please try again later.",
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
        message:
          safeError(error),
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
  passwordResetLimiter,
  validateBody(
    passwordResetSendSchema
  ),
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

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

      const existing =
        passwordOtpStore.get(
          email
        );

      if (
        existing?.lastSentAt &&
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

      passwordOtpStore.set(
        email,
        {
          otpHash:
            hashOTP(
              email,
              otp
            ),

          expiresAt:
            Date.now() +
            10 * 60 * 1000,

          attempts: 0,

          lastSentAt:
            Date.now(),

          verified:
            false,
        }
      );

      const html =
        createPasswordResetEmail({
          otp,
        });

      const {
        data,
        error,
      } =
        await resend.emails.send({
          from:
            RESEND_FROM,

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
          "Password reset email error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send password reset code. Please try again later.",
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
        message:
          safeError(error),
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
  otpVerifyLimiter,
  validateBody(
    passwordVerifySchema
  ),
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

      if (isExpired(record)) {
        passwordOtpStore.delete(
          email
        );

        return res.status(400).json({
          success: false,
          message:
            "Password reset code expired. Please request a new code.",
        });
      }

      if (record.attempts >= 5) {
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

      record.verified =
        true;

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
        message:
          safeError(error),
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
  otpVerifyLimiter,
  validateBody(
    passwordChangeSchema
  ),
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

      if (isExpired(record)) {
        passwordOtpStore.delete(
          email
        );

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

      const {
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
          "Password update error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to update password. Please try again later.",
        });
      }

      passwordOtpStore.delete(
        email
      );

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
        message:
          safeError(error),
      });
    }
  }
);

// ============================================================
// RAZORPAY CONFIGURATION CHECK
// ============================================================

function ensureRazorpay(
  res
) {
  if (!razorpay) {
    res.status(500).json({
      success: false,
      message:
        "Razorpay configuration is missing.",
    });

    return false;
  }

  return true;
}

// ============================================================
// PREMIUM PLAN HELPER
// ============================================================

function getPlan(
  planId
) {
  return (
    PLAN_DETAILS[
      planId
    ] || null
  );
}

// ============================================================
// CREATE RAZORPAY ORDER
// POST /api/payment/create-order
// ============================================================

app.post(
  "/api/payment/create-order",
  paymentCreateLimiter,
  validateBody(
    paymentCreateOrderSchema
  ),
  async (req, res) => {
    try {
      if (
        !ensureRazorpay(res)
      ) {
        return;
      }

      const user =
        await getAuthenticatedUser(
          req
        );

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Please login before starting payment.",
        });
      }

      const {
        planId,
      } = req.body;

      const plan =
        getPlan(planId);

      if (!plan) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Premium plan.",
        });
      }

      const amount =
        Math.round(
          plan.amount * 100
        );

      const receipt =
        `tm_${user.id.slice(
          0,
          8
        )}_${Date.now()}`;

      const order =
        await razorpay.orders.create(
          {
            amount,

            currency:
              "INR",

            receipt,

            notes: {
              userId:
                user.id,

              userEmail:
                user.email ||
                "",

              planId,
            },
          }
        );

      console.log(
        "=========================================="
      );

      console.log(
        "RAZORPAY ORDER CREATED"
      );

      console.log(
        "Order:",
        order.id
      );

      console.log(
        "User:",
        user.id
      );

      console.log(
        "Plan:",
        planId
      );

      console.log(
        "Amount:",
        plan.amount
      );

      console.log(
        "=========================================="
      );

      return res.json({
        success: true,

        orderId:
          order.id,

        amount:
          order.amount,

        currency:
          order.currency,

        keyId:
          RAZORPAY_KEY_ID,

        planId,

        planName:
          plan.name,
      });
    } catch (error) {
      console.error(
        "Create Razorpay order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          safeError(error),
      });
    }
  }
);


// ============================================================
// RAZORPAY VERIFY PAYMENT + PREMIUM ACTIVATION
// POST /api/payment/verify
// ============================================================

app.post(
  "/api/payment/verify",
  paymentVerifyLimiter,
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // 1. PAYMENT DETAILS
      // --------------------------------------------------------

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body || {};

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
      // 2. CHECK CONFIGURATION
      // --------------------------------------------------------

      if (!razorpay) {
        return res.status(500).json({
          success: false,
          verified: false,
          activated: false,
          message:
            "Razorpay configuration is missing.",
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

      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          verified: false,
          activated: false,
          message:
            "Supabase Admin configuration is missing.",
        });
      }

      // --------------------------------------------------------
      // 3. AUTHENTICATE LOGGED-IN USER
      // --------------------------------------------------------

      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res.status(401).json({
          success: false,
          verified: false,
          activated: false,
          message:
            "Login session is missing or expired. Please login again.",
        });
      }

      const userId =
        user.id;

      // --------------------------------------------------------
      // 4. VERIFY RAZORPAY SIGNATURE
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
          String(
            razorpay_signature
          ),
          "utf8"
        );

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
        "Razorpay signature verified:",
        razorpay_payment_id
      );

      // --------------------------------------------------------
      // 5. FETCH RAZORPAY ORDER
      // --------------------------------------------------------

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

      if (!razorpayOrder) {
        return res.status(400).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Razorpay order not found.",
        });
      }

      // --------------------------------------------------------
      // 6. GET PLAN FROM RAZORPAY ORDER NOTES
      // --------------------------------------------------------

      const planId =
        String(
          razorpayOrder?.notes?.plan_id ||
          req.body?.planId ||
          ""
        ).trim();

      const plan =
        PLAN_DETAILS[planId];

      if (!plan) {
        return res.status(400).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Premium plan information could not be identified.",
        });
      }

      // --------------------------------------------------------
      // 7. VERIFY USER AGAINST ORDER
      // --------------------------------------------------------

      const orderUserId =
        String(
          razorpayOrder?.notes?.user_id ||
          ""
        ).trim();

      if (
        orderUserId &&
        orderUserId !== userId
      ) {
        console.error(
          "Payment user mismatch:",
          {
            orderUserId,
            userId,
          }
        );

        return res.status(403).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "This payment does not belong to the logged-in account.",
        });
      }

      // --------------------------------------------------------
      // 8. VERIFY ORDER AMOUNT
      // --------------------------------------------------------

      const expectedAmount =
        Math.round(
          plan.amount * 100
        );

      const actualOrderAmount =
        Number(
          razorpayOrder.amount
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
      // 9. VERIFY CURRENCY
      // --------------------------------------------------------

      if (
        razorpayOrder.currency !==
        "INR"
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
      // 10. FETCH PAYMENT FROM RAZORPAY
      // --------------------------------------------------------

      let razorpayPayment;

      try {
        razorpayPayment =
          await razorpay.payments.fetch(
            razorpay_payment_id
          );
      } catch (paymentError) {
        console.error(
          "Razorpay payment fetch error:",
          paymentError
        );

        return res.status(500).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Payment verified, but payment status could not be confirmed.",
        });
      }

      // --------------------------------------------------------
      // 11. VERIFY PAYMENT STATUS
      // --------------------------------------------------------

      if (
        razorpayPayment?.status !==
        "captured"
      ) {
        console.error(
          "Payment not captured:",
          razorpayPayment?.status
        );

        return res.status(400).json({
          success: false,
          verified: true,
          activated: false,
          message:
            `Payment is not captured. Current status: ${razorpayPayment?.status || "unknown"}.`,
        });
      }

      // --------------------------------------------------------
      // 12. VERIFY PAYMENT AMOUNT
      // --------------------------------------------------------

      const paymentAmount =
        Number(
          razorpayPayment?.amount
        );

      if (
        paymentAmount !==
        expectedAmount
      ) {
        console.error(
          "Payment captured amount mismatch:",
          {
            expectedAmount,
            paymentAmount,
          }
        );

        return res.status(400).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Captured payment amount does not match the Premium plan.",
        });
      }

      // --------------------------------------------------------
      // 13. CHECK DUPLICATE PAYMENT
      // --------------------------------------------------------

      const {
        data: existingPayment,
        error:
          existingPaymentError,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .select(
            "id,user_id,plan_code,plan_id,plan_name,amount,status,started_at,expires_at,payment_id,order_id,created_at,updated_at"
          )
          .eq(
            "payment_id",
            razorpay_payment_id
          )
          .maybeSingle();

      if (
        existingPaymentError
      ) {
        console.warn(
          "Existing payment lookup warning:",
          existingPaymentError.message
        );
      }

      if (
        existingPayment
      ) {
        // Security check
        if (
          existingPayment.user_id !==
          userId
        ) {
          return res.status(403).json({
            success: false,
            verified: true,
            activated: false,
            message:
              "This payment belongs to another account.",
          });
        }

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
      // 14. CALCULATE SUBSCRIPTION DATES
      // --------------------------------------------------------

      const startedAt =
        new Date();

      const expiresAt =
        new Date(
          startedAt
        );

      expiresAt.setMonth(
        expiresAt.getMonth() +
          plan.months
      );

      // --------------------------------------------------------
      // 15. EXPIRE OLD ACTIVE SUBSCRIPTIONS
      // --------------------------------------------------------

      const {
        error:
          deactivateError,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .update({
            status:
              "expired",

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "user_id",
            userId
          )
          .eq(
            "status",
            "active"
          );

      if (
        deactivateError
      ) {
        console.warn(
          "Previous subscription could not be expired:",
          deactivateError.message
        );
      }

      // --------------------------------------------------------
      // 16. INSERT NEW SUBSCRIPTION
      // --------------------------------------------------------

      const now =
        new Date();

      const {
        data: subscription,
        error:
          subscriptionError,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .insert({
            user_id:
              userId,

            // REQUIRED COLUMN
            plan_code:
              planId,

            plan_id:
              planId,

            plan_name:
              plan.name,

            amount:
              plan.amount,

            status:
              "active",

            started_at:
              startedAt.toISOString(),

            expires_at:
              expiresAt.toISOString(),

            payment_id:
              razorpay_payment_id,

            order_id:
              razorpay_order_id,

            // REQUIRED COLUMN
            created_at:
              now.toISOString(),

            // REQUIRED COLUMN
            updated_at:
              now.toISOString(),
          })
          .select(
            "id,user_id,plan_code,plan_id,plan_name,amount,status,started_at,expires_at,payment_id,order_id,created_at,updated_at"
          )
          .single();

      // --------------------------------------------------------
      // 17. DATABASE ERROR
      // --------------------------------------------------------

      if (
        subscriptionError
      ) {
        console.error(
          "=========================================="
        );

        console.error(
          "PREMIUM DATABASE INSERT ERROR"
        );

        console.error(
          "Message:",
          subscriptionError.message
        );

        console.error(
          "Details:",
          subscriptionError.details
        );

        console.error(
          "Hint:",
          subscriptionError.hint
        );

        console.error(
          "Code:",
          subscriptionError.code
        );

        console.error(
          "=========================================="
        );

        return res.status(500).json({
          success: false,
          verified: true,
          activated: false,
          message:
            "Payment was verified, but we could not activate Premium right now. Please contact TimberMart support.",
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
        "Subscription ID:",
        subscription?.id
      );

      console.log(
        "=========================================="
      );

      return res.json({
        success: true,

        verified: true,

        activated: true,

        alreadyActivated:
          false,

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
        "=========================================="
      );

      console.error(
        "RAZORPAY VERIFY ERROR:",
        error
      );

      console.error(
        "=========================================="
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
// PREMIUM PAYMENT RECOVERY
// POST /api/payment/recover
//
// Purpose:
// User already paid earlier, but subscription row was not
// created in Supabase. This route searches recent captured
// Razorpay payments and activates Premium if a matching payment
// belongs to the logged-in user's email.
// ============================================================

app.post(
  "/api/payment/recover",
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // 1. CHECK CONFIGURATION
      // --------------------------------------------------------

      if (!razorpay) {
        return res.status(500).json({
          success: false,
          activated: false,
          message:
            "Razorpay configuration is missing.",
        });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          activated: false,
          message:
            "Supabase Admin configuration is missing.",
        });
      }

      // --------------------------------------------------------
      // 2. AUTHENTICATE USER
      // --------------------------------------------------------

      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res.status(401).json({
          success: false,
          activated: false,
          message:
            "Login session is missing or expired. Please login again.",
        });
      }

      const userId =
        user.id;

      const userEmail =
        String(
          user.email || ""
        )
          .trim()
          .toLowerCase();

      if (!userEmail) {
        return res.status(400).json({
          success: false,
          activated: false,
          message:
            "Your account email could not be identified.",
        });
      }

      console.log(
        "Premium recovery requested:",
        {
          userId,
          userEmail,
        }
      );

      // --------------------------------------------------------
      // 3. GET RECENT RAZORPAY PAYMENTS
      // --------------------------------------------------------

      let paymentsResponse;

      try {
        paymentsResponse =
          await razorpay.payments.all({
            count: 100,
          });
      } catch (razorpayError) {
        console.error(
          "Razorpay recovery lookup error:",
          razorpayError
        );

        return res.status(500).json({
          success: false,
          activated: false,
          message:
            "Unable to check previous Razorpay payments.",
        });
      }

      const payments =
        Array.isArray(
          paymentsResponse?.items
        )
          ? paymentsResponse.items
          : [];

      // --------------------------------------------------------
      // 4. ALLOWED PREMIUM AMOUNTS
      // --------------------------------------------------------

      const premiumAmounts =
        new Set([
          19900,
          49900,
          149900,
        ]);

      // --------------------------------------------------------
      // 5. FIND MATCHING PAYMENT
      // --------------------------------------------------------

      const matchingPayments =
        payments
          .filter(
            (payment) => {
              const status =
                String(
                  payment?.status ||
                    ""
                ).toLowerCase();

              const paymentEmail =
                String(
                  payment?.email ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              const amount =
                Number(
                  payment?.amount
                );

              return (
                status ===
                  "captured" &&
                paymentEmail ===
                  userEmail &&
                premiumAmounts.has(
                  amount
                )
              );
            }
          )
          .sort(
            (a, b) =>
              Number(
                b?.created_at ||
                  0
              ) -
              Number(
                a?.created_at ||
                  0
              )
          );

      console.log(
        "Matching Premium payments found:",
        matchingPayments.length
      );

      if (
        matchingPayments.length ===
        0
      ) {
        return res.json({
          success: true,
          activated: false,
          message:
            "No previous Premium payment was found for this account.",
        });
      }

      // --------------------------------------------------------
      // 6. TRY MATCHING PAYMENTS ONE BY ONE
      // --------------------------------------------------------

      for (
        const payment of matchingPayments
      ) {
        const paymentId =
          payment?.id;

        if (!paymentId) {
          continue;
        }

        // ------------------------------------------------------
        // CHECK WHETHER PAYMENT IS ALREADY IN SUBSCRIPTIONS
        // ------------------------------------------------------

        const {
          data:
            existingSubscription,
          error:
            existingSubscriptionError,
        } =
          await supabaseAdmin
            .from(
              "user_subscriptions"
            )
            .select(
              "id,user_id,plan_code,plan_id,plan_name,amount,status,started_at,expires_at,payment_id,order_id,created_at,updated_at"
            )
            .eq(
              "payment_id",
              paymentId
            )
            .maybeSingle();

        if (
          existingSubscriptionError
        ) {
          console.warn(
            "Recovery subscription lookup warning:",
            existingSubscriptionError.message
          );
        }

        if (
          existingSubscription
        ) {
          // Never activate another user's payment.
          if (
            existingSubscription.user_id ===
            userId
          ) {
            return res.json({
              success: true,
              activated: true,
              alreadyActivated: true,
              message:
                "Your Premium payment was already activated.",
              paymentId:
                paymentId,
              subscription:
                existingSubscription,
            });
          }

          // Payment belongs to another account.
          continue;
        }

        // ------------------------------------------------------
        // 7. DETERMINE PLAN FROM PAYMENT AMOUNT
        // ------------------------------------------------------

        let planId = "";

        if (
          Number(
            payment.amount
          ) === 19900
        ) {
          planId =
            "premium_monthly";
        } else if (
          Number(
            payment.amount
          ) === 49900
        ) {
          planId =
            "premium_3_months";
        } else if (
          Number(
            payment.amount
          ) === 149900
        ) {
          planId =
            "premium_yearly";
        }

        const plan =
          PLAN_DETAILS[
            planId
          ];

        if (!plan) {
          continue;
        }

        // ------------------------------------------------------
        // 8. GET ORDER ID
        // ------------------------------------------------------

        const orderId =
          payment?.order_id ||
          null;

        // ------------------------------------------------------
        // 9. CALCULATE SUBSCRIPTION DATES
        // ------------------------------------------------------

        const startedAt =
          new Date();

        const expiresAt =
          new Date(
            startedAt
          );

        expiresAt.setMonth(
          expiresAt.getMonth() +
            plan.months
        );

        const now =
          new Date();

        // ------------------------------------------------------
        // 10. EXPIRE OLD ACTIVE SUBSCRIPTIONS
        // ------------------------------------------------------

        const {
          error:
            deactivateError,
        } =
          await supabaseAdmin
            .from(
              "user_subscriptions"
            )
            .update({
              status:
                "expired",

              updated_at:
                now.toISOString(),
            })
            .eq(
              "user_id",
              userId
            )
            .eq(
              "status",
              "active"
            );

        if (
          deactivateError
        ) {
          console.warn(
            "Recovery: previous subscription could not be expired:",
            deactivateError.message
          );
        }

        // ------------------------------------------------------
        // 11. INSERT RECOVERED PREMIUM SUBSCRIPTION
        // ------------------------------------------------------

        const {
          data: subscription,
          error:
            subscriptionError,
        } =
          await supabaseAdmin
            .from(
              "user_subscriptions"
            )
            .insert({
              user_id:
                userId,

              // Required DB column
              plan_code:
                planId,

              plan_id:
                planId,

              plan_name:
                plan.name,

              amount:
                plan.amount,

              status:
                "active",

              started_at:
                startedAt.toISOString(),

              expires_at:
                expiresAt.toISOString(),

              payment_id:
                paymentId,

              order_id:
                orderId,

              // Required DB column
              created_at:
                now.toISOString(),

              // Required DB column
              updated_at:
                now.toISOString(),
            })
            .select(
              "id,user_id,plan_code,plan_id,plan_name,amount,status,started_at,expires_at,payment_id,order_id,created_at,updated_at"
            )
            .single();

        // ------------------------------------------------------
        // 12. DATABASE INSERT ERROR
        // ------------------------------------------------------

        if (
          subscriptionError
        ) {
          console.error(
            "=========================================="
          );

          console.error(
            "PREMIUM RECOVERY DATABASE ERROR"
          );

          console.error(
            "Message:",
            subscriptionError.message
          );

          console.error(
            "Details:",
            subscriptionError.details
          );

          console.error(
            "Hint:",
            subscriptionError.hint
          );

          console.error(
            "Code:",
            subscriptionError.code
          );

          console.error(
            "=========================================="
          );

          return res.status(500).json({
            success: false,
            verified: true,
            activated: false,
            message:
              "Previous payment was found, but Premium could not be activated right now. Please contact TimberMart support.",
          });
        }

        // ------------------------------------------------------
        // 13. RECOVERY SUCCESS
        // ------------------------------------------------------

        console.log(
          "=========================================="
        );

        console.log(
          "PREVIOUS PREMIUM PAYMENT RECOVERED"
        );

        console.log(
          "User:",
          userId
        );

        console.log(
          "Email:",
          userEmail
        );

        console.log(
          "Plan:",
          plan.name
        );

        console.log(
          "Payment:",
          paymentId
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

          activated: true,

          alreadyActivated:
            false,

          message:
            "Your previous Premium payment was found and Premium has been activated successfully.",

          paymentId:
            paymentId,

          orderId:
            orderId,

          planId:
            planId,

          planName:
            plan.name,

          amount:
            plan.amount,

          subscription:
            subscription,
        });
      }

      // --------------------------------------------------------
      // 14. NO USABLE PAYMENT
      // --------------------------------------------------------

      return res.json({
        success: true,
        activated: false,
        message:
          "No unused Premium payment could be recovered for this account.",
      });
    } catch (error) {
      console.error(
        "Premium recovery error:",
        error
      );

      return res.status(500).json({
        success: false,
        activated: false,
        message:
          error?.message ||
          "Unable to recover previous Premium payment.",
      });
    }
  }
);

// ============================================================
// API 404 HANDLER
// ============================================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        `API route not found: ${req.method} ${req.originalUrl}`,
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
      "GLOBAL API ERROR:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res.status(
      error?.status ||
        500
    ).json({
      success: false,
      message:
        error?.message ||
        "Internal server error.",
    });
  }
);

// ============================================================
// VERCEL SERVERLESS HANDLER
// ============================================================

export default app;

// ============================================================
// PART 4 END
// ============================================================
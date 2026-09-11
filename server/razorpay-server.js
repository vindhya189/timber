import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

// =====================================================
// ENV
// =====================================================

dotenv.config({
  path: ".env.local",
});

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

const PORT =
  process.env.PORT || 5000;

const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID;

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// =====================================================
// ENV VALIDATION
// =====================================================

if (
  !RAZORPAY_KEY_ID ||
  !RAZORPAY_KEY_SECRET
) {
  console.error(
    "❌ Razorpay keys are missing in .env.local"
  );
}

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "❌ Supabase backend credentials are missing in .env.local"
  );
}

// =====================================================
// RAZORPAY
// =====================================================

const razorpay =
  new Razorpay({
    key_id:
      RAZORPAY_KEY_ID,

    key_secret:
      RAZORPAY_KEY_SECRET,
  });

// =====================================================
// SUPABASE ADMIN
// =====================================================

const supabaseAdmin =
  createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

// =====================================================
// PREMIUM PLANS
// =====================================================

const PLANS = {
  premium_monthly: {
    title: "Premium Monthly",
    amount: 19900, // ₹199
    durationMonths: 1,
  },

  premium_3_months: {
    title: "Premium 3 Months",
    amount: 49900, // ₹499
    durationMonths: 3,
  },

  premium_yearly: {
    title: "Premium Yearly",
    amount: 149900, // ₹1499
    durationMonths: 12,
  },
};

// =====================================================
// SAFE MONTH CALCULATION
// =====================================================

function addMonthsClamped(
  date,
  months
) {
  const result =
    new Date(date);

  const originalDay =
    result.getDate();

  result.setDate(1);

  result.setMonth(
    result.getMonth() +
      Number(months || 0)
  );

  const lastDay =
    new Date(
      result.getFullYear(),
      result.getMonth() + 1,
      0
    ).getDate();

  result.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );

  return result;
}

// =====================================================
// BEARER TOKEN
// =====================================================

function getBearerToken(req) {
  const header =
    req.headers.authorization || "";

  if (
    !header.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  return header
    .slice("Bearer ".length)
    .trim() || null;
}

// =====================================================
// AUTH USER
// =====================================================

async function requireUser(
  req,
  res
) {
  const token =
    getBearerToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message:
        "Authentication is required.",
    });

    return null;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.auth.getUser(
      token
    );

  if (
    error ||
    !data?.user
  ) {
    res.status(401).json({
      success: false,
      message:
        "Your login session is invalid or expired.",
    });

    return null;
  }

  return data.user;
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/",
  (_req, res) => {
    res.json({
      success: true,
      message:
        "TimberMart Razorpay server is running",
    });
  }
);

// =====================================================
// CREATE ORDER
// =====================================================

app.post(
  "/api/payments/create-order",
  async (req, res) => {
    try {
      const user =
        await requireUser(
          req,
          res
        );

      if (!user) return;

      const {
        planId,
      } = req.body || {};

      const plan =
        PLANS[planId];

      if (!plan) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid premium plan.",
          });
      }

      // -----------------------------------------------
      // Prevent accidental duplicate active subscription
      // -----------------------------------------------

      const {
        data:
          existingActive,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .select(
            "id,plan_id,plan_name,status,expires_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "status",
            "active"
          )
          .gt(
            "expires_at",
            new Date().toISOString()
          )
          .maybeSingle();

      if (
        existingActive
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "You already have an active Premium subscription.",
            subscription:
              existingActive,
          });
      }

      // -----------------------------------------------
      // Create Razorpay order
      // -----------------------------------------------

      const order =
        await razorpay.orders.create(
          {
            amount:
              plan.amount,

            currency:
              "INR",

            receipt:
              `tm_${Date.now()}`,

            notes: {
              plan_id:
                planId,

              user_id:
                user.id,

              product:
                "TimberMart Premium",
            },
          }
        );

      console.log(
        `✅ Order ${order.id} created for ${user.id}`
      );

      return res
        .status(200)
        .json({
          success: true,

          keyId:
            RAZORPAY_KEY_ID,

          order: {
            id:
              order.id,

            amount:
              order.amount,

            currency:
              order.currency,
          },

          plan: {
            id:
              planId,

            title:
              plan.title,

            amount:
              plan.amount,

            durationMonths:
              plan.durationMonths,
          },

          customer: {
            name:
              user.user_metadata
                ?.full_name ||
              user.user_metadata
                ?.name ||
              "",

            email:
              user.email || "",

            phone:
              user.phone ||
              user.user_metadata
                ?.phone ||
              "",
          },
        });

    } catch (error) {
      console.error(
        "❌ Create order error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error?.error
              ?.description ||
            error?.message ||
            "Unable to create payment order.",
        });
    }
  }
);

// =====================================================
// VERIFY PAYMENT + ACTIVATE PREMIUM
// =====================================================

app.post(
  "/api/payments/verify",
  async (req, res) => {
    try {
      const user =
        await requireUser(
          req,
          res
        );

      if (!user) return;

      const {
        planId,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      } = req.body || {};

      // -----------------------------------------------
      // Validate request
      // -----------------------------------------------

      if (
        !planId ||
        !razorpayPaymentId ||
        !razorpayOrderId ||
        !razorpaySignature
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Incomplete payment verification data.",
          });
      }

      const plan =
        PLANS[planId];

      if (!plan) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid premium plan.",
          });
      }

      // -----------------------------------------------
      // Fetch Razorpay order
      // -----------------------------------------------

      const order =
        await razorpay.orders.fetch(
          razorpayOrderId
        );

      const orderPlanId =
        order?.notes
          ?.plan_id;

      const orderUserId =
        order?.notes
          ?.user_id;

      // -----------------------------------------------
      // Verify order belongs to user
      // -----------------------------------------------

      if (
        orderUserId !==
          user.id ||
        orderPlanId !==
          planId
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Payment order does not match this account or plan.",
          });
      }

      // -----------------------------------------------
      // Verify amount/currency
      // -----------------------------------------------

      if (
        Number(
          order.amount
        ) !==
          Number(
            plan.amount
          ) ||
        order.currency !==
          "INR"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Payment amount validation failed.",
          });
      }

      // -----------------------------------------------
      // Verify HMAC signature
      // -----------------------------------------------

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            RAZORPAY_KEY_SECRET
          )
          .update(
            `${razorpayOrderId}|${razorpayPaymentId}`
          )
          .digest("hex");

      const expectedBuffer =
        Buffer.from(
          expectedSignature,
          "utf8"
        );

      const receivedBuffer =
        Buffer.from(
          razorpaySignature,
          "utf8"
        );

      if (
        expectedBuffer.length !==
          receivedBuffer.length ||
        !crypto.timingSafeEqual(
          expectedBuffer,
          receivedBuffer
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid payment signature.",
          });
      }

      // -----------------------------------------------
      // Fetch payment directly from Razorpay
      // -----------------------------------------------

      const payment =
        await razorpay.payments.fetch(
          razorpayPaymentId
        );

      if (
        payment.order_id !==
        razorpayOrderId
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Payment and order do not match.",
          });
      }

      // -----------------------------------------------
      // Payment must be captured/authorized
      // -----------------------------------------------

      if (
        payment.status !==
          "captured" &&
        payment.status !==
          "authorized"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `Payment status is ${
                payment.status ||
                "unknown"
              }.`,
          });
      }

      // ===============================================
      // IDEMPOTENCY
      // ===============================================

      const {
        data:
          existingPayment,
        error:
          existingPaymentError,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .select("*")
          .eq(
            "payment_id",
            razorpayPaymentId
          )
          .maybeSingle();

      if (
        existingPaymentError
      ) {
        console.error(
          "❌ Existing payment lookup error:",
          existingPaymentError
        );
      }

      if (
        existingPayment
      ) {
        return res
          .status(200)
          .json({
            success: true,

            message:
              "Payment already verified and Premium is active.",

            subscription:
              existingPayment,
          });
      }

      // ===============================================
      // EXPIRE OLD EXPIRED ROWS
      // ===============================================

      const nowIso =
        new Date().toISOString();

      const {
        error:
          expireError,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .update({
            status:
              "expired",

            updated_at:
              nowIso,
          })
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "status",
            "active"
          )
          .lte(
            "expires_at",
            nowIso
          );

      if (
        expireError
      ) {
        console.warn(
          "⚠️ Expired subscription cleanup warning:",
          expireError
        );
      }

      // ===============================================
      // CHECK CURRENT ACTIVE PLAN
      // ===============================================

      const {
        data:
          activeSubscription,
        error:
          activeSubscriptionError,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .select(
            "id,plan_id,plan_name,status,started_at,expires_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "status",
            "active"
          )
          .gt(
            "expires_at",
            nowIso
          )
          .order(
            "expires_at",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (
        activeSubscriptionError
      ) {
        console.error(
          "❌ Active subscription lookup error:",
          activeSubscriptionError
        );

        return res
          .status(500)
          .json({
            success: false,

            message:
              "Unable to check your current Premium status.",

            supabaseError:
              activeSubscriptionError,
          });
      }

      if (
        activeSubscription
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Your account already has an active Premium subscription.",

            subscription:
              activeSubscription,
          });
      }

      // ===============================================
      // CALCULATE START + EXPIRY
      // ===============================================

      const startedAt =
        new Date();

      const expiresAt =
        addMonthsClamped(
          startedAt,
          plan.durationMonths
        );

      // ===============================================
      // INSERT PREMIUM SUBSCRIPTION
      // ===============================================

      const {
        data:
          subscription,
        error:
          subscriptionError,
      } =
        await supabaseAdmin
          .from(
            "user_subscriptions"
          )
          .insert({
            user_id:
              user.id,

            plan_id:
              planId,

            plan_name:
              plan.title,

            amount:
              plan.amount / 100,

            payment_id:
              razorpayPaymentId,

            order_id:
              razorpayOrderId,

            status:
              "active",

            started_at:
              startedAt.toISOString(),

            expires_at:
              expiresAt.toISOString(),

            created_at:
              startedAt.toISOString(),

            updated_at:
              startedAt.toISOString(),
          })
          .select()
          .single();

      if (
        subscriptionError
      ) {
        console.error(
          "❌ SUPABASE INSERT ERROR:",
          subscriptionError
        );

        return res
          .status(500)
          .json({
            success: false,

            message:
              "Payment verified, but Premium activation failed.",

            supabaseError: {
              code:
                subscriptionError.code ||
                null,

              message:
                subscriptionError.message ||
                null,

              details:
                subscriptionError.details ||
                null,

              hint:
                subscriptionError.hint ||
                null,
            },
          });
      }

      // ===============================================
      // SUCCESS
      // ===============================================

      console.log(
        `✅ Premium activated for ${user.id}: ${planId}`
      );

      console.log(
        `✅ Premium expires at: ${expiresAt.toISOString()}`
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Payment verified and Premium activated.",

          subscription,

          premium: {
            active:
              true,

            planId:
              planId,

            planName:
              plan.title,

            expiresAt:
              expiresAt.toISOString(),
          },

          payment: {
            paymentId:
              razorpayPaymentId,

            orderId:
              razorpayOrderId,

            status:
              payment.status,
          },
        });

    } catch (error) {
      console.error(
        "❌ Verify payment error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error?.error
              ?.description ||
            error?.message ||
            "Payment verification failed.",
        });
    }
  }
);

// =====================================================
// SERVER
// =====================================================

app.listen(
  PORT,
  () => {
    console.log(
      "=========================================="
    );

    console.log(
      " TimberMart Razorpay Server"
    );

    console.log(
      "=========================================="
    );

    console.log(
      ` http://localhost:${PORT}`
    );

    console.log(
      "=========================================="
    );
  }
);
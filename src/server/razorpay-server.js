import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import Razorpay from "razorpay";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("❌ Razorpay keys missing in .env file");
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/* =========================================================
   PREMIUM PLANS
   Amount is in paise
   ₹199  = 19900
   ₹499  = 49900
   ₹1499 = 149900
========================================================= */

const PLANS = {
  premium_monthly: {
    title: "Premium Monthly",
    amount: 19900,
    durationMonths: 1,
  },

  premium_3_months: {
    title: "Premium 3 Months",
    amount: 49900,
    durationMonths: 3,
  },

  premium_yearly: {
    title: "Premium Yearly",
    amount: 149900,
    durationMonths: 12,
  },
};

/* =========================================================
   TEST API
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TimberMart Razorpay server is running",
  });
});

/* =========================================================
   CREATE RAZORPAY ORDER
========================================================= */

app.post("/api/payments/create-order", async (req, res) => {
  try {
    const { planId } = req.body || {};

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required",
      });
    }

    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid premium plan",
      });
    }

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: "INR",
      receipt: `tm_${Date.now()}`,
      notes: {
        plan_id: planId,
        product: "TimberMart Premium",
      },
    });

    console.log("✅ Razorpay order created:", order.id);

    return res.status(200).json({
      success: true,

      keyId: RAZORPAY_KEY_ID,

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },

      plan: {
        id: planId,
        title: plan.title,
        amount: plan.amount,
        durationMonths: plan.durationMonths,
      },
    });
  } catch (error) {
    console.error("❌ Create order error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.message ||
        "Unable to create Razorpay order",
    });
  }
});

/* =========================================================
   VERIFY PAYMENT
========================================================= */

app.post("/api/payments/verify", async (req, res) => {
  try {
    const {
      planId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body || {};

    if (
      !planId ||
      !razorpayPaymentId ||
      !razorpayOrderId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete payment verification data",
      });
    }

    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid premium plan",
      });
    }

    /* -------------------------------------------------------
       Razorpay signature verification
    ------------------------------------------------------- */

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const signatureValid =
      generatedSignature === razorpaySignature;

    if (!signatureValid) {
      console.error("❌ Invalid Razorpay signature");

      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    console.log("✅ Payment signature verified");

    /* -------------------------------------------------------
       IMPORTANT

       Payment is genuine here.

       NEXT STEP:
       Update Supabase user_subscriptions table here.

       Example fields:
       user_id
       plan_id
       razorpay_order_id
       razorpay_payment_id
       status
       starts_at
       expires_at
    ------------------------------------------------------- */

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",

      payment: {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        planId,
        planTitle: plan.title,
        durationMonths: plan.durationMonths,
      },
    });
  } catch (error) {
    console.error("❌ Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log(" TimberMart Razorpay Server");
  console.log("==========================================");
  console.log(` Server running on port ${PORT}`);
  console.log(` http://localhost:${PORT}`);
  console.log("==========================================");
  console.log("");
});
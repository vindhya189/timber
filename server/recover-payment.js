import dotenv from "dotenv";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const PAYMENT_ID = "pay_TZpbAhITIP3qE8";
const ORDER_ID = "order_TZpYHjyGxGDJls";

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

async function recoverPayment() {
  try {
    console.log("==========================================");
    console.log(" TimberMart Premium Payment Recovery");
    console.log("==========================================");

    // 1. Fetch Razorpay order
    const order =
      await razorpay.orders.fetch(ORDER_ID);

    console.log("✅ Order fetched:", order.id);

    // 2. Fetch Razorpay payment
    const payment =
      await razorpay.payments.fetch(PAYMENT_ID);

    console.log("✅ Payment fetched:", payment.id);
    console.log("Payment status:", payment.status);

    // 3. Check order/payment match
    if (payment.order_id !== ORDER_ID) {
      throw new Error(
        "Payment does not belong to this order."
      );
    }

    // 4. Check payment status
    if (
      payment.status !== "captured" &&
      payment.status !== "authorized"
    ) {
      throw new Error(
        `Payment is not captured. Current status: ${payment.status}`
      );
    }

    // 5. Get user + plan from Razorpay order notes
    const userId =
      order?.notes?.user_id;

    const planId =
      order?.notes?.plan_id;

    console.log("User ID:", userId);
    console.log("Plan ID:", planId);

    if (!userId) {
      throw new Error(
        "user_id is missing from Razorpay order notes."
      );
    }

    if (!planId) {
      throw new Error(
        "plan_id is missing from Razorpay order notes."
      );
    }

    const plan = PLANS[planId];

    if (!plan) {
      throw new Error(
        `Unknown plan: ${planId}`
      );
    }

    // 6. Check amount
    if (Number(order.amount) !== Number(plan.amount)) {
      throw new Error(
        `Amount mismatch. Razorpay=${order.amount}, Expected=${plan.amount}`
      );
    }

    // 7. Check whether already activated
    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("payment_id", PAYMENT_ID)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      console.log(
        "✅ Premium already exists for this payment."
      );

      console.log(existing);
      return;
    }

    // 8. Expire already-expired subscriptions
    await supabase
      .from("user_subscriptions")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "active")
      .lte(
        "expires_at",
        new Date().toISOString()
      );

    // 9. Check active subscription
    const {
      data: activeSubscription,
      error: activeError,
    } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt(
        "expires_at",
        new Date().toISOString()
      )
      .maybeSingle();

    if (activeError) {
      throw activeError;
    }

    if (activeSubscription) {
      console.log(
        "⚠️ User already has an active Premium subscription."
      );
      console.log(activeSubscription);
      return;
    }

    // 10. Create subscription dates
    const startedAt = new Date();

    const expiresAt = new Date(startedAt);

    expiresAt.setMonth(
      expiresAt.getMonth() +
        plan.durationMonths
    );

    // 11. Insert Premium subscription
    const {
      data: subscription,
      error: insertError,
    } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_name: plan.title,
        amount: plan.amount / 100,
        payment_id: PAYMENT_ID,
        order_id: ORDER_ID,
        status: "active",
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "❌ Supabase insert error:",
        insertError
      );

      throw insertError;
    }

    console.log("");
    console.log(
      "🎉🎉🎉 PREMIUM ACTIVATED SUCCESSFULLY 🎉🎉🎉"
    );
    console.log("");
    console.log("User:", userId);
    console.log("Plan:", plan.title);
    console.log("Amount: ₹" + plan.amount / 100);
    console.log("Payment:", PAYMENT_ID);
    console.log("Order:", ORDER_ID);
    console.log(
      "Expires:",
      expiresAt.toISOString()
    );
    console.log("");
    console.log("Subscription row:");
    console.log(subscription);

  } catch (error) {
    console.error("");
    console.error("❌ RECOVERY FAILED");
    console.error("Message:", error?.message);
    console.error("Code:", error?.code || "");
    console.error("Details:", error?.details || "");
    console.error("Hint:", error?.hint || "");
  }
}

recoverPayment();
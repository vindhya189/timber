import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Crown,
  Gift,
  Headphones,
  Landmark,
  Leaf,
  QrCode,
  ShieldCheck,
  Star,
  Smartphone,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./PremiumPage.css";

const PLANS = [
  {
    id: "free",
    title: "Free",
    subtitle: "Get started with TimberMart",
    amount: 0,
    priceText: "₹0",
    suffix: "",
    oldPrice: "",
    saving: "",
    note: "Free Forever",
    popular: false,
    savings: false,
    features: [
      ["View only 5 user profiles/day", true],
      ["Basic search", true],
      ["Limited contact access", true],
      ["Basic filters", true],
      ["Normal listing visibility", true],
      ["Advanced filters", false],
      ["Priority leads", false],
      ["Profile insights", false],
    ],
  },
  {
    id: "premium_monthly",
    title: "Premium Monthly",
    subtitle: "For regular users",
    amount: 199,
    priceText: "₹199",
    suffix: "/ month",
    oldPrice: "",
    saving: "",
    note: "",
    features: [
      ["Unlimited user profiles", true],
      ["Advanced search & filters", true],
      ["Full contact access (Phone / WhatsApp)", true],
      ["Nearby users unlimited", true],
      ["Priority leads in your area", true],
      ["Higher profile visibility", true],
      ["Premium notifications", true],
      ["Lead insights & analytics", true],
    ],
  },
  {
    id: "premium_3_months",
    title: "Premium 3 Months",
    subtitle: "Best value for active users",
    amount: 499,
    priceText: "₹499",
    suffix: "",
    oldPrice: "₹597",
    saving: "Save ₹98 (16%)",
    note: "",
    popular: true,
    features: [
      ["Unlimited user profiles", true],
      ["Advanced search & filters", true],
      ["Full contact access (Phone / WhatsApp)", true],
      ["Nearby users unlimited", true],
      ["Priority leads in your area", true],
      ["Higher profile visibility", true],
      ["Premium notifications", true],
      ["Lead insights & analytics", true],
    ],
  },
  {
    id: "premium_yearly",
    title: "Premium Yearly",
    subtitle: "For serious growth",
    amount: 1499,
    priceText: "₹1,499",
    suffix: "",
    oldPrice: "₹2,388",
    saving: "Save ₹889 (37%)",
    note: "",
    savings: true,
    features: [
      ["Unlimited user profiles", true],
      ["Advanced search & filters", true],
      ["Full contact access (Phone / WhatsApp)", true],
      ["Nearby users unlimited", true],
      ["Priority leads in your area", true],
      ["Higher profile visibility", true],
      ["Premium notifications", true],
      ["Lead insights & analytics", true],
    ],
  },
];

const PAYMENT_METHODS = [
  {
    id: "upi",
    title: "UPI",
    subtitle: "Google Pay, PhonePe, Paytm & more",
    icon: QrCode,
  },
  {
    id: "card",
    title: "Card",
    subtitle: "Credit / Debit Card",
    icon: CreditCard,
  },
  {
    id: "netbanking",
    title: "Net Banking",
    subtitle: "Pay using your bank account",
    icon: Landmark,
  },
];

function Feature({ text, enabled }) {
  return (
    <li className={`tm-feature ${enabled ? "yes" : "no"}`}>
      <span className="tm-feature-icon">
        {enabled ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={2.6} />}
      </span>
      <span>{text}</span>
    </li>
  );
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PremiumPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const planId = searchParams.get("plan");
    if (!planId) return;

    const plan = PLANS.find(
      (item) => item.id === planId && item.amount > 0
    );

    if (plan) {
      setSelectedPlan(plan);
      setPaymentMethod("upi");
      setPaymentStatus("");
      setError("");
    }
  }, [searchParams]);

  useEffect(() => {
    document.body.classList.toggle("tm-premium-lock-scroll", !!selectedPlan);

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !paying) closePayment();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("tm-premium-lock-scroll");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedPlan, paying]);

  const openPayment = (plan) => {
    if (!plan || !plan.amount) return;

    setSelectedPlan(plan);
    setPaymentMethod("upi");
    setPaymentStatus("");
    setError("");

    // Keep URL state in sync so browser navigation works.
    setSearchParams({ plan: plan.id });
  };

  const closePayment = () => {
    if (paying) return;
    setSelectedPlan(null);
    setPaymentStatus("");
    setError("");
    setSearchParams({});
  };

  const startRealPayment = async () => {
    if (!selectedPlan || paying) return;

    setPaying(true);
    setPaymentStatus("");
    setError("");

    try {
      const scriptReady = await loadRazorpayScript();

      if (!scriptReady) {
        throw new Error("Payment gateway could not be loaded. Check your internet connection.");
      }

      // IMPORTANT:
      // Your backend must create the Razorpay order.
      // Never put RAZORPAY_KEY_SECRET in React/frontend code.
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
        }),
      });

      const orderJson = await orderResponse.json();

      if (!orderResponse.ok || !orderJson?.order?.id) {
        throw new Error(orderJson?.message || "Unable to create payment order.");
      }

      const customerName = orderJson?.customer?.name || "";
      const customerEmail = orderJson?.customer?.email || "";
      const customerPhone = orderJson?.customer?.phone || "";

      const options = {
        key: orderJson.keyId,
        amount: orderJson.order.amount,
        currency: orderJson.order.currency || "INR",
        name: "TimberMart",
        description: selectedPlan.title,
        order_id: orderJson.order.id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          plan_id: selectedPlan.id,
        },
        theme: {
          color: "#087343",
        },

        // Razorpay Checkout will show the payment methods enabled
        // for your account and route the customer through the chosen
        // UPI/card/net-banking flow.
        modal: {
          ondismiss: () => {
            setPaying(false);
            setPaymentStatus("");
          },
        },

        handler: async (response) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planId: selectedPlan.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyJson = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyJson?.success) {
              throw new Error(
                verifyJson?.message || "Payment verification failed."
              );
            }

            setPaymentStatus("Payment successful! Premium activation is complete.");
            setError("");
          } catch (verificationError) {
            console.error(verificationError);
            setError(
              verificationError?.message ||
                "Payment completed, but verification failed. Please contact support."
            );
            setPaymentStatus("");
          } finally {
            setPaying(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response?.error);
        setError(
          response?.error?.description ||
            "Payment failed. Please try another payment method."
        );
        setPaymentStatus("");
        setPaying(false);
      });

      razorpay.open();
    } catch (paymentError) {
      console.error("Payment start error:", paymentError);
      setError(paymentError?.message || "Unable to start payment.");
      setPaying(false);
    }
  };

  return (
    <div className="tm-premium-page">
      <header className="tm-premium-header">
        <button
          type="button"
          className="tm-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={23} />
        </button>

        <div className="tm-brand">
          <div className="tm-brand-mark">🌳</div>
          <div>
            <div className="tm-brand-name">
              <span>Timber</span>
              <strong>Mart</strong>
            </div>
            <div className="tm-brand-tagline">BUY | SELL | CONNECT</div>
          </div>
        </div>

        <div className="tm-header-slogan">
          <Leaf size={26} />
          <div>
            <strong>A Greener</strong>
            <span>Tomorrow Together</span>
          </div>
        </div>
      </header>

      <main className="tm-premium-content">
        <section className="tm-premium-hero">
          <div className="tm-hero-copy">
            <span className="tm-hero-kicker">
              <Crown size={18} /> PREMIUM MEMBERSHIP
            </span>
            <h1>
              Upgrade to <span>Premium</span>
            </h1>
            <p>
              More Connections. More Business.
              <br />
              A Bigger Tomorrow.
            </p>

            <div className="tm-hero-checks">
              <div><Check size={17} /> Find the right buyers &amp; sellers</div>
              <div><Check size={17} /> Get unlimited access</div>
              <div><Check size={17} /> Grow your timber business</div>
            </div>
          </div>

          <div className="tm-hero-art" aria-hidden="true">
            <div className="tm-art-glow" />
            <div className="tm-log log-one" />
            <div className="tm-log log-two" />
            <div className="tm-log log-three" />
            <div className="tm-art-text">
              <span>Good</span>
              <strong>Timber</strong>
              <strong>Great</strong>
              <span>Opportunities</span>
            </div>
          </div>
        </section>

        <section className="tm-section-heading">
          <div><h2>Compare Plans</h2></div>
          <p>Choose the plan that fits your needs</p>
        </section>

        <section className="tm-plans-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`tm-plan-card ${plan.popular ? "popular" : ""} ${
                plan.savings ? "savings" : ""
              }`}
            >
              {plan.popular && <span className="tm-plan-badge">Popular</span>}
              {plan.savings && (
                <span className="tm-plan-badge">Most Savings</span>
              )}

              <div className="tm-plan-head">
                <h3>{plan.title}</h3>
                <p>{plan.subtitle}</p>
              </div>

              <div className="tm-price-row">
                <strong>{plan.priceText}</strong>
                {plan.suffix && <span>{plan.suffix}</span>}
                {plan.oldPrice && <del>{plan.oldPrice}</del>}
              </div>

              <div
                className={`tm-saving ${
                  !plan.saving && !plan.note ? "tm-saving-empty" : ""
                }`}
              >
                {plan.saving || plan.note}
              </div>

              <button
                type="button"
                className="tm-plan-button"
                disabled={plan.amount === 0}
                onClick={() => openPayment(plan)}
              >
                {plan.amount > 0 && <Crown size={17} />}
                {plan.amount > 0 ? "Choose Plan" : "Current Plan"}
              </button>

              <ul className="tm-features">
                {plan.features.map(([text, enabled]) => (
                  <Feature key={text} text={text} enabled={enabled} />
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="tm-invest-banner">
          <div className="tm-invest-icon"><Gift size={33} /></div>
          <div>
            <h3>Invest in Premium Today</h3>
            <p>Get more opportunities, more customers and grow faster!</p>
          </div>
          <div className="tm-invest-hand">
            Timber Business
            <br />
            Made Easier
          </div>
        </section>

        <section className="tm-trust-row">
          <div>
            <ShieldCheck size={29} />
            <span><strong>100% Secure</strong>Payments</span>
          </div>
          <div>
            <span className="tm-rupee">₹</span>
            <span><strong>Multiple Payment</strong>Options</span>
          </div>
          <div>
            <Headphones size={29} />
            <span><strong>Need Help?</strong>We&apos;re here for you</span>
          </div>
          <div>
            <Leaf size={29} />
            <span><strong>Support</strong>Sustainable Trade</span>
          </div>
        </section>

        <section className="tm-testimonial">
          <div className="tm-testimonial-avatar">👨🏻</div>
          <div className="tm-testimonial-copy">
            <p>
              “After upgrading to Premium, I could connect with many genuine
              buyers near my location. It really helped my business!”
            </p>
            <span>– Suresh, Timber Seller, Visakhapatnam</span>
          </div>
          <div className="tm-stars" aria-label="5 star rating">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={17} fill="currentColor" />
            ))}
          </div>
          <ArrowRight className="tm-testimonial-arrow" size={23} />
        </section>

        <button
          type="button"
          className="tm-bottom-cta"
          onClick={() =>
            openPayment(PLANS.find((plan) => plan.id === "premium_monthly"))
          }
        >
          <Crown size={24} />
          <span>Upgrade to Premium Now</span>
          <ArrowRight size={24} />
        </button>

        <footer className="tm-premium-footer">
          More People&nbsp;&nbsp; | &nbsp;&nbsp;More Timber&nbsp;&nbsp; | &nbsp;&nbsp;A Greener Tomorrow
        </footer>
      </main>

      {selectedPlan && (
        <div
          className="tm-payment-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePayment();
          }}
        >
          <div
            className="tm-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tm-payment-title"
          >
            <button
              type="button"
              className="tm-payment-close"
              onClick={closePayment}
              disabled={paying}
              aria-label="Close payment"
            >
              <X size={21} />
            </button>

            <div className="tm-payment-topline">TIMBERMART PREMIUM</div>

            <div className="tm-payment-heading">
              <div>
                <span className="tm-payment-kicker">SECURE CHECKOUT</span>
                <h2 id="tm-payment-title">Choose Payment Method</h2>
                <p>
                  {selectedPlan.title} ·{" "}
                  <strong>
                    {selectedPlan.priceText}
                    {selectedPlan.suffix}
                  </strong>
                </p>
              </div>
              <div className="tm-payment-crown">
                <Crown size={23} />
              </div>
            </div>

            <div className="tm-payment-method-grid">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;

                return (
                  <button
                    key={method.id}
                    type="button"
                    className={`tm-payment-method ${
                      paymentMethod === method.id ? "active" : ""
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                    disabled={paying}
                  >
                    <span className="tm-payment-method-icon">
                      <Icon size={21} />
                    </span>

                    <span className="tm-payment-method-text">
                      <strong>{method.title}</strong>
                      <small>{method.subtitle}</small>
                    </span>

                    <span className="tm-payment-radio">
                      {paymentMethod === method.id && <span />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="tm-selected-payment-card">
              {paymentMethod === "upi" && (
                <>
                  <div className="tm-selected-icon"><Smartphone size={23} /></div>
                  <div>
                    <strong>Pay with UPI</strong>
                    <p>
                      Razorpay will open the secure UPI flow. On mobile, the
                      customer can select their UPI app and complete payment.
                    </p>
                  </div>
                </>
              )}

              {paymentMethod === "card" && (
                <>
                  <div className="tm-selected-icon"><CreditCard size={23} /></div>
                  <div>
                    <strong>Pay with Card</strong>
                    <p>
                      Enter card details in Razorpay Checkout. Card data is
                      handled by the payment gateway, not stored by TimberMart.
                    </p>
                  </div>
                </>
              )}

              {paymentMethod === "netbanking" && (
                <>
                  <div className="tm-selected-icon"><Landmark size={23} /></div>
                  <div>
                    <strong>Pay with Net Banking</strong>
                    <p>
                      Select your bank in Razorpay Checkout and continue to
                      the secure bank authentication flow.
                    </p>
                  </div>
                </>
              )}
            </div>

            {(error || paymentStatus) && (
              <div className={`tm-payment-alert ${error ? "error" : "success"}`}>
                {error || paymentStatus}
              </div>
            )}

            <button
              type="button"
              className="tm-payment-primary"
              onClick={startRealPayment}
              disabled={paying}
            >
              {paying ? "Opening Secure Checkout…" : `Pay ${selectedPlan.priceText}`}
              {!paying && <ArrowRight size={18} />}
            </button>

            <button
              type="button"
              className="tm-payment-back"
              onClick={closePayment}
              disabled={paying}
            >
              <ArrowLeft size={16} />
              Back to Premium
            </button>

            <div className="tm-payment-security">
              <ShieldCheck size={16} />
              <span>Secure payment powered by Razorpay</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

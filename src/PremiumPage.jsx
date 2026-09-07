import React from "react";
import { ArrowLeft, ArrowRight, Check, Crown, Gift, Headphones, Leaf, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./PremiumPage.css";

const plans = [
  {
    id: "free",
    title: "Free",
    subtitle: "Get started with TimberMart",
    price: "₹0",
    suffix: "",
    oldPrice: "",
    saving: "",
    note: "Free Forever",
    type: "free",
    button: "Current Plan",
    features: [
      { text: "View only 5 user profiles/day", yes: true },
      { text: "Basic search", yes: true },
      { text: "Limited contact access", yes: true },
      { text: "Basic filters", yes: true },
      { text: "Normal listing visibility", yes: true },
      { text: "Advanced filters", yes: false },
      { text: "Priority leads", yes: false },
      { text: "Profile insights", yes: false },
    ],
  },
  {
    id: "premium_monthly",
    title: "Premium Monthly",
    subtitle: "For regular users",
    price: "₹199",
    suffix: "/ month",
    oldPrice: "",
    saving: "",
    note: "",
    type: "premium",
    button: "Choose Monthly",
    features: [
      { text: "Unlimited user profiles", yes: true },
      { text: "Advanced search & filters", yes: true },
      { text: "Full contact access (Phone / WhatsApp)", yes: true },
      { text: "Nearby users unlimited", yes: true },
      { text: "Priority leads in your area", yes: true },
      { text: "Higher profile visibility", yes: true },
      { text: "Premium notifications", yes: true },
      { text: "Lead insights & analytics", yes: true },
    ],
  },
  {
    id: "premium_3_months",
    title: "Premium 3 Months",
    subtitle: "Best value for active users",
    price: "₹499",
    suffix: "",
    oldPrice: "₹597",
    saving: "Save ₹98 (16%)",
    note: "",
    type: "premium popular",
    badge: "Popular",
    button: "Choose 3 Months",
    features: [
      { text: "Unlimited user profiles", yes: true },
      { text: "Advanced search & filters", yes: true },
      { text: "Full contact access (Phone / WhatsApp)", yes: true },
      { text: "Nearby users unlimited", yes: true },
      { text: "Priority leads in your area", yes: true },
      { text: "Higher profile visibility", yes: true },
      { text: "Premium notifications", yes: true },
      { text: "Lead insights & analytics", yes: true },
    ],
  },
  {
    id: "premium_yearly",
    title: "Premium Yearly",
    subtitle: "For serious growth",
    price: "₹1,499",
    suffix: "",
    oldPrice: "₹2,388",
    saving: "Save ₹889 (37%)",
    note: "",
    type: "premium savings",
    badge: "Most Savings",
    button: "Choose Yearly",
    features: [
      { text: "Unlimited user profiles", yes: true },
      { text: "Advanced search & filters", yes: true },
      { text: "Full contact access (Phone / WhatsApp)", yes: true },
      { text: "Nearby users unlimited", yes: true },
      { text: "Priority leads in your area", yes: true },
      { text: "Higher profile visibility", yes: true },
      { text: "Premium notifications", yes: true },
      { text: "Lead insights & analytics", yes: true },
    ],
  },
];

function Feature({ item }) {
  return (
    <li className={item.yes ? "tm-feature yes" : "tm-feature no"}>
      <span className="tm-feature-icon">
        {item.yes ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={2.6} />}
      </span>
      <span>{item.text}</span>
    </li>
  );
}

export default function PremiumPage() {
  const navigate = useNavigate();

  const handlePlan = (planId) => {
    if (planId === "free") return;

    // Payment integration can be connected here later.
    navigate(`/premium?plan=${encodeURIComponent(planId)}`);
  };

  return (
    <div className="tm-premium-page">
      <header className="tm-premium-header">
        <button
          className="tm-back-btn"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="tm-brand">
          <div className="tm-brand-mark">🌳</div>
          <div>
            <div className="tm-brand-name">
              <span>Timber</span><strong>Mart</strong>
            </div>
            <div className="tm-brand-tagline">BUY&nbsp;&nbsp;|&nbsp;&nbsp;SELL&nbsp;&nbsp;|&nbsp;&nbsp;CONNECT</div>
          </div>
        </div>

        <div className="tm-header-slogan">
          <Leaf size={28} />
          <div>
            <strong>A Greener</strong>
            <span>Tomorrow Together</span>
          </div>
        </div>
      </header>

      <main className="tm-premium-content">
        <section className="tm-premium-hero">
          <div className="tm-hero-copy">
            <span className="tm-hero-kicker"><Crown size={18} /> PREMIUM MEMBERSHIP</span>
            <h1>
              Upgrade to <span>Premium</span>
            </h1>
            <p>More Connections. More Business.<br />A Bigger Tomorrow.</p>

            <div className="tm-hero-checks">
              <div><Check size={17} /> Find the right buyers & sellers</div>
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
          <div>
            <h2>Compare Plans</h2>
          </div>
          <p>Choose the plan that fits your needs</p>
        </section>

        <section className="tm-plans-grid">
          {plans.map((plan) => (
            <article key={plan.id} className={`tm-plan-card ${plan.type}`}>
              {plan.badge && <span className="tm-plan-badge">{plan.badge}</span>}

              <div className="tm-plan-head">
                <h3>{plan.title}</h3>
                <p>{plan.subtitle}</p>
              </div>

              <div className="tm-price-row">
                <strong>{plan.price}</strong>
                {plan.suffix && <span>{plan.suffix}</span>}
                {plan.oldPrice && <del>{plan.oldPrice}</del>}
              </div>

              {plan.saving ? (
                <div className="tm-saving">{plan.saving}</div>
              ) : (
                <div className="tm-saving tm-saving-empty">{plan.note}</div>
              )}

              <button
                type="button"
                className="tm-plan-button"
                disabled={plan.id === "free"}
                onClick={() => handlePlan(plan.id)}
              >
                {plan.id !== "free" && <Crown size={18} />}
                {plan.button}
              </button>

              <ul className="tm-features">
                {plan.features.map((item) => (
                  <Feature key={item.text} item={item} />
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="tm-invest-banner">
          <div className="tm-invest-icon"><Gift size={35} /></div>
          <div>
            <h3>Invest in Premium Today,</h3>
            <p>Get more opportunities, more customers and grow faster!</p>
          </div>
          <div className="tm-invest-hand">Timber Business<br />Made Easier</div>
        </section>

        <section className="tm-trust-row">
          <div><ShieldCheck size={30} /><span><strong>100% Secure</strong>Payments</span></div>
          <div><span className="tm-rupee">₹</span><span><strong>Multiple Payment</strong>Options (UPI, Card, Net Banking)</span></div>
          <div><Headphones size={30} /><span><strong>Need Help?</strong>We're here for you</span></div>
          <div><Leaf size={30} /><span><strong>Support</strong>Sustainable Trade</span></div>
        </section>

        <section className="tm-testimonial">
          <div className="tm-testimonial-avatar">👨🏻</div>
          <div className="tm-testimonial-copy">
            <p>“After upgrading to Premium, I could connect with many genuine buyers near my location. It really helped my business!”</p>
            <span>– Suresh, Timber Seller, Visakhapatnam</span>
          </div>
          <div className="tm-stars" aria-label="5 star rating">
            <Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" />
          </div>
          <ArrowRight className="tm-testimonial-arrow" size={24} />
        </section>

        <button
          type="button"
          className="tm-bottom-cta"
          onClick={() => handlePlan("premium_monthly")}
        >
          <Crown size={25} />
          <span>Upgrade to Premium Now</span>
          <ArrowRight size={25} />
        </button>

        <footer className="tm-premium-footer">
          More People&nbsp;&nbsp;|&nbsp;&nbsp; More Timber&nbsp;&nbsp;|&nbsp;&nbsp; A Greener Tomorrow
        </footer>
      </main>
    </div>
  );
}

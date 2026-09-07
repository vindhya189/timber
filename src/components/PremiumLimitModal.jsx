import React from "react";
import { X, Crown, Eye, Search, Phone, Filter, UserRound, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./PremiumLimitModal.css";

export default function PremiumLimitModal({
  open,
  onClose,
  viewedCount = 5,
  dailyLimit = 5,
}) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleUpgrade = () => {
    onClose?.();
    navigate("/premium");
  };

  return (
    <div
      className="tm-premium-limit-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tm-premium-limit-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="tm-premium-limit-modal">
        <button
          type="button"
          className="tm-premium-limit-close"
          aria-label="Close"
          onClick={() => onClose?.()}
        >
          <X size={22} />
        </button>

        <div className="tm-premium-limit-hero">
          <div className="tm-premium-limit-brand">
            <div className="tm-premium-limit-logo">🌳</div>
            <div>
              <div className="tm-premium-limit-brand-name">
                Timber<span>Mart</span>
              </div>
              <div className="tm-premium-limit-tagline">
                BUY&nbsp;&nbsp;|&nbsp;&nbsp;SELL&nbsp;&nbsp;|&nbsp;&nbsp;CONNECT
              </div>
            </div>
          </div>

          <div className="tm-premium-limit-go-premium">
            <Crown size={19} fill="currentColor" />
            GO PREMIUM
          </div>
        </div>

        <div className="tm-premium-limit-copy">
          <h2 id="tm-premium-limit-title">
            You've reached your free
            <br className="tm-premium-limit-desktop-break" />
            profile limit!
          </h2>

          <div className="tm-premium-limit-counter">
            <Eye size={18} />
            You have viewed{" "}
            <strong>
              {Math.min(viewedCount, dailyLimit)}/{dailyLimit}
            </strong>{" "}
            user profiles today.
          </div>

          <p>
            Upgrade to Premium and get unlimited access to buyers,
            sellers and carpenters.
          </p>
        </div>

        <div className="tm-premium-limit-compare">
          <section className="tm-premium-limit-plan tm-premium-limit-free">
            <div className="tm-premium-limit-plan-head">
              <div className="tm-premium-limit-plan-icon">
                <UserRound size={19} />
              </div>
              <div>
                <h3>Free User</h3>
                <span>Standard access</span>
              </div>
            </div>

            <div className="tm-premium-limit-feature neutral">
              <Eye size={17} />
              <span>View only {dailyLimit} profiles/day</span>
            </div>

            <div className="tm-premium-limit-feature neutral">
              <Search size={17} />
              <span>Basic search</span>
            </div>

            <div className="tm-premium-limit-feature neutral">
              <Phone size={17} />
              <span>Limited contact access</span>
            </div>

            <div className="tm-premium-limit-feature neutral">
              <Filter size={17} />
              <span>Basic filters</span>
            </div>

            <div className="tm-premium-limit-feature neutral">
              <UserRound size={17} />
              <span>Standard visibility</span>
            </div>
          </section>

          <div className="tm-premium-limit-arrow" aria-hidden="true">
            <ArrowRight size={24} />
          </div>

          <section className="tm-premium-limit-plan tm-premium-limit-premium">
            <div className="tm-premium-limit-plan-badge">
              <Crown size={16} fill="currentColor" />
              Premium User
              <span>Most Popular</span>
            </div>

            <div className="tm-premium-limit-feature">
              <Check size={17} />
              <span>View unlimited profiles</span>
            </div>

            <div className="tm-premium-limit-feature">
              <Check size={17} />
              <span>Advanced search &amp; filters</span>
            </div>

            <div className="tm-premium-limit-feature">
              <Check size={17} />
              <span>Full contact access (Phone / WhatsApp*)</span>
            </div>

            <div className="tm-premium-limit-feature">
              <Check size={17} />
              <span>Priority leads in your area</span>
            </div>

            <div className="tm-premium-limit-feature">
              <Check size={17} />
              <span>Higher profile visibility</span>
            </div>

            <div className="tm-premium-limit-feature">
              <Check size={17} />
              <span>Support sustainable trade</span>
            </div>
          </section>
        </div>

        <button
          type="button"
          className="tm-premium-limit-upgrade"
          onClick={handleUpgrade}
        >
          <Crown size={21} fill="currentColor" />
          <span>Upgrade to Premium Now</span>
          <ArrowRight size={21} />
        </button>

        <div className="tm-premium-limit-footer">
          More Connections
          <span>|</span>
          More Business
          <span>|</span>
          A Greener Tomorrow
        </div>

        <div className="tm-premium-limit-note">
          Your free profile limit resets automatically each day.
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { ArrowRight, Hammer, Leaf, ShieldCheck, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="tm-start-page">
      {/* =====================================================
          TOP NAVBAR
          ===================================================== */}
      <header className="tm-start-nav">
        <div className="tm-logo">
          <div className="tm-logo-mark">🌳</div>
          <span>TimberMart</span>
        </div>

        <button
          className="tm-btn tm-btn-outline"
          onClick={() => navigate("/roles")}
        >
          Sign In
        </button>
      </header>

      {/* =====================================================
          MAIN HERO SECTION
          ===================================================== */}
      <main className="tm-start-main">
        <div className="tm-start-content">

          <div className="tm-start-badge">
            🌲 One platform for the timber community
          </div>

          <h1 className="tm-start-title">
            Connect.
            <br />
            <span>Build.</span>
            <br />
            Grow.
          </h1>

          <p className="tm-start-description">
            TimberMart brings farmers, timber merchants, sawmills,
            carpenters, workers and buyers together in one simple
            platform.
          </p>

          <div className="tm-start-actions">
            <button
              className="tm-btn tm-btn-primary"
              onClick={() => navigate("/roles")}
            >
              Get Started
              <ArrowRight
                size={18}
                style={{ verticalAlign: "middle", marginLeft: 7 }}
              />
            </button>

            <button
              className="tm-btn tm-btn-secondary"
              onClick={() => navigate("/requirements")}
            >
              Explore Requirements
            </button>
          </div>

          {/* =================================================
              FEATURES
              ================================================= */}
          <div className="tm-start-features">

            <div className="tm-card tm-feature-card">
              <div className="tm-feature-icon">
                <Leaf size={25} />
              </div>

              <h3>For Timber Community</h3>

              <p>
                Connect with people involved in timber,
                wood, construction and related services.
              </p>
            </div>

            <div className="tm-card tm-feature-card">
              <div className="tm-feature-icon">
                <Store size={25} />
              </div>

              <h3>Find Opportunities</h3>

              <p>
                Create your own requirements, services,
                job opportunities and business listings.
              </p>
            </div>

            <div className="tm-card tm-feature-card">
              <div className="tm-feature-icon">
                <ShieldCheck size={25} />
              </div>

              <h3>One Simple Platform</h3>

              <p>
                Manage your profile, requirements,
                connections and activities from one place.
              </p>
            </div>

          </div>

          {/* =================================================
              ROLE PREVIEW
              ================================================= */}
          <div
            style={{
              marginTop: "35px",
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px",
              color: "#697365",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            <span>🌳 Farmer</span>
            <span>•</span>
            <span>🪵 Timber Merchant</span>
            <span>•</span>
            <span>🏭 Sawmill</span>
            <span>•</span>
            <span>🛠️ Carpenter</span>
            <span>•</span>
            <span>👷 Worker</span>
            <span>•</span>
            <span>🏠 Buyer</span>
          </div>

        </div>
      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}
      <footer
        style={{
          textAlign: "center",
          padding: "20px",
          color: "#879080",
          fontSize: "12px",
        }}
      >
        <Hammer
          size={14}
          style={{
            verticalAlign: "middle",
            marginRight: 5,
          }}
        />
        TimberMart • Connecting the timber ecosystem
      </footer>
    </div>
  );
}
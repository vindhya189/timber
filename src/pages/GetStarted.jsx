import React from "react";
import {
  ArrowRight,
  Hammer,
  Leaf,
  ShieldCheck,
  Store,
  Trees,
  Users,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GetStarted() {
  const navigate = useNavigate();

  const roles = [
    { icon: "🌳", name: "Farmer" },
    { icon: "🪵", name: "Merchant" },
    { icon: "🏭", name: "Sawmill" },
    { icon: "🛠️", name: "Carpenter" },
    { icon: "👷", name: "Worker" },
    { icon: "🏠", name: "Buyer" },
  ];

  return (
    <div className="tm-start-page">

      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <header className="tm-start-nav">

        <button
          className="tm-logo"
          onClick={() => navigate("/")}
          aria-label="TimberMart Home"
        >
          <span className="tm-logo-mark">🌳</span>

          <span className="tm-logo-text">
            Timber<span>Mart</span>
          </span>
        </button>

        <button
          className="tm-btn tm-btn-outline tm-start-signin"
          onClick={() => navigate("/roles")}
        >
          Sign In
        </button>

      </header>


      {/* =====================================================
          HERO
          ===================================================== */}

      <main className="tm-start-main">

        <section className="tm-start-hero">

          {/* Nature decoration */}

          <div className="tm-hero-decoration tm-leaf-one">
            🌿
          </div>

          <div className="tm-hero-decoration tm-leaf-two">
            🍃
          </div>

          <div className="tm-hero-decoration tm-leaf-three">
            🌱
          </div>


          {/* Hero content */}

          <div className="tm-start-content">

            <div className="tm-start-badge">
              <span className="tm-badge-icon">
                🌲
              </span>

              <span>
                One platform for the timber community
              </span>
            </div>


            <h1 className="tm-start-title">
              Connect.
              <span>Build.</span>
              Grow.
            </h1>


            <p className="tm-start-description">
              TimberMart brings farmers, timber merchants,
              sawmills, carpenters, workers and buyers
              together in one simple platform.
            </p>


            {/* CTA */}

            <div className="tm-start-actions">

              <button
                className="tm-btn tm-btn-primary tm-main-cta"
                onClick={() => navigate("/roles")}
              >
                <span>Get Started</span>

                <span className="tm-cta-arrow">
                  <ArrowRight size={17} />
                </span>
              </button>


              <button
                className="tm-btn tm-btn-secondary tm-requirement-cta"
                onClick={() => navigate("/requirements")}
              >
                Explore Requirements
                <ChevronRight size={17} />
              </button>

            </div>


            {/* =================================================
                TRUST LINE
                ================================================= */}

            <div className="tm-start-trust">

              <div className="tm-trust-item">
                <div className="tm-trust-icon">
                  <Users size={16} />
                </div>

                <span>
                  Timber Community
                </span>
              </div>


              <div className="tm-trust-divider" />


              <div className="tm-trust-item">
                <div className="tm-trust-icon">
                  <ShieldCheck size={16} />
                </div>

                <span>
                  Simple & Secure
                </span>
              </div>

            </div>

          </div>


          {/* =================================================
              TREE VISUAL
              ================================================= */}

          <div
            className="tm-start-tree-area"
            aria-hidden="true"
          >

            <div className="tm-tree-glow" />

            <div className="tm-tree-circle">

              <div className="tm-tree-emoji">
                🌳
              </div>

              <div className="tm-tree-ground">
                <span>🪵</span>
                <span>🪵</span>
                <span>🪵</span>
              </div>

            </div>

            <div className="tm-tree-label">
              <Trees size={15} />
              <span>Grow together</span>
            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURES
            ===================================================== */}

        <section className="tm-start-features-section">

          <div className="tm-section-heading-small">
            <span>WHY TIMBERMART?</span>
          </div>

          <div className="tm-start-features">


            {/* Feature 1 */}

            <article className="tm-card tm-feature-card">

              <div className="tm-feature-icon">
                <Leaf size={23} />
              </div>

              <div className="tm-feature-content">

                <h3>
                  For Timber Community
                </h3>

                <p>
                  Connect with people involved in
                  timber, wood, construction and
                  related services.
                </p>

              </div>

            </article>


            {/* Feature 2 */}

            <article className="tm-card tm-feature-card">

              <div className="tm-feature-icon">
                <Store size={23} />
              </div>

              <div className="tm-feature-content">

                <h3>
                  Find Opportunities
                </h3>

                <p>
                  Create your own requirements,
                  services, jobs and business
                  listings.
                </p>

              </div>

            </article>


            {/* Feature 3 */}

            <article className="tm-card tm-feature-card">

              <div className="tm-feature-icon">
                <ShieldCheck size={23} />
              </div>

              <div className="tm-feature-content">

                <h3>
                  One Simple Platform
                </h3>

                <p>
                  Manage your profile, requirements,
                  connections and activities from one
                  place.
                </p>

              </div>

            </article>

          </div>

        </section>


        {/* =====================================================
            ROLE PREVIEW
            ===================================================== */}

        <section className="tm-role-preview">

          <div className="tm-role-preview-heading">
            <span>
              Join as
            </span>

            <strong>
              your role
            </strong>
          </div>


          <div className="tm-role-preview-list">

            {roles.map((role) => (

              <button
                key={role.name}
                className="tm-role-preview-item"
                onClick={() => navigate("/roles")}
              >
                <span>
                  {role.icon}
                </span>

                <small>
                  {role.name}
                </small>
              </button>

            ))}

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="tm-start-footer">

        <div className="tm-footer-brand">
          <span>🌳</span>
          TimberMart
        </div>

        <p>
          <Hammer
            size={13}
            style={{
              verticalAlign: "middle",
              marginRight: 5,
            }}
          />

          Connecting the timber ecosystem
        </p>

      </footer>

    </div>
  );
}
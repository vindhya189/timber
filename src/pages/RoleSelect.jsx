import React from "react";
import { ArrowLeft, ArrowRight, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

const roles = [
  {
    id: "farmer",
    icon: "🌳",
    title: "Farmer",
    description: "I am a farmer looking to sell timber or logs.",
  },
  {
    id: "merchant",
    icon: "🪵",
    title: "Timber Merchant",
    description: "I buy and sell timber and wood products.",
  },
  {
    id: "sawmill",
    icon: "🏭",
    title: "Sawmill / Wood Business",
    description: "I run a sawmill or wood processing business.",
  },
  {
    id: "carpenter",
    icon: "🛠️",
    title: "Carpenter",
    description: "I provide carpentry and wood work services.",
  },
  {
    id: "worker",
    icon: "👷",
    title: "Worker / Labor",
    description: "I am a worker looking for jobs and work.",
  },
  {
    id: "buyer",
    icon: "🏠",
    title: "Buyer",
    description: "I want to buy timber, wood or related products.",
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    console.log("Selected Role:", role.id);

    // Login page ki selected role ni query parameter ga pampistundi
    navigate(`/login?role=${role.id}`);
  };

  return (
    <div className="tm3-screen tm3-role">

      {/* ================= HEADER ================= */}
      <header className="tm3-header tm3-inner-header">

        <button
          type="button"
          className="tm3-circle-btn"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={20} />
        </button>

        <button
          type="button"
          className="tm3-logo"
          onClick={() => navigate("/")}
        >
          <span>🌳</span>
          <span>TimberMart</span>
        </button>

        <button
          type="button"
          className="tm3-menu"
          onClick={() => navigate("/")}
        >
          <Menu size={21} />
        </button>

      </header>

      {/* ================= CONTENT ================= */}
      <main className="tm3-role-content">

        <div className="tm3-role-heading">
          <span className="tm3-heading-star">✦</span>

          <h1>Select Your Role</h1>

          <span className="tm3-heading-star">✦</span>
        </div>

        <p className="tm3-subtitle">
          Choose how you want to join TimberMart
        </p>

        {/* ================= ROLE LIST ================= */}
        <div className="tm3-role-list">

          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              className="tm3-role-item"
              onClick={() => handleRoleSelect(role)}
            >

              <span className="tm3-role-icon">
                {role.icon}
              </span>

              <span className="tm3-role-copy">

                <strong>
                  {role.title}
                </strong>

                <small>
                  {role.description}
                </small>

              </span>

              <span className="tm3-role-arrow">
                <ArrowRight size={19} />
              </span>

            </button>
          ))}

        </div>

        <div className="tm3-role-bottom-note">
          <span>🌳</span>
          <p>
            Select your role and continue to login.
          </p>
        </div>

      </main>
    </div>
  );
}
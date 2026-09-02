import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const roles = [
  {
    id: "farmer",
    icon: "🌳",
    title: "Farmer",
    description: "Sell timber and connect with timber buyers.",
  },
  {
    id: "merchant",
    icon: "🪵",
    title: "Timber Merchant",
    description: "Buy, sell and manage timber business requirements.",
  },
  {
    id: "sawmill",
    icon: "🏭",
    title: "Sawmill / Wood Business",
    description: "Manage wood processing and business opportunities.",
  },
  {
    id: "carpenter",
    icon: "🛠️",
    title: "Carpenter / Service Provider",
    description: "Offer carpentry and wood-related services.",
  },
  {
    id: "worker",
    icon: "👷",
    title: "Worker / Job Seeker",
    description: "Find jobs and connect with employers.",
  },
  {
    id: "buyer",
    icon: "🏠",
    title: "Buyer / Homeowner",
    description: "Find timber, wood products and services.",
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();

  const selectRole = (role) => {
    // Selected role ni login page ki send chestunnam
    navigate(`/login?role=${role.id}`);
  };

  return (
    <div className="tm-page">
      <div className="tm-auth-page">
        <div className="tm-auth-wrapper">

          {/* Back button */}
          <button
            className="tm-btn tm-btn-outline"
            onClick={() => navigate("/")}
            style={{
              marginBottom: "25px",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <ArrowLeft size={17} />
            Back
          </button>

          {/* Heading */}
          <div className="tm-auth-heading">
            <div className="tm-start-badge">
              🌲 Welcome to TimberMart
            </div>

            <h1>Choose Your Role</h1>

            <p>
              Select how you want to use TimberMart.
              You can create your account after selecting your role.
            </p>
          </div>

          {/* Roles */}
          <div className="tm-role-grid">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                className="tm-role-card"
                onClick={() => selectRole(role)}
              >
                <div className="tm-role-emoji">
                  {role.icon}
                </div>

                <h3>{role.title}</h3>

                <p>{role.description}</p>

                <div
                  className="tm-role-select"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  Continue
                  <ArrowRight size={16} />
                </div>
              </button>
            ))}
          </div>

          {/* Bottom information */}
          <div
            style={{
              textAlign: "center",
              marginTop: "25px",
            }}
          >
            <p className="tm-info-text">
              Your dashboard and available features will be based
              on the role you select.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
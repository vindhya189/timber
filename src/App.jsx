import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import GetStarted from "./pages/GetStarted";
import RoleSelect from "./pages/RoleSelect";

// FIXED LOGIN:
// This Login file checks the role saved in the user's Supabase profile
// and does not allow the user to switch to another dashboard role.
import Login from "./pages/Login_FIXED_ROLE_LOCK";

// PREMIUM PAGE
import PremiumPage from "./pages/PremiumPage";

import "./App.css";

import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import RequirementWall from "./pages/RequirementWall";

import AdminDashboard from "./dashboards/AdminDashboard";
import FarmerDashboard from "./dashboards/FarmerDashboard";
import MerchantDashboard from "./dashboards/MerchantDashboard";
import SawmillDashboard from "./dashboards/SawmillDashboard";
import CarpenterDashboard from "./dashboards/CarpenterDashboard";
import WorkerDashboard from "./dashboards/WorkerDashboard";
import BuyerDashboard from "./dashboards/BuyerDashboard";

import { supabase } from "./supabaseClient";

/* =========================================================
   GLOBAL THEME
========================================================= */
function GlobalTheme() {
  useEffect(() => {
    const applySavedTheme = () => {
      const darkMode =
        localStorage.getItem("timbermart_dark_mode") === "true";

      document.documentElement.classList.toggle(
        "timber-dark",
        darkMode
      );

      document.body.classList.toggle(
        "timber-dark-body",
        darkMode
      );
    };

    applySavedTheme();

    const handleThemeChange = () => {
      applySavedTheme();
    };

    window.addEventListener(
      "timbermart-theme-change",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "timbermart-theme-change",
        handleThemeChange
      );
    };
  }, []);

  return null;
}

/* =========================================================
   ADMIN ROUTE PROTECTION
========================================================= */
function AdminRoute() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user?.id) {
          if (active) setStatus("unauthorized");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const actualRole = String(profile?.role || "")
          .toLowerCase()
          .trim();

        if (actualRole === "admin" || actualRole === "administrator") {
          if (active) setStatus("allowed");
        } else {
          if (active) setStatus("unauthorized");
        }
      } catch (error) {
        console.error("Admin route check failed:", error);
        if (active) setStatus("unauthorized");
      }
    };

    checkAdmin();

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🛡️</div>
        <h2>TimberMart</h2>
        <p>Verifying administrator access...</p>
      </div>
    );
  }

  if (status !== "allowed") {
    return <Navigate to="/roles" replace />;
  }

  return <AdminDashboard />;
}

/* =========================================================
   ROLE-PROTECTED DASHBOARD
   ---------------------------------------------------------
   Even if a user manually types another dashboard URL,
   Supabase profile.role is checked before the dashboard renders.
========================================================= */
function RoleProtectedDashboard({ requiredRole, children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    const checkRole = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user?.id) {
          if (active) {
            setStatus("unauthorized");
            navigate(`/login?role=${requiredRole}`, { replace: true });
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const actualRole = String(profile?.role || "")
          .toLowerCase()
          .trim();

        // Exact role match only.
        if (actualRole !== requiredRole) {
          if (active) {
            setStatus("wrong-role");
            navigate(`/login?role=${requiredRole}`, { replace: true });
          }
          return;
        }

        if (active) setStatus("allowed");
      } catch (error) {
        console.error("Dashboard role check failed:", error);
        if (active) {
          setStatus("unauthorized");
          navigate(`/login?role=${requiredRole}`, { replace: true });
        }
      }
    };

    checkRole();

    return () => {
      active = false;
    };
  }, [navigate, requiredRole]);

  if (status === "checking") {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🌳</div>
        <h2>TimberMart</h2>
        <p>Verifying your account role...</p>
      </div>
    );
  }

  if (status !== "allowed") {
    return null;
  }

  return children;
}

/* =========================================================
   DASHBOARD ROUTER
========================================================= */
function DashboardRouter() {
  return (
    <Routes>
      <Route
        path="farmer"
        element={
          <RoleProtectedDashboard requiredRole="farmer">
            <FarmerDashboard />
          </RoleProtectedDashboard>
        }
      />

      <Route
        path="merchant"
        element={
          <RoleProtectedDashboard requiredRole="merchant">
            <MerchantDashboard />
          </RoleProtectedDashboard>
        }
      />

      <Route
        path="sawmill"
        element={
          <RoleProtectedDashboard requiredRole="sawmill">
            <SawmillDashboard />
          </RoleProtectedDashboard>
        }
      />

      <Route
        path="carpenter"
        element={
          <RoleProtectedDashboard requiredRole="carpenter">
            <CarpenterDashboard />
          </RoleProtectedDashboard>
        }
      />

      <Route
        path="worker"
        element={
          <RoleProtectedDashboard requiredRole="worker">
            <WorkerDashboard />
          </RoleProtectedDashboard>
        }
      />

      <Route
        path="buyer"
        element={
          <RoleProtectedDashboard requiredRole="buyer">
            <BuyerDashboard />
          </RoleProtectedDashboard>
        }
      />

      <Route path="*" element={<Navigate to="/roles" replace />} />
    </Routes>
  );
}

/* =========================================================
   MAIN APP
========================================================= */
export default function App() {
  return (
    <>
      <GlobalTheme />

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<GetStarted />} />
        <Route path="/roles" element={<RoleSelect />} />
        <Route path="/login" element={<Login />} />

        {/* COMMON LOGGED-IN PAGES */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/requirements" element={<RequirementWall />} />

        {/* PREMIUM */}
        <Route path="/premium" element={<PremiumPage />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminRoute />} />

        {/* ROLE-PROTECTED DASHBOARDS */}
        <Route path="/dashboard/*" element={<DashboardRouter />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import GetStarted from "./pages/GetStarted";
import RoleSelect from "./pages/RoleSelect";
import Login from "./pages/Login";
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
   ---------------------------------------------------------
   Dark Mode Settings lo ON chesina taruvatha,
   page change ayina, dashboard ki vellina,
   profile / requirements ki vellina theme continue avtundi.
   ========================================================= */

function GlobalTheme() {
  useEffect(() => {
    /* ---------------------------------------------
       Saved dark mode value
    --------------------------------------------- */

    const applySavedTheme = () => {
      const darkMode =
        localStorage.getItem("timbermart_dark_mode") === "true";

      /* HTML */
      document.documentElement.classList.toggle(
        "timber-dark",
        darkMode
      );

      /* BODY */
      document.body.classList.toggle(
        "timber-dark-body",
        darkMode
      );
    };

    /* ---------------------------------------------
       App start ayyinappudu theme apply
    --------------------------------------------- */

    applySavedTheme();

    /* ---------------------------------------------
       Settings nunchi theme change ayinappudu
    --------------------------------------------- */

    const handleThemeChange = () => {
      applySavedTheme();
    };

    window.addEventListener(
      "timbermart-theme-change",
      handleThemeChange
    );

    /* ---------------------------------------------
       Cleanup
    --------------------------------------------- */

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
   ---------------------------------------------------------
   /admin URL ni direct ga type chesina normal user ki
   AdminDashboard open avvakunda Supabase profiles.role
   verify chestundi.

   IMPORTANT:
   AdminDashboard.jsx already has its own admin protection.
   Ee guard additional route-level protection matrame.
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

        if (profile?.role === "admin") {
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

  /* ---------------------------------------------
     Checking
  --------------------------------------------- */

  if (status === "checking") {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🛡️</div>
        <h2>TimberMart</h2>
        <p>Verifying administrator access...</p>
      </div>
    );
  }

  /* ---------------------------------------------
     Not authorized
  --------------------------------------------- */

  if (status !== "allowed") {
    return (
      <Navigate
        to="/login?role=admin"
        replace
      />
    );
  }

  return <AdminDashboard />;
}

/* =========================================================
   DASHBOARD ROUTER
   ---------------------------------------------------------
   Existing dashboard routes same ga uncham.
   ========================================================= */

function DashboardRouter() {
  return (
    <Routes>
      <Route
        path="farmer"
        element={<FarmerDashboard />}
      />

      <Route
        path="merchant"
        element={<MerchantDashboard />}
      />

      <Route
        path="sawmill"
        element={<SawmillDashboard />}
      />

      <Route
        path="carpenter"
        element={<CarpenterDashboard />}
      />

      <Route
        path="worker"
        element={<WorkerDashboard />}
      />

      <Route
        path="buyer"
        element={<BuyerDashboard />}
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/roles"
            replace
          />
        }
      />
    </Routes>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

export default function App() {
  return (
    <>
      {/*
        GlobalTheme page change ayina theme ni maintain chestundi.
        Existing routes ki emi disturbance undadu.
      */}

      <GlobalTheme />

      <Routes>

        {/* =================================================
            PUBLIC
        ================================================= */}

        <Route
          path="/"
          element={<GetStarted />}
        />

        <Route
          path="/roles"
          element={<RoleSelect />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =================================================
            COMMON LOGGED-IN PAGES
        ================================================= */}

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/requirements"
          element={<RequirementWall />}
        />

        {/* =================================================
            ADMIN
            -------------------------------------------------
            AdminDashboard.jsx and AdminDashboard.css already
            exist. We are only protecting the route here.
        ================================================= */}

        <Route
          path="/admin"
          element={<AdminRoute />}
        />

        {/* =================================================
            DASHBOARDS
        ================================================= */}

        <Route
          path="/dashboard/*"
          element={<DashboardRouter />}
        />

        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </>
  );
}

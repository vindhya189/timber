import React, { useEffect } from "react";
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
        <Route path="/admin" element={<AdminDashboard />} />

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
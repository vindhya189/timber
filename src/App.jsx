import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import GetStarted from "./pages/GetStarted";
import RoleSelect from "./pages/RoleSelect";
import Login from "./pages/Login";

import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import RequirementWall from "./pages/RequirementWall";

import FarmerDashboard from "./dashboards/FarmerDashboard";
import MerchantDashboard from "./dashboards/MerchantDashboard";
import SawmillDashboard from "./dashboards/SawmillDashboard";
import CarpenterDashboard from "./dashboards/CarpenterDashboard";
import WorkerDashboard from "./dashboards/WorkerDashboard";
import BuyerDashboard from "./dashboards/BuyerDashboard";

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

export default function App() {
  return (
    <Routes>

      {/* PUBLIC */}

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

      {/* COMMON LOGGED-IN PAGES */}

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

      {/* DASHBOARDS */}

      <Route
        path="/dashboard/*"
        element={<DashboardRouter />}
      />

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
  );
}
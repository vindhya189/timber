import React, { useEffect, useState } from "react";
import {
  Bell,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { supabase } from "../supabaseClient";

const roleDetails = {
  farmer: {
    icon: "🌳",
    title: "Farmer",
    description: "Sell timber and connect with buyers.",
  },
  merchant: {
    icon: "🪵",
    title: "Timber Merchant",
    description: "Buy and sell timber.",
  },
  sawmill: {
    icon: "🏭",
    title: "Sawmill / Wood Business",
    description: "Manage wood processing.",
  },
  carpenter: {
    icon: "🛠️",
    title: "Carpenter / Service Provider",
    description: "Offer wood-related services.",
  },
  worker: {
    icon: "👷",
    title: "Worker / Job Seeker",
    description: "Find jobs and work opportunities.",
  },
  buyer: {
    icon: "🏠",
    title: "Buyer / Homeowner",
    description: "Find timber and services.",
  },
};

async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile error:", error);
    return null;
  }

  return data;
}

export function DashboardLayout({
  role,
  title,
  description,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleInfo =
    roleDetails[role] || roleDetails.farmer;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          navigate("/roles", { replace: true });
          return;
        }

        if (!mounted) return;

        setUser(session.user);

        let profileData =
          await getProfile(session.user.id);

        if (!profileData) {
          const name =
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "User";

          const { data, error } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              name,
              role,
            })
            .select()
            .single();

          if (error) {
            console.error(error);
          } else {
            profileData = data;
          }
        }

        if (!mounted) return;

        setProfile(profileData);

        if (
          profileData?.role &&
          profileData.role !== role
        ) {
          navigate(
            `/dashboard/${profileData.role}`,
            { replace: true }
          );
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error(
          "Dashboard authentication error:",
          error
        );

        if (mounted) {
          setLoading(false);
        }

        navigate("/roles", { replace: true });
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (
          event === "SIGNED_OUT" ||
          !session?.user
        ) {
          navigate("/roles", { replace: true });
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate, role]);

  async function logout() {
    await supabase.auth.signOut();

    navigate("/roles", {
      replace: true,
    });
  }

  function go(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  if (loading) {
    return (
      <div className="tm-loading-page">
        <div className="tm-loader" />
        <p>Loading TimberMart...</p>
      </div>
    );
  }

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const photo =
    profile?.photo_url || "";

  const dashboardPath =
    `/dashboard/${role}`;

  return (
    <div className="tm-app">

      {/* ================= TOPBAR ================= */}

      <header className="tm-topbar">

        <button
          className="tm-menu-btn"
          onClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
        >
          {sidebarOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

        <button
          className="tm-brand"
          onClick={() =>
            navigate(dashboardPath)
          }
        >
          <span className="tm-brand-icon">
            🌲
          </span>

          <span className="tm-brand-text">
            Timber<span>Mart</span>
          </span>
        </button>

        <div className="tm-topbar-right">

          <button className="tm-icon-btn">
            <Bell size={20} />
          </button>

          <button
            className="tm-user-chip"
            onClick={() =>
              navigate("/profile")
            }
          >
            <div className="tm-user-avatar">
              {photo ? (
                <img
                  src={photo}
                  alt="Profile"
                />
              ) : (
                roleInfo.icon
              )}
            </div>

            <div className="tm-user-info">
              <strong>
                {displayName}
              </strong>

              <span>
                {roleInfo.title}
              </span>
            </div>
          </button>

        </div>

      </header>

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`tm-sidebar ${
          sidebarOpen
            ? "tm-sidebar-open"
            : ""
        }`}
      >

        <div className="tm-sidebar-role">

          <div className="tm-sidebar-role-icon">
            {roleInfo.icon}
          </div>

          <div>
            <strong>
              {roleInfo.title}
            </strong>

            <span>
              {roleInfo.description}
            </span>
          </div>

        </div>

        <div className="tm-sidebar-menu">

          <button
            className={
              location.pathname ===
              dashboardPath
                ? "active"
                : ""
            }
            onClick={() =>
              go(dashboardPath)
            }
          >
            <Home size={18} />
            Dashboard
          </button>

          <button
            className={
              location.pathname.startsWith(
                "/requirements"
              )
                ? "active"
                : ""
            }
            onClick={() =>
              go("/requirements")
            }
          >
            <ClipboardList size={18} />
            Requirement Wall
          </button>

          <button
            className={
              location.pathname ===
              "/profile"
                ? "active"
                : ""
            }
            onClick={() =>
              go("/profile")
            }
          >
            <User size={18} />
            My Profile
          </button>

          <button
            className={
              location.pathname ===
              "/settings"
                ? "active"
                : ""
            }
            onClick={() =>
              go("/settings")
            }
          >
            <Settings size={18} />
            Settings
          </button>

        </div>

        <div className="tm-sidebar-bottom">

          <button
            className="tm-logout-btn"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* OVERLAY */}

      {sidebarOpen && (
        <div
          className="tm-sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ================= MAIN ================= */}

      <main className="tm-dashboard-main">

        <div className="tm-dashboard-heading">

          <div>
            <div className="tm-eyebrow">
              {roleInfo.icon}{" "}
              {roleInfo.title}
            </div>

            <h1>
              {title ||
                `${roleInfo.title} Dashboard`}
            </h1>

            {description && (
              <p>{description}</p>
            )}
          </div>

        </div>

        {children}

      </main>

      {/* ================= MOBILE NAV ================= */}

      <nav className="tm-mobile-nav">

        <button
          className={
            location.pathname ===
            dashboardPath
              ? "active"
              : ""
          }
          onClick={() =>
            go(dashboardPath)
          }
        >
          <Home size={19} />
          <span>Home</span>
        </button>

        <button
          className={
            location.pathname.startsWith(
              "/requirements"
            )
              ? "active"
              : ""
          }
          onClick={() =>
            go("/requirements")
          }
        >
          <ClipboardList size={19} />
          <span>Wall</span>
        </button>

        <button
          className={
            location.pathname ===
            "/profile"
              ? "active"
              : ""
          }
          onClick={() =>
            go("/profile")
          }
        >
          <User size={19} />
          <span>Profile</span>
        </button>

        <button
          className={
            location.pathname ===
            "/settings"
              ? "active"
              : ""
          }
          onClick={() =>
            go("/settings")
          }
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

      </nav>

    </div>
  );
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: "📋",
      title: "Requirement Wall",
      text: "View and post requirements.",
      path: "/requirements",
    },
    {
      icon: "👤",
      title: "My Profile",
      text: "Update your profile details.",
      path: "/profile",
    },
    {
      icon: "⚙️",
      title: "Settings",
      text: "Manage your account settings.",
      path: "/settings",
    },
  ];

  return (
    <div className="tm-quick-grid">

      {actions.map((item) => (
        <button
          key={item.title}
          className="tm-quick-card"
          onClick={() =>
            navigate(item.path)
          }
        >
          <div className="tm-quick-icon">
            {item.icon}
          </div>

          <div>
            <strong>
              {item.title}
            </strong>

            <span>
              {item.text}
            </span>
          </div>
        </button>
      ))}

    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

export function SectionTitle({
  title,
  description,
  action,
}) {
  return (
    <div className="tm-section-title">

      <div>
        <h2>{title}</h2>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {action}

    </div>
  );
}

/* =========================================================
   FEATURE
========================================================= */

export function Feature({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      className="tm-feature-card"
      onClick={onClick}
    >
      <div className="tm-feature-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </button>
  );
}
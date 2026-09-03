import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  TreePine,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./AdminDashboard.css";

const PAGE_SIZE = 8;

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "All Users", icon: Users },
  { id: "approvals", label: "Approvals", icon: UserCheck },
  { id: "rejected", label: "Rejected Listings", icon: XCircle },
  { id: "listings", label: "Timber Listings", icon: TreePine },
  { id: "requirements", label: "Requirements", icon: ClipboardList },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "messages", label: "Reported Messages", icon: MessageSquare },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roleLabel(role) {
  const map = {
    farmer: "Farmer",
    merchant: "Merchant",
    sawmill: "Business",
    carpenter: "Carpenter",
    worker: "Worker",
    buyer: "Buyer",
    admin: "Admin",
  };
  return map[role] || role || "User";
}

function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function StatusBadge({ status }) {
  const text = status || "unknown";
  return <span className={`admin-status ${text}`}>{text}</span>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [sessionUser, setSessionUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();

      if (sessionError) throw sessionError;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      setSessionUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== "admin") {
        setError("This account does not have Admin access.");
        return;
      }

      setAdminProfile(profile);

      const [
        usersRes,
        listingsRes,
        requirementsRes,
        jobsRes,
        notificationsRes,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("listings")
          .select(`
            *,
            profiles:user_id (
              id,
              name,
              role,
              phone,
              location,
              photo_url
            ),
            listing_images (
              id,
              image_url,
              storage_path,
              sort_order
            )
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("requirements")
          .select(`
            *,
            profiles:user_id (
              id,
              name,
              role,
              location
            )
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("jobs")
          .select(`
            *,
            profiles:user_id (
              id,
              name,
              role,
              location
            )
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (listingsRes.error) throw listingsRes.error;
      if (requirementsRes.error) throw requirementsRes.error;
      if (jobsRes.error) throw jobsRes.error;
      if (notificationsRes.error) {
        // Notifications are optional for the dashboard. Do not block the page.
        console.warn("Notifications query:", notificationsRes.error.message);
      }

      setUsers(usersRes.data || []);
      setListings(listingsRes.data || []);
      setRequirements(requirementsRes.data || []);
      setJobs(jobsRes.data || []);
      setNotifications(notificationsRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load Admin Dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    const channel = supabase
      .channel("admin-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => loadAdminData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeSection, search]);

  const pendingListings = useMemo(
    () => listings.filter((item) => item.status === "pending"),
    [listings]
  );

  const approvedListings = useMemo(
    () => listings.filter((item) => item.status === "approved"),
    [listings]
  );

  const rejectedListings = useMemo(
    () => listings.filter((item) => item.status === "rejected"),
    [listings]
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [
        u.name,
        u.role,
        u.phone,
        u.location,
        u.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, search]);

  const filteredListings = useMemo(() => {
    let source = listings;

    if (activeSection === "approvals") source = pendingListings;
    if (activeSection === "rejected") source = rejectedListings;
    if (activeSection === "listings") source = approvedListings;

    const q = search.trim().toLowerCase();
    if (!q) return source;

    return source.filter((item) =>
      [
        item.title,
        item.wood_type,
        item.product_type,
        item.service_type,
        item.work_type,
        item.location,
        item.description,
        item.profiles?.name,
        item.profiles?.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [
    listings,
    pendingListings,
    rejectedListings,
    approvedListings,
    activeSection,
    search,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      (activeSection === "users"
        ? filteredUsers.length
        : activeSection === "requirements"
        ? requirements.length
        : activeSection === "jobs"
        ? jobs.length
        : filteredListings.length) / PAGE_SIZE
    )
  );

  const visibleUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const visibleListings = filteredListings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const visibleRequirements = requirements.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const visibleJobs = jobs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const reviewListing = async (listingId, status, note = null) => {
    setReviewingId(listingId);
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc("review_listing", {
        p_listing_id: listingId,
        p_status: status,
        p_note: note || null,
      });

      if (rpcError) throw rpcError;

      setReviewModal(null);
      setReviewNote("");
      await loadAdminData();
    } catch (err) {
      console.error(err);
      setError(err.message || `Unable to ${status} listing.`);
    } finally {
      setReviewingId(null);
    }
  };

  const openRejectModal = (listing) => {
    setReviewModal({ type: "reject", listing });
    setReviewNote("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const goSection = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const statCards = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      tone: "green",
      change: "Registered accounts",
    },
    {
      label: "Total Listings",
      value: listings.length,
      icon: ShoppingBag,
      tone: "blue",
      change: `${approvedListings.length} live`,
    },
    {
      label: "Total Requirements",
      value: requirements.length,
      icon: ClipboardList,
      tone: "purple",
      change: "Requirement Wall",
    },
    {
      label: "Total Jobs",
      value: jobs.length,
      icon: BriefcaseBusiness,
      tone: "orange",
      change: "Job posts",
    },
    {
      label: "Pending Approvals",
      value: pendingListings.length,
      icon: AlertTriangle,
      tone: "teal",
      change: "Needs admin review",
    },
    {
      label: "Rejected Listings",
      value: rejectedListings.length,
      icon: XCircle,
      tone: "red",
      change: "Review history",
    },
  ];

  const recentUsers = users.slice(0, 6);
  const recentListings = listings.slice(0, 6);

  const roleCounts = users.reduce((acc, user) => {
    const role = roleLabel(user.role);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  if (error && !adminProfile) {
    return (
      <div className="admin-access-error">
        <div className="admin-error-card">
          <ShieldCheck size={48} />
          <h2>Admin access required</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-tree">
            <TreePine size={28} />
          </div>
          <div>
            <strong>TimberMart</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <button
          className={`admin-nav-item ${
            activeSection === "dashboard" ? "active" : ""
          }`}
          onClick={() => goSection("dashboard")}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <div className="admin-nav-title">USER MANAGEMENT</div>

        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          const badge =
            item.id === "approvals" && pendingListings.length > 0
              ? pendingListings.length
              : null;

          return (
            <button
              key={item.id}
              className={`admin-nav-item ${
                activeSection === item.id ? "active" : ""
              }`}
              onClick={() => goSection(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {badge ? <b className="nav-count">{badge}</b> : null}
            </button>
          );
        })}

        <div className="admin-sidebar-bottom">
          <div className="admin-admin-mini">
            <div className="admin-avatar">
              {adminProfile?.photo_url ? (
                <img src={adminProfile.photo_url} alt="" />
              ) : (
                <span>{(adminProfile?.name || "A").charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <strong>{adminProfile?.name || "Admin"}</strong>
              <small>Super Admin</small>
            </div>
          </div>

          <button className="admin-logout" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div className="admin-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users, listings, requirements, jobs..."
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="admin-top-actions">
            <button
              className="admin-icon-btn"
              onClick={() => goSection("notifications")}
              title="Notifications"
            >
              <Bell size={19} />
              {pendingListings.length > 0 && (
                <span className="top-badge">{pendingListings.length}</span>
              )}
            </button>

            <div className="admin-profile-menu">
              <div className="admin-avatar small">
                {adminProfile?.photo_url ? (
                  <img src={adminProfile.photo_url} alt="" />
                ) : (
                  <span>{(adminProfile?.name || "A").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="admin-profile-text">
                <strong>{adminProfile?.name || "Admin"}</strong>
                <small>Super Admin</small>
              </div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <section className="admin-content">
          <div className="admin-page-heading">
            <div>
              <h1>
                {activeSection === "dashboard"
                  ? "Dashboard Overview"
                  : activeSection === "approvals"
                  ? "Listing Approvals"
                  : activeSection === "rejected"
                  ? "Rejected Listings"
                  : activeSection === "listings"
                  ? "Live Timber Listings"
                  : roleLabel(activeSection)}
              </h1>
              <p>
                {activeSection === "dashboard"
                  ? "Welcome back, Admin! Here is what is happening on TimberMart."
                  : "Manage TimberMart data and keep the marketplace safe."}
              </p>
            </div>

            <div className="admin-date-pill">
              <Activity size={15} />
              Live Data
            </div>
          </div>

          {error && <div className="admin-inline-error">{error}</div>}

          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              Loading Admin Dashboard...
            </div>
          ) : (
            <>
              {activeSection === "dashboard" && (
                <>
                  <div className="admin-stats-grid">
                    {statCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <button
                          className="admin-stat-card"
                          key={card.label}
                          onClick={() => {
                            if (card.label === "Pending Approvals") {
                              goSection("approvals");
                            } else if (card.label === "Rejected Listings") {
                              goSection("rejected");
                            } else if (card.label === "Total Listings") {
                              goSection("listings");
                            } else if (card.label === "Total Users") {
                              goSection("users");
                            }
                          }}
                        >
                          <div className={`stat-icon ${card.tone}`}>
                            <Icon size={21} />
                          </div>
                          <div className="stat-info">
                            <span>{card.label}</span>
                            <strong>{card.value.toLocaleString("en-IN")}</strong>
                            <small>{card.change}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="admin-dashboard-grid">
                    <section className="admin-panel activity-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Platform Activity</h2>
                          <span>Current database overview</span>
                        </div>
                        <BarChart3 size={20} />
                      </div>

                      <div className="activity-bars">
                        {[
                          ["Users", users.length],
                          ["Listings", listings.length],
                          ["Requirements", requirements.length],
                          ["Jobs", jobs.length],
                          ["Pending", pendingListings.length],
                        ].map(([label, value]) => {
                          const max = Math.max(
                            users.length,
                            listings.length,
                            requirements.length,
                            jobs.length,
                            pendingListings.length,
                            1
                          );
                          const width = Math.max(5, (value / max) * 100);

                          return (
                            <div className="activity-row" key={label}>
                              <div className="activity-label">
                                <span>{label}</span>
                                <strong>{value}</strong>
                              </div>
                              <div className="activity-track">
                                <span style={{ width: `${width}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="admin-panel role-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Users by Role</h2>
                          <span>Registered profiles</span>
                        </div>
                        <Users size={20} />
                      </div>

                      <div className="role-list">
                        {Object.entries(roleCounts).map(([role, count]) => (
                          <div className="role-row" key={role}>
                            <span className="role-dot" />
                            <span>{role}</span>
                            <strong>{count}</strong>
                          </div>
                        ))}
                        {!Object.keys(roleCounts).length && (
                          <div className="admin-empty">No users found.</div>
                        )}
                      </div>
                    </section>

                    <section className="admin-panel pending-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Pending Approvals</h2>
                          <span>Listings waiting for review</span>
                        </div>
                        <button
                          className="panel-link"
                          onClick={() => goSection("approvals")}
                        >
                          View All
                        </button>
                      </div>

                      {pendingListings.slice(0, 5).map((listing) => (
                        <div className="pending-row" key={listing.id}>
                          <div className="pending-thumb">
                            {listing.listing_images?.[0]?.image_url ? (
                              <img
                                src={listing.listing_images[0].image_url}
                                alt=""
                              />
                            ) : (
                              <TreePine size={18} />
                            )}
                          </div>
                          <div className="pending-info">
                            <strong>{listing.title}</strong>
                            <span>
                              {listing.profiles?.name || "Unknown seller"} •{" "}
                              {formatDate(listing.created_at)}
                            </span>
                          </div>
                          <button
                            className="view-mini-btn"
                            onClick={() => goSection("approvals")}
                            title="Review"
                          >
                            <Eye size={17} />
                          </button>
                        </div>
                      ))}

                      {!pendingListings.length && (
                        <div className="admin-empty success-empty">
                          <CheckCircle2 size={28} />
                          <span>No pending listings.</span>
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="admin-two-column">
                    <section className="admin-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Recent Users</h2>
                          <span>Latest registered profiles</span>
                        </div>
                        <button
                          className="panel-link"
                          onClick={() => goSection("users")}
                        >
                          View All
                        </button>
                      </div>

                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Role</th>
                              <th>Location</th>
                              <th>Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentUsers.map((user) => (
                              <tr key={user.id}>
                                <td>
                                  <div className="table-user">
                                    <div className="table-avatar">
                                      {user.photo_url ? (
                                        <img src={user.photo_url} alt="" />
                                      ) : (
                                        <span>
                                          {(user.name || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <strong>{user.name || "Unnamed User"}</strong>
                                  </div>
                                </td>
                                <td>{roleLabel(user.role)}</td>
                                <td>{user.location || "—"}</td>
                                <td>{formatDate(user.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="admin-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Recent Listings</h2>
                          <span>Latest marketplace activity</span>
                        </div>
                        <button
                          className="panel-link"
                          onClick={() => goSection("listings")}
                        >
                          View All
                        </button>
                      </div>

                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Listing</th>
                              <th>Seller</th>
                              <th>Status</th>
                              <th>Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentListings.map((listing) => (
                              <tr key={listing.id}>
                                <td>
                                  <div className="table-listing">
                                    <div className="listing-mini-thumb">
                                      {listing.listing_images?.[0]?.image_url ? (
                                        <img
                                          src={listing.listing_images[0].image_url}
                                          alt=""
                                        />
                                      ) : (
                                        <TreePine size={16} />
                                      )}
                                    </div>
                                    <strong>{listing.title}</strong>
                                  </div>
                                </td>
                                <td>{listing.profiles?.name || "—"}</td>
                                <td>
                                  <StatusBadge status={listing.status} />
                                </td>
                                <td>{money(listing.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>

                  <div className="quick-actions">
                    <button onClick={() => goSection("users")}>
                      <Users size={19} />
                      Add / Manage Users
                    </button>
                    <button onClick={() => goSection("approvals")}>
                      <UserCheck size={19} />
                      Review Listings
                    </button>
                    <button onClick={() => goSection("requirements")}>
                      <ClipboardList size={19} />
                      Requirements
                    </button>
                    <button onClick={() => goSection("jobs")}>
                      <BriefcaseBusiness size={19} />
                      Manage Jobs
                    </button>
                    <button onClick={() => goSection("notifications")}>
                      <Bell size={19} />
                      Notifications
                    </button>
                    <button onClick={() => goSection("analytics")}>
                      <BarChart3 size={19} />
                      Analytics
                    </button>
                  </div>
                </>
              )}

              {activeSection === "approvals" && (
                <section className="admin-panel full-panel">
                  <div className="approval-header">
                    <div>
                      <h2>Pending Timber Listing Approvals</h2>
                      <p>
                        Every new timber listing stays hidden from the public
                        marketplace until an Admin approves it.
                      </p>
                    </div>
                    <span className="approval-count">
                      {pendingListings.length} Pending
                    </span>
                  </div>

                  {visibleListings.length ? (
                    <div className="approval-grid">
                      {visibleListings.map((listing) => (
                        <article className="approval-card" key={listing.id}>
                          <div className="approval-image">
                            {listing.listing_images?.[0]?.image_url ? (
                              <img
                                src={listing.listing_images[0].image_url}
                                alt={listing.title}
                              />
                            ) : (
                              <TreePine size={42} />
                            )}
                            <span>Pending Review</span>
                          </div>

                          <div className="approval-body">
                            <div className="approval-title-row">
                              <h3>{listing.title}</h3>
                              <StatusBadge status="pending" />
                            </div>

                            <div className="approval-meta">
                              <span>
                                Seller:{" "}
                                <strong>
                                  {listing.profiles?.name || "Unknown"}
                                </strong>
                              </span>
                              <span>
                                Role: {roleLabel(listing.profiles?.role)}
                              </span>
                              <span>
                                Location: {listing.location || "—"}
                              </span>
                              <span>Posted: {formatDate(listing.created_at)}</span>
                            </div>

                            <div className="approval-details">
                              <div>
                                <small>Wood</small>
                                <strong>{listing.wood_type || "—"}</strong>
                              </div>
                              <div>
                                <small>Product</small>
                                <strong>{listing.product_type || "—"}</strong>
                              </div>
                              <div>
                                <small>Quantity</small>
                                <strong>{listing.quantity || "—"}</strong>
                              </div>
                              <div>
                                <small>Price</small>
                                <strong>{money(listing.price)}</strong>
                              </div>
                            </div>

                            {listing.description && (
                              <p className="approval-description">
                                {listing.description}
                              </p>
                            )}

                            <div className="approval-actions">
                              <button
                                className="approve-btn"
                                disabled={reviewingId === listing.id}
                                onClick={() =>
                                  reviewListing(listing.id, "approved")
                                }
                              >
                                <CheckCircle2 size={18} />
                                {reviewingId === listing.id
                                  ? "Processing..."
                                  : "Approve & Publish"}
                              </button>

                              <button
                                className="reject-btn"
                                disabled={reviewingId === listing.id}
                                onClick={() => openRejectModal(listing)}
                              >
                                <XCircle size={18} />
                                Reject
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-empty large">
                      <CheckCircle2 size={42} />
                      <h3>All caught up</h3>
                      <p>No timber listings are waiting for approval.</p>
                    </div>
                  )}

                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    setPage={setPage}
                  />
                </section>
              )}

              {activeSection === "rejected" && (
                <section className="admin-panel full-panel">
                  <div className="approval-header">
                    <div>
                      <h2>Rejected Listings</h2>
                      <p>Listings rejected by Admin are kept here for history.</p>
                    </div>
                    <span className="rejected-count">
                      {rejectedListings.length} Rejected
                    </span>
                  </div>

                  {visibleListings.length ? (
                    <div className="admin-table-wrap">
                      <table className="admin-table large-table">
                        <thead>
                          <tr>
                            <th>Listing</th>
                            <th>Seller</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleListings.map((listing) => (
                            <tr key={listing.id}>
                              <td>
                                <div className="table-listing">
                                  <div className="listing-mini-thumb">
                                    {listing.listing_images?.[0]?.image_url ? (
                                      <img
                                        src={listing.listing_images[0].image_url}
                                        alt=""
                                      />
                                    ) : (
                                      <TreePine size={16} />
                                    )}
                                  </div>
                                  <strong>{listing.title}</strong>
                                </div>
                              </td>
                              <td>{listing.profiles?.name || "—"}</td>
                              <td>{listing.location || "—"}</td>
                              <td>
                                <StatusBadge status="rejected" />
                              </td>
                              <td>{formatDate(listing.created_at)}</td>
                              <td>
                                <button
                                  className="small-review-btn"
                                  onClick={() =>
                                    reviewListing(listing.id, "approved")
                                  }
                                  disabled={reviewingId === listing.id}
                                >
                                  Re-approve
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="admin-empty large">
                      <XCircle size={40} />
                      <h3>No rejected listings</h3>
                    </div>
                  )}
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    setPage={setPage}
                  />
                </section>
              )}

              {activeSection === "listings" && (
                <DataTable
                  title="Live Timber Listings"
                  subtitle="Only approved listings are visible to normal marketplace users."
                  rows={visibleListings}
                  total={approvedListings.length}
                  page={page}
                  totalPages={totalPages}
                  setPage={setPage}
                  type="listings"
                />
              )}

              {activeSection === "users" && (
                <DataTable
                  title="All Users"
                  subtitle="All registered TimberMart profiles."
                  rows={visibleUsers}
                  total={filteredUsers.length}
                  page={page}
                  totalPages={totalPages}
                  setPage={setPage}
                  type="users"
                />
              )}

              {activeSection === "requirements" && (
                <DataTable
                  title="Requirements"
                  subtitle="Requirement Wall posts from users."
                  rows={visibleRequirements}
                  total={requirements.length}
                  page={page}
                  totalPages={totalPages}
                  setPage={setPage}
                  type="requirements"
                />
              )}

              {activeSection === "jobs" && (
                <DataTable
                  title="Jobs"
                  subtitle="Job posts created by businesses and users."
                  rows={visibleJobs}
                  total={jobs.length}
                  page={page}
                  totalPages={totalPages}
                  setPage={setPage}
                  type="jobs"
                />
              )}

              {activeSection === "notifications" && (
                <section className="admin-panel full-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Notifications</h2>
                      <span>Recent system notifications</span>
                    </div>
                    <Bell size={20} />
                  </div>

                  <div className="notification-list">
                    {notifications.length ? (
                      notifications.map((item) => (
                        <div className="admin-notification-row" key={item.id}>
                          <div className="notification-icon">
                            <Bell size={17} />
                          </div>
                          <div>
                            <strong>{item.title || "TimberMart Notification"}</strong>
                            <p>{item.message || item.body || "—"}</p>
                            <small>{formatDate(item.created_at)}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="admin-empty large">
                        <Bell size={40} />
                        <h3>No notifications</h3>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeSection === "analytics" && (
                <section className="admin-panel full-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Analytics</h2>
                      <span>Live counts from your TimberMart database</span>
                    </div>
                    <BarChart3 size={20} />
                  </div>

                  <div className="analytics-grid">
                    <Metric title="Users" value={users.length} />
                    <Metric title="All Listings" value={listings.length} />
                    <Metric title="Live Listings" value={approvedListings.length} />
                    <Metric title="Pending" value={pendingListings.length} />
                    <Metric title="Rejected" value={rejectedListings.length} />
                    <Metric title="Requirements" value={requirements.length} />
                    <Metric title="Jobs" value={jobs.length} />
                  </div>
                </section>
              )}

              {["messages", "verification", "settings"].includes(activeSection) && (
                <section className="admin-panel feature-placeholder">
                  <div className="placeholder-icon">
                    {activeSection === "messages" ? (
                      <MessageSquare size={32} />
                    ) : activeSection === "verification" ? (
                      <ShieldCheck size={32} />
                    ) : (
                      <Settings size={32} />
                    )}
                  </div>
                  <h2>{roleLabel(activeSection)}</h2>
                  <p>
                    This section is ready in the Admin navigation. Connect its
                    specific workflow when you want to manage this area.
                  </p>
                </section>
              )}
            </>
          )}
        </section>
      </main>

      {reviewModal?.type === "reject" && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <button
              className="modal-close"
              onClick={() => setReviewModal(null)}
            >
              <X size={20} />
            </button>

            <div className="modal-icon reject">
              <XCircle size={27} />
            </div>
            <h2>Reject Listing</h2>
            <p>
              You are rejecting <strong>{reviewModal.listing?.title}</strong>.
              Add a reason so the seller knows what needs to be corrected.
            </p>

            <label>Rejection reason</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Example: Photos are not clear, price information is missing..."
              rows={5}
            />

            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setReviewModal(null)}
              >
                Cancel
              </button>
              <button
                className="reject-btn"
                disabled={!reviewNote.trim() || reviewingId === reviewModal.listing?.id}
                onClick={() =>
                  reviewListing(
                    reviewModal.listing.id,
                    "rejected",
                    reviewNote.trim()
                  )
                }
              >
                <XCircle size={18} />
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="admin-pagination">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <span>
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{Number(value || 0).toLocaleString("en-IN")}</strong>
    </div>
  );
}

function DataTable({
  title,
  subtitle,
  rows,
  total,
  page,
  totalPages,
  setPage,
  type,
}) {
  return (
    <section className="admin-panel full-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <span>
            {subtitle} • {total.toLocaleString("en-IN")} records
          </span>
        </div>
        <FileText size={20} />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table large-table">
          <thead>
            {type === "users" ? (
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Joined</th>
              </tr>
            ) : type === "listings" ? (
              <tr>
                <th>Listing</th>
                <th>Seller</th>
                <th>Wood</th>
                <th>Location</th>
                <th>Status</th>
                <th>Price</th>
                <th>Posted</th>
              </tr>
            ) : type === "requirements" ? (
              <tr>
                <th>Requirement</th>
                <th>Posted By</th>
                <th>Category</th>
                <th>Location</th>
                <th>Budget</th>
                <th>Posted</th>
              </tr>
            ) : (
              <tr>
                <th>Job</th>
                <th>Posted By</th>
                <th>Job Type</th>
                <th>Location</th>
                <th>Salary</th>
                <th>Posted</th>
              </tr>
            )}
          </thead>

          <tbody>
            {rows.map((row) => {
              if (type === "users") {
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="table-user">
                        <div className="table-avatar">
                          {row.photo_url ? (
                            <img src={row.photo_url} alt="" />
                          ) : (
                            <span>{(row.name || "U").charAt(0)}</span>
                          )}
                        </div>
                        <strong>{row.name || "Unnamed User"}</strong>
                      </div>
                    </td>
                    <td>{roleLabel(row.role)}</td>
                    <td>{row.phone || "—"}</td>
                    <td>{row.location || "—"}</td>
                    <td>{formatDate(row.created_at)}</td>
                  </tr>
                );
              }

              if (type === "listings") {
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="table-listing">
                        <div className="listing-mini-thumb">
                          {row.listing_images?.[0]?.image_url ? (
                            <img
                              src={row.listing_images[0].image_url}
                              alt=""
                            />
                          ) : (
                            <TreePine size={16} />
                          )}
                        </div>
                        <strong>{row.title}</strong>
                      </div>
                    </td>
                    <td>{row.profiles?.name || "—"}</td>
                    <td>{row.wood_type || row.product_type || "—"}</td>
                    <td>{row.location || "—"}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>{money(row.price)}</td>
                    <td>{formatDate(row.created_at)}</td>
                  </tr>
                );
              }

              if (type === "requirements") {
                return (
                  <tr key={row.id}>
                    <td><strong>{row.title}</strong></td>
                    <td>{row.profiles?.name || "—"}</td>
                    <td>{row.category_label || row.category || "—"}</td>
                    <td>{row.location || "—"}</td>
                    <td>{row.budget || "—"}</td>
                    <td>{formatDate(row.created_at)}</td>
                  </tr>
                );
              }

              return (
                <tr key={row.id}>
                  <td><strong>{row.title}</strong></td>
                  <td>{row.profiles?.name || "—"}</td>
                  <td>{row.job_type || "—"}</td>
                  <td>{row.location || "—"}</td>
                  <td>{row.salary || "—"}</td>
                  <td>{formatDate(row.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!rows.length && (
          <div className="admin-empty">
            <FileText size={34} />
            <span>No records found.</span>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </section>
  );
}

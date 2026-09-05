
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import "./AdminDashboard.css";

/*
  TimberMart Admin Dashboard
  --------------------------
  Standalone file:
  - No UsersManagement import
  - No Settings import
  - No chart library required
  - Supabase client: ../supabaseClient

  Main admin areas:
  Dashboard
  Approval Center
  Users
  Listings
  Requirements
  Notifications
  Locations
  Analytics
  Revenue & Payments
  Reports & Moderation
  Settings
*/

const MENU = [
  { id: "Dashboard", icon: "⌂", label: "Dashboard" },
  { id: "Approval Center", icon: "✓", label: "Approval Center", approval: true },
  { id: "Users", icon: "♟", label: "All Users" },
  { id: "Farmers", icon: "🌳", label: "Farmers" },
  { id: "Buyers", icon: "🏠", label: "Buyers" },
  { id: "Merchants", icon: "🏪", label: "Merchants" },
  { id: "Carpenters", icon: "🛠", label: "Carpenters" },
  { id: "Workers", icon: "👷", label: "Workers" },
  { id: "Businesses", icon: "🏭", label: "Businesses" },
  { id: "Listings", icon: "🪵", label: "Listings", arrow: true },
  { id: "Requirements", icon: "📋", label: "Requirements", arrow: true },
  { id: "Jobs", icon: "💼", label: "Jobs", arrow: true },
  { id: "Notifications", icon: "🔔", label: "Notifications" },
  { id: "Admin Posts", icon: "📢", label: "Admin Posts & Ads" },
  { id: "Locations", icon: "⌖", label: "Locations" },
  { id: "Analytics", icon: "▥", label: "Analytics" },
  { id: "Reports", icon: "⚠", label: "Reports & Moderation" },
  { id: "Settings", icon: "⚙", label: "Settings" },
  { id: "Admin Security", icon: "🔐", label: "Admin & Security" },
  { id: "System Logs", icon: "▤", label: "System Logs" },
];

const ROLE_LABELS = {
  buyer: "Buyer",
  farmer: "Farmer",
  timber_merchant: "Merchant",
  sawmill_business: "Business",
  carpenter: "Carpenter",
  worker: "Worker",
  admin: "Admin",
  other: "Other",
};

const ROLE_COLORS = {
  buyer: "#3f78d6",
  farmer: "#2f9960",
  timber_merchant: "#8154c7",
  sawmill_business: "#e58a28",
  carpenter: "#e05c4f",
  worker: "#1c9b9a",
  admin: "#d94666",
  other: "#9aa4ad",
};

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();

  if (["buyer", "customer", "homeowner"].includes(value)) return "buyer";
  if (["farmer", "seller", "tree_seller"].includes(value)) return "farmer";
  if (["merchant", "timber_merchant", "timber merchant"].includes(value)) {
    return "timber_merchant";
  }
  if (
    [
      "sawmill",
      "sawmill_business",
      "sawmill business",
      "wood_business",
      "wood business",
    ].includes(value)
  ) {
    return "sawmill_business";
  }
  if (["carpenter", "service_provider"].includes(value)) return "carpenter";
  if (["worker", "job_seeker", "job seeker"].includes(value)) return "worker";
  if (["admin", "administrator"].includes(value)) return "admin";
  return "other";
}

function displayName(row) {
  return (
    row?.name ||
    row?.full_name ||
    row?.fullName ||
    row?.display_name ||
    row?.username ||
    row?.email ||
    "User"
  );
}

function listingTitle(row) {
  return (
    row?.title ||
    row?.tree_type ||
    row?.species ||
    row?.category ||
    "Timber Listing"
  );
}

function requirementTitle(row) {
  return (
    row?.title ||
    row?.species ||
    row?.category ||
    row?.custom_requirement ||
    "Buyer Requirement"
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPending(row) {
  const status = String(row?.status || "").toLowerCase();
  return (
    !status ||
    ["pending", "under_review", "requested", "waiting", "submitted"].includes(
      status
    )
  );
}

function statusClass(status) {
  const value = String(status || "pending").toLowerCase();

  if (["approved", "active", "verified", "accepted", "completed"].includes(value)) {
    return "tm-status approved";
  }

  if (["rejected", "blocked", "cancelled", "suspended"].includes(value)) {
    return "tm-status rejected";
  }

  if (["reported", "flagged"].includes(value)) {
    return "tm-status reported";
  }

  return "tm-status pending";
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function DonutChart({ counts, total }) {
  const segments = [
    ["buyer", counts.buyer],
    ["farmer", counts.farmer],
    ["timber_merchant", counts.timber_merchant],
    ["sawmill_business", counts.sawmill_business],
    ["carpenter", counts.carpenter],
    ["worker", counts.worker],
    ["admin", counts.admin],
    ["other", counts.other],
  ];

  let current = 0;

  const stops = segments.map(([role, value]) => {
    const amount = total ? (value / total) * 360 : 0;
    const start = current;
    const end = current + amount;
    current = end;
    return `${ROLE_COLORS[role]} ${start}deg ${end}deg`;
  });

  const background = total
    ? `conic-gradient(${stops.join(", ")})`
    : "conic-gradient(#e8eeeb 0deg 360deg)";

  return (
    <div className="tm-donut" style={{ background }}>
      <div className="tm-donut-hole">
        <strong>{total.toLocaleString("en-IN")}</strong>
        <span>Total Users</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="tm-section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button type="button" className="tm-link-button" onClick={onAction}>
          {action} →
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon = "📭", title = "No data", text = "" }) {
  return (
    <div className="tm-empty">
      <div>{icon}</div>
      <strong>{title}</strong>
      {text && <span>{text}</span>}
    </div>
  );
}

export default function AdminDashboard({ onBack }) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const [announcement, setAnnouncement] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("TimberMart Admin");
  const [announcementRole, setAnnouncementRole] = useState("all");

  const [adminPosts, setAdminPosts] = useState([]);
  const [postTitle, setPostTitle] = useState("");
  const [postMessage, setPostMessage] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState("");
  const [postImageUploading, setPostImageUploading] = useState(false);
  const [postType, setPostType] = useState("announcement");

  const loadUsers = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (queryError) {
      console.warn("profiles:", queryError.message);
      setUsers([]);
      return;
    }

    setUsers(data || []);
  }, []);

  const loadListings = useCallback(async () => {
    for (const table of ["listings", "timber_listings"]) {
      const { data, error: queryError } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!queryError) {
        setListings(data || []);
        return;
      }
    }
    setListings([]);
  }, []);

  const loadRequirements = useCallback(async () => {
    for (const table of ["requirements", "buyer_requirements"]) {
      const { data, error: queryError } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!queryError) {
        setRequirements(data || []);
        return;
      }
    }
    setRequirements([]);
  }, []);

  const loadAdminPosts = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("admin_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (queryError) {
      console.warn("admin_posts:", queryError.message);
      setAdminPosts([]);
      return;
    }

    setAdminPosts(data || []);
  }, []);

  const loadNotifications = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (queryError) {
      console.warn("notifications:", queryError.message);
      setNotifications([]);
      return;
    }

    setNotifications(data || []);
  }, []);

  const loadAll = useCallback(async (refresh = false) => {
    setError("");
    if (refresh) setRefreshing(true);
    else setLoading(true);

    await Promise.all([
      loadUsers(),
      loadListings(),
      loadRequirements(),
      loadNotifications(),
      loadAdminPosts(),
    ]);

    if (refresh) setRefreshing(false);
    else setLoading(false);
  }, [loadUsers, loadListings, loadRequirements, loadNotifications, loadAdminPosts]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const roleCounts = useMemo(() => {
    const result = {
      buyer: 0,
      farmer: 0,
      timber_merchant: 0,
      sawmill_business: 0,
      carpenter: 0,
      worker: 0,
      admin: 0,
      other: 0,
    };

    users.forEach((user) => {
      result[normalizeRole(user.role)] += 1;
    });

    return result;
  }, [users]);

  const pendingListings = useMemo(
    () => listings.filter(isPending),
    [listings]
  );

  const pendingRequirements = useMemo(
    () => requirements.filter(isPending),
    [requirements]
  );

  const unreadNotifications = useMemo(
    () =>
      notifications.filter(
        (n) => n.is_read === false || n.is_read == null || n.read === false
      ),
    [notifications]
  );

  const pendingTotal = pendingListings.length + pendingRequirements.length;

  const approvedListings = useMemo(
    () =>
      listings.filter((row) =>
        ["approved", "active", "published", "live"].includes(
          String(row.status || "").toLowerCase()
        )
      ),
    [listings]
  );

  const growthData = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i -= 1) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const value = users.filter((user) => {
        const created = new Date(user.created_at);
        return created >= start && created < end;
      }).length;

      days.push({
        label: start.toLocaleDateString("en-IN", { weekday: "short" }),
        value,
      });
    }

    return days;
  }, [users]);

  const maxGrowth = Math.max(1, ...growthData.map((d) => d.value));

  const recentUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users.slice(0, 8);

    return users
      .filter((user) =>
        [
          displayName(user),
          user.email,
          user.phone,
          user.city,
          user.state,
          ROLE_LABELS[normalizeRole(user.role)],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
      .slice(0, 30);
  }, [users, search]);

  const filteredListings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return listings.filter((row) => {
      if (!term) return true;
      return [
        listingTitle(row),
        row.category,
        row.species,
        row.tree_type,
        row.city,
        row.state,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [listings, search]);

  const filteredRequirements = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requirements.filter((row) => {
      if (!term) return true;
      return [
        requirementTitle(row),
        row.category,
        row.species,
        row.city,
        row.state,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [requirements, search]);

  async function updateRowStatus(type, id, status) {
    if (!id) return;

    setBusyId(`${type}-${id}`);
    setError("");

    const tables =
      type === "listing"
        ? ["listings", "timber_listings"]
        : ["requirements", "buyer_requirements"];

    let success = false;

    for (const table of tables) {
      const { error: queryError } = await supabase
        .from(table)
        .update({ status })
        .eq("id", id);

      if (!queryError) {
        success = true;
        break;
      }
    }

    if (!success) {
      setError(
        `Could not ${status === "approved" ? "approve" : "reject"} this ${
          type === "listing" ? "listing" : "requirement"
        }. Check your Supabase UPDATE policy.`
      );
    } else if (type === "listing") {
      setListings((current) =>
        current.map((row) => (row.id === id ? { ...row, status } : row))
      );
    } else {
      setRequirements((current) =>
        current.map((row) => (row.id === id ? { ...row, status } : row))
      );
    }

    setBusyId("");
  }

  async function markRead(id) {
    if (!id) return;

    setBusyId(`notification-${id}`);

    const { error: queryError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!queryError) {
      setNotifications((current) =>
        current.map((row) =>
          row.id === id ? { ...row, is_read: true } : row
        )
      );
    }

    setBusyId("");
  }

  async function sendAnnouncement() {
    const message = announcement.trim();
    const title = announcementTitle.trim() || "TimberMart Admin";

    if (!message) {
      setError("Enter a notification message first.");
      return;
    }

    setBusyId("announcement");
    setError("");

    const { data, error: queryError } = await supabase.rpc(
      "admin_send_announcement",
      {
        p_title: title,
        p_message: message,
        p_target_role: announcementRole,
      }
    );

    if (queryError) {
      setError(`Notification failed: ${queryError.message}`);
    } else {
      setAnnouncement("");
      setAnnouncementTitle("TimberMart Admin");
      const result = Array.isArray(data) ? data[0] : data;
      const sent = Number(result?.recipients_count ?? result?.count ?? data ?? 0);
      setError(`Announcement sent successfully to ${sent} user${sent === 1 ? "" : "s"}.`);
      await loadNotifications();
    }

    setBusyId("");
  }

  function handlePostImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file only.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    if (postImagePreview) {
      URL.revokeObjectURL(postImagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setPostImageFile(file);
    setPostImagePreview(previewUrl);
    setPostImageUrl("");
    setError("");
  }

  function removePostImage() {
    if (postImagePreview) {
      URL.revokeObjectURL(postImagePreview);
    }
    setPostImageFile(null);
    setPostImagePreview("");
    setPostImageUrl("");
  }

  async function uploadAdminPostImage(file, userId) {
    if (!file) return null;

    const extension = file.name.includes(".")
      ? file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "")
      : "jpg";

    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "admin-post";

    const path = `admin-posts/${userId}/${crypto.randomUUID()}-${safeName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("admin-post-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("admin-post-images")
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("Could not create the uploaded image URL.");
    }

    return data.publicUrl;
  }

  async function publishAdminPost() {
    const title = postTitle.trim();
    const message = postMessage.trim();

    if (!title || !message) {
      setError("Enter both post title and post content.");
      return;
    }

    if (!postImageFile) {
      setError("Please select an image for the admin post/ad.");
      return;
    }

    setBusyId("admin-post");
    setPostImageUploading(true);
    setError("");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error("Admin session not found. Please login again.");
      }

      const uploadedImageUrl = await uploadAdminPostImage(postImageFile, userData.user.id);

      const { data, error: queryError } = await supabase.rpc(
        "admin_publish_post",
        {
          p_title: title,
          p_message: message,
          p_image_url: uploadedImageUrl,
          p_post_type: postType,
        }
      );

      if (queryError) {
        throw new Error(queryError.message);
      }

      const result = Array.isArray(data) ? data[0] : data;
      const sent = Number(result?.recipients_count || 0);

      if (postImagePreview) {
        URL.revokeObjectURL(postImagePreview);
      }

      setPostTitle("");
      setPostMessage("");
      setPostImageUrl("");
      setPostImageFile(null);
      setPostImagePreview("");
      setPostType("announcement");

      setError(
        `Post published successfully. ${sent} user${sent === 1 ? "" : "s"} notified.`
      );

      await Promise.all([loadAdminPosts(), loadNotifications()]);
    } catch (uploadOrPublishError) {
      setError(`Admin post failed: ${uploadOrPublishError.message || "Unknown error"}`);
    } finally {
      setPostImageUploading(false);
      setBusyId("");
    }
  }

  function openMenu(menu) {
    setActiveMenu(menu);
    setSearch("");
    setMobileNav(false);
  }

  function renderOverview() {
    const totalUsers = users.length;

    return (
      <>
        <section className="tm-overview-banner">
          <div>
            <span>ADMIN CONTROL CENTER</span>
            <h2>Dashboard Overview</h2>
            <p>
              Welcome back, Admin! Here&apos;s what&apos;s happening on
              TimberMart.
            </p>
          </div>

          <div className="tm-banner-buttons">
            <button onClick={() => openMenu("Users")} type="button">
              + Add User
            </button>
            <button onClick={() => openMenu("Approval Center")} type="button">
              Review Approvals
            </button>
          </div>
        </section>

        <section className="tm-stat-grid">
          <button className="tm-stat" onClick={() => openMenu("Users")} type="button">
            <div className="tm-stat-icon users">👥</div>
            <div><span>Total Users</span><strong>{totalUsers.toLocaleString("en-IN")}</strong><small>Registered profiles</small></div>
          </button>

          <button className="tm-stat" onClick={() => openMenu("Listings")} type="button">
            <div className="tm-stat-icon listings">🪵</div>
            <div><span>Total Listings</span><strong>{listings.length.toLocaleString("en-IN")}</strong><small>{approvedListings.length} active</small></div>
          </button>

          <button className="tm-stat" onClick={() => openMenu("Requirements")} type="button">
            <div className="tm-stat-icon requirements">📋</div>
            <div><span>Total Requirements</span><strong>{requirements.length.toLocaleString("en-IN")}</strong><small>{pendingRequirements.length} pending</small></div>
          </button>

          <button className="tm-stat" onClick={() => openMenu("Approval Center")} type="button">
            <div className="tm-stat-icon jobs">✓</div>
            <div><span>Pending Approvals</span><strong>{pendingTotal}</strong><small>Needs admin action</small></div>
          </button>

          <button className="tm-stat" onClick={() => openMenu("Notifications")} type="button">
            <div className="tm-stat-icon leads">🔔</div>
            <div><span>Unread Alerts</span><strong>{unreadNotifications.length}</strong><small>Platform notifications</small></div>
          </button>

          <button className="tm-stat" onClick={() => openMenu("Reports")} type="button">
            <div className="tm-stat-icon reports">⚠</div>
            <div><span>Reported Items</span><strong>{listings.filter((x) => String(x.status).toLowerCase() === "reported").length}</strong><small>Needs review</small></div>
          </button>
        </section>

        <section className="tm-main-grid">
          <div className="tm-card tm-activity-card">
            <SectionHeader title="Platform Activity" subtitle="New users created in the last 7 days" />

            <div className="tm-chart">
              <div className="tm-chart-y">
                <span>{maxGrowth}</span>
                <span>{Math.round(maxGrowth * 0.75)}</span>
                <span>{Math.round(maxGrowth * 0.5)}</span>
                <span>{Math.round(maxGrowth * 0.25)}</span>
                <span>0</span>
              </div>

              <div className="tm-chart-bars">
                {growthData.map((item) => (
                  <div className="tm-chart-col" key={item.label}>
                    <b>{item.value}</b>
                    <i style={{ height: `${Math.max(7, (item.value / maxGrowth) * 100)}%` }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="tm-card tm-role-card">
            <SectionHeader title="Users by Role" subtitle="Current registered users" />

            <div className="tm-role-layout">
              <DonutChart counts={roleCounts} total={totalUsers} />

              <div className="tm-role-list">
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <div key={role}>
                    <span>
                      <i style={{ background: ROLE_COLORS[role] }} />
                      {label}
                    </span>
                    <strong>{roleCounts[role]}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="tm-card tm-approval-preview">
          <SectionHeader
            title="Pending Approvals"
            subtitle="Items waiting for administrator review"
            action="Open Approval Center"
            onAction={() => openMenu("Approval Center")}
          />

          <div className="tm-approval-grid">
            {pendingListings.slice(0, 3).map((row) => (
              <div className="tm-approval-item" key={`l-${row.id}`}>
                <span className="tm-approval-icon">🪵</span>
                <div>
                  <strong>{listingTitle(row)}</strong>
                  <small>Timber Listing · {formatDate(row.created_at)}</small>
                </div>
                <div className="tm-mini-actions">
                  <button
                    type="button"
                    disabled={busyId === `listing-${row.id}`}
                    onClick={() => updateRowStatus("listing", row.id, "approved")}
                  >✓</button>
                  <button
                    type="button"
                    disabled={busyId === `listing-${row.id}`}
                    onClick={() => updateRowStatus("listing", row.id, "rejected")}
                  >×</button>
                </div>
              </div>
            ))}

            {pendingRequirements.slice(0, 3).map((row) => (
              <div className="tm-approval-item" key={`r-${row.id}`}>
                <span className="tm-approval-icon req">📋</span>
                <div>
                  <strong>{requirementTitle(row)}</strong>
                  <small>Buyer Requirement · {formatDate(row.created_at)}</small>
                </div>
                <div className="tm-mini-actions">
                  <button
                    type="button"
                    disabled={busyId === `requirement-${row.id}`}
                    onClick={() => updateRowStatus("requirement", row.id, "approved")}
                  >✓</button>
                  <button
                    type="button"
                    disabled={busyId === `requirement-${row.id}`}
                    onClick={() => updateRowStatus("requirement", row.id, "rejected")}
                  >×</button>
                </div>
              </div>
            ))}

            {!pendingTotal && (
              <EmptyState
                icon="✓"
                title="Everything is reviewed"
                text="There are no pending listings or requirements."
              />
            )}
          </div>
        </section>

        <section className="tm-two-grid">
          <div className="tm-card tm-table-card">
            <SectionHeader title="Recent Users" action="View All" onAction={() => openMenu("Users")} />
            <UserTable users={recentUsers} />
          </div>

          <div className="tm-card tm-table-card">
            <SectionHeader title="Recent Listings" action="View All" onAction={() => openMenu("Listings")} />
            <ListingTable
              listings={listings.slice(0, 7)}
              onApprove={(id) => updateRowStatus("listing", id, "approved")}
              onReject={(id) => updateRowStatus("listing", id, "rejected")}
              busyId={busyId}
            />
          </div>
        </section>

        <section className="tm-card tm-quick-actions">
          <SectionHeader title="Quick Actions" />

          <div className="tm-quick-grid">
            <button type="button" onClick={() => openMenu("Users")}>👤 <span>Add New User</span></button>
            <button type="button" onClick={() => openMenu("Listings")}>🪵 <span>Review Listings</span></button>
            <button type="button" onClick={() => openMenu("Requirements")}>📋 <span>Review Requirements</span></button>
            <button type="button" onClick={() => openMenu("Notifications")}>🔔 <span>Send Notification</span></button>
            <button type="button" onClick={() => openMenu("Reports")}>⚠ <span>View Reports</span></button>
            <button type="button" onClick={() => openMenu("System Logs")}>▤ <span>System Logs</span></button>
          </div>
        </section>
      </>
    );
  }

  function renderApprovalCenter() {
    return (
      <section className="tm-module">
        <SectionHeader
          title="Approval Center"
          subtitle={`${pendingTotal} items require administrator action`}
        />

        <div className="tm-approval-summary">
          <div><span>🪵</span><strong>{pendingListings.length}</strong><small>Pending Listings</small></div>
          <div><span>📋</span><strong>{pendingRequirements.length}</strong><small>Pending Requirements</small></div>
          <div><span>✓</span><strong>{approvedListings.length}</strong><small>Approved Listings</small></div>
        </div>

        <div className="tm-approval-section">
          <div className="tm-subheading">
            <div>
              <h3>Timber Listings Awaiting Approval</h3>
              <p>Check seller listing details before publishing.</p>
            </div>
            <span>{pendingListings.length}</span>
          </div>

          {pendingListings.length ? (
            <div className="tm-approval-table-wrap">
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Seller</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Created</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingListings.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{listingTitle(row)}</strong>
                        <small>{row.description || "Timber listing"}</small>
                      </td>
                      <td>{row.seller_name || row.owner_name || row.user_name || row.user_id || "Seller"}</td>
                      <td>{row.category || row.species || row.tree_type || "—"}</td>
                      <td>{[row.city, row.state].filter(Boolean).join(", ") || row.location || "—"}</td>
                      <td>{formatDate(row.created_at)}</td>
                      <td>
                        <div className="tm-decision-buttons">
                          <button
                            className="approve"
                            type="button"
                            disabled={busyId === `listing-${row.id}`}
                            onClick={() => updateRowStatus("listing", row.id, "approved")}
                          >✓ Approve</button>
                          <button
                            className="reject"
                            type="button"
                            disabled={busyId === `listing-${row.id}`}
                            onClick={() => updateRowStatus("listing", row.id, "rejected")}
                          >× Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="✓" title="No pending listings" text="All timber listings have been reviewed." />
          )}
        </div>

        <div className="tm-approval-section">
          <div className="tm-subheading">
            <div>
              <h3>Buyer Requirements Awaiting Approval</h3>
              <p>Review buyer demand before making it visible to sellers.</p>
            </div>
            <span>{pendingRequirements.length}</span>
          </div>

          {pendingRequirements.length ? (
            <div className="tm-approval-table-wrap">
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Buyer</th>
                    <th>Quantity</th>
                    <th>Budget</th>
                    <th>Location</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequirements.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{requirementTitle(row)}</strong>
                        <small>{row.description || "Buyer requirement"}</small>
                      </td>
                      <td>{row.buyer_name || row.owner_name || row.user_name || row.user_id || "Buyer"}</td>
                      <td>{row.quantity ? `${row.quantity} ${row.unit || ""}` : "—"}</td>
                      <td>{row.budget ? `₹${Number(row.budget).toLocaleString("en-IN")}` : "—"}</td>
                      <td>{[row.city, row.state].filter(Boolean).join(", ") || row.location || "—"}</td>
                      <td>
                        <div className="tm-decision-buttons">
                          <button
                            className="approve"
                            type="button"
                            disabled={busyId === `requirement-${row.id}`}
                            onClick={() => updateRowStatus("requirement", row.id, "approved")}
                          >✓ Approve</button>
                          <button
                            className="reject"
                            type="button"
                            disabled={busyId === `requirement-${row.id}`}
                            onClick={() => updateRowStatus("requirement", row.id, "rejected")}
                          >× Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="✓" title="No pending requirements" text="All buyer requirements have been reviewed." />
          )}
        </div>
      </section>
    );
  }

  function renderUsersPage(roleFilter = null) {
    const role = roleFilter ? normalizeRole(roleFilter) : null;
    const data = users.filter((user) => !role || normalizeRole(user.role) === role);

    const term = search.trim().toLowerCase();
    const filtered = term
      ? data.filter((user) =>
          [
            displayName(user),
            user.email,
            user.phone,
            user.city,
            user.state,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term)
        )
      : data;

    const title = role ? `${ROLE_LABELS[role]} Users` : "All Users";

    return (
      <section className="tm-module">
        <SectionHeader title={title} subtitle={`${filtered.length} users`} />

        <div className="tm-role-summary-grid">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <button type="button" key={key} onClick={() => openMenu(key === "buyer" ? "Buyers" : key === "farmer" ? "Farmers" : key === "timber_merchant" ? "Merchants" : key === "sawmill_business" ? "Businesses" : key === "carpenter" ? "Carpenters" : key === "worker" ? "Workers" : "Users")}>
              <span style={{ background: ROLE_COLORS[key] }}>{roleCounts[key]}</span>
              <div><strong>{label}</strong><small>Registered</small></div>
            </button>
          ))}
        </div>

        <div className="tm-card tm-inner-card">
          <UserTable users={filtered} full />
        </div>
      </section>
    );
  }

  function renderListingsPage() {
    return (
      <section className="tm-module">
        <SectionHeader title="Timber Listings" subtitle={`${filteredListings.length} listings`} action="Approval Center" onAction={() => openMenu("Approval Center")} />
        <div className="tm-card tm-inner-card">
          <ListingTable
            listings={filteredListings}
            full
            onApprove={(id) => updateRowStatus("listing", id, "approved")}
            onReject={(id) => updateRowStatus("listing", id, "rejected")}
            busyId={busyId}
          />
        </div>
      </section>
    );
  }

  function renderRequirementsPage() {
    return (
      <section className="tm-module">
        <SectionHeader title="Buyer Requirements" subtitle={`${filteredRequirements.length} requirements`} action="Approval Center" onAction={() => openMenu("Approval Center")} />
        <div className="tm-card tm-inner-card">
          {filteredRequirements.length ? (
            <div className="tm-table-scroll">
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Buyer</th>
                    <th>Quantity</th>
                    <th>Budget</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequirements.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{requirementTitle(row)}</strong><small>{row.description || "—"}</small></td>
                      <td>{row.buyer_name || row.user_name || row.user_id || "Buyer"}</td>
                      <td>{row.quantity ? `${row.quantity} ${row.unit || ""}` : "—"}</td>
                      <td>{row.budget ? `₹${Number(row.budget).toLocaleString("en-IN")}` : "—"}</td>
                      <td>{[row.city, row.state].filter(Boolean).join(", ") || row.location || "—"}</td>
                      <td><span className={statusClass(row.status)}>{row.status || "Pending"}</span></td>
                      <td>
                        <div className="tm-decision-buttons">
                          <button className="approve" type="button" onClick={() => updateRowStatus("requirement", row.id, "approved")}>✓</button>
                          <button className="reject" type="button" onClick={() => updateRowStatus("requirement", row.id, "rejected")}>×</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon="📋" title="No requirements found" text="Buyer requirements will appear here." />}
        </div>
      </section>
    );
  }

  function renderNotificationsPage() {
    return (
      <section className="tm-module">
        <SectionHeader title="Notifications" subtitle={`${unreadNotifications.length} unread notifications`} />

        <div className="tm-notification-layout">
          <div className="tm-card tm-inner-card">
            <div className="tm-subheading">
              <div><h3>Send Announcement</h3><p>Send a message to selected users.</p></div>
            </div>

            <label className="tm-label">
              Notification Title
              <input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="TimberMart Admin"
                maxLength={160}
              />
            </label>

            <label className="tm-label">
              Audience
              <select value={announcementRole} onChange={(e) => setAnnouncementRole(e.target.value)}>
                <option value="all">All Users</option>
                <option value="buyer">Buyers</option>
                <option value="farmer">Farmers</option>
                <option value="timber_merchant">Merchants</option>
                <option value="sawmill_business">Businesses</option>
                <option value="carpenter">Carpenters</option>
                <option value="worker">Workers</option>
              </select>
            </label>

            <label className="tm-label">
              Message
              <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Write announcement..." rows={6} />
            </label>

            <button className="tm-primary-button" type="button" disabled={busyId === "announcement"} onClick={sendAnnouncement}>
              {busyId === "announcement" ? "Sending..." : "🔔 Send Notification"}
            </button>

            <p className="tm-note">
              Admin sending is handled by a protected Supabase RPC. Each recipient gets an individual notification with the source marked as TimberMart Admin.
            </p>
          </div>

          <div className="tm-card tm-inner-card">
            <div className="tm-subheading">
              <div><h3>Recent Notifications</h3><p>Latest platform notifications.</p></div>
            </div>

            <div className="tm-notification-list">
              {notifications.length ? notifications.slice(0, 40).map((item) => {
                const read = item.is_read === true || item.read === true;

                return (
                  <div className={`tm-notification ${read ? "read" : "unread"}`} key={item.id}>
                    <span>🔔</span>
                    <div>
                      <strong>{item.title || "TimberMart Notification"}</strong>
                      <p>{item.message || item.body || "Notification"}</p>
                      <small>{formatDateTime(item.created_at)}</small>
                    </div>
                    {!read && (
                      <button type="button" onClick={() => markRead(item.id)}>Mark read</button>
                    )}
                  </div>
                );
              }) : <EmptyState icon="🔔" title="No notifications" />}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderAdminPosts() {
    return (
      <section className="tm-module">
        <SectionHeader
          title="Admin Posts & Ads"
          subtitle="Publish official TimberMart announcements, promotions and alerts to every user."
        />

        <div className="tm-admin-post-layout">
          <div className="tm-card tm-inner-card tm-admin-post-form">
            <div className="tm-subheading">
              <div>
                <h3>📢 Create Admin Post / Advertisement</h3>
                <p>
                  Posts are stored as official TimberMart content. The selected image is
                  uploaded securely to Supabase Storage and a notification is delivered to all registered users.
                </p>
              </div>
            </div>

            <label className="tm-label">
              Post Type
              <select value={postType} onChange={(e) => setPostType(e.target.value)}>
                <option value="announcement">Announcement</option>
                <option value="promotion">Promotion / Ad</option>
                <option value="alert">Important Alert</option>
                <option value="update">Platform Update</option>
              </select>
            </label>

            <label className="tm-label">
              Title
              <input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Example: TimberMart Weekend Sale"
                maxLength={160}
              />
            </label>

            <label className="tm-label">
              Message / Content
              <textarea
                value={postMessage}
                onChange={(e) => setPostMessage(e.target.value)}
                placeholder="Write the announcement, offer, safety message or platform update..."
                rows={7}
                maxLength={3000}
              />
            </label>

            <div className="tm-label">
              <span className="tm-label-title">Post Image <span className="tm-required">*</span></span>
              <div className="tm-image-upload-box">
                <input
                  id="tm-admin-post-image"
                  className="tm-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handlePostImageChange}
                  disabled={busyId === "admin-post"}
                />
                <label htmlFor="tm-admin-post-image" className="tm-upload-dropzone">
                  <span className="tm-upload-icon">🖼️</span>
                  <strong>Upload post image</strong>
                  <small>PNG, JPG, WEBP or GIF · Max 5 MB</small>
                  <span className="tm-upload-button">Choose Image</span>
                </label>

                {postImagePreview && (
                  <div className="tm-selected-image">
                    <img src={postImagePreview} alt="Selected admin post preview" />
                    <div className="tm-selected-image-info">
                      <strong>{postImageFile?.name || "Selected image"}</strong>
                      <small>
                        {postImageFile
                          ? `${(postImageFile.size / (1024 * 1024)).toFixed(2)} MB`
                          : "Ready to upload"}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="tm-remove-image"
                      onClick={removePostImage}
                      disabled={busyId === "admin-post"}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="tm-post-preview">
              <div className="tm-preview-head">
                <span className="tm-preview-badge">{postType}</span>
                <span className="tm-preview-brand">🌳 TimberMart Admin</span>
              </div>
              {postImagePreview && (
                <img className="tm-post-preview-image" src={postImagePreview} alt="Post preview" />
              )}
              <div className="tm-post-preview-content">
                <h4>{postTitle || "Your TimberMart post title"}</h4>
                <p>{postMessage || "Your post content preview will appear here."}</p>
                <small>🔔 All registered users will receive a TimberMart Admin notification.</small>
              </div>
            </div>

            <button
              className="tm-primary-button"
              type="button"
              disabled={busyId === "admin-post" || postImageUploading}
              onClick={publishAdminPost}
            >
              {postImageUploading
                ? "Uploading image..."
                : busyId === "admin-post"
                  ? "Publishing..."
                  : "📢 Publish to All Users"}
            </button>
          </div>

          <div className="tm-card tm-inner-card">
            <div className="tm-subheading">
              <div>
                <h3>Published Posts</h3>
                <p>Official posts and advertisements created by the administrator.</p>
              </div>
              <span className="tm-post-count">{adminPosts.length}</span>
            </div>

            <div className="tm-admin-post-list">
              {adminPosts.length ? (
                adminPosts.map((post) => (
                  <article className="tm-admin-post-item" key={post.id}>
                    <div className="tm-admin-post-icon">
                      {post.post_type === "promotion" ? "🏷️" : post.post_type === "alert" ? "🚨" : "📢"}
                    </div>
                    <div className="tm-admin-post-body">
                      <div className="tm-admin-post-meta">
                        <span>{post.post_type || "announcement"}</span>
                        <small>{formatDateTime(post.created_at)}</small>
                      </div>
                      <h4>{post.title}</h4>
                      <p>{post.message}</p>
                      {post.image_url && (
                        <img className="tm-published-post-image" src={post.image_url} alt={post.title || "Admin post"} />
                      )}
                      <small className="tm-admin-post-audience">👥 Sent to all registered users</small>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  icon="📢"
                  title="No admin posts yet"
                  text="Create your first official TimberMart announcement or advertisement."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderLocationsPage() {
    const located = users.filter(
      (user) =>
        Number.isFinite(Number(user.latitude)) &&
        Number.isFinite(Number(user.longitude))
    );

    return (
      <section className="tm-module">
        <SectionHeader title="Locations" subtitle="GPS information saved in user profiles" />

        <div className="tm-location-stats">
          <div><span>📍</span><strong>{located.length}</strong><small>GPS enabled</small></div>
          <div><span>👥</span><strong>{users.length}</strong><small>Total profiles</small></div>
          <div><span>◉</span><strong>{users.length ? Math.round((located.length / users.length) * 100) : 0}%</strong><small>Location coverage</small></div>
        </div>

        <div className="tm-card tm-inner-card">
          {located.length ? (
            <div className="tm-table-scroll">
              <table className="tm-table">
                <thead><tr><th>User</th><th>Role</th><th>City</th><th>Latitude</th><th>Longitude</th><th>Updated</th></tr></thead>
                <tbody>
                  {located.map((user) => (
                    <tr key={user.id}>
                      <td>{displayName(user)}</td>
                      <td>{ROLE_LABELS[normalizeRole(user.role)]}</td>
                      <td>{[user.city, user.state].filter(Boolean).join(", ") || "—"}</td>
                      <td>{Number(user.latitude).toFixed(5)}</td>
                      <td>{Number(user.longitude).toFixed(5)}</td>
                      <td>{formatDateTime(user.location_updated_at || user.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon="📍" title="No GPS locations" text="Users can enable location from their dashboards." />}
        </div>
      </section>
    );
  }

  function renderAnalyticsPage() {
    const total = users.length;
    const activeRate = listings.length ? Math.round((approvedListings.length / listings.length) * 100) : 0;

    return (
      <section className="tm-module">
        <SectionHeader title="Analytics" subtitle="Live statistics calculated from TimberMart data" />

        <div className="tm-analytics-grid">
          <div><span>👥</span><small>Total Users</small><strong>{total}</strong></div>
          <div><span>🪵</span><small>Total Listings</small><strong>{listings.length}</strong></div>
          <div><span>📋</span><small>Total Requirements</small><strong>{requirements.length}</strong></div>
          <div><span>✓</span><small>Approval Rate</small><strong>{activeRate}%</strong></div>
        </div>

        <div className="tm-card tm-inner-card">
          <SectionHeader title="User Distribution" subtitle="Role-wise distribution" />
          <div className="tm-big-role-layout">
            <DonutChart counts={roleCounts} total={total} />
            <div className="tm-big-role-list">
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <div key={role}>
                  <span><i style={{ background: ROLE_COLORS[role] }} />{label}</span>
                  <strong>{roleCounts[role]}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderGeneric(title, icon, text) {
    return (
      <section className="tm-module">
        <SectionHeader title={title} subtitle="TimberMart administrator workspace" />
        <div className="tm-generic-card">
          <div>{icon}</div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </section>
    );
  }

  function renderContent() {
    if (activeMenu === "Dashboard") return renderOverview();
    if (activeMenu === "Approval Center") return renderApprovalCenter();
    if (activeMenu === "Users") return renderUsersPage();
    if (activeMenu === "Farmers") return renderUsersPage("farmer");
    if (activeMenu === "Buyers") return renderUsersPage("buyer");
    if (activeMenu === "Merchants") return renderUsersPage("timber_merchant");
    if (activeMenu === "Carpenters") return renderUsersPage("carpenter");
    if (activeMenu === "Workers") return renderUsersPage("worker");
    if (activeMenu === "Businesses") return renderUsersPage("sawmill_business");
    if (activeMenu === "Listings") return renderListingsPage();
    if (activeMenu === "Requirements") return renderRequirementsPage();
    if (activeMenu === "Notifications") return renderNotificationsPage();
    if (activeMenu === "Admin Posts") return renderAdminPosts();
    if (activeMenu === "Locations") return renderLocationsPage();
    if (activeMenu === "Analytics") return renderAnalyticsPage();

    if (activeMenu === "Jobs") {
      return renderGeneric("Jobs", "💼", "Job management can be connected to your jobs table when that schema is ready.");
    }

    if (activeMenu === "Reports") {
      return renderGeneric("Reports & Moderation", "⚠", "Use this workspace to review reported listings, users and marketplace content.");
    }

    if (activeMenu === "Revenue & Payments") {
      return renderGeneric("Revenue & Payments", "₹", "Connect your payment and transaction tables here.");
    }

    if (activeMenu === "Settings") {
      return renderGeneric("Settings", "⚙", "Admin settings are protected by the admin role and AdminRoute.");
    }

    if (activeMenu === "Admin Security") {
      return renderGeneric("Admin & Security", "🔐", "Administrator access is controlled through Supabase authentication and the admin profile role.");
    }

    return renderGeneric("System Logs", "▤", "System audit logs can be connected to your audit_logs table.");
  }

  if (loading) {
    return (
      <div className="tm-loading-screen">
        <div className="tm-loading-box">
          <div className="tm-logo">🌳</div>
          <div className="tm-loader" />
          <h2>Loading TimberMart Admin</h2>
          <p>Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tm-admin">
      <aside className={`tm-sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="tm-sidebar-brand">
          <div className="tm-tree-logo">🌳</div>
          <div><strong>TimberMart</strong><span>Admin Panel</span></div>
        </div>

        <div className="tm-admin-user">
          <div className="tm-admin-avatar">🛡️</div>
          <div><strong>Administrator</strong><span>Super Admin</span></div>
          <span className="tm-online-dot" />
        </div>

        <nav className="tm-nav">
          <div className="tm-nav-label">MAIN MENU</div>

          {MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tm-nav-button ${activeMenu === item.id ? "active" : ""}`}
              onClick={() => openMenu(item.id)}
            >
              <span className="tm-nav-icon">{item.icon}</span>
              <span>{item.label}</span>

              {item.approval && pendingTotal > 0 && (
                <b className="tm-nav-count">{pendingTotal}</b>
              )}

              {item.id === "Notifications" && unreadNotifications.length > 0 && (
                <b className="tm-nav-count red">{unreadNotifications.length}</b>
              )}

              {item.arrow && <em>›</em>}
            </button>
          ))}

          <div className="tm-nav-label lower">SYSTEM</div>
        </nav>

        <div className="tm-sidebar-bottom">
          <button
            type="button"
            className="tm-back-app"
            onClick={() => (onBack ? onBack() : window.history.back())}
          >
            ← Back to App
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          type="button"
          aria-label="Close navigation"
          className="tm-mobile-overlay"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="tm-main">
        <header className="tm-topbar">
          <div className="tm-top-left">
            <button type="button" className="tm-menu-toggle" onClick={() => setMobileNav(true)}>☰</button>
            <div>
              <span className="tm-breadcrumb">Admin /</span>
              <h1>{activeMenu}</h1>
            </div>
          </div>

          <div className="tm-top-actions">
            <div className="tm-global-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users, listings, requirements..."
              />
              <kbd>⌘ K</kbd>
            </div>

            <button
              type="button"
              className="tm-top-icon"
              onClick={() => openMenu("Notifications")}
              title="Notifications"
            >
              🔔
              {unreadNotifications.length > 0 && <b>{unreadNotifications.length}</b>}
            </button>

            <button
              type="button"
              className="tm-top-icon"
              onClick={() => loadAll(true)}
              disabled={refreshing}
              title="Refresh"
            >
              {refreshing ? "…" : "↻"}
            </button>

            <div className="tm-profile-menu">
              <div className="tm-profile-avatar">A</div>
              <div><strong>Admin</strong><span>Super Admin</span></div>
              <span>⌄</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="tm-error">
            <span>⚠ {error}</span>
            <button type="button" onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="tm-page">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function UserTable({ users, full = false }) {
  if (!users.length) {
    return <EmptyState icon="👥" title="No users found" text="Registered profiles will appear here." />;
  }

  return (
    <div className="tm-table-scroll">
      <table className="tm-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Location</th>
            <th>Status</th>
            <th>Joined</th>
            {full && <th>Phone</th>}
          </tr>
        </thead>
        <tbody>
          {users.slice(0, full ? 500 : 8).map((user) => {
            const role = normalizeRole(user.role);

            return (
              <tr key={user.id}>
                <td>
                  <div className="tm-user-cell">
                    <div className="tm-user-avatar">{String(displayName(user)).charAt(0).toUpperCase()}</div>
                    <div><strong>{displayName(user)}</strong><small>{user.email || "No email"}</small></div>
                  </div>
                </td>
                <td><span className="tm-role-pill">{ROLE_LABELS[role]}</span></td>
                <td>{[user.city, user.state].filter(Boolean).join(", ") || "—"}</td>
                <td><span className="tm-status approved">{user.status || "Active"}</span></td>
                <td>{formatDate(user.created_at)}</td>
                {full && <td>{user.phone || "—"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ListingTable({ listings, full = false, onApprove, onReject, busyId }) {
  if (!listings.length) {
    return <EmptyState icon="🪵" title="No listings found" text="Timber listings will appear here." />;
  }

  return (
    <div className="tm-table-scroll">
      <table className="tm-table">
        <thead>
          <tr>
            <th>Listing</th>
            <th>Category</th>
            <th>Seller</th>
            <th>Status</th>
            <th>Price</th>
            <th>Posted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.slice(0, full ? 500 : 7).map((row) => (
            <tr key={row.id}>
              <td><strong>{listingTitle(row)}</strong><small>{row.description || "Timber listing"}</small></td>
              <td>{row.category || row.species || row.tree_type || "—"}</td>
              <td>{row.seller_name || row.owner_name || row.user_name || row.user_id || "Seller"}</td>
              <td><span className={statusClass(row.status)}>{row.status || "Pending"}</span></td>
              <td>{row.price ? `₹${Number(row.price).toLocaleString("en-IN")}` : "—"}</td>
              <td>{formatDate(row.created_at)}</td>
              <td>
                <div className="tm-row-actions">
                  <button
                    type="button"
                    title="Approve"
                    className="approve-icon"
                    disabled={busyId === `listing-${row.id}`}
                    onClick={() => onApprove(row.id)}
                  >✓</button>
                  <button
                    type="button"
                    title="Reject"
                    className="reject-icon"
                    disabled={busyId === `listing-${row.id}`}
                    onClick={() => onReject(row.id)}
                  >×</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

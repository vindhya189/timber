import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, Search, Menu, X, Maximize2, ChevronDown, ChevronRight, RefreshCw,
  LayoutDashboard, Users, Sprout, ShoppingCart, Store, Hammer, HardHat,
  Building2, Package, ClipboardList, BriefcaseBusiness, Wrench, PhoneCall,
  MessageSquare, Star, ShieldAlert, BarChart3, Send, FileText, ShieldCheck,
  Settings, LockKeyhole, ScrollText, Eye, CheckCircle2, XCircle, MapPin,
  Mail, Phone, CalendarDays, IndianRupee, Image as ImageIcon, ArrowLeft,
  LogOut, Activity, AlertTriangle, SearchX
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./AdminDashboard.css";

const MENU = [
  ["Dashboard", LayoutDashboard],
  ["User Management", null],
  ["All Users", Users],
  ["Farmers", Sprout],
  ["Buyers", ShoppingCart],
  ["Merchants", Store],
  ["Carpenters", Hammer],
  ["Workers", HardHat],
  ["Businesses", Building2],
  ["Marketplace", null],
  ["Listings", Package],
  ["Requirements", ClipboardList],
  ["Jobs", BriefcaseBusiness],
  ["Carpenter Services", Wrench],
  ["Lead / Contact Activity", PhoneCall],
  ["Reported Messages", MessageSquare],
  ["Reviews & Ratings", Star],
  ["Reports & Moderation", ShieldAlert],
  ["Analytics", BarChart3],
  ["Notifications", Bell],
  ["Content / CMS", FileText],
  ["Verification", ShieldCheck],
  ["Settings", Settings],
  ["Admin & Security", LockKeyhole],
  ["System Logs", ScrollText]
];

const ROLE_LABELS = {
  farmer: "Farmer",
  buyer: "Buyer",
  timber_merchant: "Merchant",
  merchant: "Merchant",
  sawmill_business: "Business",
  sawmill: "Business",
  carpenter: "Carpenter",
  service_provider: "Carpenter",
  worker: "Worker",
  admin: "Admin"
};

const ROLE_FILTERS = {
  "All Users": null,
  Farmers: ["farmer"],
  Buyers: ["buyer"],
  Merchants: ["timber_merchant", "merchant"],
  Carpenters: ["carpenter", "service_provider"],
  Workers: ["worker"],
  Businesses: ["sawmill_business", "sawmill"]
};

const safe = (v, fallback = "—") =>
  v === null || v === undefined || String(v).trim() === "" ? fallback : v;

const roleLabel = (role) => ROLE_LABELS[String(role || "").toLowerCase()] || safe(role, "User");

const dateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `₹${n.toLocaleString("en-IN")}` : "—";
};

const normalizeStatus = (v) => String(v || "pending").toLowerCase().trim();

const statusClass = (value) => {
  const s = normalizeStatus(value);
  if (["active", "approved", "verified", "published", "completed"].includes(s)) return "good";
  if (["pending", "submitted", "in_review"].includes(s)) return "pending";
  if (["rejected", "blocked", "reported", "suspended"].includes(s)) return "danger";
  return "neutral";
};

const displayName = (p) => p?.name || p?.full_name || p?.display_name || p?.username || p?.email || "User";

const getImages = (row, relationRows = []) => {
  const out = [];
  const add = (v) => {
    if (!v) return;
    if (typeof v === "string") {
      if (/^https?:\/\//i.test(v.trim())) out.push(v.trim());
      return;
    }
    if (Array.isArray(v)) v.forEach(add);
    else if (typeof v === "object") {
      add(v.image_url); add(v.photo_url); add(v.url); add(v.public_url);
    }
  };
  relationRows.forEach((x) => add(x.image_url));
  ["image_url", "photo_url", "cover_image", "thumbnail_url", "image_urls", "images", "photos", "photo_urls"].forEach((k) => add(row?.[k]));
  return [...new Set(out)];
};

function Badge({ children }) {
  return <span className={`ad-badge ${statusClass(children)}`}>{children || "Pending"}</span>;
}

function StatCard({ icon: Icon, label, value, note, tone = "" }) {
  return (
    <button className={`ad-stat ${tone}`} onClick={() => {}}>
      <div className="ad-stat-icon"><Icon size={20} /></div>
      <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
    </button>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="ad-empty">
      <SearchX size={26} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default function AdminDashboard({ onBack }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [dateRange] = useState("01 May 2024 - 31 May 2024");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [admin, setAdmin] = useState(null);

  const [users, setUsers] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [logs, setLogs] = useState([]);
  const [imagesById, setImagesById] = useState({});

  // Admin CMS / Posts / Ads / Announcements
  const [cmsPosts, setCmsPosts] = useState([]);
  const [cmsOpen, setCmsOpen] = useState(false);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsFile, setCmsFile] = useState(null);
  const [cmsForm, setCmsForm] = useState({
    type: "announcement",
    title: "",
    message: "",
    target_role: "all",
    cta_label: "",
    cta_url: ""
  });

  const [selected, setSelected] = useState(null);
  const [busyKey, setBusyKey] = useState("");
  const [detailTab, setDetailTab] = useState("overview");

  const loadOptional = useCallback(async (table, select = "*", order = "created_at") => {
    try {
      let q = supabase.from(table).select(select);
      if (order) q = q.order(order, { ascending: false });
      const { data, error: e } = await q.limit(500);
      if (e) return [];
      return data || [];
    } catch {
      return [];
    }
  }, []);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData?.user) throw new Error("Please login as Admin.");
      setAdmin(authData.user);

      const { data: me, error: meError } = await supabase.from("profiles").select("*").eq("id", authData.user.id).maybeSingle();
      if (meError) throw meError;
      if (!me || !["admin", "administrator"].includes(String(me.role || "").toLowerCase())) {
        throw new Error("Current account is not an Admin. Set profiles.role = 'admin'.");
      }

      const [
        profileRows, listingRows, requirementRows, jobRows, notificationRows,
        reportRows, reviewRows, logRows, postRows
      ] = await Promise.all([
        loadOptional("profiles", "*", "created_at"),
        loadOptional("timber_listings", "*", "created_at").then(async (rows) => {
          if (rows.length) return rows;
          return loadOptional("listings", "*", "created_at");
        }),
        loadOptional("buyer_requirements", "*", "created_at"),
        loadOptional("jobs", "*", "created_at"),
        loadOptional("notifications", "*", "created_at"),
        loadOptional("reports", "*", "created_at"),
        loadOptional("reviews", "*", "created_at"),
        loadOptional("system_logs", "*", "created_at"),
        loadOptional("admin_posts", "*", "created_at")
      ]);

      const profileMap = {};
      profileRows.forEach((p) => { profileMap[p.id] = p; });

      setUsers(profileRows);
      setProfilesById(profileMap);
      setListings(listingRows);
      setRequirements(requirementRows);
      setJobs(jobRows);
      setNotifications(notificationRows);
      setReports(reportRows);
      setReviews(reviewRows);
      setLogs(logRows);
      setCmsPosts(postRows);

      const ids = listingRows.map((x) => x.id).filter(Boolean);
      if (ids.length) {
        const { data: imgRows } = await supabase.from("listing_images")
          .select("id,listing_id,image_url,storage_path,sort_order,created_at")
          .in("listing_id", ids)
          .order("sort_order", { ascending: true });
        const imageMap = {};
        (imgRows || []).forEach((r) => {
          if (!imageMap[r.listing_id]) imageMap[r.listing_id] = [];
          if (r.image_url) imageMap[r.listing_id].push(r.image_url);
        });
        setImagesById(imageMap);
      } else setImagesById({});
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load Admin Dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadOptional]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channels = [
      supabase.channel("admin-live-listings").on("postgres_changes", { event: "*", schema: "public", table: "timber_listings" }, () => loadData(true)),
      supabase.channel("admin-live-requirements").on("postgres_changes", { event: "*", schema: "public", table: "buyer_requirements" }, () => loadData(true)),
      supabase.channel("admin-live-notifications").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (p) => {
        setNotifications((curr) => [p.new, ...curr].slice(0, 500));
      }),
      supabase.channel("admin-live-posts").on("postgres_changes", { event: "*", schema: "public", table: "admin_posts" }, () => loadData(true))
    ];
    channels.forEach((c) => c.subscribe());
    return () => { channels.forEach((c) => supabase.removeChannel(c)); };
  }, [loadData]);

  const pendingListings = useMemo(
    () => listings.filter((x) => normalizeStatus(x.status) === "pending"),
    [listings]
  );
  const pendingRequirements = useMemo(
    () => requirements.filter((x) => normalizeStatus(x.status) === "pending"),
    [requirements]
  );
  const activeListings = useMemo(
    () => listings.filter((x) => ["active", "approved", "published"].includes(normalizeStatus(x.status))),
    [listings]
  );

  const userCounts = useMemo(() => ({
    farmers: users.filter((u) => String(u.role || "").toLowerCase() === "farmer").length,
    buyers: users.filter((u) => String(u.role || "").toLowerCase() === "buyer").length,
    merchants: users.filter((u) => ["merchant", "timber_merchant"].includes(String(u.role || "").toLowerCase())).length,
    carpenters: users.filter((u) => ["carpenter", "service_provider"].includes(String(u.role || "").toLowerCase())).length,
    workers: users.filter((u) => String(u.role || "").toLowerCase() === "worker").length,
    businesses: users.filter((u) => ["sawmill", "sawmill_business"].includes(String(u.role || "").toLowerCase())).length
  }), [users]);

  const recentActivity = useMemo(() => {
    const a = [
      ...users.map((x) => ({ time: x.created_at, icon: "user", title: "New user registered", text: displayName(x), tone: "green" })),
      ...listings.map((x) => ({ time: x.created_at, icon: "listing", title: "New listing posted", text: x.title || x.name || "Timber listing", tone: "blue" })),
      ...requirements.map((x) => ({ time: x.created_at, icon: "req", title: "New requirement posted", text: x.custom_requirement || x.title || x.category || "Buyer requirement", tone: "purple" })),
      ...jobs.map((x) => ({ time: x.created_at, icon: "job", title: "New job posted", text: x.title || x.job_title || "Job", tone: "orange" }))
    ].filter((x) => x.time).sort((a, b) => new Date(b.time) - new Date(a.time));
    return a.slice(0, 7);
  }, [users, listings, requirements, jobs]);

  const globalSearch = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    const roles = ROLE_FILTERS[active];
    return users.filter((u) => {
      const matchRole = !roles || roles.includes(String(u.role || "").toLowerCase());
      const hay = [displayName(u), u.email, u.phone, u.location, u.city, u.state].filter(Boolean).join(" ").toLowerCase();
      return matchRole && (!globalSearch || hay.includes(globalSearch));
    });
  }, [users, active, globalSearch]);

  const filteredListings = useMemo(() => listings.filter((x) => {
    const hay = [x.title, x.name, x.category, x.subcategory, x.species, x.city, x.state, x.location, x.description].filter(Boolean).join(" ").toLowerCase();
    return !globalSearch || hay.includes(globalSearch);
  }), [listings, globalSearch]);

  const filteredRequirements = useMemo(() => requirements.filter((x) => {
    const p = profilesById[x.buyer_id || x.user_id];
    const hay = [x.title, x.custom_requirement, x.category, x.subcategory, x.species, x.city, x.state, x.description, displayName(p)].filter(Boolean).join(" ").toLowerCase();
    return !globalSearch || hay.includes(globalSearch);
  }), [requirements, globalSearch]);

  const go = (menu) => {
    setActive(menu);
    setMobileOpen(false);
    setSelected(null);
    setError("");
    setSuccess("");
  };

  const openDetail = async (type, row) => {
    setDetailTab("overview");
    setSelected({ type, row, profile: profilesById[row.buyer_id || row.user_id || row.seller_id || row.owner_id] });
  };

  const review = async (type, row, decision) => {
    const key = `${type}:${row.id}`;
    setBusyKey(key); setError(""); setSuccess("");
    try {
      let data;
      if (type === "requirement") {
        const r = await supabase.rpc("tm_admin_review_buyer_requirement", {
          p_requirement_id: row.id,
          p_decision: decision
        });
        if (r.error) throw r.error;
        data = r.data;
      } else {
        const r = await supabase.rpc("tm_admin_review_timber_listing", {
          p_listing_id: row.id,
          p_decision: decision
        });
        if (r.error) throw r.error;
        data = r.data;
      }
      if (!data?.ok) throw new Error("Approval action was not completed.");
      const newStatus = decision === "approve" ? "active" : "rejected";
      if (type === "requirement") {
        setRequirements((curr) => curr.map((x) => x.id === row.id ? { ...x, status: newStatus } : x));
      } else {
        setListings((curr) => curr.map((x) => x.id === row.id ? { ...x, status: newStatus } : x));
      }
      if (selected?.row?.id === row.id) setSelected((s) => ({ ...s, row: { ...s.row, status: newStatus } }));
      setSuccess(decision === "approve" ? "Approved and published successfully." : "Rejected successfully.");
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || "");
      setError(
        msg.includes("ADMIN_ONLY") ? "Current account is not an Admin." :
        msg.includes("NOT_FOUND") ? "Record was not found in the approval table." :
        msg || "Could not complete approval action."
      );
    } finally {
      setBusyKey("");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    if (onBack) onBack();
    else navigate("/login");
  };

  const renderDashboard = () => (
    <>
      <div className="ad-page-title">
        <div><span>ADMIN CONTROL CENTER</span><h1>Dashboard Overview</h1><p>Welcome back, Admin! Here's what's happening on TimberMart.</p></div>
        <div className="ad-date"><CalendarDays size={15} /> {dateRange}<ChevronDown size={14} /></div>
      </div>

      <div className="ad-stats">
        <StatCard icon={Users} label="Total Users" value={users.length.toLocaleString("en-IN")} note="Live platform count" tone="green" />
        <StatCard icon={Package} label="Total Listings" value={listings.length.toLocaleString("en-IN")} note={`${pendingListings.length} pending` } tone="blue" />
        <StatCard icon={ClipboardList} label="Total Requirements" value={requirements.length.toLocaleString("en-IN")} note={`${pendingRequirements.length} pending`} tone="purple" />
        <StatCard icon={BriefcaseBusiness} label="Total Jobs" value={jobs.length.toLocaleString("en-IN")} note="Loaded from jobs table" tone="orange" />
        <StatCard icon={PhoneCall} label="Total Leads" value={notifications.filter((n) => String(n.type || "").toLowerCase().includes("lead")).length.toLocaleString("en-IN")} note="From notifications" tone="teal" />
        <StatCard icon={ShieldAlert} label="Total Reports" value={reports.length.toLocaleString("en-IN")} note="Moderation queue" tone="red" />
      </div>

      <div className="ad-main-grid">
        <section className="ad-card">
          <div className="ad-card-head"><div><h2>Platform Activity</h2><span>This Month</span></div><button onClick={() => loadData(true)} className="ad-icon-btn"><RefreshCw size={15} /></button></div>
          <div className="ad-activity-grid">
            <div className="ad-mini-kpis">
              <div><b>{users.length}</b><span>Users</span></div>
              <div><b>{listings.length}</b><span>Listings</span></div>
              <div><b>{requirements.length}</b><span>Requirements</span></div>
              <div><b>{jobs.length}</b><span>Jobs</span></div>
            </div>
            <div className="ad-bar-chart">
              {[32,45,41,58,55,69,62,76,73,88,82,95].map((h, i) => <i key={i} style={{height: `${h}%`}} />)}
            </div>
          </div>
        </section>

        <section className="ad-card">
          <div className="ad-card-head"><div><h2>Users by Role</h2><span>Current database</span></div></div>
          <div className="ad-role-list">
            {Object.entries(userCounts).map(([k, v]) => <button key={k} onClick={() => go(k === "farmers" ? "Farmers" : k === "buyers" ? "Buyers" : k === "merchants" ? "Merchants" : k === "carpenters" ? "Carpenters" : k === "workers" ? "Workers" : "Businesses")}><span>{k}</span><b>{v.toLocaleString("en-IN")}</b></button>)}
          </div>
        </section>

        <section className="ad-card">
          <div className="ad-card-head"><div><h2>Recent Activities</h2><span>Latest platform events</span></div><button onClick={() => go("All Users")}>View All</button></div>
          <div className="ad-activity-list">
            {recentActivity.length ? recentActivity.map((a, i) => (
              <div key={i} className="ad-activity-row"><div className={`ad-activity-dot ${a.tone}`}><Activity size={14} /></div><div><strong>{a.title}</strong><span>{a.text}</span><small>{dateTime(a.time)}</small></div></div>
            )) : <EmptyState title="No recent activity" text="New records will appear here automatically." />}
          </div>
        </section>
      </div>

      <div className="ad-strip">
        {[
          ["Pending Verifications", users.filter((u) => normalizeStatus(u.verification_status || u.status) === "pending").length, "Verification"],
          ["Pending Listings", pendingListings.length, "Listings"],
          ["Pending Requirements", pendingRequirements.length, "Requirements"],
          ["Pending Jobs", jobs.filter((j) => normalizeStatus(j.status) === "pending").length, "Jobs"],
          ["Reported Listings", reports.filter((r) => String(r.target_type || r.type || "").toLowerCase().includes("listing")).length, "Reports & Moderation"],
          ["Reported Users", reports.filter((r) => String(r.target_type || r.type || "").toLowerCase().includes("user")).length, "Reports & Moderation"]
        ].map(([label, val, target]) => <button key={label} onClick={() => go(target)}><strong>{val}</strong><span>{label}</span><ChevronRight size={14} /></button>)}
      </div>

      <div className="ad-table-grid">
        <DataTable title="Recent Users" view="All Users" onView={() => go("All Users")} headers={["User","Role","Location","Status","Joined"]}>
          {users.slice(0,8).map((u) => <tr key={u.id}><td><div className="ad-person"><div>{displayName(u).charAt(0).toUpperCase()}</div><span><b>{displayName(u)}</b><small>{u.email || "—"}</small></span></div></td><td>{roleLabel(u.role)}</td><td>{u.location || [u.city,u.state].filter(Boolean).join(", ") || "—"}</td><td><Badge>{u.verification_status || u.status || "Active"}</Badge></td><td>{dateTime(u.created_at)}</td></tr>)}
        </DataTable>

        <DataTable title="Recent Listings" view="Listings" onView={() => go("Listings")} headers={["Listing","Category","Seller","Status","Price","Posted"]}>
          {listings.slice(0,8).map((x) => <tr key={x.id}><td><div className="ad-listing-cell">{getImages(x, imagesById[x.id]?.map((u)=>({image_url:u})) || [])[0] ? <img src={getImages(x, imagesById[x.id]?.map((u)=>({image_url:u})) || [])[0]} alt="" /> : <span>🪵</span>}<b>{x.title || x.name || x.species || "Timber Listing"}</b></div></td><td>{x.category || "Timber"}</td><td>{displayName(profilesById[x.seller_id || x.owner_id || x.user_id])}</td><td><Badge>{x.status}</Badge></td><td>{money(x.price || x.amount || x.budget)}</td><td>{dateTime(x.created_at)}</td></tr>)}
        </DataTable>
      </div>

      <section className="ad-quick-actions">
        {[
          ["Add New User", Users, "All Users"],
          ["Add New Listing", Package, "Listings"],
          ["Post Requirement", ClipboardList, "Requirements"],
          ["Post Job", BriefcaseBusiness, "Jobs"],
          ["Send Notification", Send, "Notifications"],
          ["Manage Content", FileText, "Content / CMS"],
          ["View Reports", ShieldAlert, "Reports & Moderation"],
          ["System Logs", ScrollText, "System Logs"]
        ].map(([label, Icon, target]) => <button key={label} onClick={() => go(target)}><Icon size={17} /><span>{label}</span></button>)}
      </section>
    </>
  );

  const renderUsers = () => (
    <SectionHeader eyebrow="USER MANAGEMENT" title={active} subtitle="Review platform users and profile information." action={<button className="ad-primary" onClick={() => loadData(true)}><RefreshCw size={14}/> Refresh</button>}>
      <div className="ad-table-wrap">
        <table className="ad-data-table"><thead><tr><th>User</th><th>Role</th><th>Phone</th><th>Location</th><th>Status</th><th>Joined</th><th></th></tr></thead><tbody>
          {filteredUsers.length ? filteredUsers.map((u) => <tr key={u.id}><td><div className="ad-person"><div>{displayName(u).charAt(0).toUpperCase()}</div><span><b>{displayName(u)}</b><small>{u.email || "—"}</small></span></div></td><td>{roleLabel(u.role)}</td><td>{u.phone || "—"}</td><td>{u.location || [u.city,u.state].filter(Boolean).join(", ") || "—"}</td><td><Badge>{u.verification_status || u.status || "Active"}</Badge></td><td>{dateTime(u.created_at)}</td><td><button className="ad-row-btn" onClick={() => openDetail("user", u)}><Eye size={14}/></button></td></tr>) : <tr><td colSpan="7"><EmptyState title="No users found" text="Try another search." /></td></tr>}
        </tbody></table>
      </div>
    </SectionHeader>
  );

  const renderListings = () => (
    <SectionHeader eyebrow="MARKETPLACE" title="Listings Approval Center" subtitle="Inspect the complete seller submission, photos and seller profile before approving." action={<button className="ad-primary" onClick={() => loadData(true)}><RefreshCw size={14}/> Refresh</button>}>
      <div className="ad-approval-tabs"><button className={active === "Listings" ? "active":""} onClick={() => setSearch("")}>All <b>{listings.length}</b></button><button onClick={() => setSearch("pending:")}>Pending <b>{pendingListings.length}</b></button><button onClick={() => setSearch("active:")}>Published <b>{activeListings.length}</b></button></div>
      <div className="ad-approval-grid">
        {filteredListings.length ? filteredListings.map((row) => {
          const imgs = getImages(row, (imagesById[row.id] || []).map((image_url) => ({image_url})));
          const p = profilesById[row.seller_id || row.owner_id || row.user_id];
          return <article className="ad-approval-card" key={row.id}>
            <div className="ad-approval-photo">{imgs[0] ? <img src={imgs[0]} alt="" /> : <ImageIcon size={26}/>}<span>{imgs.length} photos</span></div>
            <div className="ad-approval-content"><div className="ad-card-top"><span>LISTING</span><Badge>{row.status || "pending"}</Badge></div><h3>{row.title || row.name || row.species || "Timber Listing"}</h3><p>{safe(row.description, "No description submitted.")}</p><div className="ad-meta-grid"><div><span>Seller</span><b>{displayName(p)}</b></div><div><span>Category</span><b>{safe(row.category)}</b></div><div><span>Price</span><b>{money(row.price || row.amount || row.budget)}</b></div><div><span>Location</span><b>{row.location || [row.city,row.state].filter(Boolean).join(", ") || "—"}</b></div></div><div className="ad-card-actions"><button className="ad-secondary" onClick={() => openDetail("listing", row)}><Eye size={14}/> Check Full Details</button><button className="ad-danger" disabled={busyKey === `listing:${row.id}`} onClick={() => review("listing", row, "reject")}><XCircle size={14}/> Reject</button><button className="ad-approve" disabled={busyKey === `listing:${row.id}`} onClick={() => review("listing", row, "approve")}><CheckCircle2 size={14}/> Approve & Publish</button></div></div>
          </article>
        }) : <EmptyState title="No listings found" text="There are no records matching the current search." />}
      </div>
    </SectionHeader>
  );

  const renderRequirements = () => (
    <SectionHeader eyebrow="MODERATION" title="Buyer Requirement Approval Center" subtitle="Before approval, inspect who posted it, all submitted fields, location, contacts, description and every uploaded photo." action={<button className="ad-primary" onClick={() => loadData(true)}><RefreshCw size={14}/> Refresh</button>}>
      <div className="ad-approval-tabs"><button className="active">All <b>{requirements.length}</b></button><button>Pending <b>{pendingRequirements.length}</b></button><button>Approved <b>{requirements.filter((x)=>["active","approved"].includes(normalizeStatus(x.status))).length}</b></button><button>Rejected <b>{requirements.filter((x)=>normalizeStatus(x.status)==="rejected").length}</b></button></div>
      <div className="ad-approval-grid">
        {filteredRequirements.length ? filteredRequirements.map((row) => {
          const p = profilesById[row.buyer_id || row.user_id];
          const localImages = imagesById[row.id] || [];
          const title = row.title || row.requirement_title || row.custom_requirement || [row.subcategory,row.species].filter(Boolean).join(" ") || row.category || "Buyer Requirement";
          return <article className="ad-approval-card" key={row.id}>
            <div className="ad-approval-photo">{localImages[0] ? <img src={localImages[0]} alt="" /> : <ClipboardList size={26}/>}<span>{localImages.length} photos</span></div>
            <div className="ad-approval-content"><div className="ad-card-top"><span>BUYER REQUIREMENT</span><Badge>{row.status || "pending"}</Badge></div><h3>{title}</h3><p>{safe(row.description, "No description submitted.")}</p><div className="ad-meta-grid"><div><span>Buyer</span><b>{displayName(p)}</b></div><div><span>Category</span><b>{safe(row.category)}</b></div><div><span>Quantity</span><b>{row.quantity ? `${row.quantity} ${row.unit || ""}` : "—"}</b></div><div><span>Location</span><b>{[row.city,row.state].filter(Boolean).join(", ") || row.location || "—"}</b></div><div><span>Budget</span><b>{money(row.budget)}</b></div><div><span>Posted</span><b>{dateTime(row.created_at)}</b></div></div><div className="ad-card-actions"><button className="ad-secondary" onClick={() => openDetail("requirement", row)}><Eye size={14}/> Check Full Details</button><button className="ad-danger" disabled={busyKey === `requirement:${row.id}`} onClick={() => review("requirement", row, "reject")}><XCircle size={14}/> Reject</button><button className="ad-approve" disabled={busyKey === `requirement:${row.id}`} onClick={() => review("requirement", row, "approve")}><CheckCircle2 size={14}/> Approve & Publish</button></div></div>
          </article>
        }) : <EmptyState title="No buyer requirements found" text="A buyer's new pending requirement will appear here." />}
      </div>
    </SectionHeader>
  );

  const renderGeneric = (title, eyebrow, rows, columns, description) => (
    <SectionHeader eyebrow={eyebrow} title={title} subtitle={description || "This module is connected to the available Supabase data."} action={<button className="ad-primary" onClick={() => loadData(true)}><RefreshCw size={14}/> Refresh</button>}>
      <div className="ad-table-wrap">
        <table className="ad-data-table"><thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th>Open</th></tr></thead><tbody>
          {rows.length ? rows.slice(0,300).map((r) => <tr key={r.id || JSON.stringify(r)}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : safe(r[c.key])}</td>)}<td><button className="ad-row-btn" onClick={() => openDetail(title, r)}><Eye size={14}/></button></td></tr>) : <tr><td colSpan={columns.length+1}><EmptyState title="No records available" text="This table may be empty or is not installed in this project yet." /></td></tr>}
        </tbody></table>
      </div>
    </SectionHeader>
  );


  const resetCmsForm = () => {
    setCmsForm({
      type: "announcement",
      title: "",
      message: "",
      target_role: "all",
      cta_label: "",
      cta_url: ""
    });
    setCmsFile(null);
  };

  const closeCms = () => {
    if (cmsSaving) return;
    setCmsOpen(false);
    resetCmsForm();
  };

  const createAdminPost = async (e) => {
    e.preventDefault();
    if (cmsSaving) return;

    const title = cmsForm.title.trim();
    const message = cmsForm.message.trim();

    if (!title || !message) {
      setError("Please enter a title and message.");
      return;
    }

    setCmsSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData?.user) throw new Error("Admin session not found.");

      let imageUrl = null;

      if (cmsFile) {
        if (!cmsFile.type.startsWith("image/")) {
          throw new Error("Please upload an image file.");
        }
        if (cmsFile.size > 5 * 1024 * 1024) {
          throw new Error("Image must be 5 MB or smaller.");
        }

        const ext = (cmsFile.name.split(".").pop() || "jpg").toLowerCase();
        const path = `admin-posts/${authData.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("admin-post-images")
          .upload(path, cmsFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: cmsFile.type
          });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from("admin-post-images")
          .getPublicUrl(path);

        imageUrl = publicData?.publicUrl || null;
        if (!imageUrl) throw new Error("Unable to create public photo URL.");
      }

      const payload = {
        created_by: authData.user.id,
        type: cmsForm.type,
        title,
        message,
        body: message,
        target_role: cmsForm.target_role,
        cta_label: cmsForm.cta_label.trim() || null,
        cta_url: cmsForm.cta_url.trim() || null,
        image_url: imageUrl,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data: post, error: postError } = await supabase
        .from("admin_posts")
        .insert(payload)
        .select("*")
        .single();

      if (postError) throw postError;

      // Fan out a real notification to the matching users.
      const targetRole = cmsForm.target_role;
      let userQuery = supabase.from("profiles").select("id,role").neq("role", "admin");
      if (targetRole !== "all") {
        const accepted = targetRole === "merchant"
          ? ["merchant", "timber_merchant"]
          : targetRole === "sawmill_business"
            ? ["sawmill_business", "sawmill"]
            : targetRole === "carpenter"
              ? ["carpenter", "service_provider"]
              : [targetRole];

        userQuery = userQuery.in("role", accepted);
      }

      const { data: recipients, error: recipientError } = await userQuery;
      if (recipientError) {
        console.warn("Recipient lookup failed:", recipientError.message);
      }

      const rows = (recipients || []).map((u) => ({
        user_id: u.id,
        type: cmsForm.type,
        title,
        message,
        is_read: false,
        image_url: imageUrl,
        source: "admin_post",
        sender_name: "TimberMart Admin",
        post_id: post?.id || null
      }));

      if (rows.length) {
        // Use small batches so a large user base does not overload one request.
        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert(batch);

          if (notificationError) {
            // Retry using the core notification columns if optional columns do not
            // exist in an older notifications schema.
            const fallbackBatch = batch.map(({ user_id, type, title, message, is_read }) => ({
              user_id, type, title, message, is_read
            }));
            const { error: fallbackError } = await supabase
              .from("notifications")
              .insert(fallbackBatch);
            if (fallbackError) {
              console.warn("Notification fan-out failed:", fallbackError.message);
            }
          }
        }
      }

      setCmsPosts((curr) => [post, ...curr]);
      setSuccess(
        `${cmsForm.type === "advertisement" ? "Advertisement" : cmsForm.type === "post" ? "Post" : "Announcement"} published successfully to ${
          targetRole === "all" ? "all users" : roleLabel(targetRole)
        }.`
      );
      setCmsOpen(false);
      resetCmsForm();
    } catch (e) {
      console.error("ADMIN CMS POST:", e);
      setError(e?.message || "Could not publish admin post.");
    } finally {
      setCmsSaving(false);
    }
  };

  const toggleCmsPost = async (post) => {
    if (!post?.id) return;
    setBusyKey(`cms:${post.id}`);
    setError("");
    try {
      const next = post.is_active === false;
      const { data, error: e } = await supabase
        .from("admin_posts")
        .update({ is_active: next })
        .eq("id", post.id)
        .select("*")
        .single();
      if (e) throw e;
      setCmsPosts((curr) => curr.map((x) => x.id === post.id ? data : x));
      setSuccess(next ? "Post published." : "Post hidden.");
    } catch (e) {
      setError(e?.message || "Could not update post.");
    } finally {
      setBusyKey("");
    }
  };

  const deleteCmsPost = async (post) => {
    if (!post?.id) return;
    if (!window.confirm(`Delete "${post.title || "this post"}" permanently?`)) return;

    setBusyKey(`delete-cms:${post.id}`);
    setError("");
    try {
      const { error: e } = await supabase.from("admin_posts").delete().eq("id", post.id);
      if (e) throw e;
      setCmsPosts((curr) => curr.filter((x) => x.id !== post.id));
      setSuccess("Admin post deleted.");
    } catch (e) {
      setError(e?.message || "Could not delete post.");
    } finally {
      setBusyKey("");
    }
  };

  const renderCMS = () => (
    <SectionHeader
      eyebrow="CONTENT / CMS"
      title="Posts, Ads & Announcements"
      subtitle="Admin can publish a post with a photo to every user or to a selected role."
      action={
        <button className="ad-primary" onClick={() => setCmsOpen(true)}>
          <Send size={14} /> Create New
        </button>
      }
    >
      <div className="ad-cms-hero">
        <div>
          <span className="ad-cms-label">BROADCAST CENTER</span>
          <h2>Reach the TimberMart community</h2>
          <p>
            Publish announcements, marketplace posts and advertisements with an
            optional photo. Choose All Users or a specific role.
          </p>
        </div>
        <div className="ad-cms-actions">
          <button onClick={() => {
            resetCmsForm();
            setCmsForm((f) => ({ ...f, type: "announcement" }));
            setCmsOpen(true);
          }}><Bell size={17} /> Announcement</button>
          <button onClick={() => {
            resetCmsForm();
            setCmsForm((f) => ({ ...f, type: "post" }));
            setCmsOpen(true);
          }}><FileText size={17} /> Post</button>
          <button onClick={() => {
            resetCmsForm();
            setCmsForm((f) => ({ ...f, type: "advertisement" }));
            setCmsOpen(true);
          }}><ImageIcon size={17} /> Advertisement</button>
        </div>
      </div>

      <div className="ad-cms-stats">
        <div><b>{cmsPosts.length}</b><span>Total Published Posts</span></div>
        <div><b>{cmsPosts.filter((p) => p.is_active !== false).length}</b><span>Currently Visible</span></div>
        <div><b>{cmsPosts.filter((p) => p.type === "advertisement").length}</b><span>Advertisements</span></div>
        <div><b>{cmsPosts.filter((p) => p.type === "announcement").length}</b><span>Announcements</span></div>
      </div>

      <div className="ad-cms-list">
        {cmsPosts.length ? cmsPosts.slice(0, 100).map((post) => (
          <article key={post.id} className={`ad-cms-card ${post.is_active === false ? "is-hidden" : ""}`}>
            <div className="ad-cms-image">
              {post.image_url ? <img src={post.image_url} alt="" /> : <FileText size={28} />}
            </div>
            <div className="ad-cms-body">
              <div className="ad-cms-top">
                <span className={`ad-cms-type ${post.type}`}>{post.type || "post"}</span>
                <Badge>{post.is_active === false ? "hidden" : "published"}</Badge>
              </div>
              <h3>{post.title || "Untitled post"}</h3>
              <p>{post.message || post.body || "No message."}</p>
              <div className="ad-cms-meta">
                <span>Audience: <b>{post.target_role === "all" ? "All Users" : roleLabel(post.target_role)}</b></span>
                <span>Posted: <b>{dateTime(post.created_at)}</b></span>
              </div>
              <div className="ad-cms-card-actions">
                <button className="ad-secondary" onClick={() => toggleCmsPost(post)} disabled={busyKey === `cms:${post.id}`}>
                  {post.is_active === false ? "Publish" : "Hide"}
                </button>
                <button className="ad-danger" onClick={() => deleteCmsPost(post)} disabled={busyKey === `delete-cms:${post.id}`}>
                  <XCircle size={14} /> Delete
                </button>
              </div>
            </div>
          </article>
        )) : (
          <EmptyState title="No admin posts yet" text="Create your first announcement, post or advertisement." />
        )}
      </div>
    </SectionHeader>
  );

  const renderContent = () => {
    if (active === "Dashboard") return renderDashboard();
    if (Object.keys(ROLE_FILTERS).includes(active)) return renderUsers();
    if (active === "Listings") return renderListings();
    if (active === "Requirements") return renderRequirements();
    if (active === "Content / CMS") return renderCMS();
    if (active === "Jobs") return renderGeneric("Jobs", "MARKETPLACE", jobs, [
      {key:"title", label:"Job", render:(r)=>r.title||r.job_title||"Job"},
      {key:"category", label:"Category"},
      {key:"location", label:"Location", render:(r)=>r.location||[r.city,r.state].filter(Boolean).join(", ")},
      {key:"status", label:"Status", render:(r)=><Badge>{r.status}</Badge>},
      {key:"created_at", label:"Posted", render:(r)=>dateTime(r.created_at)}
    ], "Review jobs posted by workers, carpenters and businesses.");
    if (active === "Notifications") return renderGeneric("Notifications", "COMMUNICATION", notifications, [
      {key:"title", label:"Title", render:(r)=>r.title||r.subject||"Notification"},
      {key:"message", label:"Message", render:(r)=><span className="ad-cell-wrap">{r.message||r.body||"—"}</span>},
      {key:"type", label:"Type"},
      {key:"created_at", label:"Time", render:(r)=>dateTime(r.created_at)}
    ], "Live notification records from the platform.");
    if (active === "Reports & Moderation") return renderGeneric("Reports & Moderation", "SAFETY", reports, [
      {key:"type", label:"Type"},
      {key:"target_type", label:"Target"},
      {key:"reason", label:"Reason", render:(r)=><span className="ad-cell-wrap">{r.reason||r.description||"—"}</span>},
      {key:"status", label:"Status", render:(r)=><Badge>{r.status}</Badge>},
      {key:"created_at", label:"Reported", render:(r)=>dateTime(r.created_at)}
    ], "Review reports and moderation records.");
    if (active === "System Logs") return renderGeneric("System Logs", "AUDIT", logs, [
      {key:"action", label:"Action"},
      {key:"details", label:"Details", render:(r)=><span className="ad-cell-wrap">{typeof r.details === "object" ? JSON.stringify(r.details) : r.details || "—"}</span>},
      {key:"created_at", label:"Time", render:(r)=>dateTime(r.created_at)}
    ], "Approval and system events are recorded here when the table exists.");
    if (active === "Reviews & Ratings") return renderGeneric("Reviews & Ratings", "TRUST", reviews, [
      {key:"rating", label:"Rating", render:(r)=>"★".repeat(Math.max(0, Math.min(5, Number(r.rating)||0)))},
      {key:"review", label:"Review", render:(r)=><span className="ad-cell-wrap">{r.review||r.comment||"—"}</span>},
      {key:"status", label:"Status", render:(r)=><Badge>{r.status||"Published"}</Badge>},
      {key:"created_at", label:"Date", render:(r)=>dateTime(r.created_at)}
    ], "Review ratings and feedback records.");
    const informational = {
      "Carpenter Services": ["SERVICES", "Manage carpenter/service provider offerings and requests.", "The sidebar route is active and ready for service records when the corresponding table is added."],
      "Lead / Contact Activity": ["CRM", "Track enquiries, calls and contact activity.", "Use the existing notification/enquiry records to review leads."],
      "Reported Messages": ["SAFETY", "Review messages that users have reported.", "Connect this section to the messages/reports tables used by your project."],
      "Analytics": ["INSIGHTS", "Monitor platform growth and approval workload.", "Dashboard KPIs are live from profiles, listings, requirements, jobs and reports."],
      "Content / CMS": ["CONTENT", "Manage admin announcements, posts and media.", "This section is a working navigation surface for your existing admin content tables."],
      "Verification": ["TRUST", "Review identity and profile verification status.", "User verification status is displayed in User Management."],
      "Settings": ["SYSTEM", "Admin preferences and platform configuration.", "Use this page as the central settings hub for your TimberMart configuration."],
      "Admin & Security": ["SECURITY", "Admin access and security controls.", "Only profiles with role = admin / administrator should access this dashboard."],
      "Businesses": null
    };
    if (active === "Businesses") return renderUsers();
    if (informational[active]) {
      const [eyebrow, title, text] = informational[active];
      return <SectionHeader eyebrow={eyebrow} title={active} subtitle={title} action={<button className="ad-primary" onClick={() => loadData(true)}><RefreshCw size={14}/> Refresh</button>}><div className="ad-info-grid"><div className="ad-info-card"><ShieldCheck size={25}/><h3>{active}</h3><p>{text}</p><button className="ad-primary" onClick={() => go("Dashboard")}>Back to Dashboard</button></div></div></SectionHeader>;
    }
    return <SectionHeader eyebrow="ADMIN" title={active} subtitle="Administrative module"><div className="ad-info-grid"><div className="ad-info-card"><Activity size={25}/><h3>{active}</h3><p>This sidebar module is active and ready for the data source configured in your Supabase project.</p></div></div></SectionHeader>;
  };

  if (loading) return <div className="ad-loading"><div className="ad-logo-mark">🌳</div><h2>TimberMart Admin</h2><p>Loading Admin Control Center…</p></div>;

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="admin-brand"><div className="admin-brand-mark">🌳</div><div><b>TimberMart</b><small>Admin Panel</small></div></div>
        <nav>
          {MENU.map(([label, Icon]) => Icon ? (
            <button key={label} className={active === label ? "active" : ""} onClick={() => go(label)} title={label}><Icon size={15}/><span>{label}</span>{["Listings","Requirements","Jobs","Notifications","Reports & Moderation"].includes(label) && <i>{label==="Listings"?pendingListings.length:label==="Requirements"?pendingRequirements.length:""}</i>}</button>
          ) : <div className="admin-nav-section" key={label}>{label}</div>)}
        </nav>
        <button className="admin-logout" onClick={signOut}><LogOut size={15}/><span>Logout</span></button>
      </aside>

      <button className={`admin-backdrop ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} aria-label="Close menu" />

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-top-left"><button className="admin-menu-btn" onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? <X size={18}/> : <Menu size={18}/>}</button><div className="admin-search"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users, listings, requirements, jobs, messages..." /><kbd>⌘K</kbd></div></div>
          <div className="admin-top-actions"><button title="Search"><Search size={17}/></button><button title="Notifications"><Bell size={17}/><b>{notifications.length}</b></button><button title="Messages"><MessageSquare size={17}/><b>{reports.length}</b></button><button title="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()}><Maximize2 size={17}/></button><div className="admin-user"><div>{displayName(profilesById[admin?.id]).charAt(0).toUpperCase()}</div><span><b>{displayName(profilesById[admin?.id])}</b><small>Super Admin</small></span><ChevronDown size={14}/></div></div>
        </header>

        <div className="admin-content">
          {(error || success) && <div className={`ad-alert ${error ? "error" : "success"}`}>{error ? <AlertTriangle size={15}/> : <CheckCircle2 size={15}/>}<span>{error || success}</span><button onClick={() => {setError("");setSuccess("")}}>×</button></div>}
          {renderContent()}
        </div>
      </main>


      {cmsOpen && (
        <div className="ad-modal-backdrop" onMouseDown={closeCms}>
          <div className="ad-cms-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ad-modal-head">
              <div>
                <span>CONTENT / CMS</span>
                <h2>Create Post, Advertisement or Announcement</h2>
                <p>Publish directly from the Admin account.</p>
              </div>
              <button onClick={closeCms} disabled={cmsSaving}><X size={19}/></button>
            </div>

            <form className="ad-cms-form" onSubmit={createAdminPost}>
              <div className="ad-cms-type-grid">
                {[
                  ["announcement", "🔔", "Announcement", "Important platform update"],
                  ["post", "📝", "Post", "General community post"],
                  ["advertisement", "📣", "Advertisement", "Promotional / sponsored message"]
                ].map(([value, icon, label, text]) => (
                  <button
                    type="button"
                    key={value}
                    className={cmsForm.type === value ? "selected" : ""}
                    onClick={() => setCmsForm((f) => ({ ...f, type: value }))}
                  >
                    <span>{icon}</span><b>{label}</b><small>{text}</small>
                  </button>
                ))}
              </div>

              <label>
                <span>Audience</span>
                <select
                  value={cmsForm.target_role}
                  onChange={(e) => setCmsForm((f) => ({ ...f, target_role: e.target.value }))}
                >
                  <option value="all">All Users</option>
                  <option value="buyer">Buyers</option>
                  <option value="farmer">Farmers</option>
                  <option value="timber_merchant">Timber Merchants</option>
                  <option value="sawmill_business">Sawmill / Businesses</option>
                  <option value="carpenter">Carpenters</option>
                  <option value="worker">Workers</option>
                </select>
              </label>

              <label>
                <span>Title</span>
                <input
                  value={cmsForm.title}
                  onChange={(e) => setCmsForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={180}
                  placeholder="Enter post / announcement title"
                  required
                />
              </label>

              <label className="full">
                <span>Message / Content</span>
                <textarea
                  value={cmsForm.message}
                  onChange={(e) => setCmsForm((f) => ({ ...f, message: e.target.value }))}
                  rows={6}
                  maxLength={5000}
                  placeholder="Write the complete message that users should receive..."
                  required
                />
              </label>

              <div className="ad-cms-form-grid">
                <label>
                  <span>CTA Button Label (optional)</span>
                  <input
                    value={cmsForm.cta_label}
                    onChange={(e) => setCmsForm((f) => ({ ...f, cta_label: e.target.value }))}
                    placeholder="Example: View Offer"
                  />
                </label>
                <label>
                  <span>CTA URL (optional)</span>
                  <input
                    type="url"
                    value={cmsForm.cta_url}
                    onChange={(e) => setCmsForm((f) => ({ ...f, cta_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>
              </div>

              <label className="full">
                <span>Upload Photo (optional)</span>
                <div className="ad-cms-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCmsFile(e.target.files?.[0] || null)}
                  />
                  {cmsFile && (
                    <div className="ad-cms-file-preview">
                      <img src={URL.createObjectURL(cmsFile)} alt="" />
                      <span>{cmsFile.name}</span>
                      <button type="button" onClick={() => setCmsFile(null)}>Remove</button>
                    </div>
                  )}
                </div>
                <small>JPG, PNG, WEBP • maximum 5 MB</small>
              </label>

              <div className="ad-cms-footer">
                <button type="button" className="ad-secondary" onClick={closeCms} disabled={cmsSaving}>Cancel</button>
                <button type="submit" className="ad-primary" disabled={cmsSaving}>
                  <Send size={14} /> {cmsSaving ? "Publishing..." : "Publish Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && <DetailModal selected={selected} detailTab={detailTab} setDetailTab={setDetailTab} onClose={() => setSelected(null)} onReview={review} busyKey={busyKey} profilesById={profilesById} imagesById={imagesById} />}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle, action, children }) {
  return <section><div className="ad-section-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>{children}</section>;
}

function DataTable({ title, view, onView, headers, children }) {
  return <section className="ad-card ad-table-card"><div className="ad-card-head"><div><h2>{title}</h2><span>Latest records</span></div><button onClick={onView}>View All</button></div><div className="ad-table-wrap"><table className="ad-data-table"><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children || <tr><td colSpan={headers.length}><EmptyState title="No data" text="Nothing to show." /></td></tr>}</tbody></table></div></section>;
}

function DetailModal({ selected, detailTab, setDetailTab, onClose, onReview, busyKey, profilesById, imagesById }) {
  const { type, row } = selected;
  const profile = selected.profile;
  const relatedImages = imagesById[row.id] || [];
  const directImages = getImages(row);
  const images = [...new Set([...relatedImages, ...directImages])];
  const isApproval = type === "requirement" || type === "listing";
  const owner = profile || profilesById[row.buyer_id || row.user_id || row.seller_id || row.owner_id];
  const title = row.title || row.name || row.requirement_title || row.custom_requirement || row.species || (type === "listing" ? "Timber Listing" : "Record");

  return <div className="ad-modal-backdrop" onMouseDown={onClose}>
    <div className="ad-modal" onMouseDown={(e) => e.stopPropagation()}>
      <div className="ad-modal-head"><div><span>{type === "requirement" ? "COMPLETE BUYER REQUIREMENT REVIEW" : type === "listing" ? "COMPLETE TIMBER LISTING REVIEW" : "RECORD DETAILS"}</span><h2>{title}</h2><p>Submitted {dateTime(row.created_at)}</p></div><button onClick={onClose}><X size={19}/></button></div>
      <div className="ad-detail-tabs"><button className={detailTab==="overview"?"active":""} onClick={()=>setDetailTab("overview")}>Overview</button><button className={detailTab==="submission"?"active":""} onClick={()=>setDetailTab("submission")}>All Submitted Fields</button><button className={detailTab==="photos"?"active":""} onClick={()=>setDetailTab("photos")}>Photos ({images.length})</button></div>
      <div className="ad-modal-body">
        <section className="ad-owner-card"><div className="ad-owner-avatar">{displayName(owner).charAt(0).toUpperCase()}</div><div><small>POSTED / OWNED BY</small><strong>{displayName(owner)}</strong><span>{roleLabel(owner?.role)}</span></div><div className="ad-owner-contact"><span><Mail size={13}/>{owner?.email || "Email unavailable"}</span><span><Phone size={13}/>{owner?.phone || "Phone unavailable"}</span><span><MapPin size={13}/>{owner?.location || [owner?.city, owner?.state].filter(Boolean).join(", ") || [row.city,row.state].filter(Boolean).join(", ") || row.location || "Location unavailable"}</span></div></section>

        {detailTab === "overview" && <div className="ad-detail-grid"><section className="ad-detail-panel"><h3>Key Details</h3><div className="ad-field-grid">{Object.entries(row).filter(([k,v])=>!["id","created_at","updated_at","buyer_id","seller_id","user_id","owner_id"].includes(k)&&v!==null&&v!==undefined&&v!==""&&typeof v!=="object").slice(0,24).map(([k,v])=><div key={k}><small>{k.replace(/_/g," ")}</small><strong>{String(v)}</strong></div>)}</div>{row.description&&<div className="ad-long-text"><small>Description</small><p>{row.description}</p></div>}</section><section className="ad-detail-panel"><h3>Submission Checklist</h3><Checklist row={row} images={images} owner={owner}/></section></div>}

        {detailTab === "submission" && <section className="ad-detail-panel"><h3>Everything Submitted</h3><div className="ad-field-grid wide">{Object.entries(row).filter(([k,v])=>!["id","created_at","updated_at"].includes(k)&&v!==null&&v!==undefined&&v!==""&&typeof v!=="object").map(([k,v])=><div key={k}><small>{k.replace(/_/g," ")}</small><strong>{String(v)}</strong></div>)}</div></section>}

        {detailTab === "photos" && <section className="ad-detail-panel"><h3>Uploaded Photos</h3>{images.length ? <div className="ad-photo-grid">{images.map((url,i)=><a href={url} target="_blank" rel="noreferrer" key={`${url}-${i}`}><img src={url} alt={`Upload ${i+1}`}/><span>Photo {i+1}</span></a>)}</div> : <EmptyState title="No photos uploaded" text="No accessible image records were found."/>}</section>}
      </div>
      <div className="ad-modal-footer"><button className="ad-secondary" onClick={onClose}><ArrowLeft size={14}/> Close</button>{isApproval && <><button className="ad-danger" disabled={busyKey===`${type}:${row.id}`} onClick={()=>onReview(type,row,"reject")}><XCircle size={14}/> Reject</button><button className="ad-approve" disabled={busyKey===`${type}:${row.id}`} onClick={()=>onReview(type,row,"approve")}><CheckCircle2 size={14}/> Approve & Publish</button></>}</div>
    </div>
  </div>;
}

function Checklist({ row, images, owner }) {
  const items = [
    ["User identity", !!owner],
    ["Role information", !!owner?.role],
    ["Email", !!owner?.email],
    ["Phone", !!owner?.phone],
    ["Location", !!(owner?.location || row?.location || row?.city || row?.state)],
    ["Description", !!row?.description],
    ["Photos", images.length > 0],
    ["Status pending before approval", normalizeStatus(row?.status) === "pending"]
  ];
  return <div className="ad-checklist">{items.map(([label,ok])=><div key={label}><span className={ok?"ok":"warn"}>{ok?<CheckCircle2 size={14}/>:<AlertTriangle size={14}/>}</span><b>{label}</b><small>{ok?"Available":"Missing / not supplied"}</small></div>)}</div>;
}

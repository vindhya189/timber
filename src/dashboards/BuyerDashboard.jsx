import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Send,
  ExternalLink,
  RefreshCw,
  Package,
  ShieldCheck,
  Clock3,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./BuyerDashboard.css";
import TreeLoader from "../components/TreeLoader";

const CATEGORIES = [
  "All",
  "Trees",
  "Logs",
  "Timber",
  "Planks",
  "Plywood",
  "Doors",
  "Frames",
  "Furniture",
  "Interior",
  "Carpenter Services",
];

const WOOD_TYPES = ["All Types", "Teak", "Neem", "Pine", "Eucalyptus", "Rosewood"];

function normalizePhone(phone = "") {
  return String(phone).replace(/\D/g, "");
}

function whatsappUrl(phone, text) {
  const number = normalizePhone(phone);

  if (!number) return "#";

  let finalNumber = number;

  if (finalNumber.length === 10) {
    finalNumber = `91${finalNumber}`;
  }

  return `https://wa.me/${finalNumber}?text=${encodeURIComponent(text || "")}`;
}

function roleLabel(role) {
  const labels = {
    farmer: "Farmer",
    merchant: "Timber Merchant",
    sawmill: "Sawmill / Business",
    carpenter: "Carpenter",
    worker: "Worker",
    buyer: "Buyer",
  };

  return labels[role] || "TimberMart User";
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getListingImage(listing) {
  if (listing?.listing_images?.length) {
    return listing.listing_images
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.image_url;
  }

  return "";
}

export default function BuyerDashboard() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("All");
  const [woodType, setWoodType] = useState("All Types");
  const [locationFilter, setLocationFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const [sellerLoading, setSellerLoading] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [favourites, setFavourites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("timbermart_buyer_favourites") || "[]");
    } catch {
      return [];
    }
  });

  const [showFilters, setShowFilters] = useState(false);

  /* -------------------------------------------------------
     AUTH + PROFILE
  ------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoading(true);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.user) {
        navigate("/roles", { replace: true });
        return;
      }

      if (!mounted) return;

      setSession(currentSession);

      let { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (!userProfile) {
        const fallbackName =
          currentSession.user.user_metadata?.full_name ||
          currentSession.user.user_metadata?.name ||
          currentSession.user.email?.split("@")[0] ||
          "Buyer";

        const { data: createdProfile, error } = await supabase
          .from("profiles")
          .upsert(
            {
              id: currentSession.user.id,
              name: fallbackName,
              role: "buyer",
            },
            { onConflict: "id" }
          )
          .select()
          .single();

        if (!error) {
          userProfile = createdProfile;
        }
      }

      if (!userProfile) {
        navigate("/roles", { replace: true });
        return;
      }

      if (userProfile.role !== "buyer") {
        navigate(`/dashboard/${userProfile.role}`, { replace: true });
        return;
      }

      setProfile(userProfile);

      await loadListings();
      await loadOrders(currentSession.user.id);

      if (mounted) {
        setLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  /* -------------------------------------------------------
     LOAD LISTINGS
  ------------------------------------------------------- */

  async function loadListings() {
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        listing_images (
          id,
          image_url,
          storage_path,
          sort_order
        )
      `)
      .in("role", ["farmer", "merchant", "sawmill", "carpenter"])
      .order("created_at", { ascending: false });

    if (!error) {
      setListings(data || []);
    } else {
      console.error("Buyer listings error:", error);
    }
  }

  /* -------------------------------------------------------
     LOAD ORDERS
  ------------------------------------------------------- */

  async function loadOrders(userId) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        listing:listings (
          id,
          title,
          wood_type,
          price,
          quantity,
          location
        )
      `)
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });

    if (!error) {
      setOrders(data || []);
    } else {
      /*
        Orders table may not exist until the SQL below is executed.
        Dashboard still works without orders.
      */
      console.warn("Orders not loaded:", error.message);
      setOrders([]);
    }
  }

  /* -------------------------------------------------------
     REALTIME LISTINGS
  ------------------------------------------------------- */

  useEffect(() => {
    const channel = supabase
      .channel("buyer-listings-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listings",
        },
        () => {
          loadListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* -------------------------------------------------------
     REALTIME ORDERS
  ------------------------------------------------------- */

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`buyer-orders-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `buyer_id=eq.${session.user.id}`,
        },
        () => {
          loadOrders(session.user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  /* -------------------------------------------------------
     FILTER LISTINGS
  ------------------------------------------------------- */

  const filteredListings = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    const location = locationFilter.trim().toLowerCase();

    return listings.filter((listing) => {
      const title = String(listing.title || "").toLowerCase();
      const wood = String(listing.wood_type || "").toLowerCase();
      const product = String(listing.product_type || "").toLowerCase();
      const service = String(listing.service_type || "").toLowerCase();
      const listLocation = String(listing.location || "").toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        wood.includes(search) ||
        product.includes(search) ||
        service.includes(search) ||
        listLocation.includes(search);

      const matchesCategory =
        category === "All" ||
        title.toLowerCase().includes(category.toLowerCase()) ||
        product.includes(category.toLowerCase()) ||
        service.includes(category.toLowerCase()) ||
        (category === "Timber" &&
          ["teak", "neem", "pine", "eucalyptus", "rosewood"].some((x) =>
            wood.includes(x)
          ));

      const matchesWood =
        woodType === "All Types" ||
        wood === woodType.toLowerCase();

      const matchesLocation =
        !location || listLocation.includes(location);

      const numericPrice = parseFloat(
        String(listing.price || "").replace(/[^0-9.]/g, "")
      );

      const matchesPrice =
        !maxPrice ||
        !numericPrice ||
        numericPrice <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesWood &&
        matchesLocation &&
        matchesPrice
      );
    });
  }, [
    listings,
    searchText,
    category,
    woodType,
    locationFilter,
    maxPrice,
  ]);

  /* -------------------------------------------------------
     REFRESH
  ------------------------------------------------------- */

  async function handleRefresh() {
    setRefreshing(true);

    await Promise.all([
      loadListings(),
      session?.user?.id ? loadOrders(session.user.id) : Promise.resolve(),
    ]);

    setRefreshing(false);
  }

  /* -------------------------------------------------------
     FAVOURITES
  ------------------------------------------------------- */

  function toggleFavourite(listingId) {
    const next = favourites.includes(listingId)
      ? favourites.filter((id) => id !== listingId)
      : [...favourites, listingId];

    setFavourites(next);
    localStorage.setItem(
      "timbermart_buyer_favourites",
      JSON.stringify(next)
    );
  }

  /* -------------------------------------------------------
     SELLER PROFILE
  ------------------------------------------------------- */

  async function openSellerProfile(userId) {
    if (!userId) return;

    setSellerLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    setSellerLoading(false);

    if (!error && data) {
      setSelectedSeller(data);
    }
  }

  /* -------------------------------------------------------
     PRODUCT DETAILS
  ------------------------------------------------------- */

  function openProduct(listing) {
    setSelectedListing(listing);
  }

  /* -------------------------------------------------------
     CALL
  ------------------------------------------------------- */

  async function callUser(userId, fallbackPhone = "") {
    let phone = fallbackPhone;

    if (!phone && userId) {
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .maybeSingle();

      phone = data?.phone || "";
    }

    if (!phone) {
      alert("This user has not added a phone number yet.");
      return;
    }

    window.location.href = `tel:${phone}`;
  }

  /* -------------------------------------------------------
     WHATSAPP
  ------------------------------------------------------- */

  async function whatsappUser(userId, fallbackPhone = "", name = "") {
    let phone = fallbackPhone;

    if (!phone && userId) {
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .maybeSingle();

      phone = data?.phone || "";
    }

    if (!phone) {
      alert("This user has not added a phone number yet.");
      return;
    }

    const url = whatsappUrl(
      phone,
      `Hi ${name || "there"}, I found your listing on TimberMart. I am interested in it.`
    );

    window.open(url, "_blank", "noopener,noreferrer");
  }

  /* -------------------------------------------------------
     CHAT
  ------------------------------------------------------- */

  async function openChat(user) {
    if (!user?.id || !session?.user?.id) return;

    if (user.id === session.user.id) {
      alert("You cannot chat with yourself.");
      return;
    }

    setChatUser(user);
    setChatOpen(true);
    setMessages([]);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${session.user.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${session.user.id})`
      )
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages(data || []);
    } else {
      console.error("Chat loading error:", error);
    }
  }

  useEffect(() => {
    if (!chatOpen || !chatUser?.id || !session?.user?.id) return;

    const channel = supabase
      .channel(
        `buyer-chat-${session.user.id}-${chatUser.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new;

          const belongsToConversation =
            (message.sender_id === session.user.id &&
              message.receiver_id === chatUser.id) ||
            (message.sender_id === chatUser.id &&
              message.receiver_id === session.user.id);

          if (belongsToConversation) {
            setMessages((current) => {
              if (current.some((m) => m.id === message.id)) {
                return current;
              }

              return [...current, message];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatOpen, chatUser?.id, session?.user?.id]);

  async function sendMessage() {
    const body = messageText.trim();

    if (!body || !chatUser?.id || !session?.user?.id) {
      return;
    }

    setSendingMessage(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        receiver_id: chatUser.id,
        body,
      })
      .select()
      .single();

    setSendingMessage(false);

    if (error) {
      console.error("Send message error:", error);
      alert(error.message);
      return;
    }

    setMessages((current) => {
      if (current.some((m) => m.id === data.id)) {
        return current;
      }

      return [...current, data];
    });

    setMessageText("");
  }

  /* -------------------------------------------------------
     CREATE ORDER / DIRECT DEAL
  ------------------------------------------------------- */

  async function createOrder(listing) {
    if (!session?.user?.id || !listing?.id) return;

    const quantity = window.prompt(
      `Enter required quantity${listing.quantity ? ` (Available: ${listing.quantity})` : ""}:`
    );

    if (!quantity) return;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        buyer_id: session.user.id,
        seller_id: listing.user_id,
        listing_id: listing.id,
        quantity: quantity,
        status: "ongoing",
      })
      .select()
      .single();

    if (error) {
      console.error("Order error:", error);
      alert(
        error.message ||
          "Order could not be created. Please run the SQL provided below."
      );
      return;
    }

    setOrders((current) => [data, ...current]);

    alert(
      "Your request has been sent to the seller. You can contact the seller directly."
    );
  }

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  async function logout() {
    await supabase.auth.signOut();

    localStorage.removeItem("timbermart_current_user");

    navigate("/roles", { replace: true });
  }

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  function goTab(tab) {
    setActiveTab(tab);
    setSidebarOpen(false);

    if (tab === "profile") {
      navigate("/profile");
      return;
    }

    if (tab === "settings") {
      navigate("/settings");
      return;
    }

    if (tab === "requirements") {
      navigate("/requirements");
      return;
    }
  }

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
  return (
    <TreeLoader text="Growing your requirements..." />
  );
}

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="buyer-app">

      {/* ================= TOP BAR ================= */}

      <header className="buyer-topbar">

        <button
          className="buyer-menu-button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={23} />
        </button>

        <button
          className="buyer-brand"
          onClick={() => {
            setActiveTab("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="buyer-brand-tree">🌳</span>
          <span>TimberMart</span>
        </button>

        <div className="buyer-top-actions">

          <button
            className="buyer-icon-button"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw
              size={19}
              className={refreshing ? "buyer-spin" : ""}
            />
          </button>

          <button
            className="buyer-icon-button"
            title="Notifications"
          >
            <Bell size={20} />
          </button>

          <button
            className="buyer-user-mini"
            onClick={() => goTab("profile")}
          >
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name || "Profile"}
              />
            ) : (
              <span className="buyer-avatar-placeholder">
                {(profile?.name || "B").charAt(0).toUpperCase()}
              </span>
            )}

            <span className="buyer-user-mini-name">
              {profile?.name || "Buyer"}
            </span>
          </button>

        </div>
      </header>

      {/* ================= SIDEBAR OVERLAY ================= */}

      {sidebarOpen && (
        <div
          className="buyer-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside className={`buyer-sidebar ${sidebarOpen ? "open" : ""}`}>

        <div className="buyer-sidebar-header">

          <div className="buyer-sidebar-brand">
            <span>🌳</span>
            <div>
              <strong>TimberMart</strong>
              <small>Buy & Connect Directly</small>
            </div>
          </div>

          <button
            className="buyer-close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>

        </div>

        <div className="buyer-sidebar-profile">

          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.name || "Buyer"}
            />
          ) : (
            <div className="buyer-sidebar-avatar">
              {(profile?.name || "B").charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <strong>{profile?.name || "Buyer"}</strong>
            <span>Buyer / Homeowner</span>

            {profile?.location && (
              <small>
                <MapPin size={12} />
                {profile.location}
              </small>
            )}
          </div>

        </div>

        <nav className="buyer-sidebar-nav">

          <button
            className={activeTab === "home" ? "active" : ""}
            onClick={() => {
              setActiveTab("home");
              setSidebarOpen(false);
            }}
          >
            <ShoppingBag size={18} />
            <span>Buy Timber</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("search");
              setSidebarOpen(false);
              document
                .querySelector(".buyer-listings-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Search size={18} />
            <span>Search Listings</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("orders");
              setSidebarOpen(false);
              document
                .querySelector(".buyer-orders-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Package size={18} />
            <span>My Orders</span>
            <b>{orders.length}</b>
          </button>

          <button
            onClick={() => {
              setActiveTab("favourites");
              setSidebarOpen(false);
              document
                .querySelector(".buyer-favourites-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Heart size={18} />
            <span>Saved</span>
            <b>{favourites.length}</b>
          </button>

          <button
            onClick={() => goTab("requirements")}
          >
            <SlidersHorizontal size={18} />
            <span>Requirement Wall</span>
          </button>

          <div className="buyer-sidebar-divider" />

          <button onClick={() => goTab("profile")}>
            <User size={18} />
            <span>My Profile</span>
          </button>

          <button onClick={() => goTab("settings")}>
            <Settings size={18} />
            <span>Settings</span>
          </button>

        </nav>

        <div className="buyer-sidebar-bottom">

          <div className="buyer-sidebar-trust">
            <ShieldCheck size={18} />
            <div>
              <strong>Direct Contact</strong>
              <small>We Connect. You Deal Directly.</small>
            </div>
          </div>

          <button
            className="buyer-logout"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="buyer-main">

        {/* HERO */}

        <section className="buyer-hero">

          <div className="buyer-hero-content">

            <span className="buyer-role-badge">
              🏠 Buyer / Homeowner
            </span>

            <h1>
              Buy Quality Timber
              <br />
              <span>Directly from Sellers.</span>
            </h1>

            <p>
              Find timber, logs, planks and wood products from
              nearby sellers on TimberMart.
            </p>

            <div className="buyer-location-pill">
              <MapPin size={17} />
              <span>
                {profile?.location || "Set your location in profile"}
              </span>
            </div>

          </div>

          <div className="buyer-hero-visual">
            <div className="buyer-wood-circle">
              🪵
            </div>
            <span>Quality Timber</span>
          </div>

        </section>

        {/* SEARCH */}

        <section className="buyer-search-box">

          <div className="buyer-search-input-wrap">
            <Search size={20} />

            <input
              type="text"
              placeholder="Search timber, seller or location..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="buyer-clear-search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className="buyer-filter-toggle"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>

        </section>

        {/* CATEGORY */}

        <section className="buyer-category-section">

          <div className="buyer-section-heading">
            <div>
              <span className="buyer-eyebrow">EXPLORE</span>
              <h2>Shop by Category</h2>
            </div>

            <button
              onClick={() => {
                setCategory("All");
                setWoodType("All Types");
              }}
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="buyer-category-scroll">

            {CATEGORIES.map((item) => (
              <button
                key={item}
                className={
                  category === item
                    ? "buyer-category active"
                    : "buyer-category"
                }
                onClick={() => setCategory(item)}
              >
                <span>
                  {item === "All"
                    ? "✨"
                    : item === "Trees"
                    ? "🌳"
                    : item === "Logs"
                    ? "🪵"
                    : item === "Timber"
                    ? "🪵"
                    : item === "Planks"
                    ? "📏"
                    : item === "Plywood"
                    ? "🟫"
                    : item === "Doors"
                    ? "🚪"
                    : item === "Frames"
                    ? "🖼️"
                    : item === "Furniture"
                    ? "🪑"
                    : item === "Interior"
                    ? "🏠"
                    : "🛠️"}
                </span>
                <small>{item}</small>
              </button>
            ))}

          </div>

        </section>

        {/* FILTER PANEL */}

        {showFilters && (
          <section className="buyer-filter-panel">

            <div className="buyer-filter-field">

              <label>Wood Type</label>

              <select
                value={woodType}
                onChange={(e) => setWoodType(e.target.value)}
              >
                {WOOD_TYPES.map((wood) => (
                  <option key={wood} value={wood}>
                    {wood}
                  </option>
                ))}
              </select>

            </div>

            <div className="buyer-filter-field">

              <label>Location</label>

              <input
                value={locationFilter}
                onChange={(e) =>
                  setLocationFilter(e.target.value)
                }
                placeholder="Rajahmundry..."
              />

            </div>

            <div className="buyer-filter-field">

              <label>Maximum Price</label>

              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="₹ Maximum"
              />

            </div>

            <button
              className="buyer-clear-filters"
              onClick={() => {
                setWoodType("All Types");
                setLocationFilter("");
                setMaxPrice("");
              }}
            >
              Clear Filters
            </button>

          </section>
        )}

        {/* LISTINGS */}

        <section className="buyer-listings-section">

          <div className="buyer-section-heading">

            <div>
              <span className="buyer-eyebrow">TIMBER MARKET</span>
              <h2>Product Listings</h2>
            </div>

            <span className="buyer-result-count">
              {filteredListings.length} listing
              {filteredListings.length !== 1 ? "s" : ""}
            </span>

          </div>

          {filteredListings.length === 0 ? (
            <div className="buyer-empty">

              <div className="buyer-empty-icon">🪵</div>

              <h3>No timber listings found</h3>

              <p>
                Sellers have not posted matching listings yet.
                Try another category or search.
              </p>

              <button
                onClick={() => {
                  setSearchText("");
                  setCategory("All");
                  setWoodType("All Types");
                  setLocationFilter("");
                  setMaxPrice("");
                }}
              >
                Clear Search
              </button>

            </div>
          ) : (

            <div className="buyer-product-grid">

              {filteredListings.map((listing) => {

                const image = getListingImage(listing);

                const isFavourite =
                  favourites.includes(listing.id);

                return (
                  <article
                    className="buyer-product-card"
                    key={listing.id}
                  >

                    <div
                      className="buyer-product-image"
                      onClick={() => openProduct(listing)}
                    >

                      {image ? (
                        <img
                          src={image}
                          alt={listing.title || "Timber"}
                        />
                      ) : (
                        <div className="buyer-no-image">
                          🪵
                          <span>No photo</span>
                        </div>
                      )}

                      <button
                        className={`buyer-favourite ${
                          isFavourite ? "saved" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavourite(listing.id);
                        }}
                      >
                        <Heart
                          size={18}
                          fill={
                            isFavourite
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>

                    </div>

                    <div className="buyer-product-content">

                      <div className="buyer-product-top">

                        <span className="buyer-product-type">
                          {listing.wood_type ||
                            listing.product_type ||
                            "Timber"}
                        </span>

                        <span className="buyer-new-badge">
                          New
                        </span>

                      </div>

                      <h3>{listing.title}</h3>

                      <p className="buyer-seller-line">
                        Seller
                      </p>

                      <p className="buyer-location-line">
                        <MapPin size={13} />
                        {listing.location || "Location not added"}
                      </p>

                      <div className="buyer-product-bottom">

                        <strong>
                          {listing.price
                            ? `₹ ${listing.price}`
                            : "Price on contact"}
                        </strong>

                        {listing.quantity && (
                          <span>
                            Available: {listing.quantity}
                          </span>
                        )}

                      </div>

                      <button
                        className="buyer-view-product"
                        onClick={() => openProduct(listing)}
                      >
                        View Details
                        <ChevronRight size={16} />
                      </button>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* FAVOURITES */}

        {favourites.length > 0 && (
          <section className="buyer-favourites-section">

            <div className="buyer-section-heading">

              <div>
                <span className="buyer-eyebrow">SAVED</span>
                <h2>Saved Listings</h2>
              </div>

            </div>

            <div className="buyer-saved-row">

              {listings
                .filter((item) =>
                  favourites.includes(item.id)
                )
                .map((item) => (
                  <button
                    key={item.id}
                    className="buyer-saved-card"
                    onClick={() => openProduct(item)}
                  >
                    {getListingImage(item) ? (
                      <img
                        src={getListingImage(item)}
                        alt=""
                      />
                    ) : (
                      <span>🪵</span>
                    )}

                    <div>
                      <strong>{item.title}</strong>
                      <small>
                        {item.wood_type || "Timber"}
                      </small>
                    </div>
                  </button>
                ))}

            </div>

          </section>
        )}

        {/* ORDERS */}

        <section className="buyer-orders-section">

          <div className="buyer-section-heading">

            <div>
              <span className="buyer-eyebrow">DIRECT DEALS</span>
              <h2>My Orders</h2>
            </div>

            <span className="buyer-result-count">
              {orders.length}
            </span>

          </div>

          {orders.length === 0 ? (

            <div className="buyer-orders-empty">

              <Package size={30} />

              <div>
                <strong>No orders yet</strong>
                <p>
                  Your direct deal requests will appear here.
                </p>
              </div>

            </div>

          ) : (

            <div className="buyer-orders-list">

              {orders.map((order) => (

                <div
                  className="buyer-order-card"
                  key={order.id}
                >

                  <div className="buyer-order-image">

                    {getListingImage(order.listing) ? (
                      <img
                        src={getListingImage(order.listing)}
                        alt=""
                      />
                    ) : (
                      <span>🪵</span>
                    )}

                  </div>

                  <div className="buyer-order-info">

                    <strong>
                      {order.listing?.title ||
                        "Timber Order"}
                    </strong>

                    <span>
                      Quantity: {order.quantity}
                    </span>

                    <small>
                      {formatDate(order.created_at)}
                    </small>

                  </div>

                  <span
                    className={`buyer-order-status ${String(
                      order.status || "ongoing"
                    ).toLowerCase()}`}
                  >
                    {order.status || "Ongoing"}
                  </span>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* TRUST FOOTER */}

        <section className="buyer-trust-footer">

          <div className="buyer-trust-note">

            <ShieldCheck size={29} />

            <div>
              <strong>TimberMart only connects users.</strong>
              <p>
                All payments, deliveries and other arrangements
                are directly between buyer and seller.
                TimberMart is not responsible for transactions.
              </p>
            </div>

          </div>

          <div className="buyer-trust-items">

            <span>
              <ShoppingBag size={17} />
              Wide Categories
            </span>

            <span>
              <ShieldCheck size={17} />
              Verified Sellers
            </span>

            <span>
              <Phone size={17} />
              Direct Contact
            </span>

            <span>
              <MapPin size={17} />
              Nearby Connect
            </span>

          </div>

        </section>

      </main>

      {/* ================= PRODUCT DETAIL MODAL ================= */}

      {selectedListing && (
        <div
          className="buyer-modal-backdrop"
          onClick={() => setSelectedListing(null)}
        >

          <div
            className="buyer-product-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="buyer-modal-close"
              onClick={() => setSelectedListing(null)}
            >
              <X size={21} />
            </button>

            <div className="buyer-detail-image">

              {getListingImage(selectedListing) ? (
                <img
                  src={getListingImage(selectedListing)}
                  alt={selectedListing.title}
                />
              ) : (
                <div>🪵</div>
              )}

            </div>

            <div className="buyer-detail-body">

              <span className="buyer-detail-tag">
                {selectedListing.wood_type ||
                  selectedListing.product_type ||
                  "Timber"}
              </span>

              <h2>{selectedListing.title}</h2>

              <div className="buyer-detail-price">
                {selectedListing.price
                  ? `₹ ${selectedListing.price}`
                  : "Price on contact"}
              </div>

              <div className="buyer-detail-quick">

                <span>
                  <Package size={16} />
                  {selectedListing.quantity ||
                    "Available quantity not specified"}
                </span>

                <span>
                  <MapPin size={16} />
                  {selectedListing.location ||
                    "Location not specified"}
                </span>

              </div>

              <div className="buyer-detail-info">

                <h3>Product Information</h3>

                {selectedListing.wood_type && (
                  <div>
                    <span>Wood Type</span>
                    <strong>{selectedListing.wood_type}</strong>
                  </div>
                )}

                {selectedListing.product_type && (
                  <div>
                    <span>Product Type</span>
                    <strong>
                      {selectedListing.product_type}
                    </strong>
                  </div>
                )}

                {selectedListing.quantity && (
                  <div>
                    <span>Quantity</span>
                    <strong>
                      {selectedListing.quantity}
                    </strong>
                  </div>
                )}

                {selectedListing.location && (
                  <div>
                    <span>Location</span>
                    <strong>
                      {selectedListing.location}
                    </strong>
                  </div>
                )}

                <div>
                  <span>Posted On</span>
                  <strong>
                    {formatDate(selectedListing.created_at)}
                  </strong>
                </div>

              </div>

              {selectedListing.description && (
                <div className="buyer-description">
                  <h3>Description</h3>
                  <p>{selectedListing.description}</p>
                </div>
              )}

              <div className="buyer-seller-preview">

                <div className="buyer-seller-preview-avatar">
                  👤
                </div>

                <div>
                  <span>Seller</span>
                  <strong>View seller profile</strong>
                </div>

                <button
                  onClick={() =>
                    openSellerProfile(
                      selectedListing.user_id
                    )
                  }
                >
                  <ExternalLink size={16} />
                </button>

              </div>

              <div className="buyer-contact-actions">

                <button
                  className="buyer-call-btn"
                  onClick={() =>
                    callUser(selectedListing.user_id)
                  }
                >
                  <Phone size={18} />
                  Call Seller
                </button>

                <button
                  className="buyer-whatsapp-btn"
                  onClick={() =>
                    whatsappUser(selectedListing.user_id)
                  }
                >
                  WhatsApp
                </button>

                <button
                  className="buyer-chat-btn"
                  onClick={async () => {
                    const { data } = await supabase
                      .from("profiles")
                      .select("*")
                      .eq("id", selectedListing.user_id)
                      .maybeSingle();

                    if (data) {
                      openChat(data);
                    }
                  }}
                >
                  <MessageCircle size={18} />
                  Chat Now
                </button>

              </div>

              <button
                className="buyer-direct-deal-btn"
                onClick={() => createOrder(selectedListing)}
              >
                <ShoppingBag size={18} />
                Send Deal Request
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ================= SELLER PROFILE MODAL ================= */}

      {selectedSeller && (
        <div
          className="buyer-modal-backdrop"
          onClick={() => setSelectedSeller(null)}
        >

          <div
            className="buyer-seller-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="buyer-modal-close"
              onClick={() => setSelectedSeller(null)}
            >
              <X size={21} />
            </button>

            <div className="buyer-seller-cover">
              <div className="buyer-seller-large-avatar">

                {selectedSeller.photo_url ? (
                  <img
                    src={selectedSeller.photo_url}
                    alt={selectedSeller.name}
                  />
                ) : (
                  <span>
                    {(selectedSeller.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

              </div>
            </div>

            <div className="buyer-seller-modal-body">

              <div className="buyer-verified-row">

                <h2>
                  {selectedSeller.name ||
                    "TimberMart User"}
                </h2>

                <span>
                  <ShieldCheck size={14} />
                  Seller
                </span>

              </div>

              <p className="buyer-seller-role">
                {roleLabel(selectedSeller.role)}
              </p>

              {selectedSeller.location && (
                <p className="buyer-seller-location">
                  <MapPin size={15} />
                  {selectedSeller.location}
                </p>
              )}

              {selectedSeller.bio && (
                <div className="buyer-seller-about">
                  <h3>About Seller</h3>
                  <p>{selectedSeller.bio}</p>
                </div>
              )}

              <div className="buyer-profile-stats">

                <div>
                  <strong>
                    {
                      listings.filter(
                        (l) =>
                          l.user_id === selectedSeller.id
                      ).length
                    }
                  </strong>
                  <span>Products</span>
                </div>

                <div>
                  <strong>Direct</strong>
                  <span>Contact</span>
                </div>

                <div>
                  <strong>Local</strong>
                  <span>Seller</span>
                </div>

              </div>

              <div className="buyer-seller-actions">

                <button
                  onClick={() =>
                    callUser(
                      selectedSeller.id,
                      selectedSeller.phone
                    )
                  }
                >
                  <Phone size={18} />
                  Call
                </button>

                <button
                  onClick={() =>
                    openChat(selectedSeller)
                  }
                >
                  <MessageCircle size={18} />
                  Chat
                </button>

                <button
                  onClick={() =>
                    whatsappUser(
                      selectedSeller.id,
                      selectedSeller.phone,
                      selectedSeller.name
                    )
                  }
                >
                  WhatsApp
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= CHAT MODAL ================= */}

      {chatOpen && chatUser && (
        <div
          className="buyer-chat-backdrop"
          onClick={() => setChatOpen(false)}
        >

          <div
            className="buyer-chat-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="buyer-chat-header">

              <button
                onClick={() => setChatOpen(false)}
              >
                <ChevronLeft size={22} />
              </button>

              <div className="buyer-chat-user">

                {chatUser.photo_url ? (
                  <img
                    src={chatUser.photo_url}
                    alt={chatUser.name}
                  />
                ) : (
                  <span>
                    {(chatUser.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <div>
                  <strong>
                    {chatUser.name || "TimberMart User"}
                  </strong>
                  <small>Online / Direct Contact</small>
                </div>

              </div>

              <div className="buyer-chat-head-actions">

                <button
                  onClick={() =>
                    callUser(
                      chatUser.id,
                      chatUser.phone
                    )
                  }
                >
                  <Phone size={18} />
                </button>

                <button
                  onClick={() =>
                    whatsappUser(
                      chatUser.id,
                      chatUser.phone,
                      chatUser.name
                    )
                  }
                >
                  WhatsApp
                </button>

              </div>

            </div>

            <div className="buyer-chat-body">

              {messages.length === 0 ? (

                <div className="buyer-chat-empty">
                  <MessageCircle size={34} />
                  <strong>Start a conversation</strong>
                  <p>
                    Ask about timber, quantity, price or
                    availability.
                  </p>
                </div>

              ) : (

                messages.map((message) => {

                  const mine =
                    message.sender_id ===
                    session.user.id;

                  return (
                    <div
                      key={message.id}
                      className={
                        mine
                          ? "buyer-message mine"
                          : "buyer-message"
                      }
                    >
                      <div>
                        {message.body}
                      </div>

                      <small>
                        {new Date(
                          message.created_at
                        ).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  );
                })

              )}

            </div>

            <div className="buyer-chat-input">

              <input
                value={messageText}
                onChange={(e) =>
                  setMessageText(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
              />

              <button
                onClick={sendMessage}
                disabled={
                  sendingMessage ||
                  !messageText.trim()
                }
              >
                <Send size={19} />
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ================= SELLER LOADING ================= */}

      {sellerLoading && (
        <div className="buyer-small-loading">
          Loading profile...
        </div>
      )}

    </div>
  );
}
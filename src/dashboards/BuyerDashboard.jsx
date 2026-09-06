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
    timber_merchant: "Timber Merchant",
    sawmill: "Sawmill / Business",
    sawmill_business: "Sawmill / Business",
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

function getListingImages(listing) {
  if (!listing?.listing_images?.length) return [];

  return [...listing.listing_images]
    .filter((item) => item?.image_url)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((item) => item.image_url);
}

function getListingImage(listing) {
  return getListingImages(listing)[0] || "";
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
  const [selectedDetailImage, setSelectedDetailImage] = useState("");
  const [selectedAdminPost, setSelectedAdminPost] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const [sellerLoading, setSellerLoading] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Chat list + notification state
  const [chatContacts, setChatContacts] = useState([]);
  const [showChatList, setShowChatList] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const [favourites, setFavourites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("timbermart_buyer_favourites") || "[]");
    } catch {
      return [];
    }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [supplierMode, setSupplierMode] = useState(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState("");

  /* -------------------------------------------------------
     LOCATION - 40 KM NOTIFICATION SUPPORT
  ------------------------------------------------------- */

  async function saveCurrentLocation() {
    if (!session?.user?.id) return;

    if (!navigator.geolocation) {
      setLocationError("This browser does not support GPS location.");
      return;
    }

    setLocationSaving(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        let readableLocation = profile?.location || "Current location";

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } }
          );
          if (response.ok) {
            const data = await response.json();
            const address = data?.address || {};
            const parts = [
              address.city || address.town || address.village || address.municipality,
              address.state_district,
              address.state,
            ].filter(Boolean);
            if (parts.length) readableLocation = parts.join(", ");
          }
        } catch (geocodeError) {
          console.warn("Reverse geocoding failed:", geocodeError);
        }

        const { data, error } = await supabase
          .from("profiles")
          .update({
            latitude,
            longitude,
            location: readableLocation,
          })
          .eq("id", session.user.id)
          .select("*")
          .single();

        setLocationSaving(false);

        if (error) {
          console.error("Buyer location save error:", error);
          setLocationError(error.message || "Could not save your location.");
          return;
        }

        setProfile(data || { ...profile, latitude, longitude, location: readableLocation });
      },
      (error) => {
        setLocationSaving(false);
        const messages = {
          1: "Location permission was denied. Allow location access in your browser.",
          2: "Your location could not be determined.",
          3: "Location request timed out. Please try again.",
        };
        setLocationError(messages[error.code] || "Could not get your location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }

  const hasLocation =
    Number.isFinite(Number(profile?.latitude)) &&
    Number.isFinite(Number(profile?.longitude));

  /* -------------------------------------------------------
     SUPPLIER DIRECTORY
  ------------------------------------------------------- */

  const supplierListings = useMemo(() => {
    const mode = supplierMode;
    if (!mode) return [];

    return listings.filter((listing) => {
      const text = [
        listing.title,
        listing.description,
        listing.wood_type,
        listing.product_type,
        listing.service_type,
        listing.category,
        listing.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (mode === "imported") {
        return /imported|bulk|wholesale|container|foreign|malaysian|african|burma/.test(text);
      }

      if (mode === "patta") {
        return /patta teak|patta|indian teak/.test(text);
      }

      return false;
    });
  }, [listings, supplierMode]);

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
      await loadNotifications(currentSession.user.id);
      await loadChatContacts(currentSession.user.id);

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
      .in("role", [
        "farmer",
        "merchant",
        "timber_merchant",
        "sawmill",
        "sawmill_business",
        "carpenter",
      ])
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
     LOAD NOTIFICATIONS
  ------------------------------------------------------- */

  async function loadNotifications(userId = session?.user?.id) {
    if (!userId) return;

    setNotificationLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) {
      setNotifications(data || []);
    } else {
      console.error("Buyer notifications error:", error);
      setNotifications([]);
    }

    setNotificationLoading(false);
  }

  /* -------------------------------------------------------
     LOAD CHAT CONTACTS
  ------------------------------------------------------- */

  async function loadChatContacts(userId = session?.user?.id) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, created_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Chat contacts error:", error);
      setChatContacts([]);
      return;
    }

    const ids = [];
    for (const row of data || []) {
      const otherId =
        row.sender_id === userId ? row.receiver_id : row.sender_id;

      if (otherId && !ids.includes(otherId)) {
        ids.push(otherId);
      }
    }

    if (!ids.length) {
      setChatContacts([]);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, role, phone, photo_url, location")
      .in("id", ids);

    if (profileError) {
      console.error("Chat profile error:", profileError);
      setChatContacts([]);
      return;
    }

    const ordered = ids
      .map((id) => (profiles || []).find((profile) => profile.id === id))
      .filter(Boolean);

    setChatContacts(ordered);
  }

  /* -------------------------------------------------------
     MARK NOTIFICATION READ
  ------------------------------------------------------- */

  async function markNotificationRead(notificationId) {
    if (!notificationId || !session?.user?.id) return;

    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId
          ? { ...item, is_read: true }
          : item
      )
    );

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Mark notification read error:", error);
    }
  }

  async function markAllNotificationsRead() {
    if (!session?.user?.id) return;

    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true }))
    );

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Mark all notifications error:", error);
    }
  }

  async function openBuyerNotification(notification) {
    if (!notification) return;

    await markNotificationRead(notification.id);
    setShowNotifications(false);

    // Listing notification
    if (notification.listing_id || notification.post_type === "listing") {
      const listingId = notification.listing_id || notification.post_id;

      if (!listingId) return;

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
        .eq("id", listingId)
        .maybeSingle();

      if (error) {
        console.error("Notification listing error:", error);
        return;
      }

      if (data) {
        setSelectedListing(data);
      }

      return;
    }

    // Requirement notification
    if (
      notification.requirement_id ||
      notification.post_type === "requirement" ||
      notification.type === "requirement_approved" ||
      notification.type === "requirement_rejected"
    ) {
      const requirementId =
        notification.requirement_id || notification.post_id;

      if (!requirementId) return;

      const { data, error } = await supabase
        .from("buyer_requirements")
        .select("*")
        .eq("id", requirementId)
        .maybeSingle();

      if (error) {
        console.error("Notification requirement error:", error);
        return;
      }

      if (data) {
        alert(
          `${data.title || "Requirement"}\n\n${
            data.description || "Requirement details are available."
          }`
        );
      }

      return;
    }

    // Official Admin Post / Advertisement notification
    if (
      notification.post_id ||
      notification.source === "admin_post" ||
      ["announcement", "admin_post", "advertisement", "ad"].includes(String(notification.type || "").toLowerCase())
    ) {
      const postId = notification.post_id;

      if (postId) {
        const { data, error } = await supabase
          .from("admin_posts")
          .select("*")
          .eq("id", postId)
          .maybeSingle();

        if (!error && data) {
          setSelectedAdminPost(data);
          return;
        }

        console.error("Admin post notification error:", error);
      }

      // Fallback for older notifications without a post_id
      alert(
        `${notification.title || "TimberMart Admin"}\n\n${
          notification.message || "New TimberMart Admin update."
        }`
      );
    }
  }

  /* -------------------------------------------------------
     INITIAL LOAD FOR NOTIFICATIONS + CHATS
  ------------------------------------------------------- */

  useEffect(() => {
    if (!session?.user?.id) return;

    loadNotifications(session.user.id);
    loadChatContacts(session.user.id);
  }, [session?.user?.id]);

  /* -------------------------------------------------------
     REALTIME NOTIFICATIONS
  ------------------------------------------------------- */

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;

    const channel = supabase
      .channel(`buyer-notifications-${userId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (payload.new?.user_id !== userId) return;

          setNotifications((current) => [
            payload.new,
            ...current.filter((item) => item.id !== payload.new.id),
          ]);

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(
                payload.new.title || "TimberMart Notification",
                {
                  body:
                    payload.new.message ||
                    "You have a new notification.",
                }
              );
            } catch (notificationError) {
              console.warn(
                "Browser notification error:",
                notificationError
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  /* -------------------------------------------------------
     REALTIME CHAT LIST
  ------------------------------------------------------- */

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;

    const channel = supabase
      .channel(`buyer-chat-list-${userId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new;

          if (
            message.sender_id !== userId &&
            message.receiver_id !== userId
          ) {
            return;
          }

          loadChatContacts(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

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

  useEffect(() => {
    const modalOpen = Boolean(selectedListing);

    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedListing]);

  async function openProduct(listing) {
    if (!listing?.id) return;

    // Use the already-loaded listing immediately so the modal opens fast.
    const localImages = getListingImages(listing);
    setSelectedListing(listing);
    setSelectedDetailImage(localImages[0] || "");

    // Then fetch the complete listing again so every image/detail is present.
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
      .eq("id", listing.id)
      .maybeSingle();

    if (!error && data) {
      const images = getListingImages(data);
      setSelectedListing(data);
      setSelectedDetailImage(images[0] || "");
    } else if (error) {
      console.error("Product details error:", error);
    }
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

    await loadChatContacts(session.user.id);
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
    await loadChatContacts(session.user.id);
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
            className="buyer-icon-button buyer-notification-button"
            title="Notifications"
            onClick={() => setShowNotifications((value) => !value)}
          >
            <Bell size={20} />
            {notifications.filter((item) => !item.is_read).length > 0 && (
              <span className="buyer-notification-count">
                {Math.min(
                  notifications.filter((item) => !item.is_read).length,
                  99
                )}
              </span>
            )}
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

            <em className={hasLocation ? "buyer-gps-status on" : "buyer-gps-status"}>
              {hasLocation ? "● Location active" : "○ Location not set"}
            </em>
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
            className={showChatList ? "active" : ""}
            onClick={() => {
              setShowChatList(true);
              setSidebarOpen(false);
              loadChatContacts();
            }}
          >
            <MessageCircle size={18} />
            <span>Chats</span>
            {chatContacts.length > 0 && <b>{chatContacts.length}</b>}
          </button>

          <button
            className={showNotifications ? "active" : ""}
            onClick={() => {
              setShowNotifications(true);
              setSidebarOpen(false);
              loadNotifications();
            }}
          >
            <Bell size={18} />
            <span>Notifications</span>
            {notifications.filter((item) => !item.is_read).length > 0 && (
              <b>
                {Math.min(
                  notifications.filter((item) => !item.is_read).length,
                  99
                )}
              </b>
            )}
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

          <button
            className={supplierMode === "imported" ? "active" : ""}
            onClick={() => {
              setSupplierMode("imported");
              setSidebarOpen(false);
              setTimeout(() => {
                document.querySelector(".buyer-supplier-section")?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }}
          >
            <span className="buyer-nav-emoji">🌍</span>
            <span>Imported Wood Bulk Suppliers</span>
          </button>

          <button
            className={supplierMode === "patta" ? "active" : ""}
            onClick={() => {
              setSupplierMode("patta");
              setSidebarOpen(false);
              setTimeout(() => {
                document.querySelector(".buyer-supplier-section")?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }}
          >
            <span className="buyer-nav-emoji">🌳</span>
            <span>Indian Patta Teak Supplier</span>
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

            <div className="buyer-location-row">
              <div className={`buyer-location-pill ${hasLocation ? "ready" : "needs-location"}`}>
                <MapPin size={17} />
                <span>
                  {profile?.location || "Location needed for 40 KM alerts"}
                </span>
                <b>{hasLocation ? "GPS ON" : "GPS OFF"}</b>
              </div>

              <button
                className="buyer-location-button"
                onClick={saveCurrentLocation}
                disabled={locationSaving}
              >
                <MapPin size={16} />
                {locationSaving ? "Saving..." : hasLocation ? "Update Location" : "Enable Location"}
              </button>
            </div>

            {locationError && (
              <div className="buyer-location-error">
                {locationError}
              </div>
            )}

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
                      className="buyer-product-image buyer-product-image-clickable"
                      onClick={() => openProduct(listing)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openProduct(listing);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${listing.title || "timber listing"}`}
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

        {/* ================= SUPPLIER DIRECTORY ================= */}

        {supplierMode && (
          <section className="buyer-supplier-section">
            <div className="buyer-section-heading">
              <div>
                <span className="buyer-eyebrow">SUPPLIER NETWORK</span>
                <h2>
                  {supplierMode === "imported"
                    ? "Imported Wood Bulk Suppliers"
                    : "Indian Patta Teak Supplier"}
                </h2>
                <p className="buyer-section-subtitle">
                  {supplierMode === "imported"
                    ? "Bulk and imported-wood listings currently available on TimberMart."
                    : "Listings tagged with Patta Teak / Indian Teak from sellers on TimberMart."}
                </p>
              </div>
              <button onClick={() => setSupplierMode(null)}>Close</button>
            </div>

            {supplierListings.length === 0 ? (
              <div className="buyer-supplier-empty">
                <div>🪵</div>
                <h3>No matching supplier listings yet</h3>
                <p>
                  When a seller posts a matching imported/bulk or Patta Teak listing,
                  it will automatically appear here.
                </p>
                <button
                  onClick={() => {
                    setSupplierMode(null);
                    document.querySelector(".buyer-listings-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Browse All Listings
                </button>
              </div>
            ) : (
              <div className="buyer-supplier-grid">
                {supplierListings.map((listing) => (
                  <article className="buyer-supplier-card" key={listing.id}>
                    <div className="buyer-supplier-icon">🪵</div>
                    <div className="buyer-supplier-main">
                      <span>{listing.wood_type || listing.product_type || "Timber"}</span>
                      <h3>{listing.title || "Timber Supplier Listing"}</h3>
                      <p>
                        <MapPin size={13} /> {listing.location || "Location not added"}
                      </p>
                      <strong>
                        {listing.price ? `₹ ${listing.price}` : "Price on contact"}
                      </strong>
                    </div>
                    <button onClick={() => openProduct(listing)}>
                      View
                      <ChevronRight size={16} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

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

      {/* ================= CHAT LIST PANEL ================= */}

      {showChatList && (
        <div
          className="buyer-panel-backdrop"
          onClick={() => setShowChatList(false)}
        >
          <aside
            className="buyer-chat-list-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="buyer-chat-list-header">
              <div>
                <span>MESSAGES</span>
                <h2>Chats</h2>
              </div>

              <button
                onClick={() => setShowChatList(false)}
                aria-label="Close chats"
              >
                <X size={20} />
              </button>
            </div>

            <div className="buyer-chat-list-body">
              {chatContacts.length === 0 ? (
                <div className="buyer-chat-list-empty">
                  <MessageCircle size={34} />
                  <strong>No chats yet</strong>
                  <p>
                    Open a timber listing and tap Chat Now to start
                    a conversation with a seller.
                  </p>
                </div>
              ) : (
                chatContacts.map((contact) => (
                  <button
                    key={contact.id}
                    className="buyer-chat-contact"
                    onClick={() => {
                      setShowChatList(false);
                      openChat(contact);
                    }}
                  >
                    <div className="buyer-chat-contact-avatar">
                      {contact.photo_url ? (
                        <img
                          src={contact.photo_url}
                          alt={contact.name || "User"}
                        />
                      ) : (
                        <span>
                          {(contact.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="buyer-chat-contact-info">
                      <strong>
                        {contact.name || "TimberMart User"}
                      </strong>
                      <small>
                        {roleLabel(contact.role)}
                      </small>
                      {contact.location && (
                        <span>
                          <MapPin size={11} />
                          {contact.location}
                        </span>
                      )}
                    </div>

                    <ChevronRight size={17} />
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ================= NOTIFICATIONS PANEL ================= */}

      {showNotifications && (
        <div
          className="buyer-notification-backdrop"
          onClick={() => setShowNotifications(false)}
        >
          <aside
            className="buyer-notification-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="buyer-notification-header">
              <div>
                <span>UPDATES</span>
                <h2>Notifications</h2>
              </div>

              <div className="buyer-notification-header-actions">
                {notifications.some((item) => !item.is_read) && (
                  <button onClick={markAllNotificationsRead}>
                    Mark all read
                  </button>
                )}

                <button
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="buyer-notification-body">
              {notificationLoading ? (
                <div className="buyer-notification-empty">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="buyer-notification-empty">
                  <Bell size={35} />
                  <strong>No notifications</strong>
                  <p>
                    Matching nearby posts and account updates will
                    appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`buyer-notification-item ${
                      !notification.is_read ? "unread" : ""
                    }`}
                    onClick={() =>
                      openBuyerNotification(notification)
                    }
                  >
                    <div className="buyer-notification-icon">
                      {notification.type === "nearby_listing" ||
                      notification.post_type === "listing" ? (
                        "🪵"
                      ) : notification.type === "message" ? (
                        "💬"
                      ) : (
                        "🔔"
                      )}
                    </div>

                    <div className="buyer-notification-content">
                      {notification.image_url && (
                        <div className="buyer-notification-image-wrap">
                          <img
                            className="buyer-notification-image"
                            src={notification.image_url}
                            alt={notification.title || "TimberMart Admin post"}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.parentElement.style.display = "none";
                            }}
                          />
                          <span className="buyer-admin-post-badge">TIMBERMART ADMIN</span>
                        </div>
                      )}
                      <strong>
                        {notification.title ||
                          "TimberMart Notification"}
                      </strong>

                      <p>
                        {notification.message ||
                          "You have a new TimberMart update."}
                      </p>

                      <div className="buyer-notification-meta">
                        {notification.distance_km != null && (
                          <span>
                            📍{" "}
                            {Number(
                              notification.distance_km
                            ).toFixed(1)}{" "}
                            km away
                          </span>
                        )}

                        <small>
                          {formatDate(
                            notification.created_at
                          )}
                        </small>
                      </div>
                    </div>

                    {!notification.is_read && (
                      <span className="buyer-unread-dot" />
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      )}


      {/* ================= ADMIN POST / AD MODAL ================= */}
      {selectedAdminPost && (
        <div
          className="buyer-modal-backdrop buyer-admin-post-backdrop"
          onClick={() => setSelectedAdminPost(null)}
        >
          <div
            className="buyer-admin-post-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="buyer-modal-close"
              onClick={() => setSelectedAdminPost(null)}
              aria-label="Close admin post"
            >
              <X size={21} />
            </button>

            {selectedAdminPost.image_url && (
              <div className="buyer-admin-post-hero">
                <img
                  src={selectedAdminPost.image_url}
                  alt={selectedAdminPost.title || "TimberMart Admin post"}
                />
              </div>
            )}

            <div className="buyer-admin-post-body">
              <span className="buyer-admin-post-label">
                📢 TIMBERMART ADMIN
              </span>
              <span className="buyer-admin-post-type">
                {selectedAdminPost.post_type || "announcement"}
              </span>
              <h2>{selectedAdminPost.title}</h2>
              <p>{selectedAdminPost.message}</p>
              <small>{formatDate(selectedAdminPost.created_at)}</small>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCT DETAIL MODAL ================= */}

      {selectedListing && (
        <div
          className="buyer-modal-backdrop buyer-product-detail-backdrop"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="buyer-product-modal buyer-product-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="buyer-modal-close"
              onClick={() => setSelectedListing(null)}
              aria-label="Close product details"
            >
              <X size={21} />
            </button>

            {(() => {
              const detailImages = getListingImages(selectedListing);
              const activeImage =
                selectedDetailImage || detailImages[0] || "";

              return (
                <div className="buyer-detail-layout">
                  {/* ================= ALL PRODUCT PHOTOS ================= */}
                  <div className="buyer-detail-gallery">
                    <div className="buyer-detail-main-image">
                      {activeImage ? (
                        <img
                          src={activeImage}
                          alt={selectedListing.title || "Timber listing"}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="buyer-detail-no-image">
                          <span>🪵</span>
                          <small>No photos available</small>
                        </div>
                      )}

                      {detailImages.length > 0 && (
                        <span className="buyer-detail-photo-count">
                          {detailImages.length} photo{detailImages.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {detailImages.length > 0 && (
                      <div className="buyer-detail-thumbnails">
                        {detailImages.map((imageUrl, index) => (
                          <button
                            type="button"
                            key={`${imageUrl}-${index}`}
                            className={
                              activeImage === imageUrl
                                ? "buyer-detail-thumb active"
                                : "buyer-detail-thumb"
                            }
                            onClick={() => setSelectedDetailImage(imageUrl)}
                            aria-label={`View photo ${index + 1}`}
                          >
                            <img
                              src={imageUrl}
                              alt={`${selectedListing.title || "Timber"} ${index + 1}`}
                            />
                            <span>{index + 1}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ================= COMPLETE DETAILS ================= */}
                  <div className="buyer-detail-body">
                    <span className="buyer-detail-tag">
                      {selectedListing.wood_type ||
                        selectedListing.product_type ||
                        selectedListing.category ||
                        "Timber"}
                    </span>

                    <h2>{selectedListing.title || "Timber Listing"}</h2>

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
                      <h3>Complete Product Information</h3>

                      <div>
                        <span>Listing Title</span>
                        <strong>{selectedListing.title || "—"}</strong>
                      </div>

                      <div>
                        <span>Wood Type</span>
                        <strong>
                          {selectedListing.wood_type || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Product Type</span>
                        <strong>
                          {selectedListing.product_type || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Category</span>
                        <strong>
                          {selectedListing.category || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Service Type</span>
                        <strong>
                          {selectedListing.service_type || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Quantity / Stock</span>
                        <strong>
                          {selectedListing.quantity || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Price</span>
                        <strong>
                          {selectedListing.price
                            ? `₹ ${selectedListing.price}`
                            : "Price on contact"}
                        </strong>
                      </div>

                      <div>
                        <span>Location</span>
                        <strong>
                          {selectedListing.location || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Posted On</span>
                        <strong>
                          {formatDate(selectedListing.created_at) || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Photos</span>
                        <strong>
                          {detailImages.length} uploaded
                        </strong>
                      </div>
                    </div>

                    <div className="buyer-description">
                      <h3>Description</h3>
                      <p>
                        {selectedListing.description ||
                          "The seller has not added a description for this listing."}
                      </p>
                    </div>

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
                          openSellerProfile(selectedListing.user_id)
                        }
                        aria-label="View seller profile"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>

                    {/* ================= CALL / WHATSAPP / CHAT ================= */}
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
                          whatsappUser(
                            selectedListing.user_id,
                            "",
                            selectedListing.title || "Timber"
                          )
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
                            setSelectedListing(null);
                            openChat(data);
                          } else {
                            alert("Seller profile could not be loaded.");
                          }
                        }}
                      >
                        <MessageCircle size={18} />
                        Chat Now
                      </button>
                    </div>

                    
                  </div>
                </div>
              );
            })()}
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
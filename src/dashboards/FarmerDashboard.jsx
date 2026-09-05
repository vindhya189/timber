import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  FileText,
  Eye,
  Home,
  ImagePlus,
  LogOut,
  LocateFixed,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Settings,
  Trash2,
  TreePine,
  Upload,
  User,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

import "./FarmerDashboard.css";
import TreeLoader from "../components/TreeLoader";

/* =========================================================
   FARMER DASHBOARD
   ---------------------------------------------------------
   Existing dashboard functionality preserved.

   Added:
   - Professional Sell Tree flow
   - Category selection
   - Indian Trees
   - Plantations
   - Wood Products
   - Dynamic tree/product types
   - Plantation Acre field
   - Tree age
   - Diameter
   - Quantity + unit
   - Expected price
   - Photos
   - Review
   - Publish to Supabase
========================================================= */


/* =========================================================
   SELL TREE DATA
========================================================= */

const SELL_CATEGORIES = [
  {
    id: "indian_trees",
    icon: "🌳",
    title: "Indian Trees",
    description:
      "Standing trees grown on farms or individual land.",
  },

  {
    id: "plantations",
    icon: "🌱",
    title: "Plantations",
    description:
      "Commercial plantation timber and farm-grown trees.",
  },

  {
    id: "wood_products",
    icon: "🪵",
    title: "Wood Products",
    description:
      "Logs, planks, beams and other wood products.",
  },
];


const INDIAN_TREES = [
  "Teak",
  "Neem",
  "Rosewood",
  "Mango",
  "Tamarind",
  "Eucalyptus",
  "Melia Dubia",
  "Casuarina",
  "Subabul",
  "Babul",
  "Jackfruit",
  "Sandalwood",
  "Mahogany",
  "Other Indian Tree",
];


const PLANTATION_TYPES = [
  "Casuarina Plantation",
  "Eucalyptus Plantation",
  "Melia Dubia Plantation",
  "Subabul Plantation",
  "Teak Plantation",
  "Bamboo Plantation",
  "Other Plantation",
];


const WOOD_PRODUCTS = [
  "Timber Logs",
  "Sawn Timber",
  "Wooden Planks",
  "Wooden Beams",
  "Wooden Poles",
  "Firewood",
  "Sawdust",
  "Wood Chips",
  "Plywood / Boards",
  "Other Wood Product",
];


const QUANTITY_UNITS = [
  "Trees",
  "Logs",
  "Tonnes",
  "Cubic Feet",
  "Cubic Metres",
  "Pieces",
  "Load",
];


const TREE_CONDITIONS = [
  "Fresh",
  "Good",
  "Seasoned",
  "Dry",
  "Mixed",
];


const HARVEST_STATUS = [
  "Ready for sale",
  "Ready for harvest",
  "Harvesting soon",
  "Future harvest",
];


/* =========================================================
   MAIN FARMER DASHBOARD
========================================================= */

/* =======================================================
   NEARBY LISTING MATCHING
   Gets the user's real device coordinates so Supabase can
   match a new listing with requirements within 30 km.
======================================================= */
async function getCurrentCoordinates() {
  // GPS only. IP address location is NEVER used.
  if (!navigator.geolocation) return null;

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });

    return {
      latitude: Number(position.coords.latitude),
      longitude: Number(position.coords.longitude),
    };
  } catch (error) {
    console.warn("GPS location unavailable:", error);
    return null;
  }
}

async function reverseGeocodeLocation(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "";
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) return "";

    const data = await response.json();
    const address = data?.address || {};

    const parts = [
      address.village,
      address.town,
      address.city,
      address.municipality,
      address.district,
      address.state,
      address.country,
    ].filter(Boolean);

    const uniqueParts = [...new Set(parts)];
    return uniqueParts.join(", ") || data?.display_name || "";
  } catch (error) {
    console.warn("Reverse geocoding failed:", error);
    return "";
  }
}

function cleanMatchingKeywords(values = []) {
  const output = [];

  values.forEach((value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) output.push(String(item).trim().toLowerCase());
      });
      return;
    }

    String(value)
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .forEach((item) => output.push(item));
  });

  return [...new Set(output)];
}

async function notifyMatchingUsers40Km({
  senderId,
  latitude,
  longitude,
  postType,
  postId,
  title,
  message,
  keywords = [],
  matchingRoles = [],
  listingId = null,
  requirementId = null,
  jobId = null,
}) {
  if (!senderId || !postId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 0;
  }

  const { data, error } = await supabase.rpc(
    "notify_matching_users_40km",
    {
      p_sender_id: senderId,
      p_latitude: latitude,
      p_longitude: longitude,
      p_post_type: postType,
      p_post_id: postId,
      p_title: title,
      p_message: message,
      p_keywords: cleanMatchingKeywords(keywords),
      p_matching_roles: matchingRoles,
      p_listing_id: listingId,
      p_requirement_id: requirementId,
      p_job_id: jobId,
    }
  );

  if (error) {
    console.error("40 KM matching notification error:", error);
    return 0;
  }

  return Number(data || 0);
}

export default function FarmerDashboard() {
  const navigate = useNavigate();

  /* =======================================================
     USER / PROFILE
  ======================================================= */

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // GPS / 40 KM notification status
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  /* =======================================================
     DASHBOARD DATA
  ======================================================= */

  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // MESSAGES CENTER
  const [showMessages, setShowMessages] = useState(false);
  const [messageConversations, setMessageConversations] = useState([]);
  const [unreadByUser, setUnreadByUser] = useState({});
  const [messageToast, setMessageToast] = useState(null);
  const messageAudioContextRef = useRef(null);
  const messageSoundUnlockedRef = useRef(false);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [searchText, setSearchText] = useState("");

  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedRequirement, setSelectedRequirement] =
    useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);

  // CHAT STATE
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Keep the latest chat/user values available to realtime message listeners.
  const selectedProfileRef = useRef(null);
  const showChatRef = useRef(false);
  const userRef = useRef(null);

  useEffect(() => {
    selectedProfileRef.current = selectedProfile;
    showChatRef.current = showChat;
    userRef.current = user;
  }, [selectedProfile, showChat, user]);

  /* =======================================================
     LISTING EXPIRY CLOCK
     -------------------------------------------------------
     Supabase sets expires_at when admin approves a listing.
     This clock displays the remaining time and removes an
     expired listing from the visible Timber Listings section.
  ======================================================= */

  const [expiryNow, setExpiryNow] = useState(Date.now());

  useEffect(() => {
    const expiryTimer = window.setInterval(() => {
      setExpiryNow(Date.now());
    }, 1000);

    return () => window.clearInterval(expiryTimer);
  }, []);

  /* =======================================================
     SELL TREE STATE
  ======================================================= */

  const [showSellTree, setShowSellTree] = useState(false);

  const [sellStep, setSellStep] = useState(1);

  const [sellForm, setSellForm] = useState({
    category: "",
    tree_type: "",
    title: "",
    location: "",
    quantity: "",
    quantity_unit: "",
    acreage: "",
    tree_age: "",
    diameter: "",
    estimated_volume: "",
    condition: "",
    harvest_status: "",
    price: "",
    description: "",
  });

  const [sellPhotos, setSellPhotos] = useState([]);

  const [sellError, setSellError] = useState("");
  const [publishingListing, setPublishingListing] =
    useState(false);

  const [listingPublished, setListingPublished] =
    useState(false);

  /* =======================================================
     AUTH + INITIAL DATA
  ======================================================= */

  useEffect(() => {
    loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          navigate("/login", { replace: true });
        } else {
          setUser(session.user);
        }
      }
    );

    const notificationChannel = supabase
      .channel(`farmer-notifications-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        async (payload) => {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (payload.new?.user_id !== session?.user?.id) return;

          setNotifications((previous) => [
            payload.new,
            ...previous.filter((item) => item.id !== payload.new.id),
          ]);

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(
              payload.new?.title || "TimberMart",
              {
                body: payload.new?.message || "New notification",
              }
            );
          }
        }
      )
      .subscribe();

    // Global incoming-message listener. It works even when the chat window
    // is closed, so the Messages badge can update immediately.
    const incomingMessageChannel = supabase
      .channel(`farmer-incoming-messages-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const receiverId = payload.new?.receiver_id;
          const senderId = payload.new?.sender_id;
          if (!receiverId || !senderId || receiverId !== userRef.current?.id) return;

          // Update the open chat immediately if this conversation is visible.
          if (showChatRef.current && selectedProfileRef.current?.id === senderId) {
            setMessages((old) =>
              old.some((item) => item.id === payload.new.id)
                ? old
                : [...old, payload.new]
            );
          } else {
            setUnreadByUser((old) => ({
              ...old,
              [senderId]: (old[senderId] || 0) + 1,
            }));
          }

          let senderProfile = null;

          try {
            const { data: fetchedSenderProfile } = await supabase
              .from("profiles")
              .select("id,name,role,photo_url,location")
              .eq("id", senderId)
              .maybeSingle();

            senderProfile = fetchedSenderProfile;

            if (senderProfile) {
              setMessageConversations((old) => {
                const existing = old.find((item) => item.profile.id === senderId);
                const nextItem = {
                  profile: senderProfile,
                  lastMessage: payload.new.body || "New message",
                  updatedAt: payload.new.created_at || new Date().toISOString(),
                  unread: showChatRef.current && selectedProfileRef.current?.id === senderId
                    ? existing?.unread || 0
                    : (existing?.unread || 0) + 1,
                };
                return [
                  nextItem,
                  ...old.filter((item) => item.profile.id !== senderId),
                ];
              });
            }
          } catch (error) {
            console.error("Incoming message profile error:", error);
          }

          playFarmerMessageSound();
          setMessageToast({
            name: senderProfile?.name || "New message",
            text: payload.new?.body || "You received a new message.",
          });
          window.clearTimeout(window.__tmMessageToastTimer);
          window.__tmMessageToastTimer = window.setTimeout(() => {
            setMessageToast(null);
          }, 4500);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(incomingMessageChannel);
    };
  }, [navigate]);


  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserNotificationPermission("unsupported");
      return;
    }

    setBrowserNotificationPermission(Notification.permission);
  }, []);

  // Keep the open chat live in real time.
  useEffect(() => {
    if (!user?.id || !selectedProfile?.id || !showChat) return;

    const channel = supabase
      .channel(`farmer-chat-${user.id}-${selectedProfile.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${selectedProfile.id}`,
        },
        (payload) => {
          if (payload.new?.receiver_id !== user.id) return;
          setMessages((old) =>
            old.some((item) => item.id === payload.new.id)
              ? old
              : [...old, payload.new]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedProfile?.id, showChat]);


  async function loadChatMessages(otherUserId) {
    if (!user?.id || !otherUserId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Chat messages error:", error);
      setMessages([]);
      return false;
    }

    setMessages(data || []);
    return true;
  }


  async function sendMessage(event) {
    event.preventDefault();

    const text = messageText.trim();
    if (!text || !user?.id || !selectedProfile?.id) return;

    const receiverId = selectedProfile.id;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        body: text,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Send message error:", error);
      alert(error.message || "Unable to send message.");
      return;
    }

    setMessages((old) =>
      old.some((item) => item.id === data.id) ? old : [...old, data]
    );
    setMessageConversations((old) => {
      const existing = old.find((item) => item.profile.id === receiverId);
      if (!existing) return old;
      return [
        {
          ...existing,
          lastMessage: text,
          updatedAt: data.created_at || new Date().toISOString(),
          unread: 0,
        },
        ...old.filter((item) => item.profile.id !== receiverId),
      ];
    });
    setUnreadByUser((old) => ({ ...old, [receiverId]: 0 }));
    setMessageText("");
  }


  async function openChat(userId, context = {}) {
    if (!userId || !user?.id) {
      alert("User information not available.");
      return;
    }

    if (userId === user.id) {
      alert("You cannot chat with yourself.");
      return;
    }

    setChatLoading(true);

    try {
      // Create the listing-interest notification for the listing owner.
      if (context?.listingId && context.listingOwnerId === userId) {
        const { error: notificationError } = await supabase.rpc("notify_listing_chat", {
          p_listing_id: context.listingId,
        });

        if (notificationError) {
          console.error("Listing chat notification error:", notificationError);
        }
      }

      const { data: person, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!person) {
        alert("User profile not found.");
        return;
      }

      setSelectedProfile(person);
      setMessageText("");
      setShowNotifications(false);
      await loadChatMessages(userId);
      setShowChat(true);
    } catch (error) {
      console.error("Open chat error:", error);
      alert(error.message || "Unable to open chat.");
    } finally {
      setChatLoading(false);
    }
  }


  // Unlock the browser audio engine after the farmer interacts with the page.
  // This makes realtime message sounds much more reliable than creating a new
  // AudioContext only after a websocket event arrives.
  useEffect(() => {
    const unlockMessageSound = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!messageAudioContextRef.current) {
          messageAudioContextRef.current = new AudioContextClass();
        }
        const ctx = messageAudioContextRef.current;
        if (ctx.state === "suspended") await ctx.resume();
        messageSoundUnlockedRef.current = ctx.state === "running";
      } catch (error) {
        console.debug("Audio unlock unavailable:", error);
      }
    };

    window.addEventListener("pointerdown", unlockMessageSound, { passive: true });
    window.addEventListener("keydown", unlockMessageSound);
    return () => {
      window.removeEventListener("pointerdown", unlockMessageSound);
      window.removeEventListener("keydown", unlockMessageSound);
    };
  }, []);

  useEffect(() => {
    return () => {
      const ctx = messageAudioContextRef.current;
      if (ctx) ctx.close().catch(() => {});
    };
  }, []);

  // Special 3-note TimberMart incoming-message sound.
  function playFarmerMessageSound() {
    try {
      const ctx = messageAudioContextRef.current;
      if (!ctx || ctx.state !== "running") return;

      const now = ctx.currentTime + 0.01;
      const notes = [
        { frequency: 659.25, start: 0, duration: 0.13 },
        { frequency: 783.99, start: 0.14, duration: 0.13 },
        { frequency: 1046.5, start: 0.28, duration: 0.24 },
      ];

      notes.forEach(({ frequency, start, duration }) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, now + start);
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.22, now + start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + start);
        oscillator.stop(now + start + duration + 0.03);
      });
    } catch (error) {
      console.debug("Message sound unavailable:", error);
    }
  }

  async function loadMessageConversations(userId) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,receiver_id,body,created_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(150);

    if (error) {
      console.error("Message inbox error:", error);
      return;
    }

    const latestByUser = new Map();
    (data || []).forEach((message) => {
      const otherId = message.sender_id === userId
        ? message.receiver_id
        : message.sender_id;
      if (otherId && !latestByUser.has(otherId)) {
        latestByUser.set(otherId, message);
      }
    });

    const otherIds = [...latestByUser.keys()];
    if (!otherIds.length) {
      setMessageConversations([]);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id,name,role,photo_url,location")
      .in("id", otherIds);

    if (profilesError) {
      console.error("Message profile error:", profilesError);
      return;
    }

    const profileMap = new Map((profilesData || []).map((item) => [item.id, item]));
    setMessageConversations(
      otherIds
        .map((otherId) => {
          const message = latestByUser.get(otherId);
          const person = profileMap.get(otherId);
          if (!person) return null;
          return {
            profile: person,
            lastMessage: message?.body || "",
            updatedAt: message?.created_at || new Date().toISOString(),
            unread: unreadByUser[otherId] || 0,
          };
        })
        .filter(Boolean)
    );
  }

  function openMessagesCenter() {
    setMenuOpen(false);
    setShowNotifications(false);
    setShowMessages(true);
    if (user?.id) loadMessageConversations(user.id);
  }

  async function openConversationFromMessages(person) {
    if (!person?.id) return;
    setUnreadByUser((old) => ({ ...old, [person.id]: 0 }));
    setMessageConversations((old) =>
      old.map((item) =>
        item.profile.id === person.id ? { ...item, unread: 0 } : item
      )
    );
    await openChat(person.id);
  }

  function closeMessagesCenter() {
    setShowMessages(false);
    setShowChat(false);
    setSelectedProfile(null);
  }

  async function updateFarmerLocation() {
    if (!user?.id) return;

    if (!navigator.geolocation) {
      setLocationError("Your browser does not support GPS location.");
      return;
    }

    setLocationUpdating(true);
    setLocationError("");
    setLocationMessage("Detecting your current location...");

    try {
      const coordinates = await getCurrentCoordinates();

      if (!coordinates) {
        throw new Error("Location permission was denied or GPS is unavailable.");
      }

      const readableLocation =
        (await reverseGeocodeLocation(
          coordinates.latitude,
          coordinates.longitude
        )) || profile?.location || "Current GPS Location";

      const { error } = await supabase
        .from("profiles")
        .update({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          location: readableLocation,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((previous) => ({
        ...(previous || {}),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        location: readableLocation,
      }));

      setLocationMessage("Location updated. 40 KM alerts are ready.");
    } catch (error) {
      console.error("Farmer location update error:", error);
      setLocationError(error?.message || "Unable to update location.");
      setLocationMessage("");
    } finally {
      setLocationUpdating(false);
    }
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      setBrowserNotificationPermission("unsupported");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserNotificationPermission(permission);
    } catch (error) {
      console.error("Browser notification permission error:", error);
    }
  }

  const hasFarmerGps =
    Number.isFinite(Number(profile?.latitude)) &&
    Number.isFinite(Number(profile?.longitude));

  async function loadDashboard() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(session.user);

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Profile error:",
          profileError
        );
      }

      setProfile(profileData);

      if (profileData?.latitude && profileData?.longitude) {
        setLocationMessage("Saved GPS location is active for 40 KM alerts.");
      }

      await Promise.all([
        loadListings(session.user.id),
        loadRequirements(),
        loadNotifications(session.user.id),
        loadMessageConversations(session.user.id),
      ]);
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     LOAD LISTINGS
  ======================================================= */

  async function loadListings(userId) {
    const {
      data,
      error,
    } = await supabase
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
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Listings error:",
        error
      );
      return;
    }

    setListings(data || []);
  }


  /* =======================================================
     LOAD REQUIREMENTS
  ======================================================= */

  async function loadNotifications(userId) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Notifications error:", error);
      return;
    }

    setNotifications(data || []);
  }

  async function markNotificationRead(notificationId) {
    if (!user?.id) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Notification read error:", error);
      return;
    }

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notificationId
          ? { ...item, is_read: true }
          : item
      )
    );
  }

  async function loadRequirements() {
    const {
      data,
      error,
    } = await supabase
      .from("requirements")
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          role,
          phone,
          location,
          photo_url
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Requirements error:",
        error
      );
      return;
    }

    setRequirements(data || []);
  }


  /* =======================================================
     NAVIGATION
  ======================================================= */

  function goProfile() {
    setMenuOpen(false);
    navigate("/profile");
  }


  function goSettings() {
    setMenuOpen(false);
    navigate("/settings");
  }


  function goNotifications() {
    setMenuOpen(false);
    setShowNotifications(true);
  }


  function goRequirements() {
    setMenuOpen(false);
    navigate("/requirements");
  }


  function goHome() {
    setActiveSection("home");
    setMenuOpen(false);
  }


  /* =======================================================
     OPEN SELL TREE
  ======================================================= */

  function goSellTree() {
    setMenuOpen(false);

    setActiveSection("sell");

    setShowSellTree(true);

    setSellStep(1);

    setSellError("");

    setListingPublished(false);

    setSellPhotos([]);

    setSellForm({
      category: "",
      tree_type: "",
      title: "",
      location: profile?.location || "",
      quantity: "",
      quantity_unit: "",
      acreage: "",
      tree_age: "",
      diameter: "",
      estimated_volume: "",
      condition: "",
      harvest_status: "",
      price: "",
      description: "",
    });
  }


  /* =======================================================
     CLOSE SELL TREE
  ======================================================= */

  function closeSellTree() {
    if (publishingListing) return;

    setShowSellTree(false);
    setSellStep(1);
    setSellError("");
    setSellPhotos([]);
    setListingPublished(false);
  }


  /* =======================================================
     UPDATE SELL FIELD
  ======================================================= */

  function updateSellField(field, value) {
    setSellError("");

    setSellForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }


  /* =======================================================
     CHANGE CATEGORY
  ======================================================= */

  function changeSellCategory(category) {
    setSellError("");

    setSellForm((previous) => ({
      ...previous,
      category,
      tree_type: "",
      acreage: "",
      tree_age: "",
      diameter: "",
      condition: "",
      harvest_status: "",
      quantity: "",
      quantity_unit: "",
    }));
  }


  /* =======================================================
     GET TREE TYPES BASED ON CATEGORY
  ======================================================= */

  const sellTreeTypes = useMemo(() => {
    if (
      sellForm.category ===
      "indian_trees"
    ) {
      return INDIAN_TREES;
    }

    if (
      sellForm.category ===
      "plantations"
    ) {
      return PLANTATION_TYPES;
    }

    if (
      sellForm.category ===
      "wood_products"
    ) {
      return WOOD_PRODUCTS;
    }

    return [];
  }, [sellForm.category]);


  const selectedSellCategory =
    SELL_CATEGORIES.find(
      (item) =>
        item.id === sellForm.category
    );


  const isPlantation =
    sellForm.category ===
    "plantations";


  const isIndianTree =
    sellForm.category ===
    "indian_trees";


  const isWoodProduct =
    sellForm.category ===
    "wood_products";


  /* =======================================================
     SELL STEP 1 VALIDATION
  ======================================================= */

  function validateSellStepOne() {
    if (!sellForm.category) {
      setSellError(
        "Please select a category."
      );
      return false;
    }

    if (!sellForm.tree_type) {
      setSellError(
        "Please select a tree or product type."
      );
      return false;
    }

    setSellError("");

    return true;
  }


  /* =======================================================
     SELL STEP 2 VALIDATION
  ======================================================= */

  function validateSellStepTwo() {
    if (!sellForm.title.trim()) {
      setSellError(
        "Please enter a listing title."
      );
      return false;
    }

    if (!sellForm.location.trim()) {
      setSellError(
        "Please enter the location."
      );
      return false;
    }

    if (!sellForm.quantity.trim()) {
      setSellError(
        "Please enter the quantity."
      );
      return false;
    }

    if (!sellForm.quantity_unit) {
      setSellError(
        "Please select the quantity unit."
      );
      return false;
    }

    if (
      isPlantation &&
      !sellForm.acreage
    ) {
      setSellError(
        "Please enter plantation area in acres."
      );
      return false;
    }

    setSellError("");

    return true;
  }


  /* =======================================================
     SELL STEP 3
  ======================================================= */

  function validateSellStepThree() {
    setSellError("");

    return true;
  }


  /* =======================================================
     SELL STEP NAVIGATION
  ======================================================= */

  function nextSellStep() {
    if (sellStep === 1) {
      if (!validateSellStepOne()) {
        return;
      }
    }

    if (sellStep === 2) {
      if (!validateSellStepTwo()) {
        return;
      }
    }

    if (sellStep === 3) {
      if (!validateSellStepThree()) {
        return;
      }
    }

    if (sellStep < 4) {
      setSellStep(
        (previous) => previous + 1
      );
    }
  }


  function previousSellStep() {
    setSellError("");

    if (sellStep > 1) {
      setSellStep(
        (previous) => previous - 1
      );
    }
  }


  /* =======================================================
     PHOTO UPLOAD SELECTION
  ======================================================= */

  function handleSellPhotos(event) {
    const selectedFiles =
      Array.from(
        event.target.files || []
      );

    const validFiles =
      selectedFiles.filter(
        (file) => {
          if (
            !file.type.startsWith(
              "image/"
            )
          ) {
            return false;
          }

          if (
            file.size >
            5 * 1024 * 1024
          ) {
            return false;
          }

          return true;
        }
      );

    setSellPhotos(
      (previous) =>
        [
          ...previous,
          ...validFiles,
        ].slice(0, 6)
    );

    event.target.value = "";
  }


  function removeSellPhoto(index) {
    setSellPhotos(
      (previous) =>
        previous.filter(
          (_, photoIndex) =>
            photoIndex !== index
        )
    );
  }


  /* =======================================================
     PUBLISH SELL TREE LISTING
  ======================================================= */

  async function publishSellListing() {
    if (!user) {
      setSellError(
        "Your session has expired. Please login again."
      );
      return;
    }

    if (!validateSellStepTwo()) {
      setSellStep(2);
      return;
    }

    if (!sellForm.price.trim()) {
      setSellError(
        "Please enter your expected price."
      );
      setSellStep(2);
      return;
    }

    try {
      setPublishingListing(true);
      setSellError("");

      /* -----------------------------------------------
         CREATE LISTING
      ------------------------------------------------ */

      // GPS location only. No IP address is used.
      let coordinates = await getCurrentCoordinates();

      // If GPS permission is temporarily unavailable, use the user's
      // previously saved GPS coordinates. They are never shown in the UI.
      if (!coordinates && Number.isFinite(Number(profile?.latitude)) && Number.isFinite(Number(profile?.longitude))) {
        coordinates = {
          latitude: Number(profile.latitude),
          longitude: Number(profile.longitude),
        };
      }

      if (!coordinates) {
        throw new Error(
          "Please allow GPS location permission before posting. Your location is required for 40 KM matching notifications."
        );
      }

      // Convert GPS to a human-readable location such as:
      // Guntur, Andhra Pradesh, India
      const detectedLocation =
        await reverseGeocodeLocation(
          coordinates.latitude,
          coordinates.longitude
        );

      const displayLocation =
        detectedLocation ||
        sellForm.location.trim() ||
        profile?.location ||
        "Current Location";

      // Save readable location + hidden coordinates.
      const { error: profileLocationError } = await supabase
        .from("profiles")
        .update({
          location: displayLocation,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        })
        .eq("id", user.id);

      if (profileLocationError) {
        console.warn(
          "Profile location update skipped:",
          profileLocationError
        );
      }

      setProfile((previous) => ({
        ...(previous || {}),
        location: displayLocation,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }));

      const {
        data: newListing,
        error: listingError,
      } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,

          role: "farmer",

          status: "pending",

          category:
            sellForm.category,

          tree_type:
            sellForm.tree_type,

          title:
            sellForm.title.trim(),

          wood_type:
            sellForm.tree_type,

          product_type:
            isWoodProduct
              ? sellForm.tree_type
              : null,

          service_type: null,

          work_type: null,

          experience: null,

          skills: null,

          availability: null,

          quantity:
            sellForm.quantity.trim(),

          quantity_unit:
            sellForm.quantity_unit,

          acreage:
            isPlantation
              ? Number(
                  sellForm.acreage
                )
              : null,

          tree_age:
            sellForm.tree_age.trim() ||
            null,

          diameter:
            sellForm.diameter.trim() ||
            null,

          estimated_volume:
            sellForm.estimated_volume.trim() ||
            null,

          condition:
            sellForm.condition ||
            null,

          harvest_status:
            sellForm.harvest_status ||
            null,

          location:
            displayLocation,

          latitude: coordinates?.latitude ?? null,
          longitude: coordinates?.longitude ?? null,

          price:
            sellForm.price.trim(),

          expected_salary: null,

          description:
            sellForm.description.trim() ||
            null,

          contact_preference:
            "Call / WhatsApp / Chat",
        })
        .select("*")
        .single();

      if (listingError) {
        throw listingError;
      }


      /* -----------------------------------------------
         UPLOAD PHOTOS
      ------------------------------------------------ */

      for (
        let index = 0;
        index < sellPhotos.length;
        index++
      ) {
        const file =
          sellPhotos[index];

        const extension =
          file.name
            .split(".")
            .pop() || "jpg";

        const storagePath =
          `${user.id}/${newListing.id}/${Date.now()}-${index}.${extension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("listing-photos")
          .upload(
            storagePath,
            file,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                file.type,
            }
          );

        if (uploadError) {
          console.error(
            "Photo upload error:",
            uploadError
          );
          continue;
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from(
            "listing-photos"
          )
          .getPublicUrl(
            storagePath
          );

        const publicUrl =
          publicUrlData?.publicUrl;

        if (!publicUrl) {
          continue;
        }

        const {
          error: imageError,
        } = await supabase
          .from("listing_images")
          .insert({
            listing_id:
              newListing.id,

            user_id:
              user.id,

            image_url:
              publicUrl,

            storage_path:
              storagePath,

            sort_order:
              index,
          });

        if (imageError) {
          console.error(
            "Image database error:",
            imageError
          );
        }
      }


      /* -----------------------------------------------
         40 KM MATCHING NOTIFICATIONS
         The listing remains globally visible.
         Only matching users within 40 KM are notified.
      ------------------------------------------------ */

      await notifyMatchingUsers40Km({
        senderId: user.id,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        postType: "listing",
        postId: newListing.id,
        listingId: newListing.id,
        title: "New Timber Listing Near You",
        message: `${sellForm.tree_type || "Timber"} listing is available near your location.`,
        keywords: [
          sellForm.tree_type,
          sellForm.category,
          sellForm.title,
          sellForm.description,
        ],
        matchingRoles: [
          "timber_merchant",
          "sawmill_business",
          "buyer",
        ],
      });

      /* -----------------------------------------------
         REFRESH DASHBOARD
      ------------------------------------------------ */

      await loadListings(user.id);

      setListingPublished(true);

      setSellStep(5);
    } catch (error) {
      console.error(
        "Publish listing error:",
        error
      );

      setSellError(
        error?.message ||
          "Unable to publish listing. Please try again."
      );
    } finally {
      setPublishingListing(false);
    }
  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function handleLogout() {
    try {
      await supabase.auth.signOut();

      localStorage.removeItem(
        "timbermart_selected_role"
      );

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }


  /* =======================================================
     CONTACT HELPERS
  ======================================================= */

  function callUser(phone) {
    if (!phone) {
      alert(
        "Phone number is not available."
      );
      return;
    }

    window.location.href =
      `tel:${phone}`;
  }


  function whatsappUser(phone) {
    if (!phone) {
      alert(
        "WhatsApp number is not available."
      );
      return;
    }

    const cleanPhone =
      phone.replace(/\D/g, "");

    window.open(
      `https://wa.me/${cleanPhone}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  async function chatUser(otherUserId, context = {}) {
    return openChat(otherUserId, context);
  }


  /* =======================================================
     OPEN LISTING
  ======================================================= */

  function openListing(listing) {
    setSelectedListing(listing);
    setShowNotifications(false);
  }


  async function openNotification(notification) {
    await markNotificationRead(notification.id);
    setShowNotifications(false);

    if (!notification) return;

    // -----------------------------------------------------
    // LISTING NOTIFICATION
    // -----------------------------------------------------
    const listingId =
      notification.listing_id ||
      (notification.post_type === "listing"
        ? notification.post_id
        : null);

    if (listingId) {
      const { data, error } = await supabase
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

    // -----------------------------------------------------
    // REQUIREMENT NOTIFICATION
    // -----------------------------------------------------
    const requirementId =
      notification.requirement_id ||
      (notification.post_type === "requirement"
        ? notification.post_id
        : null);

    if (requirementId) {
      const { data, error } = await supabase
        .from("requirements")
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            role,
            phone,
            location,
            photo_url
          )
        `)
        .eq("id", requirementId)
        .maybeSingle();

      if (error) {
        console.error("Notification requirement error:", error);
        return;
      }

      if (data) {
        setSelectedRequirement(data);
      }

      return;
    }

    // Job/service notifications can be opened by the existing
    // dashboard navigation when those sections are available.
    if (notification.post_type === "job") {
      setActiveSection("jobs");
      return;
    }

    if (notification.post_type === "service") {
      setActiveSection("services");
    }
  }


  /* =======================================================
     OPEN REQUIREMENT
  ======================================================= */

  function openRequirement(
    requirement
  ) {
    setSelectedRequirement(
      requirement
    );
  }


  /* =======================================================
     DELETE REQUIREMENT
  ======================================================= */

  async function deleteRequirement(
    requirementId
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this requirement?"
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("requirements")
      .delete()
      .eq(
        "id",
        requirementId
      )
      .eq(
        "user_id",
        user.id
      );

    if (error) {
      console.error(error);

      alert(error.message);

      return;
    }

    setRequirements(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !==
            requirementId
        )
    );

    setSelectedRequirement(
      null
    );
  }


  /* =======================================================
     FILTER LISTINGS
  ======================================================= */

  const filteredListings =
    useMemo(() => {
      const query =
        searchText
          .trim()
          .toLowerCase();

      if (!query) {
        return listings;
      }

      return listings.filter(
        (item) =>
          [
            item.title,
            item.wood_type,
            item.tree_type,
            item.category,
            item.product_type,
            item.location,
            item.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      listings,
      searchText,
    ]);


  const liveListings = useMemo(() => {
    return listings.filter((item) => {
      if (item.status !== "approved") return false;

      const expiryDate = getListingExpiryDate(item);

      // If Supabase has not populated an expiry yet, keep the approved
      // listing visible instead of breaking the existing dashboard.
      if (!expiryDate) return true;

      return expiryDate.getTime() > expiryNow;
    });
  }, [listings, expiryNow]);

  const filteredLiveListings = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return liveListings;

    return liveListings.filter((item) =>
      [
        item.title,
        item.wood_type,
        item.tree_type,
        item.category,
        item.product_type,
        item.location,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [liveListings, searchText]);

  /* =======================================================
     FILTER REQUIREMENTS
  ======================================================= */

  const filteredRequirements =
    useMemo(() => {
      const query =
        searchText
          .trim()
          .toLowerCase();

      if (!query) {
        return requirements;
      }

      return requirements.filter(
        (item) =>
          [
            item.title,
            item.category,
            item.category_label,
            item.location,
            item.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      requirements,
      searchText,
    ]);


  /* =======================================================
     STATS
  ======================================================= */

  const ownListings =
    listings.filter(
      (item) =>
        item.user_id ===
        user?.id
    );


  const ownRequirements =
    requirements.filter(
      (item) =>
        item.user_id ===
        user?.id
    );


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <TreeLoader
        text="Growing your dashboard..."
      />
    );
  }


  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="farmer-dashboard">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`farmer-sidebar ${
          menuOpen ? "open" : ""
        }`}
      >

        <div className="farmer-brand">

          <div className="farmer-brand-icon">
            <TreePine size={25} />
          </div>

          <div>
            <h2>
              TimberMart
            </h2>

            <span>
              Farmer Portal
            </span>
          </div>

        </div>


        <nav className="farmer-nav">

          <button
            className={
              activeSection ===
              "home"
                ? "active"
                : ""
            }
            onClick={goHome}
          >
            <Home size={19} />
            <span>
              Dashboard
            </span>
          </button>


          <button
            onClick={
              goSellTree
            }
          >
            <TreePine size={19} />

            <span>
              Sell Tree
            </span>
          </button>


          <button
            onClick={
              goRequirements
            }
          >
            <FileText
              size={19}
            />

            <span>
              Requirement Wall
            </span>
          </button>


          <button
            className={showMessages ? "active" : ""}
            onClick={openMessagesCenter}
          >
            <MessageCircle size={19} />
            <span>Messages</span>
            {Object.values(unreadByUser).reduce((sum, count) => sum + count, 0) > 0 && (
              <span className="farmer-sidebar-message-badge">
                {Object.values(unreadByUser).reduce((sum, count) => sum + count, 0) > 9
                  ? "9+"
                  : Object.values(unreadByUser).reduce((sum, count) => sum + count, 0)}
              </span>
            )}
          </button>


          <button
            className={showNotifications ? "active" : ""}
            onClick={goNotifications}
          >
            <Bell size={19} />

            <span>
              Notifications
            </span>

            {notifications.filter((item) => !item.is_read).length > 0 && (
              <span className="farmer-sidebar-notification-badge">
                {notifications.filter((item) => !item.is_read).length > 9
                  ? "9+"
                  : notifications.filter((item) => !item.is_read).length}
              </span>
            )}
          </button>


          <button
            onClick={goProfile}
          >
            <CircleUserRound
              size={19}
            />

            <span>
              Profile
            </span>
          </button>


          <button
            onClick={goSettings}
          >
            <Settings
              size={19}
            />

            <span>
              Settings
            </span>
          </button>

        </nav>


        <div className="farmer-sidebar-bottom">

          <button
            className="farmer-logout"
            onClick={
              handleLogout
            }
          >
            <LogOut
              size={19}
            />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>


      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {menuOpen && (
        <div
          className="farmer-overlay"
          onClick={() =>
            setMenuOpen(false)
          }
        />
      )}


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="farmer-main">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="farmer-topbar">

          <div className="farmer-top-left">

            <button
              className="farmer-menu-button"
              onClick={() =>
                setMenuOpen(true)
              }
            >
              <Menu size={22} />
            </button>


            <div>
              <h1>
                Farmer Dashboard
              </h1>

              <p>
                Manage your timber
                activities
              </p>
            </div>

          </div>


          <div className="farmer-top-actions">

            <div className="farmer-notification-wrap">
              <button
                className="farmer-icon-button farmer-notification-button"
                title="Notifications"
                onClick={() =>
                  setShowNotifications((previous) => !previous)
                }
              >
                <Bell size={20} />

                {notifications.filter((item) => !item.is_read).length > 0 && (
                  <span className="farmer-notification-badge">
                    {notifications.filter((item) => !item.is_read).length > 9
                      ? "9+"
                      : notifications.filter((item) => !item.is_read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="farmer-notification-panel">
                  <div className="farmer-notification-header">
                    <div>
                      <strong>Notifications</strong>
                      <span>Nearby matches, approvals & chat updates</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div className="farmer-notification-list">
                    {notifications.length === 0 ? (
                      <div className="farmer-notification-empty">
                        <Bell size={25} />
                        <strong>No notifications yet</strong>
                        <span>Matching posts within 40 KM will appear here in real time.</span>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          className={`farmer-notification-item ${
                            notification.is_read ? "read" : "unread"
                          }`}
                          onClick={() =>
                            openNotification(notification)
                          }
                        >
                          <div className="farmer-notification-item-icon">
                            {notification.type === "listing_approved"
                              ? "✓"
                              : notification.type === "listing_rejected"
                              ? "!"
                              : notification.type === "listing_chat"
                              ? "💬"
                              : notification.type === "nearby_match"
                              ? "📍"
                              : "🔔"}
                          </div>

                          <div>
                            <strong>{notification.title}</strong>
                            <p>{notification.message}</p>
                            <small>
                              {notification.distance_km != null
                                ? `📍 ${Number(notification.distance_km).toFixed(1)} KM away • `
                                : ""}
                              {notification.created_at
                                ? new Date(notification.created_at).toLocaleString()
                                : ""}
                            </small>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              className="farmer-icon-button"
              title="Requirement Wall"
              onClick={
                goRequirements
              }
            >
              <FileText
                size={20}
              />
            </button>


            <button
              className="farmer-icon-button"
              title="Settings"
              onClick={
                goSettings
              }
            >
              <Settings
                size={20}
              />
            </button>


            <button
              className="farmer-profile-button"
              onClick={
                goProfile
              }
            >

              {profile?.photo_url ? (
                <img
                  src={
                    profile.photo_url
                  }
                  alt="Profile"
                />
              ) : (
                <User
                  size={20}
                />
              )}

              <span>
                {profile?.name ||
                  user?.email?.split(
                    "@"
                  )[0] ||
                  "Farmer"}
              </span>

            </button>

          </div>

        </header>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <section className="farmer-content">

          {/* =================================================
              WELCOME
          ================================================= */}

          <div className="farmer-welcome farmer-welcome-premium">

            <div className="farmer-welcome-copy">

              <span className="farmer-welcome-label">
                Welcome back 👋
              </span>

              <h2>
                {profile?.name ||
                  user?.email?.split("@")[0] ||
                  "Farmer"}
              </h2>

              <p>
                Manage your timber listings, connect with buyers,
                and receive smart nearby opportunities.
              </p>

              <div className="farmer-welcome-pills">
                <span className="farmer-welcome-pill">
                  <TreePine size={14} />
                  Farmer Portal
                </span>

                <span className={`farmer-welcome-pill ${hasFarmerGps ? "success" : "warning"}`}>
                  <MapPin size={14} />
                  {hasFarmerGps ? "GPS Active" : "GPS Not Set"}
                </span>
              </div>

            </div>

            <div className="farmer-location-summary">
              <div className="farmer-location-summary-icon">
                <MapPin size={20} />
              </div>

              <div className="farmer-location-summary-copy">
                <span>Your current location</span>
                <strong>
                  {profile?.location || "Location not added"}
                </strong>

                <small>
                  {hasFarmerGps
                    ? "Used only for 40 KM matching alerts"
                    : "Set GPS to receive nearby 40 KM alerts"}
                </small>
              </div>

              <button
                type="button"
                className="farmer-location-update-button"
                onClick={updateFarmerLocation}
                disabled={locationUpdating}
                title="Update current GPS location"
              >
                <LocateFixed size={17} />
                {locationUpdating ? "Updating..." : "Update"}
              </button>
            </div>

          </div>

          <div className="farmer-location-alert-card">

            <div className="farmer-location-alert-icon">
              <Bell size={21} />
            </div>

            <div className="farmer-location-alert-copy">
              <div className="farmer-location-alert-title-row">
                <h3>Smart 40 KM Alerts</h3>
                <span className={hasFarmerGps ? "tm-status-live" : "tm-status-off"}>
                  <i />
                  {hasFarmerGps ? "ACTIVE" : "SET LOCATION"}
                </span>
              </div>

              <p>
                When a farmer, buyer, merchant or sawmill posts a matching timber
                opportunity, only relevant users within 40 KM receive a notification.
                All public posts remain visible globally.
              </p>

              <div className="farmer-alert-features">
                <span><MapPin size={14} /> 40 KM radius</span>
                <span><CheckCircle2 size={14} /> Role matching</span>
                <span><CheckCircle2 size={14} /> Keyword matching</span>
                <span><Bell size={14} /> Realtime alerts</span>
              </div>

              {(locationMessage || locationError) && (
                <div className={`farmer-location-feedback ${locationError ? "error" : "success"}`}>
                  {locationError || locationMessage}
                </div>
              )}
            </div>

            <div className="farmer-alert-actions">
              <button
                type="button"
                className="farmer-alert-primary"
                onClick={updateFarmerLocation}
                disabled={locationUpdating}
              >
                <LocateFixed size={16} />
                {locationUpdating ? "Locating..." : "Use Current GPS"}
              </button>

              {browserNotificationPermission !== "granted" &&
                browserNotificationPermission !== "unsupported" && (
                  <button
                    type="button"
                    className="farmer-alert-secondary"
                    onClick={enableBrowserNotifications}
                  >
                    <Bell size={16} />
                    Enable Browser Alerts
                  </button>
                )}

              {browserNotificationPermission === "granted" && (
                <span className="farmer-browser-alert-enabled">
                  <CheckCircle2 size={15} />
                  Browser alerts enabled
                </span>
              )}
            </div>

          </div>


          {/* =================================================
              STATS
          ================================================= */}

          <div className="farmer-stats">

            <div className="farmer-stat-card">

              <div className="farmer-stat-icon">
                <TreePine
                  size={21}
                />
              </div>

              <div>
                <strong>
                  {
                    ownListings.length
                  }
                </strong>

                <span>
                  My Tree Listings
                </span>
              </div>

            </div>


            <div className="farmer-stat-card">

              <div className="farmer-stat-icon">
                <FileText
                  size={21}
                />
              </div>

              <div>
                <strong>
                  {
                    ownRequirements.length
                  }
                </strong>

                <span>
                  My Requirements
                </span>
              </div>

            </div>


            <div className="farmer-stat-card">

              <div className="farmer-stat-icon">
                <Search
                  size={21}
                />
              </div>

              <div>
                <strong>
                  {
                    liveListings.length
                  }
                </strong>

                <span>
                  Available Listings
                </span>
              </div>

            </div>


            <div className="farmer-stat-card">

              <div className="farmer-stat-icon">
                <Bell
                  size={21}
                />
              </div>

              <div>
                <strong>
                  {
                    requirements.length
                  }
                </strong>

                <span>
                  Requirements
                </span>
              </div>

            </div>

          </div>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="farmer-section-heading">

            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Start managing your
                timber activities
              </p>
            </div>

          </div>


          <div className="farmer-actions-grid">

            <button
              className="farmer-action-card"
              onClick={
                goSellTree
              }
            >

              <div className="farmer-action-icon tree">
                <TreePine
                  size={25}
                />
              </div>

              <div>
                <strong>
                  Sell Tree
                </strong>

                <span>
                  Create a timber
                  listing
                </span>
              </div>

              <ChevronRight
                size={19}
              />

            </button>


            <button
              className="farmer-action-card"
              onClick={
                goRequirements
              }
            >

              <div className="farmer-action-icon requirement">
                <FileText
                  size={25}
                />
              </div>

              <div>
                <strong>
                  Requirement Wall
                </strong>

                <span>
                  Add or view
                  requirements
                </span>
              </div>

              <ChevronRight
                size={19}
              />

            </button>


            <button
              className="farmer-action-card"
              onClick={
                goProfile
              }
            >

              <div className="farmer-action-icon profile">
                <User
                  size={25}
                />
              </div>

              <div>
                <strong>
                  My Profile
                </strong>

                <span>
                  Update your farmer
                  profile
                </span>
              </div>

              <ChevronRight
                size={19}
              />

            </button>


            <button
              className="farmer-action-card"
              onClick={
                goSettings
              }
            >

              <div className="farmer-action-icon settings">
                <Settings
                  size={25}
                />
              </div>

              <div>
                <strong>
                  Settings
                </strong>

                <span>
                  Manage account
                  preferences
                </span>
              </div>

              <ChevronRight
                size={19}
              />

            </button>

          </div>


          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="farmer-search-box">

            <Search
              size={19}
            />

            <input
              type="text"
              placeholder="Search timber listings or requirements..."
              value={searchText}
              onChange={(e) =>
                setSearchText(
                  e.target.value
                )
              }
            />

            {searchText && (
              <button
                onClick={() =>
                  setSearchText("")
                }
              >
                <X
                  size={18}
                />
              </button>
            )}

          </div>


          {/* =================================================
              REQUIREMENT WALL
          ================================================= */}

          <div className="farmer-section-heading">

            <div>
              <h2>
                Requirement Wall
              </h2>

              <p>
                Latest timber
                requirements from
                users
              </p>
            </div>


            <button
              className="farmer-view-all"
              onClick={
                goRequirements
              }
            >
              View All

              <ChevronRight
                size={17}
              />
            </button>

          </div>


          {filteredRequirements.length ===
          0 ? (

            <div className="farmer-empty">

              <FileText
                size={35}
              />

              <h3>
                No requirements
                yet
              </h3>

              <p>
                Create your first
                requirement and
                connect with
                timber sellers.
              </p>

              <button
                onClick={
                  goRequirements
                }
              >
                <Plus
                  size={18}
                />

                Add Requirement
              </button>

            </div>

          ) : (

            <div className="farmer-requirements-grid">

              {filteredRequirements
                .slice(0, 6)
                .map(
                  (
                    requirement
                  ) => (
                    <RequirementCard
                      key={
                        requirement.id
                      }
                      requirement={
                        requirement
                      }
                      currentUserId={
                        user?.id
                      }
                      onOpen={() =>
                        openRequirement(
                          requirement
                        )
                      }
                      onDelete={() =>
                        deleteRequirement(
                          requirement.id
                        )
                      }
                      onProfile={(
                        owner
                      ) =>
                        setSelectedOwner(
                          owner
                        )
                      }
                      onCall={
                        callUser
                      }
                      onWhatsapp={
                        whatsappUser
                      }
                      onChat={
                        chatUser
                      }
                    />
                  )
                )}

            </div>

          )}


          {/* =================================================
              TREE LISTINGS
          ================================================= */}

          <div className="farmer-section-heading listing-heading">

            <div>
              <h2>
                Timber Listings
              </h2>

              <p>
                Latest trees and
                timber available
              </p>
            </div>

          </div>


          {filteredListings.length ===
          0 ? (

            <div className="farmer-empty">

              <TreePine
                size={35}
              />

              <h3>
                No timber listings
                yet
              </h3>

              <p>
                You can create a
                listing from Sell
                Tree.
              </p>

              <button
                onClick={
                  goSellTree
                }
              >
                <Plus
                  size={18}
                />

                Sell Tree
              </button>

            </div>

          ) : (

            <div className="farmer-listings-grid">

              {filteredLiveListings
                .map(
                  (listing) => (
                    <ListingCard
                      key={
                        listing.id
                      }
                      listing={
                        listing
                      }
                      currentUserId={
                        user?.id
                      }
                      onOpen={() =>
                        openListing(
                          listing
                        )
                      }
                      onProfile={(
                        owner
                      ) =>
                        setSelectedOwner(
                          owner
                        )
                      }
                      onCall={
                        callUser
                      }
                      onWhatsapp={
                        whatsappUser
                      }
                      onChat={
                        chatUser
                      }
                    />
                  )
                )}

            </div>

          )}


          {/* =================================================
              DISCLAIMER
          ================================================= */}

          <div className="farmer-disclaimer">

            <strong>
              TimberMart connects
              people directly.
            </strong>

            <p>
              TimberMart does not
              handle payments,
              delivery or
              transactions. Buyers
              and sellers communicate
              directly and make
              their own arrangements.
            </p>

          </div>

        </section>

      </main>


      {/* =====================================================
          SELL TREE MODAL
      ===================================================== */}

      {showSellTree && (
        <SellTreeModal
          user={user}
          profile={profile}
          step={sellStep}
          setStep={setSellStep}
          form={sellForm}
          setForm={setSellForm}
          updateField={
            updateSellField
          }
          changeCategory={
            changeSellCategory
          }
          categories={
            SELL_CATEGORIES
          }
          treeTypes={
            sellTreeTypes
          }
          isPlantation={
            isPlantation
          }
          isIndianTree={
            isIndianTree
          }
          isWoodProduct={
            isWoodProduct
          }
          selectedCategory={
            selectedSellCategory
          }
          photos={sellPhotos}
          onPhotos={
            handleSellPhotos
          }
          removePhoto={
            removeSellPhoto
          }
          error={sellError}
          publishing={
            publishingListing
          }
          published={
            listingPublished
          }
          onClose={
            closeSellTree
          }
          onNext={
            nextSellStep
          }
          onBack={
            previousSellStep
          }
          onPublish={
            publishSellListing
          }
        />
      )}


      {/* =====================================================
          LISTING MODAL
      ===================================================== */}

      {selectedListing && (
        <ListingModal
          listing={
            selectedListing
          }
          currentUserId={
            user?.id
          }
          onClose={() =>
            setSelectedListing(
              null
            )
          }
          onProfile={(
            owner
          ) =>
            setSelectedOwner(
              owner
            )
          }
          onCall={
            callUser
          }
          onWhatsapp={
            whatsappUser
          }
          onChat={
            chatUser
          }
        />
      )}


      {/* =====================================================
          REQUIREMENT MODAL
      ===================================================== */}

      {selectedRequirement && (
        <RequirementModal
          requirement={
            selectedRequirement
          }
          currentUserId={
            user?.id
          }
          onClose={() =>
            setSelectedRequirement(
              null
            )
          }
          onDelete={() =>
            deleteRequirement(
              selectedRequirement.id
            )
          }
          onProfile={(
            owner
          ) =>
            setSelectedOwner(
              owner
            )
          }
          onCall={
            callUser
          }
          onWhatsapp={
            whatsappUser
          }
          onChat={
            chatUser
          }
        />
      )}


      {/* =====================================================
          PROFILE MODAL
      ===================================================== */}

      {selectedOwner && (
        <ProfileModal
          owner={
            selectedOwner
          }
          onClose={() =>
            setSelectedOwner(
              null
            )
          }
          onCall={
            callUser
          }
          onWhatsapp={
            whatsappUser
          }
          onChat={
            chatUser
          }
        />
      )}



      {/* =====================================================
          MODERN MESSAGES CENTER
          -----------------------------------------------------
          This is an inbox-style chat screen. Existing listing
          chat functionality remains untouched underneath.
      ====================================================== */}
      {messageToast && !showMessages && (
        <button
          type="button"
          className="tm-message-toast"
          onClick={() => {
            setMessageToast(null);
            openMessagesCenter();
          }}
        >
          <span className="tm-toast-icon"><MessageCircle size={20} /></span>
          <span className="tm-toast-copy">
            <strong>{messageToast.name}</strong>
            <small>{messageToast.text}</small>
          </span>
          <span className="tm-toast-wave">🔔</span>
        </button>
      )}

      {showMessages && (
        <div className="tm-inbox-overlay" onMouseDown={closeMessagesCenter}>
          <div className="tm-inbox" onMouseDown={(event) => event.stopPropagation()}>
            <header className="tm-inbox-topbar">
              <div className="tm-inbox-brand">
                <div className="tm-inbox-brand-icon"><MessageCircle size={22} /></div>
                <div>
                  <strong>Messages</strong>
                  <span>TimberMart Inbox • Real-time chat</span>
                </div>
              </div>
              <div className="tm-inbox-top-actions">
                <span className="tm-inbox-live"><i /> Live chat</span>
                <button type="button" onClick={closeMessagesCenter} aria-label="Close messages"><X size={20} /></button>
              </div>
            </header>

            <div className="tm-inbox-body">
              <aside className="tm-inbox-list">
                <div className="tm-inbox-list-head">
                  <div>
                    <strong>Chats</strong>
                    <span>{messageConversations.length} conversations</span>
                  </div>
                  {Object.values(unreadByUser).reduce((sum, count) => sum + count, 0) > 0 && (
                    <b>{Object.values(unreadByUser).reduce((sum, count) => sum + count, 0)} new</b>
                  )}
                </div>

                <div className="tm-inbox-conversations">
                  {messageConversations.length === 0 ? (
                    <div className="tm-inbox-empty-list">
                      <div><MessageCircle size={28} /></div>
                      <strong>No chats yet</strong>
                      <span>Open any listing and tap Chat to start.</span>
                    </div>
                  ) : (
                    messageConversations.map((conversation) => {
                      const person = conversation.profile;
                      const unread = unreadByUser[person.id] || conversation.unread || 0;
                      return (
                        <button
                          key={person.id}
                          type="button"
                          className={`tm-conversation ${selectedProfile?.id === person.id ? "active" : ""} ${unread ? "has-unread" : ""}`}
                          onClick={() => openConversationFromMessages(person)}
                        >
                          <div className="tm-conversation-avatar">
                            {person.photo_url ? <img src={person.photo_url} alt="" /> : <span>{(person.name || "U").charAt(0).toUpperCase()}</span>}
                            <i />
                          </div>
                          <div className="tm-conversation-content">
                            <div className="tm-conversation-name">
                              <strong>{person.name || "TimberMart User"}</strong>
                              <time>{conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</time>
                            </div>
                            <small>{person.role || "User"}</small>
                            <p>{conversation.lastMessage || "Start a conversation"}</p>
                          </div>
                          {unread > 0 && <em>{unread > 9 ? "9+" : unread}</em>}
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <section className="tm-chat">
                {selectedProfile ? (
                  <>
                    <div className="tm-chat-head">
                      <div className="tm-chat-person">
                        <div className="tm-chat-avatar">
                          {selectedProfile.photo_url ? <img src={selectedProfile.photo_url} alt="" /> : <span>{(selectedProfile.name || "U").charAt(0).toUpperCase()}</span>}
                          <i />
                        </div>
                        <div>
                          <strong>{selectedProfile.name || "TimberMart User"}</strong>
                          <span>{selectedProfile.role || "User"}{selectedProfile.location ? ` • ${selectedProfile.location}` : ""}</span>
                        </div>
                      </div>
                      <div className="tm-chat-actions">
                        {selectedProfile.phone && <a href={`tel:${selectedProfile.phone}`} title="Call"><Phone size={18} /></a>}
                        <button type="button" onClick={() => { setShowChat(false); setSelectedProfile(null); }} title="Close conversation"><X size={18} /></button>
                      </div>
                    </div>

                    <div className="tm-chat-stream">
                      {chatLoading ? (
                        <div className="tm-chat-status">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="tm-chat-welcome">
                          <div className="tm-chat-welcome-icon"><MessageCircle size={30} /></div>
                          <strong>Start chatting with {selectedProfile.name || "this user"}</strong>
                          <span>Send a message about timber, listings or requirements.</span>
                        </div>
                      ) : (
                        <>
                          <div className="tm-chat-day">Today</div>
                          {messages.map((message) => {
                            const mine = message.sender_id === user?.id;
                            return (
                              <div key={message.id} className={`tm-message-row ${mine ? "mine" : "other"}`}>
                                <div className="tm-message-bubble">
                                  <span>{message.body}</span>
                                  <small>{message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}{mine ? "  ✓" : ""}</small>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    <form className="tm-chat-composer" onSubmit={sendMessage}>
                      <button type="button" className="tm-composer-plus" title="More options"><Plus size={19} /></button>
                      <input
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        placeholder={`Message ${selectedProfile.name || "user"}...`}
                        autoComplete="off"
                        disabled={chatLoading}
                      />
                      <button type="submit" className="tm-composer-send" disabled={chatLoading || !messageText.trim()} title="Send message"><MessageCircle size={18} /></button>
                    </form>
                  </>
                ) : (
                  <div className="tm-chat-no-selection">
                    <div className="tm-chat-no-selection-icon"><MessageCircle size={42} /></div>
                    <h3>Your messages</h3>
                    <p>Select a chat from the left to continue the conversation.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CHAT MODAL
      ====================================================== */}
      {showChat && selectedProfile && !showMessages && (
        <div
          className="farmer-modal-overlay farmer-chat-overlay"
          onMouseDown={() => setShowChat(false)}
        >
          <div
            className="farmer-chat-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="farmer-chat-header">
              <div className="farmer-chat-user">
                <div className="farmer-chat-avatar">
                  {selectedProfile.photo_url ? (
                    <img src={selectedProfile.photo_url} alt="" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <strong>{selectedProfile.name || "TimberMart User"}</strong>
                  <span>{selectedProfile.role || "User"}</span>
                </div>
              </div>
              <button
                type="button"
                className="farmer-close"
                onClick={() => setShowChat(false)}
                title="Close chat"
              >
                <X size={21} />
              </button>
            </div>

            <div className="farmer-chat-messages">
              {chatLoading ? (
                <div className="farmer-chat-empty">Loading chat...</div>
              ) : messages.length === 0 ? (
                <div className="farmer-chat-empty">
                  <MessageCircle size={34} />
                  <h3>Start Conversation</h3>
                  <p>Send a message to {selectedProfile.name || "this user"}.</p>
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={mine ? "farmer-message farmer-message-mine" : "farmer-message"}
                    >
                      {message.body}
                    </div>
                  );
                })
              )}
            </div>

            <form className="farmer-chat-form" onSubmit={sendMessage}>
              <input
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Type a message..."
                disabled={chatLoading}
                autoComplete="off"
              />
              <button type="submit" disabled={chatLoading || !messageText.trim()}>
                <MessageCircle size={19} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


/* ===========================================================
   SELL TREE MODAL
=========================================================== */

function SellTreeModal({
  user,
  profile,
  step,
  setStep,
  form,
  setForm,
  updateField,
  changeCategory,
  categories,
  treeTypes,
  isPlantation,
  isIndianTree,
  isWoodProduct,
  selectedCategory,
  photos,
  onPhotos,
  removePhoto,
  error,
  publishing,
  published,
  onClose,
  onNext,
  onBack,
  onPublish,
}) {
  return (
    <div
      className="sell-tree-overlay"
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="sell-tree-modal">

        {/* HEADER */}

        <header className="sell-tree-header">

          <div className="sell-tree-brand">

            <div className="sell-tree-brand-icon">
              <TreePine
                size={24}
              />
            </div>

            <div>
              <strong>
                TimberMart
              </strong>

              <span>
                Sell Timber
              </span>
            </div>

          </div>


          <button
            className="sell-tree-close"
            onClick={
              onClose
            }
            disabled={
              publishing
            }
          >
            <X size={21} />
          </button>

        </header>


        {/* PROGRESS */}

        {!published && (
          <div className="sell-progress">

            <ProgressItem
              number="1"
              label="Category"
              active={
                step >= 1
              }
              current={
                step === 1
              }
            />

            <ProgressItem
              number="2"
              label="Details"
              active={
                step >= 2
              }
              current={
                step === 2
              }
            />

            <ProgressItem
              number="3"
              label="Photos"
              active={
                step >= 3
              }
              current={
                step === 3
              }
            />

            <ProgressItem
              number="4"
              label="Review"
              active={
                step >= 4
              }
              current={
                step === 4
              }
            />

          </div>
        )}


        {/* BODY */}

        <div className="sell-tree-body">

          {/* =================================================
              STEP 1
          ================================================= */}

          {step === 1 && (
            <div className="sell-step">

              <div className="sell-step-heading">

                <span>
                  STEP 1
                </span>

                <h2>
                  What are you
                  selling?
                </h2>

                <p>
                  Select a category
                  first. The available
                  tree or product types
                  will appear below.
                </p>

              </div>


              <div className="sell-category-grid">

                {categories.map(
                  (category) => (
                    <button
                      type="button"
                      key={
                        category.id
                      }
                      className={`sell-category-card ${
                        form.category ===
                        category.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        changeCategory(
                          category.id
                        )
                      }
                    >

                      <div className="sell-category-icon">
                        {
                          category.icon
                        }
                      </div>

                      <div className="sell-category-content">

                        <strong>
                          {
                            category.title
                          }
                        </strong>

                        <p>
                          {
                            category.description
                          }
                        </p>

                      </div>


                      {form.category ===
                        category.id && (
                        <CheckCircle2
                          size={22}
                          className="sell-category-check"
                        />
                      )}

                    </button>
                  )
                )}

              </div>


              {/* DYNAMIC TYPE SELECT */}

              {form.category && (
                <div className="sell-dependent-box">

                  <div className="sell-dependent-heading">

                    <div>
                      <span>
                        {selectedCategory?.icon}
                      </span>

                      <div>
                        <small>
                          Selected Category
                        </small>

                        <strong>
                          {
                            selectedCategory?.title
                          }
                        </strong>
                      </div>
                    </div>

                  </div>


                  <label>
                    {isWoodProduct
                      ? "Select wood product"
                      : "Select tree type"}

                    <span>
                      *
                    </span>
                  </label>


                  <select
                    value={
                      form.tree_type
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "tree_type",
                        event.target
                          .value
                      )
                    }
                  >

                    <option value="">
                      Select{" "}
                      {isWoodProduct
                        ? "wood product"
                        : "tree type"}
                    </option>

                    {treeTypes.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}

                  </select>


                  {form.tree_type ===
                    "Casuarina Plantation" && (
                    <div className="sell-special-note">
                      <span>
                        🌱
                      </span>

                      <div>
                        <strong>
                          Casuarina Plantation
                        </strong>

                        <p>
                          Plantation area in
                          acres will be
                          required in the next
                          step.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}


          {/* =================================================
              STEP 2
          ================================================= */}

          {step === 2 && (
            <div className="sell-step">

              <div className="sell-step-heading">

                <span>
                  STEP 2
                </span>

                <h2>
                  Timber details
                </h2>

                <p>
                  Add accurate details
                  so buyers can
                  understand your
                  listing.
                </p>

              </div>


              <div className="sell-selected-summary">

                <div className="sell-summary-icon">
                  {
                    selectedCategory?.icon
                  }
                </div>

                <div>
                  <small>
                    {
                      selectedCategory?.title
                    }
                  </small>

                  <strong>
                    {
                      form.tree_type
                    }
                  </strong>
                </div>

              </div>


              <div className="sell-form-grid">

                {/* TITLE */}

                <div className="sell-field sell-full">

                  <label>
                    Listing title
                    <span>
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.title
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "title",
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      isPlantation
                        ? "Example: 3 acre Casuarina plantation for sale"
                        : isWoodProduct
                        ? "Example: Seasoned teak timber logs"
                        : "Example: Mature teak trees for sale"
                    }
                  />

                </div>


                {/* LOCATION */}

                <div className="sell-field">

                  <label>
                    Location
                    <span>
                      *
                    </span>
                  </label>

                  <div className="sell-input-with-icon">

                    <MapPin
                      size={17}
                    />

                    <input
                      value={
                        form.location
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "location",
                          event.target
                            .value
                        )
                      }
                      placeholder="Village / Town / District"
                    />

                  </div>

                </div>


                {/* QUANTITY */}

                <div className="sell-field">

                  <label>
                    Quantity
                    <span>
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.quantity
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "quantity",
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      isPlantation
                        ? "Estimated quantity"
                        : "Example: 25"
                    }
                  />

                </div>


                {/* UNIT */}

                <div className="sell-field">

                  <label>
                    Quantity unit
                    <span>
                      *
                    </span>
                  </label>

                  <select
                    value={
                      form.quantity_unit
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "quantity_unit",
                        event.target
                          .value
                      )
                    }
                  >

                    <option value="">
                      Select unit
                    </option>

                    {QUANTITY_UNITS.map(
                      (unit) => (
                        <option
                          key={unit}
                          value={unit}
                        >
                          {unit}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* PLANTATION ACRES */}

                {isPlantation && (
                  <div className="sell-field sell-important-field">

                    <label>
                      Plantation area
                      (Acres)

                      <span>
                        *
                      </span>
                    </label>

                    <div className="sell-acres-input">

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.acreage
                        }
                        onChange={(
                          event
                        ) =>
                          updateField(
                            "acreage",
                            event.target
                              .value
                          )
                        }
                        placeholder="Example: 2.5"
                      />

                      <span>
                        Acres
                      </span>

                    </div>

                    <small>
                      Enter total
                      plantation area.
                    </small>

                  </div>
                )}


                {/* TREE AGE */}

                {(isPlantation ||
                  isIndianTree) && (
                  <div className="sell-field">

                    <label>
                      Tree age
                    </label>

                    <input
                      value={
                        form.tree_age
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "tree_age",
                          event.target
                            .value
                        )
                      }
                      placeholder="Example: 5 years"
                    />

                  </div>
                )}


                {/* DIAMETER */}

                {isIndianTree && (
                  <div className="sell-field">

                    <label>
                      Average diameter
                    </label>

                    <input
                      value={
                        form.diameter
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "diameter",
                          event.target
                            .value
                        )
                      }
                      placeholder="Example: 18 inches"
                    />

                  </div>
                )}


                {/* CONDITION */}

                {isWoodProduct && (
                  <div className="sell-field">

                    <label>
                      Wood condition
                    </label>

                    <select
                      value={
                        form.condition
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "condition",
                          event.target
                            .value
                        )
                      }
                    >

                      <option value="">
                        Select condition
                      </option>

                      {TREE_CONDITIONS.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                  </div>
                )}


                {/* VOLUME */}

                <div className="sell-field">

                  <label>
                    Estimated volume
                  </label>

                  <input
                    value={
                      form.estimated_volume
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "estimated_volume",
                        event.target
                          .value
                      )
                    }
                    placeholder="Example: 500 CFT"
                  />

                </div>


                {/* HARVEST */}

                {!isWoodProduct && (
                  <div className="sell-field">

                    <label>
                      Sale / Harvest
                      status
                    </label>

                    <select
                      value={
                        form.harvest_status
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "harvest_status",
                          event.target
                            .value
                        )
                      }
                    >

                      <option value="">
                        Select status
                      </option>

                      {HARVEST_STATUS.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                  </div>
                )}


                {/* PRICE */}

                <div className="sell-field sell-full">

                  <label>
                    Expected price
                    <span>
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.price
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "price",
                        event.target
                          .value
                      )
                    }
                    placeholder="Example: ₹2,50,000 or ₹1,200 / CFT"
                  />

                  <small>
                    You can enter a
                    total price or
                    price per unit.
                  </small>

                </div>


                {/* DESCRIPTION */}

                <div className="sell-field sell-full">

                  <label>
                    Description
                  </label>

                  <textarea
                    rows="5"
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "description",
                        event.target
                          .value
                      )
                    }
                    placeholder="Add tree quality, road access, land details, timber condition, harvesting information and any other useful details."
                  />

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              STEP 3 — PHOTOS
          ================================================= */}

          {step === 3 && (
            <div className="sell-step">

              <div className="sell-step-heading">

                <span>
                  STEP 3
                </span>

                <h2>
                  Add timber photos
                </h2>

                <p>
                  Good photos help
                  buyers understand
                  the actual timber.
                </p>

              </div>


              <label className="sell-photo-upload">

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={
                    onPhotos
                  }
                />

                <div className="sell-photo-upload-icon">
                  <ImagePlus
                    size={30}
                  />
                </div>

                <strong>
                  Upload photos
                </strong>

                <span>
                  JPG, PNG or WEBP
                </span>

                <small>
                  Maximum 5 MB per
                  image · Up to 6
                  photos
                </small>

              </label>


              {photos.length > 0 && (
                <div className="sell-photo-grid">

                  {photos.map(
                    (
                      photo,
                      index
                    ) => (
                      <div
                        className="sell-photo-preview"
                        key={`${photo.name}-${index}`}
                      >

                        <img
                          src={URL.createObjectURL(
                            photo
                          )}
                          alt=""
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removePhoto(
                              index
                            )
                          }
                        >
                          <X
                            size={16}
                          />
                        </button>

                        {index ===
                          0 && (
                          <span>
                            Main photo
                          </span>
                        )}

                      </div>
                    )
                  )}

                </div>
              )}


              <div className="sell-photo-tip">

                <Camera
                  size={19}
                />

                <div>

                  <strong>
                    Photo tips
                  </strong>

                  <p>
                    Upload clear
                    photos of the
                    actual tree,
                    plantation,
                    logs or wood
                    products.
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              STEP 4 — REVIEW
          ================================================= */}

          {step === 4 && (
            <div className="sell-step">

              <div className="sell-step-heading">

                <span>
                  STEP 4
                </span>

                <h2>
                  Review listing
                </h2>

                <p>
                  Check your details
                  before publishing.
                </p>

              </div>


              <div className="sell-review-card">

                <div className="sell-review-top">

                  <div className="sell-review-category-icon">
                    {
                      selectedCategory?.icon
                    }
                  </div>

                  <div>

                    <small>
                      {
                        selectedCategory?.title
                      }
                    </small>

                    <h3>
                      {
                        form.title
                      }
                    </h3>

                    <strong>
                      {
                        form.tree_type
                      }
                    </strong>

                  </div>

                </div>


                <div className="sell-review-grid">

                  <ReviewItem
                    label="Location"
                    value={
                      form.location
                    }
                  />

                  <ReviewItem
                    label="Quantity"
                    value={`${form.quantity} ${form.quantity_unit}`}
                  />

                  {isPlantation && (
                    <ReviewItem
                      label="Plantation Area"
                      value={`${form.acreage} Acres`}
                    />
                  )}

                  {form.tree_age && (
                    <ReviewItem
                      label="Tree Age"
                      value={
                        form.tree_age
                      }
                    />
                  )}

                  {form.diameter && (
                    <ReviewItem
                      label="Diameter"
                      value={
                        form.diameter
                      }
                    />
                  )}

                  {form.estimated_volume && (
                    <ReviewItem
                      label="Estimated Volume"
                      value={
                        form.estimated_volume
                      }
                    />
                  )}

                  {form.condition && (
                    <ReviewItem
                      label="Condition"
                      value={
                        form.condition
                      }
                    />
                  )}

                  {form.harvest_status && (
                    <ReviewItem
                      label="Harvest Status"
                      value={
                        form.harvest_status
                      }
                    />
                  )}

                  <ReviewItem
                    label="Expected Price"
                    value={
                      form.price
                    }
                  />

                  <ReviewItem
                    label="Photos"
                    value={`${photos.length} ${
                      photos.length ===
                      1
                        ? "photo"
                        : "photos"
                    }`}
                  />

                </div>


                {form.description && (
                  <div className="sell-review-description">

                    <strong>
                      Description
                    </strong>

                    <p>
                      {
                        form.description
                      }
                    </p>

                  </div>
                )}

              </div>


              <div className="sell-publish-note">

                <CheckCircle2
                  size={20}
                />

                <p>
                  Your listing will be
                  visible to TimberMart
                  users. Buyers can
                  contact you directly
                  through Call,
                  WhatsApp or Chat.
                </p>

              </div>

            </div>
          )}


          {/* =================================================
              STEP 5 — SUCCESS
          ================================================= */}

          {step === 5 && (
            <div className="sell-success">

              <div className="sell-success-icon">

                <CheckCircle2
                  size={52}
                />

              </div>

              <h2>
                Submitted for Approval ⏳
              </h2>

              <p>
                Your timber listing has been submitted successfully.
                It will become live only after TimberMart admin approval.
              </p>


              <div className="sell-success-summary">

                <TreePine
                  size={20}
                />

                <span>
                  {
                    form.title
                  }
                </span>

              </div>


              <small>
                You will receive a notification after admin approval.
                Until then, the listing will not appear in live Timber Listings.
              </small>


              <button
                className="sell-success-close"
                onClick={
                  onClose
                }
              >
                Back to Dashboard
              </button>

            </div>
          )}


          {/* ERROR */}

          {error && (
            <div className="sell-error">
              {error}
            </div>
          )}

        </div>


        {/* FOOTER */}

        {!published && (
          <footer className="sell-tree-footer">

            <button
              type="button"
              className="sell-back-button"
              onClick={
                step === 1
                  ? onClose
                  : onBack
              }
              disabled={
                publishing
              }
            >
              <ChevronRight
                size={18}
                className="sell-back-icon"
              />

              {step === 1
                ? "Cancel"
                : "Back"}
            </button>


            {step < 4 ? (
              <button
                type="button"
                className="sell-next-button"
                onClick={
                  onNext
                }
                disabled={
                  publishing
                }
              >
                Continue

                <ChevronRight
                  size={18}
                />
              </button>
            ) : (
              <button
                type="button"
                className="sell-publish-button"
                onClick={
                  onPublish
                }
                disabled={
                  publishing
                }
              >

                {publishing ? (
                  <>
                    <span className="sell-button-spinner" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload
                      size={18}
                    />
                    Publish Listing
                  </>
                )}

              </button>
            )}

          </footer>
        )}

      </div>

    </div>
  );
}


/* ===========================================================
   PROGRESS ITEM
=========================================================== */

function ProgressItem({
  number,
  label,
  active,
  current,
}) {
  return (
    <div
      className={`sell-progress-item ${
        active
          ? "active"
          : ""
      } ${
        current
          ? "current"
          : ""
      }`}
    >

      <span>
        {active &&
        !current ? (
          <Check
            size={14}
          />
        ) : (
          number
        )}
      </span>

      <strong>
        {label}
      </strong>

    </div>
  );
}


/* ===========================================================
   REVIEW ITEM
=========================================================== */

function ReviewItem({
  label,
  value,
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="sell-review-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* ===========================================================
   REQUIREMENT CARD
=========================================================== */

function RequirementCard({
  requirement,
  currentUserId,
  onOpen,
  onDelete,
  onProfile,
  onCall,
  onWhatsapp,
  onChat,
}) {
  const owner =
    requirement.profiles;

  return (
    <article className="farmer-requirement-card">

      <div className="farmer-card-top">

        <div
          className="farmer-user-mini"
          onClick={() =>
            onProfile(
              owner
            )
          }
        >

          {owner?.photo_url ? (
            <img
              src={
                owner.photo_url
              }
              alt=""
            />
          ) : (
            <div className="farmer-avatar">
              <User
                size={17}
              />
            </div>
          )}

          <div>

            <strong>
              {owner?.name ||
                "TimberMart User"}
            </strong>

            <span>
              {owner?.role ||
                "User"}
            </span>

          </div>

        </div>


        {requirement.user_id ===
          currentUserId && (
          <button
            className="farmer-delete-mini"
            onClick={(
              event
            ) => {
              event.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <Trash2
              size={16}
            />
          </button>
        )}

      </div>


      <button
        className="farmer-card-body-button"
        onClick={
          onOpen
        }
      >

        <h3>
          {
            requirement.title
          }
        </h3>


        <div className="farmer-card-info">

          {(requirement.category_label ||
            requirement.category) && (
            <span>
              {
                requirement.category_label ||
                requirement.category
              }
            </span>
          )}


          {requirement.location && (
            <span>
              <MapPin
                size={14}
              />

              {
                requirement.location
              }
            </span>
          )}


          {requirement.quantity && (
            <span>
              Quantity:{" "}
              {
                requirement.quantity
              }
            </span>
          )}


          {requirement.budget && (
            <span>
              Budget:{" "}
              {
                requirement.budget
              }
            </span>
          )}

        </div>


        {requirement.description && (
          <p>
            {
              requirement.description
            }
          </p>
        )}

      </button>


      <div className="farmer-card-actions">

        <button
          onClick={() =>
            onCall(
              owner?.phone
            )
          }
          disabled={
            !owner?.phone
          }
        >
          <Phone
            size={16}
          />

          Call
        </button>


        <button
          onClick={() =>
            onWhatsapp(
              owner?.phone
            )
          }
          disabled={
            !owner?.phone
          }
        >
          <MessageCircle
            size={16}
          />

          WhatsApp
        </button>


        <button
          onClick={() =>
            onChat(
              owner?.id
            )
          }
          disabled={
            !owner?.id
          }
        >
          <MessageCircle
            size={16}
          />

          Chat
        </button>

      </div>

    </article>
  );
}


/* ===========================================================
   LISTING EXPIRY DISPLAY
=========================================================== */

function getListingExpiryDate(listing) {
  if (!listing) return null;

  // Preferred value: Supabase expiry created at admin approval.
  if (listing.expires_at) {
    const directDate = new Date(listing.expires_at);
    if (!Number.isNaN(directDate.getTime())) return directDate;
  }

  // Safe fallback for older approved rows created before expires_at
  // was added. For approved listings, reviewed_at is the approval time.
  const baseValue =
    listing.reviewed_at ||
    (listing.status === "approved" ? listing.created_at : null);

  if (!baseValue) return null;

  const baseDate = new Date(baseValue);
  if (Number.isNaN(baseDate.getTime())) return null;

  return new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000);
}

function getExpiryInfo(listing) {
  const expiryDate = getListingExpiryDate(listing);

  if (!expiryDate) {
    return {
      expired: false,
      text: "Expiry: Pending",
      dateText: "",
    };
  }

  const expiryTime = expiryDate.getTime();
  const remaining = expiryTime - Date.now();

  if (remaining <= 0) {
    return {
      expired: true,
      text: "Expired",
      dateText: expiryDate.toLocaleString(),
    };
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: false,
    text: `Expires in ${days}d ${hours}h ${minutes}m ${seconds}s`,
    dateText: expiryDate.toLocaleString(),
  };
}

/* ===========================================================
   LISTING CARD
=========================================================== */

function ListingCard({
  listing,
  currentUserId,
  onOpen,
  onProfile,
  onCall,
  onWhatsapp,
  onChat,
}) {
  const owner =
    listing.profiles;

  const images = [
    ...(listing.listing_images ||
      []),
  ].sort(
    (a, b) =>
      (a.sort_order || 0) -
      (b.sort_order || 0)
  );

  const image =
    images[0]?.image_url;

  const expiryInfo = getExpiryInfo(listing);

  return (
    <article className="farmer-listing-card">

      <div
        className="farmer-listing-image farmer-listing-image-clickable"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onOpen();
        }}
        title="Click image to view listing"
      >

        {image ? (
          <>
            <img
              src={image}
              alt={
                listing.title
              }
            />
            <span className="farmer-image-view-hint">
              <Eye size={16} /> View photo
            </span>
          </>
        ) : (
          <div className="farmer-no-image">

            <TreePine
              size={38}
            />

            <span>
              No photo
            </span>

          </div>
        )}


        {listing.user_id ===
          currentUserId && (
          <span className="farmer-own-badge">
            Your Listing
          </span>
        )}

        {listing.user_id === currentUserId &&
          listing.status &&
          listing.status !== "approved" && (
          <span className={`farmer-listing-status ${listing.status}`}>
            {listing.status === "pending"
              ? "⏳ Pending Approval"
              : "✕ Rejected"}
          </span>
        )}

      </div>


      <div className="farmer-listing-content">

        <div
          className="farmer-user-mini"
          onClick={() =>
            onProfile(
              owner
            )
          }
        >

          {owner?.photo_url ? (
            <img
              src={
                owner.photo_url
              }
              alt=""
            />
          ) : (
            <div className="farmer-avatar">
              <User
                size={17}
              />
            </div>
          )}

          <div>

            <strong>
              {owner?.name ||
                "TimberMart User"}
            </strong>

            <span>
              {owner?.role ||
                "Farmer"}
            </span>

          </div>

        </div>


        <button
          className="farmer-listing-open"
          onClick={
            onOpen
          }
        >

          <h3>
            {
              listing.title
            }
          </h3>


          {listing.category && (
            <span>
              Category:{" "}
              {
                listing.category ===
                "indian_trees"
                  ? "Indian Trees"
                  : listing.category ===
                    "plantations"
                  ? "Plantations"
                  : "Wood Products"
              }
            </span>
          )}


          {listing.tree_type && (
            <span>
              Type:{" "}
              {
                listing.tree_type
              }
            </span>
          )}


          {listing.quantity && (
            <span>
              Quantity:{" "}
              {
                listing.quantity
              }{" "}
              {
                listing.quantity_unit ||
                ""
              }
            </span>
          )}


          {listing.acreage && (
            <span>
              Plantation:{" "}
              {
                listing.acreage
              }{" "}
              Acres
            </span>
          )}


          {listing.location && (
            <span>
              <MapPin
                size={14}
              />

              {
                listing.location
              }
            </span>
          )}


          {listing.price && (
            <strong>
              Price:{" "}
              {
                listing.price
              }
            </strong>
          )}

          {/* =================================================
              LISTING EXPIRY
              Shows the live countdown and exact expiry time.
          ================================================= */}
          <span
            className={`farmer-listing-expiry ${
              expiryInfo.expired ? "expired" : ""
            }`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              padding: "7px 10px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: 1.35,
              background: expiryInfo.expired
                ? "rgba(220, 38, 38, 0.10)"
                : "rgba(245, 158, 11, 0.10)",
              color: expiryInfo.expired
                ? "#b91c1c"
                : "#b45309",
              width: "fit-content",
            }}
            title={
              expiryInfo.dateText
                ? `Expires on ${expiryInfo.dateText}`
                : "Expiry will be set after admin approval"
            }
          >
            ⏳ {expiryInfo.text}
          </span>

        </button>


        <div className="farmer-card-actions">

          <button
            className="farmer-view-listing-button"
            onClick={onOpen}
            type="button"
          >
            <Eye size={16} />
            View
          </button>

          <button
            onClick={() =>
              onCall(
                owner?.phone
              )
            }
            disabled={
              !owner?.phone
            }
          >
            <Phone
              size={16}
            />

            Call
          </button>


          <button
            onClick={() =>
              onWhatsapp(
                owner?.phone
              )
            }
            disabled={
              !owner?.phone
            }
          >
            <MessageCircle
              size={16}
            />

            WhatsApp
          </button>


          <button
            onClick={() =>
              onChat(
                owner?.id,
                {
                  listingId: listing.id,
                  listingOwnerId: listing.user_id,
                  listingTitle: listing.title,
                }
              )
            }
            disabled={
              !owner?.id
            }
          >
            <MessageCircle
              size={16}
            />

            Chat
          </button>

        </div>

      </div>

    </article>
  );
}


/* ===========================================================
   LISTING MODAL
=========================================================== */

function ListingModal({
  listing,
  currentUserId,
  onClose,
  onProfile,
  onCall,
  onWhatsapp,
  onChat,
}) {
  const owner =
    listing.profiles;

  const images = [
    ...(listing.listing_images ||
      []),
  ].sort(
    (a, b) =>
      (a.sort_order || 0) -
      (b.sort_order || 0)
  );

  const [lightboxImage, setLightboxImage] = useState(null);
  const expiryInfo = getExpiryInfo(listing);

  useEffect(() => {
    if (!lightboxImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setLightboxImage(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  return (
    <div
      className="farmer-modal-backdrop"
      onClick={
        onClose
      }
    >

      <div
        className="farmer-modal"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        <button
          className="farmer-modal-close"
          onClick={
            onClose
          }
        >
          <X
            size={21}
          />
        </button>


        <div className="farmer-modal-header">

          <div>

            <span className="farmer-modal-label">
              Timber Listing
            </span>

            <h2>
              {
                listing.title
              }
            </h2>

            <div className={`farmer-modal-expiry ${expiryInfo.expired ? "expired" : ""}`}>
              <span>⏳ {expiryInfo.text}</span>
              {expiryInfo.dateText && (
                <small>Expires on {expiryInfo.dateText}</small>
              )}
            </div>

          </div>

        </div>


        {images.length >
          0 && (
          <div className="farmer-modal-images">

            {images.map(
              (image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className="farmer-modal-image-button"
                  onClick={() => setLightboxImage(image.image_url)}
                  title="Click to enlarge"
                >
                  <img
                    src={image.image_url}
                    alt={`${listing.title} photo ${index + 1}`}
                  />
                  <span className="farmer-modal-image-zoom">
                    <Eye size={18} />
                  </span>
                </button>
              )
            )}

          </div>
        )}


        <div className="farmer-modal-details">

          {listing.category && (
            <DetailRow
              label="Category"
              value={
                listing.category ===
                "indian_trees"
                  ? "Indian Trees"
                  : listing.category ===
                    "plantations"
                  ? "Plantations"
                  : "Wood Products"
              }
            />
          )}


          {listing.tree_type && (
            <DetailRow
              label="Tree / Product Type"
              value={
                listing.tree_type
              }
            />
          )}


          {listing.wood_type && (
            <DetailRow
              label="Wood Type"
              value={
                listing.wood_type
              }
            />
          )}


          {listing.quantity && (
            <DetailRow
              label="Quantity"
              value={`${listing.quantity} ${
                listing.quantity_unit ||
                ""
              }`}
            />
          )}


          {listing.acreage && (
            <DetailRow
              label="Plantation Area"
              value={`${listing.acreage} Acres`}
            />
          )}


          {listing.tree_age && (
            <DetailRow
              label="Tree Age"
              value={
                listing.tree_age
              }
            />
          )}


          {listing.diameter && (
            <DetailRow
              label="Diameter"
              value={
                listing.diameter
              }
            />
          )}


          {listing.estimated_volume && (
            <DetailRow
              label="Estimated Volume"
              value={
                listing.estimated_volume
              }
            />
          )}


          {listing.condition && (
            <DetailRow
              label="Condition"
              value={
                listing.condition
              }
            />
          )}


          {listing.harvest_status && (
            <DetailRow
              label="Status"
              value={
                listing.harvest_status
              }
            />
          )}


          {listing.location && (
            <DetailRow
              label="Location"
              value={
                listing.location
              }
            />
          )}


          {listing.price && (
            <DetailRow
              label="Expected Price"
              value={
                listing.price
              }
            />
          )}


          {expiryInfo.dateText && (
            <DetailRow
              label="Listing Expires"
              value={expiryInfo.dateText}
            />
          )}

          {listing.description && (
            <div className="farmer-description">

              <strong>
                Description
              </strong>

              <p>
                {
                  listing.description
                }
              </p>

            </div>
          )}

        </div>


        <div
          className="farmer-modal-owner"
          onClick={() =>
            onProfile(
              owner
            )
          }
        >

          {owner?.photo_url ? (
            <img
              src={
                owner.photo_url
              }
              alt=""
            />
          ) : (
            <div className="farmer-avatar large">
              <User
                size={21}
              />
            </div>
          )}


          <div>

            <strong>
              {owner?.name ||
                "TimberMart User"}
            </strong>

            <span>
              {owner?.location ||
                "Location not available"}
            </span>

          </div>

        </div>


        {listing.user_id !==
          currentUserId && (
          <div className="farmer-modal-actions">

            <button
              onClick={() =>
                onCall(
                  owner?.phone
                )
              }
              disabled={
                !owner?.phone
              }
            >
              <Phone
                size={18}
              />
              Call
            </button>


            <button
              onClick={() =>
                onWhatsapp(
                  owner?.phone
                )
              }
              disabled={
                !owner?.phone
              }
            >
              <MessageCircle
                size={18}
              />
              WhatsApp
            </button>


            <button
              onClick={() =>
                onChat(
                  owner?.id,
                  {
                    listingId: listing.id,
                    listingOwnerId: listing.user_id,
                    listingTitle: listing.title,
                  }
                )
              }
              disabled={
                !owner?.id
              }
            >
              <MessageCircle
                size={18}
              />
              Chat
            </button>

          </div>
        )}

      </div>


      {lightboxImage && (
        <div
          className="farmer-image-lightbox"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Large listing image"
        >
          <button
            type="button"
            className="farmer-lightbox-close"
            onClick={() => setLightboxImage(null)}
            aria-label="Close image"
          >
            <X size={26} />
          </button>
          <img
            src={lightboxImage}
            alt={listing.title}
            onClick={(event) => event.stopPropagation()}
          />
          <span className="farmer-lightbox-caption">Click anywhere outside the image to close</span>
        </div>
      )}

    </div>
  );
}


/* ===========================================================
   REQUIREMENT MODAL
=========================================================== */

function RequirementModal({
  requirement,
  currentUserId,
  onClose,
  onDelete,
  onProfile,
  onCall,
  onWhatsapp,
  onChat,
}) {
  const owner =
    requirement.profiles;

  return (
    <div
      className="farmer-modal-backdrop"
      onClick={
        onClose
      }
    >

      <div
        className="farmer-modal"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        <button
          className="farmer-modal-close"
          onClick={
            onClose
          }
        >
          <X
            size={21}
          />
        </button>


        <span className="farmer-modal-label">
          Requirement
        </span>


        <h2>
          {
            requirement.title
          }
        </h2>


        <div className="farmer-modal-details">

          {(requirement.category_label ||
            requirement.category) && (
            <DetailRow
              label="Category"
              value={
                requirement.category_label ||
                requirement.category
              }
            />
          )}


          {requirement.location && (
            <DetailRow
              label="Location"
              value={
                requirement.location
              }
            />
          )}


          {requirement.quantity && (
            <DetailRow
              label="Quantity"
              value={
                requirement.quantity
              }
            />
          )}


          {requirement.budget && (
            <DetailRow
              label="Budget"
              value={
                requirement.budget
              }
            />
          )}


          {requirement.description && (
            <div className="farmer-description">

              <strong>
                Description
              </strong>

              <p>
                {
                  requirement.description
                }
              </p>

            </div>
          )}

        </div>


        <div
          className="farmer-modal-owner"
          onClick={() =>
            onProfile(
              owner
            )
          }
        >

          {owner?.photo_url ? (
            <img
              src={
                owner.photo_url
              }
              alt=""
            />
          ) : (
            <div className="farmer-avatar large">
              <User
                size={21}
              />
            </div>
          )}


          <div>

            <strong>
              {owner?.name ||
                "TimberMart User"}
            </strong>

            <span>
              {owner?.location ||
                "Location not available"}
            </span>

          </div>

        </div>


        {requirement.user_id ===
        currentUserId ? (

          <button
            className="farmer-danger-button"
            onClick={
              onDelete
            }
          >
            <Trash2
              size={18}
            />

            Delete Requirement
          </button>

        ) : (

          <div className="farmer-modal-actions">

            <button
              onClick={() =>
                onCall(
                  owner?.phone
                )
              }
              disabled={
                !owner?.phone
              }
            >
              <Phone
                size={18}
              />
              Call
            </button>


            <button
              onClick={() =>
                onWhatsapp(
                  owner?.phone
                )
              }
              disabled={
                !owner?.phone
              }
            >
              <MessageCircle
                size={18}
              />
              WhatsApp
            </button>


            <button
              onClick={() =>
                onChat(
                  owner?.id
                )
              }
              disabled={
                !owner?.id
              }
            >
              <MessageCircle
                size={18}
              />
              Chat
            </button>

          </div>

        )}

      </div>

    </div>
  );
}


/* ===========================================================
   PROFILE MODAL
=========================================================== */

function ProfileModal({
  owner,
  onClose,
  onCall,
  onWhatsapp,
  onChat,
}) {
  if (!owner) {
    return null;
  }

  return (
    <div
      className="farmer-modal-backdrop"
      onClick={
        onClose
      }
    >

      <div
        className="farmer-profile-modal"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        <button
          className="farmer-modal-close"
          onClick={
            onClose
          }
        >
          <X
            size={21}
          />
        </button>


        <div className="farmer-profile-modal-photo">

          {owner.photo_url ? (
            <img
              src={
                owner.photo_url
              }
              alt={
                owner.name ||
                "User"
              }
            />
          ) : (
            <User
              size={35}
            />
          )}

        </div>


        <h2>
          {owner.name ||
            "TimberMart User"}
        </h2>


        <span className="farmer-profile-role">
          {owner.role ||
            "User"}
        </span>


        {owner.location && (
          <p className="farmer-profile-location">

            <MapPin
              size={16}
            />

            {
              owner.location
            }

          </p>
        )}


        <div className="farmer-profile-actions">

          <button
            onClick={() =>
              onCall(
                owner.phone
              )
            }
            disabled={
              !owner.phone
            }
          >
            <Phone
              size={18}
            />

            Call
          </button>


          <button
            onClick={() =>
              onWhatsapp(
                owner.phone
              )
            }
            disabled={
              !owner.phone
            }
          >
            <MessageCircle
              size={18}
            />

            WhatsApp
          </button>


          <button
            onClick={() =>
              onChat(
                owner.id
              )
            }
            disabled={
              !owner.id
            }
          >
            <MessageCircle
              size={18}
            />

            Chat
          </button>

        </div>

      </div>

    </div>
  );
}


/* ===========================================================
   DETAIL ROW
=========================================================== */

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="farmer-detail-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}
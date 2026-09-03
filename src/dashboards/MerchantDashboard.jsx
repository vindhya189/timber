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
  Plus,
  Trash2,
  BriefcaseBusiness,
  Users,
  ImagePlus,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./MerchantDashboard.css";

const CATEGORIES = [
  "All",
  "Trees",
  "Logs",
  "Timber",
  "Planks",
  "Plywood",
  "Beams",
  "Battens",
  "Veneer",
  "Doors",
  "Frames",
  "Furniture",
  "Interior",
  "Carpenter Services",
];

const WOOD_TYPES = [
  "All Types",
  "Teak",
  "Neem",
  "Pine",
  "Eucalyptus",
  "Rosewood",
];

const JOB_CATEGORIES = [
  "Machine Operator",
  "Timber Cutter",
  "Log Loading Worker",
  "Carpenter Helper",
  "Saw Mill Worker",
  "Wood Worker",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "No Experience",
  "0 - 2 Years",
  "2 - 5 Years",
  "5 - 8 Years",
  "8+ Years",
];

function normalizePhone(phone = "") {
  return String(phone).replace(/\D/g, "");
}

function getWhatsAppUrl(phone, message = "") {
  let number = normalizePhone(phone);

  if (!number) return "";

  if (number.length === 10) {
    number = `91${number}`;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getImage(listing) {
  if (!listing?.listing_images?.length) return "";

  const images = [...listing.listing_images].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  );

  return images[0]?.image_url || "";
}

function roleName(role) {
  const roles = {
    farmer: "Farmer",
    merchant: "Timber Merchant",
    sawmill: "Sawmill / Business",
    carpenter: "Carpenter",
    worker: "Worker",
    buyer: "Buyer / Homeowner",
  };

  return roles[role] || "TimberMart User";
}

export default function MerchantDashboard() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [woodType, setWoodType] = useState("All Types");
  const [locationFilter, setLocationFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const [showSellModal, setShowSellModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] =
    useState(false);
  const [showJobModal, setShowJobModal] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [favourites, setFavourites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("timbermart_merchant_favourites") || "[]"
      );
    } catch {
      return [];
    }
  });

  /* =====================================================
     SELL LISTING FORM
  ===================================================== */

  const [sellForm, setSellForm] = useState({
    title: "",
    wood_type: "",
    product_type: "Timber",
    quantity: "",
    location: "",
    price: "",
    price_type: "Fixed Price",
    description: "",
  });

  const [sellPhotos, setSellPhotos] = useState([]);
  const [selling, setSelling] = useState(false);

  /* =====================================================
     REQUIREMENT FORM
  ===================================================== */

  const [requirementForm, setRequirementForm] = useState({
    title: "",
    category: "Timber",
    location: "",
    quantity: "",
    budget: "",
    description: "",
  });

  const [postingRequirement, setPostingRequirement] =
    useState(false);

  /* =====================================================
     JOB FORM
  ===================================================== */

  const [jobForm, setJobForm] = useState({
    title: "",
    category: "Machine Operator",
    job_type: "Full Time",
    experience: "2 - 5 Years",
    salary: "",
    location: "",
    positions: "1",
    accommodation: false,
    food: false,
    description: "",
  });

  const [postingJob, setPostingJob] = useState(false);

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function initialize() {
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
        const name =
          currentSession.user.user_metadata?.full_name ||
          currentSession.user.user_metadata?.name ||
          currentSession.user.email?.split("@")[0] ||
          "Merchant";

        const { data: createdProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: currentSession.user.id,
              name,
              role: "merchant",
            },
            {
              onConflict: "id",
            }
          )
          .select()
          .single();

        userProfile = createdProfile;
      }

      if (!userProfile) {
        navigate("/roles", { replace: true });
        return;
      }

      if (userProfile.role !== "merchant") {
        navigate(`/dashboard/${userProfile.role}`, {
          replace: true,
        });
        return;
      }

      setProfile(userProfile);

      setSellForm((old) => ({
        ...old,
        location: userProfile.location || "",
      }));

      setRequirementForm((old) => ({
        ...old,
        location: userProfile.location || "",
      }));

      setJobForm((old) => ({
        ...old,
        location: userProfile.location || "",
      }));

      await Promise.all([
        loadListings(),
        loadRequirements(),
        loadJobs(),
        loadWorkers(),
        loadOrders(currentSession.user.id),
      ]);

      if (mounted) {
        setLoading(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     LOAD LISTINGS
  ===================================================== */

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
        "sawmill",
        "carpenter",
      ])
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Listings error:", error);
      return;
    }

    setListings(data || []);
  }

  /* =====================================================
     REQUIREMENTS
  ===================================================== */

  async function loadRequirements() {
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Requirements error:", error);
      return;
    }

    setRequirements(data || []);
  }

  /* =====================================================
     JOBS
  ===================================================== */

  async function loadJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Jobs error:", error);
      return;
    }

    setJobs(data || []);
  }

  /* =====================================================
     WORKERS
  ===================================================== */

  async function loadWorkers() {
    const { data: workerProfiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "worker")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Workers error:", error);
      return;
    }

    setWorkers(workerProfiles || []);
  }

  /* =====================================================
     ORDERS
  ===================================================== */

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
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setOrders(data || []);
    }
  }

  /* =====================================================
     REALTIME
  ===================================================== */

  useEffect(() => {
    const channel = supabase
      .channel("merchant-dashboard-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listings",
        },
        () => loadListings()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requirements",
        },
        () => loadRequirements()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        () => loadJobs()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => loadWorkers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =====================================================
     FILTER PRODUCTS
  ===================================================== */

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const loc = locationFilter.trim().toLowerCase();

    return listings.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const wood = String(item.wood_type || "").toLowerCase();
      const product = String(
        item.product_type || ""
      ).toLowerCase();
      const itemLocation = String(
        item.location || ""
      ).toLowerCase();

      const searchMatch =
        !q ||
        title.includes(q) ||
        wood.includes(q) ||
        product.includes(q) ||
        itemLocation.includes(q);

      const categoryMatch =
        category === "All" ||
        title.includes(category.toLowerCase()) ||
        product.includes(category.toLowerCase()) ||
        (category === "Timber" &&
          [
            "teak",
            "neem",
            "pine",
            "eucalyptus",
            "rosewood",
          ].some((woodName) =>
            wood.includes(woodName)
          ));

      const woodMatch =
        woodType === "All Types" ||
        wood === woodType.toLowerCase();

      const locationMatch =
        !loc || itemLocation.includes(loc);

      const priceNumber = parseFloat(
        String(item.price || "").replace(
          /[^0-9.]/g,
          ""
        )
      );

      const priceMatch =
        !maxPrice ||
        !priceNumber ||
        priceNumber <= Number(maxPrice);

      return (
        searchMatch &&
        categoryMatch &&
        woodMatch &&
        locationMatch &&
        priceMatch
      );
    });
  }, [
    listings,
    search,
    category,
    woodType,
    locationFilter,
    maxPrice,
  ]);

  /* =====================================================
     REFRESH
  ===================================================== */

  async function refreshAll() {
    setRefreshing(true);

    await Promise.all([
      loadListings(),
      loadRequirements(),
      loadJobs(),
      loadWorkers(),
      session?.user?.id
        ? loadOrders(session.user.id)
        : Promise.resolve(),
    ]);

    setRefreshing(false);
  }

  /* =====================================================
     PHOTO SELECT
  ===================================================== */

  function handlePhotoSelect(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const remaining = Math.max(
      0,
      10 - sellPhotos.length
    );

    setSellPhotos((current) => [
      ...current,
      ...files.slice(0, remaining),
    ]);
  }

  function removeSellPhoto(index) {
    setSellPhotos((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  /* =====================================================
     SELL TIMBER
  ===================================================== */

  async function handleSellTimber(event) {
    event.preventDefault();

    if (!session?.user?.id) return;

    if (!sellForm.title.trim()) {
      alert("Please enter listing title.");
      return;
    }

    if (!sellForm.wood_type.trim()) {
      alert("Please select wood type.");
      return;
    }

    setSelling(true);

    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        user_id: session.user.id,
        role: "merchant",
        title: sellForm.title.trim(),
        wood_type: sellForm.wood_type.trim(),
        product_type: sellForm.product_type,
        quantity: sellForm.quantity.trim(),
        location:
          sellForm.location.trim() ||
          profile?.location ||
          "",
        price: sellForm.price.trim(),
        price_type: sellForm.price_type,
        description: sellForm.description.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setSelling(false);
      return;
    }

    /* Upload photos */

    for (let i = 0; i < sellPhotos.length; i++) {
      const file = sellPhotos[i];

      const safeName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, "-")
        .toLowerCase();

      const path = `${session.user.id}/${listing.id}/${Date.now()}-${i}-${safeName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("listing-photos")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        console.error("Photo upload:", uploadError);
        continue;
      }

      const { data: publicData } =
        supabase.storage
          .from("listing-photos")
          .getPublicUrl(path);

      await supabase
        .from("listing_images")
        .insert({
          listing_id: listing.id,
          user_id: session.user.id,
          image_url: publicData.publicUrl,
          storage_path: path,
          sort_order: i,
        });
    }

    setSelling(false);

    setSellForm({
      title: "",
      wood_type: "",
      product_type: "Timber",
      quantity: "",
      location: profile?.location || "",
      price: "",
      price_type: "Fixed Price",
      description: "",
    });

    setSellPhotos([]);
    setShowSellModal(false);

    await loadListings();

    alert("Timber listing posted successfully.");
  }

  /* =====================================================
     DELETE OWN LISTING
  ===================================================== */

  async function deleteListing(listing) {
    if (!listing?.id) return;

    if (
      listing.user_id !== session?.user?.id
    ) {
      return;
    }

    const ok = window.confirm(
      "Delete this timber listing?"
    );

    if (!ok) return;

    await supabase
      .from("listing_images")
      .delete()
      .eq("listing_id", listing.id);

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedListing(null);
    await loadListings();
  }

  /* =====================================================
     REQUIREMENT POST
  ===================================================== */

  async function handleRequirementPost(event) {
    event.preventDefault();

    if (!session?.user?.id) return;

    if (!requirementForm.title.trim()) {
      alert("Enter requirement title.");
      return;
    }

    setPostingRequirement(true);

    const { error } = await supabase
      .from("requirements")
      .insert({
        user_id: session.user.id,
        title: requirementForm.title.trim(),
        category: requirementForm.category,
        category_label: requirementForm.category,
        location:
          requirementForm.location.trim() ||
          profile?.location ||
          "",
        quantity: requirementForm.quantity.trim(),
        budget: requirementForm.budget.trim(),
        description:
          requirementForm.description.trim(),
      });

    setPostingRequirement(false);

    if (error) {
      alert(error.message);
      return;
    }

    setRequirementForm({
      title: "",
      category: "Timber",
      location: profile?.location || "",
      quantity: "",
      budget: "",
      description: "",
    });

    setShowRequirementModal(false);

    await loadRequirements();

    alert("Requirement posted successfully.");
  }

  /* =====================================================
     DELETE REQUIREMENT
  ===================================================== */

  async function deleteRequirement(requirement) {
    if (
      requirement.user_id !==
      session?.user?.id
    ) {
      return;
    }

    const ok = window.confirm(
      "Delete this requirement?"
    );

    if (!ok) return;

    const { error } = await supabase
      .from("requirements")
      .delete()
      .eq("id", requirement.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedRequirement(null);
    await loadRequirements();
  }

  /* =====================================================
     JOB POST
  ===================================================== */

  async function handleJobPost(event) {
    event.preventDefault();

    if (!session?.user?.id) return;

    if (!jobForm.title.trim()) {
      alert("Enter job title.");
      return;
    }

    setPostingJob(true);

    const { error } = await supabase
      .from("jobs")
      .insert({
        user_id: session.user.id,
        title: jobForm.title.trim(),
        category: jobForm.category,
        job_type: jobForm.job_type,
        experience: jobForm.experience,
        salary: jobForm.salary.trim(),
        location:
          jobForm.location.trim() ||
          profile?.location ||
          "",
        positions: jobForm.positions.trim(),
        accommodation:
          jobForm.accommodation,
        food: jobForm.food,
        description:
          jobForm.description.trim(),
      });

    setPostingJob(false);

    if (error) {
      alert(error.message);
      return;
    }

    setJobForm({
      title: "",
      category: "Machine Operator",
      job_type: "Full Time",
      experience: "2 - 5 Years",
      salary: "",
      location: profile?.location || "",
      positions: "1",
      accommodation: false,
      food: false,
      description: "",
    });

    setShowJobModal(false);

    await loadJobs();

    alert("Job posted successfully.");
  }

  /* =====================================================
     DELETE OWN JOB
  ===================================================== */

  async function deleteJob(job) {
    if (job.user_id !== session?.user?.id) {
      return;
    }

    const ok = window.confirm(
      "Delete this job?"
    );

    if (!ok) return;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadJobs();
  }

  /* =====================================================
     FAVOURITES
  ===================================================== */

  function toggleFavourite(id) {
    const next = favourites.includes(id)
      ? favourites.filter((x) => x !== id)
      : [...favourites, id];

    setFavourites(next);

    localStorage.setItem(
      "timbermart_merchant_favourites",
      JSON.stringify(next)
    );
  }

  /* =====================================================
     PROFILE
  ===================================================== */

  async function openProfile(userId) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setSelectedSeller(data);
    }
  }

  /* =====================================================
     CALL
  ===================================================== */

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
      alert(
        "This user has not added a phone number."
      );
      return;
    }

    window.location.href = `tel:${phone}`;
  }

  /* =====================================================
     WHATSAPP
  ===================================================== */

  async function whatsappUser(
    userId,
    fallbackPhone = "",
    name = ""
  ) {
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
      alert(
        "This user has not added a phone number."
      );
      return;
    }

    const url = getWhatsAppUrl(
      phone,
      `Hi ${name || "there"}, I found your profile/listing on TimberMart. I would like to connect with you.`
    );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =====================================================
     CHAT
  ===================================================== */

  async function openChat(user) {
    if (!user?.id || !session?.user?.id) {
      return;
    }

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
      .order("created_at", {
        ascending: true,
      });

    if (!error) {
      setMessages(data || []);
    }
  }

  useEffect(() => {
    if (
      !chatOpen ||
      !chatUser?.id ||
      !session?.user?.id
    ) {
      return;
    }

    const channel = supabase
      .channel(
        `merchant-chat-${session.user.id}-${chatUser.id}`
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

          const valid =
            (message.sender_id ===
              session.user.id &&
              message.receiver_id ===
                chatUser.id) ||
            (message.sender_id ===
              chatUser.id &&
              message.receiver_id ===
                session.user.id);

          if (!valid) return;

          setMessages((current) => {
            if (
              current.some(
                (item) =>
                  item.id === message.id
              )
            ) {
              return current;
            }

            return [...current, message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    chatOpen,
    chatUser?.id,
    session?.user?.id,
  ]);

  async function sendMessage() {
    const body = messageText.trim();

    if (
      !body ||
      !chatUser?.id ||
      !session?.user?.id
    ) {
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
      alert(error.message);
      return;
    }

    setMessages((current) => {
      if (
        current.some(
          (item) => item.id === data.id
        )
      ) {
        return current;
      }

      return [...current, data];
    });

    setMessageText("");
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function logout() {
    await supabase.auth.signOut();

    navigate("/roles", {
      replace: true,
    });
  }

  /* =====================================================
     NAV
  ===================================================== */

  function navTo(tab) {
    setActiveTab(tab);
    setSidebarOpen(false);

    if (tab === "profile") {
      navigate("/profile");
    }

    if (tab === "settings") {
      navigate("/settings");
    }

    if (tab === "requirements") {
      document
        .querySelector(
          ".merchant-requirements-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }

    if (tab === "jobs") {
      document
        .querySelector(
          ".merchant-jobs-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="merchant-loading">
        <div className="merchant-loading-card">
          <div className="merchant-loading-logo">
            🌳
          </div>

          <h2>TimberMart</h2>

          <p>
            Loading your merchant dashboard...
          </p>

          <div className="merchant-loader" />
        </div>
      </div>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="merchant-app">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <header className="merchant-topbar">

        <button
          className="merchant-menu-btn"
          onClick={() =>
            setSidebarOpen(true)
          }
        >
          <Menu size={22} />
        </button>

        <button
          className="merchant-logo"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          🌳 TimberMart
        </button>

        <div className="merchant-top-right">

          <button
            className="merchant-icon-btn"
            onClick={refreshAll}
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "merchant-spin"
                  : ""
              }
            />
          </button>

          <button className="merchant-icon-btn">
            <Bell size={19} />
          </button>

          <button
            className="merchant-mini-profile"
            onClick={() =>
              navTo("profile")
            }
          >
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt=""
              />
            ) : (
              <span>
                {(profile?.name || "M")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}

            <strong>
              {profile?.name || "Merchant"}
            </strong>
          </button>

        </div>
      </header>

      {/* =================================================
          SIDEBAR OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <div
          className="merchant-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`merchant-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >

        <div className="merchant-sidebar-head">

          <div className="merchant-side-brand">
            <span>🌳</span>

            <div>
              <strong>TimberMart</strong>
              <small>
                Buy • Sell • Connect
              </small>
            </div>
          </div>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        <div className="merchant-account">

          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt=""
            />
          ) : (
            <div className="merchant-account-avatar">
              {(profile?.name || "M")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div>
            <strong>
              {profile?.name || "Merchant"}
            </strong>

            <span>
              Timber Merchant
            </span>

            <small>
              <MapPin size={11} />
              {profile?.location ||
                "Location not added"}
            </small>
          </div>

        </div>

        <nav className="merchant-nav">

          <button
            className={
              activeTab === "home"
                ? "active"
                : ""
            }
            onClick={() => {
              setActiveTab("home");
              setSidebarOpen(false);
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            <ShoppingBag size={18} />
            Buy / Timber
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              setShowSellModal(true);
            }}
          >
            <Plus size={18} />
            Sell Timber
          </button>

          <button
            onClick={() =>
              navTo("requirements")
            }
          >
            <ClipboardList size={18} />
            Requirement Wall
            <b>{requirements.length}</b>
          </button>

          <button
            onClick={() =>
              navTo("jobs")
            }
          >
            <BriefcaseBusiness size={18} />
            Jobs
            <b>{jobs.length}</b>
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              setShowJobModal(true);
            }}
          >
            <Plus size={18} />
            Post Job
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              document
                .querySelector(
                  ".merchant-workers-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                });
            }}
          >
            <Users size={18} />
            Find Workers
          </button>

          <div className="merchant-nav-divider" />

          <button
            onClick={() =>
              navTo("profile")
            }
          >
            <User size={18} />
            My Profile
          </button>

          <button
            onClick={() =>
              navTo("settings")
            }
          >
            <Settings size={18} />
            Settings
          </button>

        </nav>

        <div className="merchant-side-bottom">

          <div className="merchant-side-trust">
            <ShieldCheck size={18} />

            <div>
              <strong>
                Direct Contact
              </strong>

              <small>
                We Connect. You Deal Directly.
              </small>
            </div>
          </div>

          <button
            className="merchant-logout"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="merchant-main">

        {/* HERO */}

        <section className="merchant-hero">

          <div>

            <span className="merchant-role-badge">
              🪵 Timber Merchant
            </span>

            <h1>
              Buy. Sell.
              <br />
              <span>Connect Directly.</span>
            </h1>

            <p>
              Find trees and timber, sell your
              products, post requirements and
              connect with workers.
            </p>

            <div className="merchant-location">
              <MapPin size={16} />
              {profile?.location ||
                "Add your location"}
            </div>

          </div>

          <div className="merchant-hero-wood">
            <div>🪵</div>
            <span>Timber Marketplace</span>
          </div>

        </section>

        {/* STATS */}

        <section className="merchant-stats">

          <div>
            <span>🪵</span>
            <strong>
              {
                listings.filter(
                  (x) =>
                    x.user_id ===
                    session?.user?.id
                ).length
              }
            </strong>
            <small>My Listings</small>
          </div>

          <div>
            <span>📋</span>
            <strong>
              {requirements.length}
            </strong>
            <small>Requirements</small>
          </div>

          <div>
            <span>👷</span>
            <strong>
              {workers.length}
            </strong>
            <small>Workers</small>
          </div>

          <div>
            <span>💼</span>
            <strong>
              {jobs.length}
            </strong>
            <small>Jobs</small>
          </div>

        </section>

        {/* QUICK ACTIONS */}

        <section className="merchant-quick-actions">

          <div className="merchant-section-title">
            <div>
              <span>QUICK ACTIONS</span>
              <h2>
                What do you want to do?
              </h2>
            </div>
          </div>

          <div className="merchant-action-grid">

            <button
              onClick={() =>
                setShowSellModal(true)
              }
            >
              <div>🪵</div>
              <strong>Sell Timber</strong>
              <small>
                Add timber listing & photos
              </small>
            </button>

            <button
              onClick={() =>
                setShowRequirementModal(true)
              }
            >
              <div>📋</div>
              <strong>
                Post Requirement
              </strong>
              <small>
                Find timber you need
              </small>
            </button>

            <button
              onClick={() =>
                setShowJobModal(true)
              }
            >
              <div>💼</div>
              <strong>Post a Job</strong>
              <small>
                Connect with workers
              </small>
            </button>

            <button
              onClick={() =>
                document
                  .querySelector(
                    ".merchant-workers-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              <div>👷</div>
              <strong>
                Find Workers
              </strong>
              <small>
                Search nearby workers
              </small>
            </button>

          </div>

        </section>

        {/* BUY SEARCH */}

        <section className="merchant-buy-section">

          <div className="merchant-section-title">

            <div>
              <span>BUY</span>
              <h2>
                Find Trees & Timber
              </h2>
            </div>

            <span className="merchant-count">
              {filteredListings.length} listings
            </span>

          </div>

          <div className="merchant-search-bar">

            <Search size={19} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search trees, timber, logs..."
            />

            <button
              onClick={() =>
                setShowFilters(
                  (value) => !value
                )
              }
            >
              <SlidersHorizontal size={17} />
              Filter
            </button>

          </div>

          <div className="merchant-category-scroll">

            {CATEGORIES.map((item) => (
              <button
                key={item}
                className={
                  category === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory(item)
                }
              >
                {item}
              </button>
            ))}

          </div>

          {showFilters && (
            <div className="merchant-filter-panel">

              <div>
                <label>Wood Type</label>

                <select
                  value={woodType}
                  onChange={(e) =>
                    setWoodType(e.target.value)
                  }
                >
                  {WOOD_TYPES.map((wood) => (
                    <option
                      key={wood}
                      value={wood}
                    >
                      {wood}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Location</label>

                <input
                  value={locationFilter}
                  onChange={(e) =>
                    setLocationFilter(
                      e.target.value
                    )
                  }
                  placeholder="Rajahmundry..."
                />
              </div>

              <div>
                <label>Max Price</label>

                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value)
                  }
                  placeholder="₹"
                />
              </div>

              <button
                onClick={() => {
                  setWoodType("All Types");
                  setLocationFilter("");
                  setMaxPrice("");
                }}
              >
                Clear
              </button>

            </div>
          )}

          {filteredListings.length === 0 ? (
            <div className="merchant-empty">
              <div>🪵</div>
              <h3>
                No listings found
              </h3>
              <p>
                No sellers have posted
                matching products yet.
              </p>
            </div>
          ) : (

            <div className="merchant-product-grid">

              {filteredListings.map(
                (listing) => {

                  const image =
                    getImage(listing);

                  const saved =
                    favourites.includes(
                      listing.id
                    );

                  return (
                    <article
                      className="merchant-product-card"
                      key={listing.id}
                    >

                      <div
                        className="merchant-product-photo"
                        onClick={() =>
                          setSelectedListing(
                            listing
                          )
                        }
                      >

                        {image ? (
                          <img
                            src={image}
                            alt={
                              listing.title
                            }
                          />
                        ) : (
                          <div>
                            🪵
                            <small>
                              No photo
                            </small>
                          </div>
                        )}

                        <button
                          className={
                            saved
                              ? "saved"
                              : ""
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavourite(
                              listing.id
                            );
                          }}
                        >
                          <Heart
                            size={18}
                            fill={
                              saved
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>

                      </div>

                      <div className="merchant-product-body">

                        <span className="merchant-product-tag">
                          {listing.wood_type ||
                            "Timber"}
                        </span>

                        <h3>
                          {listing.title}
                        </h3>

                        <p>
                          <MapPin size={12} />
                          {listing.location ||
                            "Location not added"}
                        </p>

                        <strong>
                          {listing.price
                            ? `₹ ${listing.price}`
                            : "Price on contact"}
                        </strong>

                        {listing.quantity && (
                          <small>
                            Available:{" "}
                            {listing.quantity}
                          </small>
                        )}

                        <button
                          className="merchant-view-btn"
                          onClick={() =>
                            setSelectedListing(
                              listing
                            )
                          }
                        >
                          View Details
                          <ChevronRight
                            size={15}
                          />
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* MY LISTINGS */}

        <section className="merchant-my-listings">

          <div className="merchant-section-title">

            <div>
              <span>SELL</span>
              <h2>
                My Timber Listings
              </h2>
            </div>

            <button
              onClick={() =>
                setShowSellModal(true)
              }
            >
              <Plus size={16} />
              Add Listing
            </button>

          </div>

          <div className="merchant-my-list-grid">

            {listings.filter(
              (item) =>
                item.user_id ===
                session?.user?.id
            ).length === 0 ? (

              <div className="merchant-empty-small">
                <span>🪵</span>
                <strong>
                  You have no listings yet.
                </strong>
                <button
                  onClick={() =>
                    setShowSellModal(true)
                  }
                >
                  Sell Timber
                </button>
              </div>

            ) : (

              listings
                .filter(
                  (item) =>
                    item.user_id ===
                    session?.user?.id
                )
                .map((listing) => (
                  <div
                    className="merchant-my-card"
                    key={listing.id}
                  >

                    {getImage(listing) ? (
                      <img
                        src={getImage(
                          listing
                        )}
                        alt=""
                      />
                    ) : (
                      <div>🪵</div>
                    )}

                    <section>
                      <strong>
                        {listing.title}
                      </strong>

                      <span>
                        {listing.wood_type}
                      </span>

                      <small>
                        {listing.location}
                      </small>
                    </section>

                    <button
                      onClick={() =>
                        deleteListing(
                          listing
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                ))

            )}

          </div>

        </section>

        {/* REQUIREMENTS */}

        <section className="merchant-requirements-section">

          <div className="merchant-section-title">

            <div>
              <span>REQUIREMENT WALL</span>
              <h2>
                Customer Requirements
              </h2>
            </div>

            <button
              onClick={() =>
                setShowRequirementModal(
                  true
                )
              }
            >
              <Plus size={16} />
              Post Requirement
            </button>

          </div>

          <div className="merchant-requirement-list">

            {requirements.length === 0 ? (

              <div className="merchant-empty">
                <div>📋</div>
                <h3>
                  No requirements yet
                </h3>
                <p>
                  User-posted requirements
                  will appear here.
                </p>
              </div>

            ) : (

              requirements.map(
                (requirement) => (
                  <article
                    className="merchant-requirement-card"
                    key={requirement.id}
                  >

                    <div className="merchant-requirement-icon">
                      📋
                    </div>

                    <div>

                      <div className="merchant-card-top">
                        <span>
                          {requirement.category_label ||
                            requirement.category ||
                            "Requirement"}
                        </span>

                        <small>
                          {formatDate(
                            requirement.created_at
                          )}
                        </small>
                      </div>

                      <h3>
                        {requirement.title}
                      </h3>

                      <p>
                        <MapPin size={12} />
                        {requirement.location ||
                          "Location not added"}
                      </p>

                      <div className="merchant-requirement-meta">

                        {requirement.quantity && (
                          <span>
                            Quantity:{" "}
                            {requirement.quantity}
                          </span>
                        )}

                        {requirement.budget && (
                          <span>
                            Budget: ₹{" "}
                            {requirement.budget}
                          </span>
                        )}

                      </div>

                      <button
                        onClick={() =>
                          setSelectedRequirement(
                            requirement
                          )
                        }
                      >
                        View Requirement
                        <ChevronRight
                          size={15}
                        />
                      </button>

                    </div>

                  </article>
                )
              )

            )}

          </div>

        </section>

        {/* JOBS */}

        <section className="merchant-jobs-section">

          <div className="merchant-section-title">

            <div>
              <span>JOBS</span>
              <h2>
                Find / Post Workers
              </h2>
            </div>

            <button
              onClick={() =>
                setShowJobModal(true)
              }
            >
              <Plus size={16} />
              Post Job
            </button>

          </div>

          <div className="merchant-job-grid">

            {jobs.length === 0 ? (

              <div className="merchant-empty">
                <div>💼</div>
                <h3>
                  No jobs posted
                </h3>
                <p>
                  Post a job to connect
                  with workers.
                </p>
              </div>

            ) : (

              jobs.map((job) => (
                <article
                  className="merchant-job-card"
                  key={job.id}
                >

                  <div className="merchant-job-icon">
                    💼
                  </div>

                  <div>

                    <div className="merchant-job-header">
                      <span>
                        {job.category ||
                          "Job"}
                      </span>

                      {job.user_id ===
                        session?.user?.id && (
                        <button
                          onClick={() =>
                            deleteJob(job)
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <h3>
                      {job.title}
                    </h3>

                    <p>
                      <MapPin size={12} />
                      {job.location ||
                        "Location not added"}
                    </p>

                    <div className="merchant-job-info">

                      <span>
                        {job.job_type ||
                          "Work"}
                      </span>

                      <span>
                        {job.experience ||
                          "Experience not specified"}
                      </span>

                      {job.salary && (
                        <span>
                          ₹ {job.salary}
                        </span>
                      )}

                    </div>

                    {job.description && (
                      <p className="merchant-job-description">
                        {job.description}
                      </p>
                    )}

                  </div>

                </article>
              ))

            )}

          </div>

        </section>

        {/* WORKERS */}

        <section className="merchant-workers-section">

          <div className="merchant-section-title">

            <div>
              <span>FIND WORKERS</span>
              <h2>
                Nearby / Available Workers
              </h2>
            </div>

            <span className="merchant-count">
              {workers.length} workers
            </span>

          </div>

          <div className="merchant-worker-search">

            <Search size={17} />

            <input
              placeholder="Search workers by name or location..."
              onChange={(e) => {
                const value =
                  e.target.value.toLowerCase();

                const filtered =
                  workers.filter(
                    (worker) =>
                      String(
                        worker.name || ""
                      )
                        .toLowerCase()
                        .includes(value) ||
                      String(
                        worker.location || ""
                      )
                        .toLowerCase()
                        .includes(value) ||
                      String(
                        worker.bio || ""
                      )
                        .toLowerCase()
                        .includes(value)
                  );

                setWorkers(
                  value
                    ? filtered
                    : workers
                );
              }}
            />

          </div>

          {workers.length === 0 ? (

            <div className="merchant-empty">
              <div>👷</div>
              <h3>
                No worker profiles yet
              </h3>
              <p>
                Workers who create profiles
                will appear here.
              </p>
            </div>

          ) : (

            <div className="merchant-worker-grid">

              {workers.map((worker) => (
                <article
                  className="merchant-worker-card"
                  key={worker.id}
                >

                  <div className="merchant-worker-avatar">

                    {worker.photo_url ? (
                      <img
                        src={
                          worker.photo_url
                        }
                        alt=""
                      />
                    ) : (
                      <span>
                        {(worker.name ||
                          "W")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}

                  </div>

                  <h3>
                    {worker.name ||
                      "Worker"}
                  </h3>

                  <span className="merchant-worker-role">
                    Worker
                  </span>

                  {worker.location && (
                    <p>
                      <MapPin size={12} />
                      {worker.location}
                    </p>
                  )}

                  {worker.bio && (
                    <p className="merchant-worker-bio">
                      {worker.bio}
                    </p>
                  )}

                  <div className="merchant-worker-actions">

                    <button
                      onClick={() =>
                        openProfile(
                          worker.id
                        )
                      }
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() =>
                        callUser(
                          worker.id,
                          worker.phone
                        )
                      }
                    >
                      <Phone size={15} />
                    </button>

                    <button
                      onClick={() =>
                        openChat(worker)
                      }
                    >
                      <MessageCircle
                        size={15}
                      />
                    </button>

                  </div>

                </article>
              ))}

            </div>

          )}

        </section>

        {/* TRUST */}

        <footer className="merchant-footer">

          <div className="merchant-disclaimer">

            <ShieldCheck size={30} />

            <div>
              <strong>
                TimberMart only connects users.
              </strong>

              <p>
                TimberMart does not provide
                payments, transactions,
                employment, delivery or
                other arrangements.
                All terms are directly
                between the parties.
              </p>
            </div>

          </div>

          <div className="merchant-footer-items">

            <span>
              <ShieldCheck size={16} />
              No Payments
            </span>

            <span>
              <span>💼</span>
              No Commission
            </span>

            <span>
              <Phone size={16} />
              Direct Contact
            </span>

            <span>
              <MapPin size={16} />
              Nearby Connect
            </span>

            <strong>
              🤝 We Connect. You Deal Directly.
            </strong>

          </div>

        </footer>

      </main>

      {/* =================================================
          SELL MODAL
      ================================================= */}

      {showSellModal && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setShowSellModal(false)
          }
        >

          <div
            className="merchant-form-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="merchant-modal-head">

              <div>
                <span>
                  SELL TIMBER
                </span>

                <h2>
                  Add Timber Listing
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowSellModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSellTimber}
              className="merchant-form"
            >

              <label>
                Listing Title *
                <input
                  value={sellForm.title}
                  onChange={(e) =>
                    setSellForm({
                      ...sellForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Example: Teak Wood Logs"
                  required
                />
              </label>

              <div className="merchant-form-two">

                <label>
                  Wood Type *
                  <select
                    value={sellForm.wood_type}
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        wood_type:
                          e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">
                      Select Wood
                    </option>

                    {WOOD_TYPES.slice(1).map(
                      (wood) => (
                        <option
                          key={wood}
                          value={wood}
                        >
                          {wood}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Product Type
                  <select
                    value={
                      sellForm.product_type
                    }
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        product_type:
                          e.target.value,
                      })
                    }
                  >
                    <option>
                      Timber
                    </option>
                    <option>
                      Wood Logs
                    </option>
                    <option>
                      Timber Planks
                    </option>
                    <option>
                      Beams
                    </option>
                    <option>
                      Battens
                    </option>
                    <option>
                      Plywood
                    </option>
                    <option>
                      Doors
                    </option>
                    <option>
                      Frames
                    </option>
                    <option>
                      Furniture
                    </option>
                    <option>
                      Other
                    </option>
                  </select>
                </label>

              </div>

              <div className="merchant-form-two">

                <label>
                  Quantity
                  <input
                    value={
                      sellForm.quantity
                    }
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        quantity:
                          e.target.value,
                      })
                    }
                    placeholder="15 CMT"
                  />
                </label>

                <label>
                  Location
                  <input
                    value={
                      sellForm.location
                    }
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        location:
                          e.target.value,
                      })
                    }
                    placeholder="Rajahmundry, AP"
                  />
                </label>

              </div>

              <div className="merchant-form-two">

                <label>
                  Price
                  <input
                    value={sellForm.price}
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        price:
                          e.target.value,
                      })
                    }
                    placeholder="85000 / CMT"
                  />
                </label>

                <label>
                  Price Type
                  <select
                    value={
                      sellForm.price_type
                    }
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        price_type:
                          e.target.value,
                      })
                    }
                  >
                    <option>
                      Fixed Price
                    </option>
                    <option>
                      Negotiable
                    </option>
                  </select>
                </label>

              </div>

              <label>
                Description
                <textarea
                  value={
                    sellForm.description
                  }
                  onChange={(e) =>
                    setSellForm({
                      ...sellForm,
                      description:
                        e.target.value,
                    })
                  }
                  placeholder="Describe wood quality, size, availability..."
                  rows="4"
                />
              </label>

              <div className="merchant-photo-upload">

                <div className="merchant-upload-title">
                  <ImagePlus size={18} />
                  <strong>
                    Add Photos
                  </strong>
                  <small>
                    Up to 10 photos
                  </small>
                </div>

                <label className="merchant-upload-box">

                  <ImagePlus size={27} />

                  <span>
                    Add timber photos
                  </span>

                  <small>
                    JPG / PNG / WEBP
                  </small>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={
                      handlePhotoSelect
                    }
                  />

                </label>

                {sellPhotos.length > 0 && (
                  <div className="merchant-photo-grid">

                    {sellPhotos.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                        >

                          <img
                            src={URL.createObjectURL(
                              file
                            )}
                            alt=""
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeSellPhoto(
                                index
                              )
                            }
                          >
                            <X size={13} />
                          </button>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

              <button
                className="merchant-submit-btn"
                type="submit"
                disabled={selling}
              >
                {selling
                  ? "Posting..."
                  : "Preview & Post Listing"}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          REQUIREMENT MODAL
      ================================================= */}

      {showRequirementModal && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setShowRequirementModal(
              false
            )
          }
        >

          <div
            className="merchant-form-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="merchant-modal-head">

              <div>
                <span>
                  REQUIREMENT WALL
                </span>

                <h2>
                  Post Your Requirement
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowRequirementModal(
                    false
                  )
                }
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="merchant-form"
              onSubmit={
                handleRequirementPost
              }
            >

              <label>
                Requirement Title *
                <input
                  value={
                    requirementForm.title
                  }
                  onChange={(e) =>
                    setRequirementForm({
                      ...requirementForm,
                      title:
                        e.target.value,
                    })
                  }
                  placeholder="Need 25 CMT Teak Timber"
                  required
                />
              </label>

              <div className="merchant-form-two">

                <label>
                  Category
                  <select
                    value={
                      requirementForm.category
                    }
                    onChange={(e) =>
                      setRequirementForm({
                        ...requirementForm,
                        category:
                          e.target.value,
                      })
                    }
                  >
                    <option>
                      Timber
                    </option>
                    <option>
                      Trees
                    </option>
                    <option>
                      Logs
                    </option>
                    <option>
                      Doors
                    </option>
                    <option>
                      Furniture
                    </option>
                    <option>
                      Other
                    </option>
                  </select>
                </label>

                <label>
                  Quantity
                  <input
                    value={
                      requirementForm.quantity
                    }
                    onChange={(e) =>
                      setRequirementForm({
                        ...requirementForm,
                        quantity:
                          e.target.value,
                      })
                    }
                    placeholder="25 CMT"
                  />
                </label>

              </div>

              <label>
                Location
                <input
                  value={
                    requirementForm.location
                  }
                  onChange={(e) =>
                    setRequirementForm({
                      ...requirementForm,
                      location:
                        e.target.value,
                    })
                  }
                  placeholder="Rajahmundry, AP"
                />
              </label>

              <label>
                Budget
                <input
                  value={
                    requirementForm.budget
                  }
                  onChange={(e) =>
                    setRequirementForm({
                      ...requirementForm,
                      budget:
                        e.target.value,
                    })
                  }
                  placeholder="₹ 4,00,000 approx."
                />
              </label>

              <label>
                Description
                <textarea
                  value={
                    requirementForm.description
                  }
                  onChange={(e) =>
                    setRequirementForm({
                      ...requirementForm,
                      description:
                        e.target.value,
                    })
                  }
                  rows="4"
                  placeholder="Explain what timber/product you need..."
                />
              </label>

              <button
                className="merchant-submit-btn"
                disabled={
                  postingRequirement
                }
              >
                {postingRequirement
                  ? "Posting..."
                  : "Post Requirement"}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          JOB MODAL
      ================================================= */}

      {showJobModal && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setShowJobModal(false)
          }
        >

          <div
            className="merchant-form-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="merchant-modal-head">

              <div>
                <span>
                  JOBS
                </span>

                <h2>
                  Post a Job
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowJobModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="merchant-form"
              onSubmit={handleJobPost}
            >

              <label>
                Job Title *
                <input
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      title:
                        e.target.value,
                    })
                  }
                  placeholder="Saw Mill Machine Operator"
                  required
                />
              </label>

              <div className="merchant-form-two">

                <label>
                  Job Category
                  <select
                    value={
                      jobForm.category
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        category:
                          e.target.value,
                      })
                    }
                  >
                    {JOB_CATEGORIES.map(
                      (item) => (
                        <option
                          key={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Job Type
                  <select
                    value={
                      jobForm.job_type
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        job_type:
                          e.target.value,
                      })
                    }
                  >
                    <option>
                      Full Time
                    </option>
                    <option>
                      Part Time
                    </option>
                    <option>
                      Project Based
                    </option>
                  </select>
                </label>

              </div>

              <div className="merchant-form-two">

                <label>
                  Experience
                  <select
                    value={
                      jobForm.experience
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        experience:
                          e.target.value,
                      })
                    }
                  >
                    {EXPERIENCE_OPTIONS.map(
                      (item) => (
                        <option
                          key={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Salary
                  <input
                    value={jobForm.salary}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        salary:
                          e.target.value,
                      })
                    }
                    placeholder="₹ 18,000 - ₹ 25,000 / Month"
                  />
                </label>

              </div>

              <div className="merchant-form-two">

                <label>
                  Location
                  <input
                    value={jobForm.location}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        location:
                          e.target.value,
                      })
                    }
                    placeholder="Rajahmundry, AP"
                  />
                </label>

                <label>
                  Number of Positions
                  <input
                    type="number"
                    min="1"
                    value={
                      jobForm.positions
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        positions:
                          e.target.value,
                      })
                    }
                  />
                </label>

              </div>

              <div className="merchant-checkbox-row">

                <label>
                  <input
                    type="checkbox"
                    checked={
                      jobForm.accommodation
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        accommodation:
                          e.target.checked,
                      })
                    }
                  />
                  Accommodation Available
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      jobForm.food
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        food:
                          e.target.checked,
                      })
                    }
                  />
                  Food Available
                </label>

              </div>

              <label>
                Job Description
                <textarea
                  rows="5"
                  value={
                    jobForm.description
                  }
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      description:
                        e.target.value,
                    })
                  }
                  placeholder="Describe the work, responsibilities and requirements..."
                />
              </label>

              <button
                className="merchant-submit-btn"
                disabled={postingJob}
              >
                {postingJob
                  ? "Posting..."
                  : "Post Job"}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          PRODUCT DETAILS
      ================================================= */}

      {selectedListing && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setSelectedListing(null)
          }
        >

          <div
            className="merchant-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="merchant-detail-close"
              onClick={() =>
                setSelectedListing(null)
              }
            >
              <X size={20} />
            </button>

            <div className="merchant-detail-image">

              {getImage(
                selectedListing
              ) ? (
                <img
                  src={getImage(
                    selectedListing
                  )}
                  alt={
                    selectedListing.title
                  }
                />
              ) : (
                <div>🪵</div>
              )}

            </div>

            <div className="merchant-detail-body">

              <span className="merchant-detail-tag">
                {selectedListing.wood_type ||
                  "Timber"}
              </span>

              <h2>
                {selectedListing.title}
              </h2>

              <strong className="merchant-detail-price">
                {selectedListing.price
                  ? `₹ ${selectedListing.price}`
                  : "Price on contact"}
              </strong>

              <div className="merchant-detail-pills">

                <span>
                  <Package size={15} />
                  {selectedListing.quantity ||
                    "Quantity not specified"}
                </span>

                <span>
                  <MapPin size={15} />
                  {selectedListing.location ||
                    "Location not specified"}
                </span>

              </div>

              <div className="merchant-detail-info">

                <h3>
                  Product Information
                </h3>

                <div>
                  <span>
                    Wood Type
                  </span>

                  <strong>
                    {selectedListing.wood_type ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Product Type
                  </span>

                  <strong>
                    {selectedListing.product_type ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Quantity
                  </span>

                  <strong>
                    {selectedListing.quantity ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Location
                  </span>

                  <strong>
                    {selectedListing.location ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Posted
                  </span>

                  <strong>
                    {formatDate(
                      selectedListing.created_at
                    )}
                  </strong>
                </div>

              </div>

              {selectedListing.description && (
                <div className="merchant-detail-description">

                  <h3>
                    Description
                  </h3>

                  <p>
                    {
                      selectedListing.description
                    }
                  </p>

                </div>
              )}

              <div className="merchant-detail-seller">

                <div>
                  <User size={19} />
                </div>

                <section>
                  <small>
                    Seller
                  </small>

                  <strong>
                    View Seller Profile
                  </strong>
                </section>

                <button
                  onClick={() =>
                    openProfile(
                      selectedListing.user_id
                    )
                  }
                >
                  <ExternalLink
                    size={16}
                  />
                </button>

              </div>

              <div className="merchant-contact-grid">

                <button
                  onClick={() =>
                    callUser(
                      selectedListing.user_id
                    )
                  }
                >
                  <Phone size={17} />
                  Call
                </button>

                <button
                  onClick={async () => {
                    const { data } =
                      await supabase
                        .from("profiles")
                        .select("*")
                        .eq(
                          "id",
                          selectedListing.user_id
                        )
                        .maybeSingle();

                    if (data) {
                      openChat(data);
                    }
                  }}
                >
                  <MessageCircle
                    size={17}
                  />
                  Chat
                </button>

                <button
                  onClick={() =>
                    whatsappUser(
                      selectedListing.user_id
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

      {/* =================================================
          REQUIREMENT DETAILS
      ================================================= */}

      {selectedRequirement && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setSelectedRequirement(null)
          }
        >

          <div
            className="merchant-simple-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="merchant-detail-close"
              onClick={() =>
                setSelectedRequirement(
                  null
                )
              }
            >
              <X size={20} />
            </button>

            <span className="merchant-detail-tag">
              {selectedRequirement.category_label ||
                selectedRequirement.category ||
                "Requirement"}
            </span>

            <h2>
              {selectedRequirement.title}
            </h2>

            <div className="merchant-requirement-detail-grid">

              <div>
                <MapPin size={16} />
                <span>
                  Location
                </span>
                <strong>
                  {selectedRequirement.location ||
                    "-"}
                </strong>
              </div>

              <div>
                <Package size={16} />
                <span>
                  Required Quantity
                </span>
                <strong>
                  {selectedRequirement.quantity ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>₹</span>
                <span>
                  Budget
                </span>
                <strong>
                  {selectedRequirement.budget ||
                    "-"}
                </strong>
              </div>

            </div>

            {selectedRequirement.description && (
              <div className="merchant-detail-description">
                <h3>
                  Description
                </h3>

                <p>
                  {
                    selectedRequirement.description
                  }
                </p>
              </div>
            )}

            <div className="merchant-requirement-actions">

              <button
                onClick={() =>
                  openProfile(
                    selectedRequirement.user_id
                  )
                }
              >
                <User size={17} />
                View Profile
              </button>

              <button
                onClick={() =>
                  callUser(
                    selectedRequirement.user_id
                  )
                }
              >
                <Phone size={17} />
                Call
              </button>

              <button
                onClick={async () => {
                  const { data } =
                    await supabase
                      .from("profiles")
                      .select("*")
                      .eq(
                        "id",
                        selectedRequirement.user_id
                      )
                      .maybeSingle();

                  if (data) {
                    openChat(data);
                  }
                }}
              >
                <MessageCircle
                  size={17}
                />
                Chat
              </button>

            </div>

            {selectedRequirement.user_id ===
              session?.user?.id && (
              <button
                className="merchant-delete-full"
                onClick={() =>
                  deleteRequirement(
                    selectedRequirement
                  )
                }
              >
                <Trash2 size={16} />
                Delete Requirement
              </button>
            )}

          </div>

        </div>
      )}

      {/* =================================================
          WORKER / SELLER PROFILE
      ================================================= */}

      {selectedSeller && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setSelectedSeller(null)
          }
        >

          <div
            className="merchant-profile-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="merchant-detail-close"
              onClick={() =>
                setSelectedSeller(null)
              }
            >
              <X size={20} />
            </button>

            <div className="merchant-profile-cover" />

            <div className="merchant-profile-avatar">

              {selectedSeller.photo_url ? (
                <img
                  src={
                    selectedSeller.photo_url
                  }
                  alt=""
                />
              ) : (
                <span>
                  {(selectedSeller.name ||
                    "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

            </div>

            <div className="merchant-profile-body">

              <h2>
                {selectedSeller.name ||
                  "TimberMart User"}
              </h2>

              <span className="merchant-profile-role">
                {roleName(
                  selectedSeller.role
                )}
              </span>

              {selectedSeller.location && (
                <p>
                  <MapPin size={14} />
                  {selectedSeller.location}
                </p>
              )}

              {selectedSeller.bio && (
                <div className="merchant-about">
                  <h3>
                    About
                  </h3>

                  <p>
                    {selectedSeller.bio}
                  </p>
                </div>
              )}

              <div className="merchant-profile-actions">

                <button
                  onClick={() =>
                    callUser(
                      selectedSeller.id,
                      selectedSeller.phone
                    )
                  }
                >
                  <Phone size={17} />
                  Call
                </button>

                <button
                  onClick={() =>
                    openChat(
                      selectedSeller
                    )
                  }
                >
                  <MessageCircle
                    size={17}
                  />
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

      {/* =================================================
          CHAT
      ================================================= */}

      {chatOpen && chatUser && (
        <div
          className="merchant-chat-backdrop"
          onClick={() =>
            setChatOpen(false)
          }
        >

          <div
            className="merchant-chat"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <header>

              <button
                onClick={() =>
                  setChatOpen(false)
                }
              >
                <ChevronLeft size={20} />
              </button>

              <div>

                {chatUser.photo_url ? (
                  <img
                    src={
                      chatUser.photo_url
                    }
                    alt=""
                  />
                ) : (
                  <span>
                    {(chatUser.name ||
                      "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <section>
                  <strong>
                    {chatUser.name ||
                      "TimberMart User"}
                  </strong>

                  <small>
                    Direct Contact
                  </small>
                </section>

              </div>

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

            </header>

            <div className="merchant-chat-body">

              {messages.length === 0 ? (

                <div className="merchant-chat-empty">
                  <MessageCircle
                    size={35}
                  />

                  <strong>
                    Start a conversation
                  </strong>

                  <p>
                    Ask about timber,
                    requirements, jobs or
                    work details.
                  </p>
                </div>

              ) : (

                messages.map(
                  (message) => {

                    const mine =
                      message.sender_id ===
                      session.user.id;

                    return (
                      <div
                        className={
                          mine
                            ? "merchant-message mine"
                            : "merchant-message"
                        }
                        key={message.id}
                      >

                        <div>
                          {message.body}
                        </div>

                        <small>
                          {new Date(
                            message.created_at
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute:
                                "2-digit",
                            }
                          )}
                        </small>

                      </div>
                    );
                  }
                )

              )}

            </div>

            <div className="merchant-chat-input">

              <input
                value={messageText}
                onChange={(e) =>
                  setMessageText(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
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
                <Send size={18} />
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
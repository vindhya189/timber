import React, { useEffect, useMemo, useState } from "react";

import {
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  FileText,
  Home,
  ImagePlus,
  LogOut,
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

export default function FarmerDashboard() {
  const navigate = useNavigate();

  /* =======================================================
     USER / PROFILE
  ======================================================= */

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  /* =======================================================
     DASHBOARD DATA
  ======================================================= */

  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);

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

    return () => subscription.unsubscribe();
  }, [navigate]);


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

      await Promise.all([
        loadListings(session.user.id),
        loadRequirements(),
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

      const {
        data: newListing,
        error: listingError,
      } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,

          role: "farmer",

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
            sellForm.location.trim(),

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


  function chatUser(otherUserId) {
    if (!otherUserId) {
      alert(
        "User information not available."
      );
      return;
    }

    navigate(
      `/dashboard/farmer?chat=${otherUserId}`
    );
  }


  /* =======================================================
     OPEN LISTING
  ======================================================= */

  function openListing(listing) {
    setSelectedListing(listing);
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

          <div className="farmer-welcome">

            <div>

              <span className="farmer-welcome-label">
                Welcome back 👋
              </span>

              <h2>
                {profile?.name ||
                  user?.email?.split(
                    "@"
                  )[0] ||
                  "Farmer"}
              </h2>

              <p>
                Connect with timber
                buyers and manage
                your requirements
                from one place.
              </p>

            </div>


            <div className="farmer-location">

              <MapPin
                size={17}
              />

              <span>
                {profile?.location ||
                  "Location not added"}
              </span>

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
                    listings.length
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

              {filteredListings
                .slice(0, 6)
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
                Listing Published 🎉
              </h2>

              <p>
                Your timber listing
                has been successfully
                published on
                TimberMart.
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
                Buyers can now view
                your listing and
                contact you directly.
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

  return (
    <article className="farmer-listing-card">

      <div className="farmer-listing-image">

        {image ? (
          <img
            src={image}
            alt={
              listing.title
            }
          />
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

          </div>

        </div>


        {images.length >
          0 && (
          <div className="farmer-modal-images">

            {images.map(
              (image) => (
                <img
                  key={
                    image.id
                  }
                  src={
                    image.image_url
                  }
                  alt=""
                />
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
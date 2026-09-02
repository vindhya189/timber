import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Home,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  DashboardLayout,
  QuickActions,
  SectionTitle,
  Feature,
} from "./DashboardFrame";

const LISTINGS_KEY = "timbermart_listings";
const REQUIREMENTS_KEY = "timbermart_requirements";
const CURRENT_USER_KEY = "timbermart_current_user";
const USERS_KEY = "timbermart_users";

function getCurrentUser() {
  try {
    const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

    if (!currentUserId) return null;

    return users.find((user) => user.id === currentUserId) || null;
  } catch {
    return null;
  }
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function BuyerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "",
    location: "",
    quantity: "",
    budget: "",
    description: "",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate("/roles");
      return;
    }

    setUser(currentUser);

    try {
      const savedListings = JSON.parse(
        localStorage.getItem(LISTINGS_KEY) || "[]"
      );

      const savedRequirements = JSON.parse(
        localStorage.getItem(REQUIREMENTS_KEY) || "[]"
      );

      setListings(
        Array.isArray(savedListings) ? savedListings : []
      );

      setRequirements(
        Array.isArray(savedRequirements)
          ? savedRequirements
          : []
      );
    } catch {
      setListings([]);
      setRequirements([]);
    }
  }, [navigate]);

  const availableListings = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return listings
      .filter((item) => item.userId !== user?.id)
      .filter((item) => {
        if (!keyword) return true;

        return [
          item.title,
          item.woodType,
          item.productType,
          item.serviceType,
          item.workType,
          item.location,
          item.description,
          item.userName,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(keyword)
          );
      })
      .slice(0, 10);
  }, [listings, search, user]);

  const myRequirements = useMemo(() => {
    if (!user) return [];

    return requirements.filter(
      (item) => item.userId === user.id
    );
  }, [requirements, user]);

  const otherRequirements = useMemo(() => {
    if (!user) return [];

    return requirements.filter(
      (item) => item.userId !== user.id
    );
  }, [requirements, user]);

  function showMessage(text) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function postRequirement(event) {
    event.preventDefault();

    if (!user) return;

    if (!form.title.trim()) {
      showMessage("Requirement title enter cheyyandi.");
      return;
    }

    if (!form.category.trim()) {
      showMessage("Category enter cheyyandi.");
      return;
    }

    if (!form.location.trim()) {
      showMessage("Location enter cheyyandi.");
      return;
    }

    if (!form.description.trim()) {
      showMessage("Requirement description enter cheyyandi.");
      return;
    }

    const newRequirement = {
      id: createId(),

      title: form.title.trim(),

      category: "other",
      categoryLabel: form.category.trim(),

      location: form.location.trim(),
      quantity: form.quantity.trim(),
      budget: form.budget.trim(),
      description: form.description.trim(),

      userId: user.id,
      userName: user.name || "Buyer",
      userRole: "buyer",

      createdAt: new Date().toISOString(),
    };

    const updatedRequirements = [
      newRequirement,
      ...requirements,
    ];

    localStorage.setItem(
      REQUIREMENTS_KEY,
      JSON.stringify(updatedRequirements)
    );

    setRequirements(updatedRequirements);

    setForm({
      title: "",
      category: "",
      location: "",
      quantity: "",
      budget: "",
      description: "",
    });

    setShowForm(false);

    showMessage("Your requirement was posted successfully.");
  }

  function deleteRequirement(id) {
    if (!user) return;

    const updatedRequirements = requirements.filter(
      (item) =>
        !(item.id === id && item.userId === user.id)
    );

    localStorage.setItem(
      REQUIREMENTS_KEY,
      JSON.stringify(updatedRequirements)
    );

    setRequirements(updatedRequirements);

    showMessage("Requirement deleted.");
  }

  function openRequirementWall() {
    navigate("/requirements");
  }

  function openProfile() {
    navigate("/profile");
  }

  function openListingDetails(item) {
    const sellerName = item.userName || "User";

    showMessage(
      `${item.title} — posted by ${sellerName}`
    );
  }

  return (
    <DashboardLayout
      role="buyer"
      title="Buyer Dashboard"
      description="Find timber, wood products, services and trusted professionals."
    >
      <div className="tm-dashboard">

        {/* =========================
            HEADER
        ========================== */}

        <div className="tm-dashboard-header">

          <div>
            <div className="tm-eyebrow">
              🏠 Buyer / Homeowner
            </div>

            <h1 className="tm-dashboard-title">
              Welcome, {user?.name || "Buyer"}
            </h1>

            <p className="tm-dashboard-subtitle">
              Find the right timber, wood products and services for your needs.
            </p>
          </div>

          <button
            type="button"
            className="tm-btn tm-btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Post Requirement
          </button>

        </div>

        {/* =========================
            MESSAGE
        ========================== */}

        {message && (
          <div className="tm-info-box">
            {message}
          </div>
        )}

        {/* =========================
            STATS
        ========================== */}

        <div className="tm-stat-grid">

          <div className="tm-stat-card">

            <div className="tm-stat-icon">
              <ShoppingBag size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                Available Listings
              </span>

              <strong className="tm-stat-value">
                {availableListings.length}
              </strong>
            </div>

          </div>

          <div className="tm-stat-card">

            <div className="tm-stat-icon">
              <ClipboardList size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                My Requirements
              </span>

              <strong className="tm-stat-value">
                {myRequirements.length}
              </strong>
            </div>

          </div>

          <div className="tm-stat-card">

            <div className="tm-stat-icon">
              <Home size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                Community Posts
              </span>

              <strong className="tm-stat-value">
                {otherRequirements.length}
              </strong>
            </div>

          </div>

          <div className="tm-stat-card">

            <div className="tm-stat-icon">
              <User size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                Profile
              </span>

              <strong className="tm-stat-value">
                {user?.location ? "Complete" : "Update"}
              </strong>
            </div>

          </div>

        </div>

        {/* =========================
            QUICK ACTIONS
        ========================== */}

        <QuickActions />

        {/* =========================
            MAIN GRID
        ========================== */}

        <div className="tm-dashboard-grid">

          {/* =========================
              AVAILABLE PRODUCTS
          ========================== */}

          <section className="tm-panel">

            <SectionTitle
              title="Find Timber & Services"
              description="Explore listings added by TimberMart users."
              action={
                <button
                  type="button"
                  className="tm-btn tm-btn-outline"
                  onClick={openRequirementWall}
                >
                  Requirement Wall
                </button>
              }
            />

            {/* SEARCH */}

            <div className="tm-search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search timber, products or services..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            {availableListings.length === 0 ? (

              <div className="tm-empty">

                <div className="tm-empty-icon">
                  🔎
                </div>

                <h3>
                  No listings found
                </h3>

                <p>
                  Timber, wood products and service listings added by users will appear here.
                </p>

                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={openRequirementWall}
                >
                  <ClipboardList size={17} />
                  Browse Requirements
                </button>

              </div>

            ) : (

              <div className="tm-list">

                {availableListings.map((item) => (

                  <div
                    className="tm-list-item"
                    key={item.id}
                  >

                    <div className="tm-list-item-main">

                      <div className="tm-list-item-icon">
                        {item.role === "carpenter"
                          ? "🛠️"
                          : item.role === "worker"
                          ? "👷"
                          : item.role === "sawmill"
                          ? "🏭"
                          : "🪵"}
                      </div>

                      <div>

                        <h3>
                          {item.title}
                        </h3>

                        <div className="tm-list-meta">

                          {item.woodType && (
                            <span>
                              {item.woodType}
                            </span>
                          )}

                          {item.productType && (
                            <span>
                              {item.productType}
                            </span>
                          )}

                          {item.serviceType && (
                            <span>
                              {item.serviceType}
                            </span>
                          )}

                          {item.workType && (
                            <span>
                              {item.workType}
                            </span>
                          )}

                          {item.location && (
                            <span>
                              <MapPin size={14} />
                              {item.location}
                            </span>
                          )}

                        </div>

                        {item.quantity && (
                          <div className="tm-requirement-extra">
                            <span>
                              Quantity: {item.quantity}
                            </span>
                          </div>
                        )}

                        {item.availability && (
                          <div className="tm-requirement-extra">
                            <span>
                              Availability: {item.availability}
                            </span>
                          </div>
                        )}

                        {item.description && (
                          <p className="tm-list-description">
                            {item.description}
                          </p>
                        )}

                        {item.price && (
                          <div className="tm-price">
                            ₹{item.price}
                          </div>
                        )}

                        {item.expectedSalary && (
                          <div className="tm-price">
                            Expected: ₹{item.expectedSalary}
                          </div>
                        )}

                        <small>
                          Posted by {item.userName || "User"}
                        </small>

                      </div>

                    </div>

                    <button
                      type="button"
                      className="tm-btn tm-btn-secondary"
                      onClick={() =>
                        openListingDetails(item)
                      }
                    >
                      View
                    </button>

                  </div>

                ))}

              </div>

            )}

          </section>

          {/* =========================
              MY REQUIREMENTS
          ========================== */}

          <section className="tm-panel">

            <SectionTitle
              title="My Requirements"
              description="Requirements you have posted."
              action={
                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={16} />
                  Post
                </button>
              }
            />

            {myRequirements.length === 0 ? (

              <div className="tm-empty tm-empty-small">

                <div className="tm-empty-icon">
                  📋
                </div>

                <h3>
                  No requirements posted
                </h3>

                <p>
                  Tell TimberMart sellers and service providers what you need.
                </p>

                <button
                  type="button"
                  className="tm-btn tm-btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={17} />
                  Post Requirement
                </button>

              </div>

            ) : (

              <div className="tm-list">

                {myRequirements.slice(0, 8).map((item) => (

                  <div
                    className="tm-list-item"
                    key={item.id}
                  >

                    <div className="tm-list-item-main">

                      <div className="tm-list-item-icon">
                        📋
                      </div>

                      <div>

                        <h3>
                          {item.title}
                        </h3>

                        <div className="tm-list-meta">

                          <span className="tm-tag">
                            {item.categoryLabel}
                          </span>

                          {item.location && (
                            <span>
                              <MapPin size={14} />
                              {item.location}
                            </span>
                          )}

                        </div>

                        {item.description && (
                          <p className="tm-list-description">
                            {item.description}
                          </p>
                        )}

                        <div className="tm-requirement-extra">

                          {item.quantity && (
                            <span>
                              Quantity: {item.quantity}
                            </span>
                          )}

                          {item.budget && (
                            <span>
                              Budget: {item.budget}
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                    <button
                      type="button"
                      className="tm-icon-btn tm-danger-btn"
                      title="Delete requirement"
                      onClick={() =>
                        deleteRequirement(item.id)
                      }
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                ))}

              </div>

            )}

          </section>

        </div>

        {/* =========================
            BUYER FEATURES
        ========================== */}

        <section className="tm-panel">

          <SectionTitle
            title="Buyer Tools"
            description="Everything you need to find timber and services."
          />

          <div className="tm-feature-grid">

            <Feature
              icon="🪵"
              title="Find Timber"
              description="Search timber and wood products listed by merchants and sawmills."
              onClick={() => {
                setSearch("");
                window.scrollTo({
                  top: 500,
                  behavior: "smooth",
                });
              }}
            />

            <Feature
              icon="📋"
              title="Post Requirement"
              description="Tell sellers and service providers exactly what you need."
              onClick={() => setShowForm(true)}
            />

            <Feature
              icon="🛠️"
              title="Find Services"
              description="Discover carpenters and workers offering their skills."
              onClick={() => {
                setSearch("carpenter");
                window.scrollTo({
                  top: 500,
                  behavior: "smooth",
                });
              }}
            />

            <Feature
              icon="👤"
              title="My Profile"
              description="Update your name, photo, phone number and location."
              onClick={openProfile}
            />

          </div>

        </section>

        {/* =========================
            LOCATION REMINDER
        ========================== */}

        {user && !user.location && (

          <section className="tm-panel tm-profile-reminder">

            <div className="tm-reminder-icon">
              📍
            </div>

            <div>

              <h3>
                Add your location
              </h3>

              <p>
                Add your location to get more relevant timber and service options near you.
              </p>

            </div>

            <button
              type="button"
              className="tm-btn tm-btn-primary"
              onClick={openProfile}
            >
              Update Profile
            </button>

          </section>

        )}

      </div>

      {/* =========================
          POST REQUIREMENT MODAL
      ========================== */}

      {showForm && (

        <div
          className="tm-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowForm(false);
            }
          }}
        >

          <div className="tm-modal">

            {/* MODAL HEADER */}

            <div className="tm-modal-header">

              <div>

                <div className="tm-eyebrow">
                  🏠 Buyer
                </div>

                <h2>
                  Post Requirement
                </h2>

                <p>
                  Tell sellers and service providers what you need.
                </p>

              </div>

              <button
                type="button"
                className="tm-modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              className="tm-form"
              onSubmit={postRequirement}
            >

              {/* TITLE */}

              <div className="tm-form-group">

                <label>
                  Requirement Title *
                </label>

                <input
                  className="tm-input"
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="Example: Need timber for house construction"
                />

              </div>

              {/* CATEGORY */}

              <div className="tm-form-group">

                <label>
                  What do you need? *
                </label>

                <input
                  className="tm-input"
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  placeholder="Example: Teak wood / Furniture / Carpenter"
                />

              </div>

              {/* LOCATION + QUANTITY */}

              <div className="tm-form-row">

                <div className="tm-form-group">

                  <label>
                    Location *
                  </label>

                  <input
                    className="tm-input"
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    placeholder="Enter required location"
                  />

                </div>

                <div className="tm-form-group">

                  <label>
                    Quantity
                  </label>

                  <input
                    className="tm-input"
                    name="quantity"
                    value={form.quantity}
                    onChange={updateField}
                    placeholder="Example: 200 CFT"
                  />

                </div>

              </div>

              {/* BUDGET */}

              <div className="tm-form-group">

                <label>
                  Budget
                </label>

                <input
                  className="tm-input"
                  name="budget"
                  value={form.budget}
                  onChange={updateField}
                  placeholder="Enter your budget"
                />

              </div>

              {/* DESCRIPTION */}

              <div className="tm-form-group">

                <label>
                  Requirement Details *
                </label>

                <textarea
                  className="tm-textarea"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Explain exactly what you need, quality, size, quantity, delivery or service details..."
                  rows="6"
                />

              </div>

              {/* ACTIONS */}

              <div className="tm-modal-actions">

                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tm-btn tm-btn-primary"
                >
                  <Plus size={17} />
                  Post Requirement
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}
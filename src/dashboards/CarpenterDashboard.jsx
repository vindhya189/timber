import React, { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ClipboardList,
  MapPin,
  Plus,
  Search,
  Trash2,
  User,
  Wrench,
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

export default function CarpenterDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [requirements, setRequirements] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    serviceType: "",
    experience: "",
    location: "",
    price: "",
    availability: "",
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

      const carpenterServices = Array.isArray(savedListings)
        ? savedListings
            .filter(
              (item) =>
                item.role === "carpenter" &&
                item.userId === currentUser.id
            )
            .map((item) => ({
              ...item,
              serviceType:
                item.serviceType || item.productType || "",
              experience: item.experience || "",
              availability: item.availability || "",
            }))
        : [];

      setServices(carpenterServices);

      setRequirements(
        Array.isArray(savedRequirements)
          ? savedRequirements
          : []
      );
    } catch {
      setServices([]);
      setRequirements([]);
    }
  }, [navigate]);

  const customerRequirements = useMemo(() => {
    if (!user) return [];

    const keyword = search.trim().toLowerCase();

    return requirements
      .filter((item) => item.userId !== user.id)
      .filter((item) => {
        if (!keyword) return true;

        return [
          item.title,
          item.categoryLabel,
          item.location,
          item.description,
          item.quantity,
          item.budget,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(keyword)
          );
      })
      .filter((item) => {
        const category = String(
          item.category || ""
        ).toLowerCase();

        const label = String(
          item.categoryLabel || ""
        ).toLowerCase();

        return (
          category === "carpentry" ||
          category === "services" ||
          label.includes("carpent") ||
          label.includes("service") ||
          !category
        );
      })
      .slice(0, 8);
  }, [requirements, user, search]);

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

  function saveService(event) {
    event.preventDefault();

    if (!user) return;

    if (!form.title.trim()) {
      showMessage("Service title enter cheyyandi.");
      return;
    }

    if (!form.serviceType.trim()) {
      showMessage("Service type enter cheyyandi.");
      return;
    }

    if (!form.location.trim()) {
      showMessage("Location enter cheyyandi.");
      return;
    }

    const newService = {
      id: createId(),

      title: form.title.trim(),
      serviceType: form.serviceType.trim(),
      experience: form.experience.trim(),
      location: form.location.trim(),
      price: form.price.trim(),
      availability: form.availability.trim(),
      description: form.description.trim(),

      // Shared listings collection lo carpenter service
      role: "carpenter",

      userId: user.id,
      userName: user.name || "Carpenter",

      createdAt: new Date().toISOString(),
    };

    let allListings = [];

    try {
      allListings = JSON.parse(
        localStorage.getItem(LISTINGS_KEY) || "[]"
      );

      if (!Array.isArray(allListings)) {
        allListings = [];
      }
    } catch {
      allListings = [];
    }

    const updatedListings = [
      newService,
      ...allListings,
    ];

    localStorage.setItem(
      LISTINGS_KEY,
      JSON.stringify(updatedListings)
    );

    setServices((previous) => [
      newService,
      ...previous,
    ]);

    setForm({
      title: "",
      serviceType: "",
      experience: "",
      location: "",
      price: "",
      availability: "",
      description: "",
    });

    setShowForm(false);

    showMessage("Your service was added successfully.");
  }

  function deleteService(id) {
    if (!user) return;

    try {
      const allListings = JSON.parse(
        localStorage.getItem(LISTINGS_KEY) || "[]"
      );

      const updatedListings = Array.isArray(allListings)
        ? allListings.filter(
            (item) =>
              !(
                item.id === id &&
                item.userId === user.id &&
                item.role === "carpenter"
              )
          )
        : [];

      localStorage.setItem(
        LISTINGS_KEY,
        JSON.stringify(updatedListings)
      );

      setServices((previous) =>
        previous.filter((item) => item.id !== id)
      );

      showMessage("Service deleted.");
    } catch {
      showMessage("Unable to delete service.");
    }
  }

  function openRequirementWall() {
    navigate("/requirements");
  }

  function openProfile() {
    navigate("/profile");
  }

  return (
    <DashboardLayout
      role="carpenter"
      title="Carpenter Dashboard"
      description="Offer your carpentry skills and connect with customers."
    >
      <div className="tm-dashboard">

        {/* =========================
            DASHBOARD HEADER
        ========================== */}

        <div className="tm-dashboard-header">

          <div>
            <div className="tm-eyebrow">
              🛠️ Carpenter / Service Provider
            </div>

            <h1 className="tm-dashboard-title">
              Welcome, {user?.name || "Carpenter"}
            </h1>

            <p className="tm-dashboard-subtitle">
              Showcase your skills, services and find new customer requirements.
            </p>
          </div>

          <button
            type="button"
            className="tm-btn tm-btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add Service
          </button>

        </div>

        {/* =========================
            SUCCESS / ERROR MESSAGE
        ========================== */}

        {message && (
          <div className="tm-info-box">
            {message}
          </div>
        )}

        {/* =========================
            STAT CARDS
        ========================== */}

        <div className="tm-stat-grid">

          <div className="tm-stat-card">

            <div className="tm-stat-icon">
              <Wrench size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                My Services
              </span>

              <strong className="tm-stat-value">
                {services.length}
              </strong>
            </div>

          </div>

          <div className="tm-stat-card">

            <div className="tm-stat-icon">
              <ClipboardList size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                Requirements
              </span>

              <strong className="tm-stat-value">
                {requirements.length}
              </strong>
            </div>

          </div>

          <div className="tm-stat-card">

            <div className="tm-stat-icon">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                Service Requests
              </span>

              <strong className="tm-stat-value">
                {customerRequirements.length}
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
            COMMON QUICK ACTIONS
        ========================== */}

        <QuickActions />

        {/* =========================
            MAIN TWO COLUMN AREA
        ========================== */}

        <div className="tm-dashboard-grid">

          {/* =========================
              MY SERVICES
          ========================== */}

          <section className="tm-panel">

            <SectionTitle
              title="My Services"
              description="Services offered by you on TimberMart."
              action={
                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={16} />
                  Add Service
                </button>
              }
            />

            {services.length === 0 ? (

              <div className="tm-empty">

                <div className="tm-empty-icon">
                  🛠️
                </div>

                <h3>
                  No services added yet
                </h3>

                <p>
                  Add your first carpentry service to start connecting with customers.
                </p>

                <button
                  type="button"
                  className="tm-btn tm-btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={17} />
                  Add Your First Service
                </button>

              </div>

            ) : (

              <div className="tm-list">

                {services.map((service) => (

                  <div
                    className="tm-list-item"
                    key={service.id}
                  >

                    <div className="tm-list-item-main">

                      <div className="tm-list-item-icon">
                        🛠️
                      </div>

                      <div>

                        <h3>
                          {service.title}
                        </h3>

                        <div className="tm-list-meta">

                          <span>
                            {service.serviceType}
                          </span>

                          {service.experience && (
                            <span>
                              Experience: {service.experience}
                            </span>
                          )}

                          <span>
                            <MapPin size={14} />
                            {service.location}
                          </span>

                        </div>

                        {service.availability && (
                          <div className="tm-requirement-extra">
                            <span>
                              Availability: {service.availability}
                            </span>
                          </div>
                        )}

                        {service.description && (
                          <p className="tm-list-description">
                            {service.description}
                          </p>
                        )}

                        {service.price && (
                          <div className="tm-price">
                            ₹{service.price}
                          </div>
                        )}

                      </div>

                    </div>

                    <button
                      type="button"
                      className="tm-icon-btn tm-danger-btn"
                      title="Delete service"
                      onClick={() =>
                        deleteService(service.id)
                      }
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                ))}

              </div>

            )}

          </section>

          {/* =========================
              CUSTOMER REQUIREMENTS
          ========================== */}

          <section className="tm-panel">

            <SectionTitle
              title="Customer Service Requirements"
              description="Find people looking for carpentry and related services."
              action={
                <button
                  type="button"
                  className="tm-btn tm-btn-outline"
                  onClick={openRequirementWall}
                >
                  View All
                </button>
              }
            />

            {/* SEARCH */}

            <div className="tm-search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search service requirements..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            {customerRequirements.length === 0 ? (

              <div className="tm-empty tm-empty-small">

                <div className="tm-empty-icon">
                  🔎
                </div>

                <h3>
                  No matching requirements
                </h3>

                <p>
                  Customer service requirements will appear here when users post them.
                </p>

                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={openRequirementWall}
                >
                  <ClipboardList size={17} />
                  Open Requirement Wall
                </button>

              </div>

            ) : (

              <div className="tm-list">

                {customerRequirements.map((item) => (

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

                          {item.categoryLabel && (
                            <span className="tm-tag">
                              {item.categoryLabel}
                            </span>
                          )}

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
                              Need: {item.quantity}
                            </span>
                          )}

                          {item.budget && (
                            <span>
                              Budget: {item.budget}
                            </span>
                          )}

                        </div>

                        <small>
                          Posted by {item.userName || "User"}
                        </small>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

        </div>

        {/* =========================
            CARPENTER FEATURES
        ========================== */}

        <section className="tm-panel">

          <SectionTitle
            title="Carpenter Tools"
            description="Manage your service business from one place."
          />

          <div className="tm-feature-grid">

            <Feature
              icon="🛠️"
              title="My Services"
              description="Add and manage the carpentry services you provide."
              onClick={() => setShowForm(true)}
            />

            <Feature
              icon="📋"
              title="Requirement Wall"
              description="Find customer requirements related to carpentry and services."
              onClick={openRequirementWall}
            />

            <Feature
              icon="📍"
              title="Service Location"
              description="Keep your service location updated for nearby customers."
              onClick={openProfile}
            />

            <Feature
              icon="👤"
              title="My Profile"
              description="Update your profile photo, phone, location and introduction."
              onClick={openProfile}
            />

          </div>

        </section>

        {/* =========================
            PROFILE REMINDER
        ========================== */}

        {user && !user.location && (

          <section className="tm-panel tm-profile-reminder">

            <div className="tm-reminder-icon">
              📍
            </div>

            <div>
              <h3>
                Add your service location
              </h3>

              <p>
                Customers can find you more easily when your location is added to your profile.
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
          ADD SERVICE MODAL
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

            <div className="tm-modal-header">

              <div>

                <div className="tm-eyebrow">
                  🛠️ Carpenter
                </div>

                <h2>
                  Add Your Service
                </h2>

                <p>
                  Enter your real service details.
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

            <form
              className="tm-form"
              onSubmit={saveService}
            >

              {/* SERVICE TITLE */}

              <div className="tm-form-group">

                <label>
                  Service Title *
                </label>

                <input
                  className="tm-input"
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="Enter your service title"
                />

              </div>

              {/* SERVICE + EXPERIENCE */}

              <div className="tm-form-row">

                <div className="tm-form-group">

                  <label>
                    Service Type *
                  </label>

                  <input
                    className="tm-input"
                    name="serviceType"
                    value={form.serviceType}
                    onChange={updateField}
                    placeholder="Example: Furniture making"
                  />

                </div>

                <div className="tm-form-group">

                  <label>
                    Experience
                  </label>

                  <input
                    className="tm-input"
                    name="experience"
                    value={form.experience}
                    onChange={updateField}
                    placeholder="Example: 5 years"
                  />

                </div>

              </div>

              {/* LOCATION + PRICE */}

              <div className="tm-form-row">

                <div className="tm-form-group">

                  <label>
                    Service Location *
                  </label>

                  <input
                    className="tm-input"
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    placeholder="Enter your service location"
                  />

                </div>

                <div className="tm-form-group">

                  <label>
                    Starting Price
                  </label>

                  <input
                    className="tm-input"
                    name="price"
                    value={form.price}
                    onChange={updateField}
                    placeholder="Enter starting price"
                  />

                </div>

              </div>

              {/* AVAILABILITY */}

              <div className="tm-form-group">

                <label>
                  Availability
                </label>

                <input
                  className="tm-input"
                  name="availability"
                  value={form.availability}
                  onChange={updateField}
                  placeholder="Example: Weekdays / Full time"
                />

              </div>

              {/* DESCRIPTION */}

              <div className="tm-form-group">

                <label>
                  About Your Service
                </label>

                <textarea
                  className="tm-textarea"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Describe your skills, work quality, services and other details..."
                  rows="5"
                />

              </div>

              {/* ACTION BUTTONS */}

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
                  Add Service
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapPin,
  Plus,
  Search,
  TreePine,
  User,
  Trash2,
  X,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../supabaseClient";

import {
  DashboardLayout,
  QuickActions,
  SectionTitle,
} from "./DashboardFrame";

import "./FarmerDashboard.css";

export default function FarmerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [listings, setListings] = useState([]);
  const [requirementsCount, setRequirementsCount] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    title: "",
    woodType: "",
    quantity: "",
    location: "",
    price: "",
    description: "",
  });

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/roles", {
          replace: true,
        });
        return;
      }

      setUser(session.user);

      const { data: profileData } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

      setProfile(profileData);

      await Promise.all([
        loadListings(session.user.id),
        loadRequirements(session.user.id),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LISTINGS
  ===================================================== */

  async function loadListings(userId) {
    const { data, error } =
      await supabase
        .from("listings")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "farmer")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(error);
      return;
    }

    setListings(data || []);
  }

  /* =====================================================
     REQUIREMENTS
  ===================================================== */

  async function loadRequirements(userId) {
    const { count, error } =
      await supabase
        .from("requirements")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    setRequirementsCount(count || 0);
  }

  /* =====================================================
     FORM
  ===================================================== */

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
    setMessage("");
  }

  function openForm() {
    setShowForm(true);
    setError("");
    setMessage("");
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);

    setForm({
      title: "",
      woodType: "",
      quantity: "",
      location: "",
      price: "",
      description: "",
    });
  }

  /* =====================================================
     CREATE LISTING
  ===================================================== */

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user?.id) {
      setError(
        "Please login again."
      );
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Please enter listing title."
      );
      return;
    }

    if (!form.woodType.trim()) {
      setError(
        "Please enter timber type."
      );
      return;
    }

    if (!form.quantity.trim()) {
      setError(
        "Please enter quantity."
      );
      return;
    }

    if (!form.location.trim()) {
      setError(
        "Please enter location."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data, error } =
        await supabase
          .from("listings")
          .insert({
            user_id: user.id,
            role: "farmer",
            title: form.title.trim(),
            wood_type:
              form.woodType.trim(),
            quantity:
              form.quantity.trim(),
            location:
              form.location.trim(),
            price:
              form.price.trim(),
            description:
              form.description.trim(),
          })
          .select()
          .single();

      if (error) {
        throw error;
      }

      setListings((old) => [
        data,
        ...old,
      ]);

      setMessage(
        "🌳 Timber listing published successfully."
      );

      closeForm();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to publish listing."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function handleDelete(id) {
    const ok = window.confirm(
      "Delete this timber listing?"
    );

    if (!ok) return;

    try {
      const { error } =
        await supabase
          .from("listings")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setListings((old) =>
        old.filter(
          (item) => item.id !== id
        )
      );

      setMessage(
        "Listing deleted successfully."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to delete listing."
      );
    }
  }

  const myListings = useMemo(
    () => listings,
    [listings]
  );

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Farmer";

  const location =
    profile?.location ||
    "Not Added";

  if (loading) {
    return (
      <div className="tm-loading-page">
        <div className="tm-loader" />
        <p>Loading Farmer Dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      role="farmer"
      title="Farmer Dashboard"
    >

      {/* ================= WELCOME ================= */}

      <section className="farmer-welcome">

        <div>
          <h2>
            Welcome, {displayName} 🌳
          </h2>

          <p>
            Sell your trees directly and connect
            with buyers through TimberMart.
          </p>

          <div className="farmer-location">
            <MapPin size={16} />
            {location}
          </div>
        </div>

        <button
          className="tm-btn tm-btn-secondary"
          onClick={loadDashboard}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </section>

      {/* ================= MESSAGE ================= */}

      {error && (
        <div className="tm-alert tm-alert-error">
          {error}
        </div>
      )}

      {message && (
        <div className="tm-alert tm-alert-success">
          {message}
        </div>
      )}

      {/* ================= STATS ================= */}

      <div className="tm-stat-grid">

        <div className="tm-stat-card">
          <div className="tm-stat-icon">
            🌲
          </div>

          <strong>
            {myListings.length}
          </strong>

          <span>
            My Timber Listings
          </span>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon">
            📌
          </div>

          <strong>
            {requirementsCount}
          </strong>

          <span>
            My Requirements
          </span>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon">
            📍
          </div>

          <strong className="small-value">
            {location}
          </strong>

          <span>
            My Location
          </span>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon">
            👤
          </div>

          <strong>
            Active
          </strong>

          <span>
            Account Status
          </span>
        </div>

      </div>

      {/* ================= QUICK ACTIONS ================= */}

      <section className="tm-section">

        <SectionTitle
          title="Quick Actions"
          description="Access important TimberMart features quickly."
        />

        <QuickActions />

      </section>

      {/* ================= FARMER TOOLS ================= */}

      <section className="tm-section">

        <SectionTitle
          title="Farmer Tools"
          description="Sell your trees and find buyer requirements."
        />

        <div className="farmer-tool-grid">

          <button
            className="farmer-tool"
            onClick={openForm}
          >
            <div className="farmer-tool-icon">
              <Plus size={24} />
            </div>

            <strong>
              Sell Tree
            </strong>

            <span>
              Create a timber listing.
            </span>
          </button>

          <button
            className="farmer-tool"
            onClick={() =>
              navigate("/requirements")
            }
          >
            <div className="farmer-tool-icon">
              <Search size={24} />
            </div>

            <strong>
              Requirement Wall
            </strong>

            <span>
              Find buyers looking for timber.
            </span>
          </button>

          <button
            className="farmer-tool"
            onClick={() =>
              navigate("/profile")
            }
          >
            <div className="farmer-tool-icon">
              <User size={24} />
            </div>

            <strong>
              My Profile
            </strong>

            <span>
              Update photo and location.
            </span>
          </button>

          <button
            className="farmer-tool"
            onClick={() =>
              navigate("/requirements")
            }
          >
            <div className="farmer-tool-icon">
              <ClipboardList size={24} />
            </div>

            <strong>
              Post Requirement
            </strong>

            <span>
              Tell buyers what you need.
            </span>
          </button>

        </div>

      </section>

      {/* ================= SELL TREE FORM ================= */}

      {showForm && (
        <section className="tm-section">

          <div className="farmer-form-card">

            <div className="farmer-form-header">

              <div>
                <h2>
                  🌳 Sell Your Tree
                </h2>

                <p>
                  Enter your tree/timber details.
                </p>
              </div>

              <button
                className="tm-icon-btn"
                onClick={closeForm}
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="farmer-form"
            >

              <div className="form-two">

                <div className="tm-form-group">
                  <label>
                    Listing Title *
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Example: Teak Trees"
                  />
                </div>

                <div className="tm-form-group">
                  <label>
                    Tree / Wood Type *
                  </label>

                  <input
                    name="woodType"
                    value={form.woodType}
                    onChange={handleChange}
                    placeholder="Enter your tree type"
                  />
                </div>

                <div className="tm-form-group">
                  <label>
                    Quantity *
                  </label>

                  <input
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="Example: 10 trees"
                  />
                </div>

                <div className="tm-form-group">
                  <label>
                    Location *
                  </label>

                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Enter tree location"
                  />
                </div>

                <div className="tm-form-group">
                  <label>
                    Expected Price
                  </label>

                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="Enter expected price"
                  />
                </div>

              </div>

              <div className="tm-form-group">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Add tree details, age, size, condition etc."
                  rows="5"
                />
              </div>

              <div className="farmer-form-buttons">

                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tm-btn tm-btn-primary"
                  disabled={saving}
                >
                  <Plus size={17} />

                  {saving
                    ? "Publishing..."
                    : "Publish Listing"}
                </button>

              </div>

            </form>

          </div>

        </section>
      )}

      {/* ================= MY LISTINGS ================= */}

      <section className="tm-section">

        <SectionTitle
          title="My Timber Listings"
          description="Trees and timber you have posted."
          action={
            <button
              className="tm-btn tm-btn-primary"
              onClick={openForm}
            >
              <Plus size={16} />
              Sell Tree
            </button>
          }
        />

        {myListings.length === 0 ? (

          <div className="tm-empty">

            <div className="tm-empty-icon">
              <TreePine size={28} />
            </div>

            <h3>
              No listings yet
            </h3>

            <p>
              Your tree listings will appear here
              after you publish them.
            </p>

            <button
              className="tm-btn tm-btn-primary"
              onClick={openForm}
            >
              <Plus size={16} />
              Create First Listing
            </button>

          </div>

        ) : (

          <div className="farmer-listing-grid">

            {myListings.map((listing) => (

              <article
                className="farmer-listing-card"
                key={listing.id}
              >

                <div className="listing-top">

                  <div>
                    <span className="listing-label">
                      🌳 TIMBER LISTING
                    </span>

                    <h3>
                      {listing.title}
                    </h3>
                  </div>

                  <span className="listing-status">
                    Live
                  </span>

                </div>

                <div className="listing-details">

                  <div>
                    <span>
                      Tree Type
                    </span>

                    <strong>
                      {listing.wood_type ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Quantity
                    </span>

                    <strong>
                      {listing.quantity ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Location
                    </span>

                    <strong>
                      📍 {listing.location}
                    </strong>
                  </div>

                  {listing.price && (
                    <div>
                      <span>
                        Expected Price
                      </span>

                      <strong>
                        {listing.price}
                      </strong>
                    </div>
                  )}

                </div>

                {listing.description && (
                  <p className="listing-description">
                    {listing.description}
                  </p>
                )}

                <div className="listing-footer">

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(
                        listing.id
                      )
                    }
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

      {/* ================= PROFILE SUMMARY ================= */}

      <section className="tm-section">

        <div className="farmer-profile-summary">

          <div className="profile-summary-avatar">

            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt="Profile"
              />
            ) : (
              <TreePine size={30} />
            )}

          </div>

          <div>
            <h3>
              {displayName}
            </h3>

            <p>
              Farmer
            </p>

            <p>
              📍 {location}
            </p>
          </div>

          <button
            className="tm-btn tm-btn-secondary"
            onClick={() =>
              navigate("/profile")
            }
          >
            Edit Profile
          </button>

        </div>

      </section>

    </DashboardLayout>
  );
}
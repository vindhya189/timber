import React, { useEffect, useMemo, useState } from "react";

import {
  BriefcaseBusiness,
  ClipboardList,
  MapPin,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
  Package,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  DashboardLayout,
  SectionTitle,
} from "./DashboardFrame";

import { supabase } from "../supabaseClient";
import "./MerchantDashboard.css";

/*
============================================================
 TIMBERMART - MERCHANT DASHBOARD
============================================================

Merchant can:

🛒 Buy / Find timber
🪵 Sell / Add timber listing
📋 Requirement Wall
👷 Find / Post Workers
👤 Profile
⚙️ Settings

IMPORTANT:

- No fake timber listings
- No fake requirements
- No fake jobs
- User-created timber listings come from Supabase
- Requirements come from Supabase
- Jobs posted by merchant are stored locally until a jobs
  table is added to Supabase
============================================================
*/

export default function MerchantDashboard() {
  const navigate = useNavigate();

  /* ========================================================
     USER
  ======================================================== */

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  /* ========================================================
     DATA
  ======================================================== */

  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [jobs, setJobs] = useState([]);

  /* ========================================================
     UI
  ======================================================== */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeSection, setActiveSection] =
    useState("home");

  const [showSellForm, setShowSellForm] =
    useState(false);

  const [showJobForm, setShowJobForm] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* ========================================================
     SELL FORM
  ======================================================== */

  const [sellForm, setSellForm] =
    useState({
      title: "",
      wood_type: "",
      product_type: "",
      quantity: "",
      location: "",
      price: "",
      description: "",
    });

  /* ========================================================
     JOB FORM
  ======================================================== */

  const [jobForm, setJobForm] =
    useState({
      title: "",
      job_type: "",
      experience: "",
      salary: "",
      location: "",
      positions: "",
      description: "",
    });

  /* ========================================================
     LOAD PAGE
  ======================================================== */

  useEffect(() => {
    loadMerchantData();
  }, []);

  async function loadMerchantData() {
    try {
      setLoading(true);
      setError("");

      const {
        data: {
          session,
        },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/roles", {
          replace: true,
        });

        return;
      }

      setUser(session.user);

      /* PROFILE */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          session.user.id
        )
        .maybeSingle();

      if (profileError) {
        console.error(
          "Merchant profile error:",
          profileError
        );
      }

      setProfile(profileData);

      /* LISTINGS */

      await loadListings();

      /* REQUIREMENTS */

      await loadRequirements();

      /* JOBS */

      loadJobs();
    } catch (err) {
      console.error(
        "Merchant dashboard error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load merchant dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ========================================================
     LOAD LISTINGS
  ======================================================== */

  async function loadListings() {
    const {
      data,
      error: listingError,
    } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (listingError) {
      throw listingError;
    }

    setListings(data || []);
  }

  /* ========================================================
     LOAD REQUIREMENTS
  ======================================================== */

  async function loadRequirements() {
    const {
      data,
      error: requirementError,
    } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (requirementError) {
      throw requirementError;
    }

    setRequirements(
      data || []
    );
  }

  /* ========================================================
     LOAD JOBS
  ======================================================== */

  function loadJobs() {
    try {
      const key =
        "timbermart_merchant_jobs";

      const saved =
        localStorage.getItem(key);

      const parsed =
        saved
          ? JSON.parse(saved)
          : [];

      setJobs(
        Array.isArray(parsed)
          ? parsed
          : []
      );
    } catch {
      setJobs([]);
    }
  }

  /* ========================================================
     REFRESH
  ======================================================== */

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setMessage("");

      await loadListings();
      await loadRequirements();
      loadJobs();

      setMessage(
        "Dashboard refreshed."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Refresh failed."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* ========================================================
     SELL FORM CHANGE
  ======================================================== */

  function handleSellChange(e) {
    const {
      name,
      value,
    } = e.target;

    setSellForm((old) => ({
      ...old,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  /* ========================================================
     ADD TIMBER LISTING
  ======================================================== */

  async function handleSellSubmit(e) {
    e.preventDefault();

    if (!user?.id) {
      setError(
        "Login session not found."
      );
      return;
    }

    if (!sellForm.title.trim()) {
      setError(
        "Please enter listing title."
      );
      return;
    }

    if (!sellForm.wood_type.trim()) {
      setError(
        "Please enter timber / wood type."
      );
      return;
    }

    if (!sellForm.quantity.trim()) {
      setError(
        "Please enter quantity."
      );
      return;
    }

    if (!sellForm.location.trim()) {
      setError(
        "Please enter location."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      const {
        data,
        error: insertError,
      } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          role: "merchant",

          title:
            sellForm.title.trim(),

          wood_type:
            sellForm.wood_type.trim(),

          product_type:
            sellForm.product_type.trim(),

          quantity:
            sellForm.quantity.trim(),

          location:
            sellForm.location.trim(),

          price:
            sellForm.price.trim(),

          description:
            sellForm.description.trim(),
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setListings((old) => [
        data,
        ...old,
      ]);

      setSellForm({
        title: "",
        wood_type: "",
        product_type: "",
        quantity: "",
        location: "",
        price: "",
        description: "",
      });

      setShowSellForm(false);

      setMessage(
        "Timber listing added successfully."
      );
    } catch (err) {
      console.error(
        "Add listing error:",
        err
      );

      setError(
        err?.message ||
          "Unable to add timber listing."
      );
    }
  }

  /* ========================================================
     DELETE LISTING
  ======================================================== */

  async function deleteListing(id) {
    if (!user?.id) return;

    const confirmed =
      window.confirm(
        "Delete this timber listing?"
      );

    if (!confirmed) return;

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("listings")
        .delete()
        .eq("id", id)
        .eq(
          "user_id",
          user.id
        );

      if (deleteError) {
        throw deleteError;
      }

      setListings((old) =>
        old.filter(
          (item) =>
            item.id !== id
        )
      );

      setMessage(
        "Listing deleted."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to delete listing."
      );
    }
  }

  /* ========================================================
     JOB FORM CHANGE
  ======================================================== */

  function handleJobChange(e) {
    const {
      name,
      value,
    } = e.target;

    setJobForm((old) => ({
      ...old,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  /* ========================================================
     POST JOB
  ======================================================== */

  function handleJobSubmit(e) {
    e.preventDefault();

    if (!jobForm.title.trim()) {
      setError(
        "Please enter job title."
      );
      return;
    }

    if (!jobForm.location.trim()) {
      setError(
        "Please enter job location."
      );
      return;
    }

    const newJob = {
      id:
        crypto.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`,

      merchant_id:
        user?.id,

      title:
        jobForm.title.trim(),

      job_type:
        jobForm.job_type.trim(),

      experience:
        jobForm.experience.trim(),

      salary:
        jobForm.salary.trim(),

      location:
        jobForm.location.trim(),

      positions:
        jobForm.positions.trim(),

      description:
        jobForm.description.trim(),

      created_at:
        new Date().toISOString(),
    };

    const updatedJobs = [
      newJob,
      ...jobs,
    ];

    setJobs(updatedJobs);

    localStorage.setItem(
      "timbermart_merchant_jobs",
      JSON.stringify(
        updatedJobs
      )
    );

    setJobForm({
      title: "",
      job_type: "",
      experience: "",
      salary: "",
      location: "",
      positions: "",
      description: "",
    });

    setShowJobForm(false);

    setMessage(
      "Job posted successfully."
    );
  }

  /* ========================================================
     DELETE JOB
  ======================================================== */

  function deleteJob(id) {
    const confirmed =
      window.confirm(
        "Delete this job?"
      );

    if (!confirmed) return;

    const updatedJobs =
      jobs.filter(
        (job) =>
          job.id !== id
      );

    setJobs(updatedJobs);

    localStorage.setItem(
      "timbermart_merchant_jobs",
      JSON.stringify(
        updatedJobs
      )
    );

    setMessage(
      "Job deleted."
    );
  }

  /* ========================================================
     FILTER LISTINGS
  ======================================================== */

  const filteredListings =
    useMemo(() => {
      const text =
        searchText
          .trim()
          .toLowerCase();

      if (!text) {
        return listings;
      }

      return listings.filter(
        (item) => {
          const combined = `
            ${item.title || ""}
            ${item.wood_type || ""}
            ${item.product_type || ""}
            ${item.location || ""}
            ${item.description || ""}
          `.toLowerCase();

          return combined.includes(
            text
          );
        }
      );
    }, [
      listings,
      searchText,
    ]);

  /* ========================================================
     STATS
  ======================================================== */

  const myListings =
    listings.filter(
      (item) =>
        item.user_id ===
        user?.id
    );

  const myRequirements =
    requirements.filter(
      (item) =>
        item.user_id ===
        user?.id
    );

  const myJobs =
    jobs.filter(
      (item) =>
        item.merchant_id ===
        user?.id
    );

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Merchant";

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="tm-merchant-loading">
        <div className="tm-merchant-spinner" />

        <h3>
          Loading Merchant Dashboard...
        </h3>

        <p>
          Please wait.
        </p>
      </div>
    );
  }

  /* ========================================================
     DASHBOARD
  ======================================================== */

  return (
    <DashboardLayout
      role="merchant"
      title="Merchant Dashboard"
      description="Buy, sell timber, manage requirements and connect with workers."
    >

      {/* ====================================================
          TOP MESSAGE
      ==================================================== */}

      {error && (
        <div className="tm-merchant-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="tm-merchant-message success">
          {message}
        </div>
      )}

      {/* ====================================================
          WELCOME
      ==================================================== */}

      <section className="tm-merchant-welcome">

        <div>
          <div className="tm-merchant-welcome-small">
            🪵 Timber Merchant
          </div>

          <h2>
            Welcome, {displayName} 👋
          </h2>

          <p>
            Manage your timber business,
            find timber and connect directly
            with the TimberMart community.
          </p>

          {profile?.location && (
            <div className="tm-merchant-location">
              <MapPin size={15} />
              {profile.location}
            </div>
          )}
        </div>

        <button
          type="button"
          className="tm-merchant-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "tm-refresh-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </section>

      {/* ====================================================
          STATS
      ==================================================== */}

      <div className="tm-merchant-stat-grid">

        <StatCard
          icon="🪵"
          title="My Listings"
          value={myListings.length}
        />

        <StatCard
          icon="📋"
          title="My Requirements"
          value={myRequirements.length}
        />

        <StatCard
          icon="🛒"
          title="Available Timber"
          value={listings.length}
        />

        <StatCard
          icon="👷"
          title="My Jobs"
          value={myJobs.length}
        />

      </div>

      {/* ====================================================
          QUICK ACTIONS
      ==================================================== */}

      <section className="tm-merchant-section">

        <SectionTitle
          title="Quick Actions"
          description="Access important merchant features quickly."
        />

        <div className="tm-merchant-action-grid">

          <ActionCard
            icon={
              <ShoppingCart size={25} />
            }
            title="Buy Timber"
            description="Find timber and wood listings."
            onClick={() => {
              setActiveSection("buy");
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          />

          <ActionCard
            icon={
              <Package size={25} />
            }
            title="Sell Timber"
            description="Add your timber listing."
            onClick={() => {
              setShowSellForm(true);
            }}
          />

          <ActionCard
            icon={
              <ClipboardList size={25} />
            }
            title="Requirement Wall"
            description="Find and post requirements."
            onClick={() =>
              navigate(
                "/requirements"
              )
            }
          />

          <ActionCard
            icon={
              <BriefcaseBusiness
                size={25}
              />
            }
            title="Jobs"
            description="Find workers or post a job."
            onClick={() =>
              setActiveSection("jobs")
            }
          />

          <ActionCard
            icon={
              <User size={25} />
            }
            title="My Profile"
            description="Update photo and account details."
            onClick={() =>
              navigate("/profile")
            }
          />

          <ActionCard
            icon="⚙️"
            title="Settings"
            description="Manage account preferences."
            onClick={() =>
              navigate("/settings")
            }
          />

        </div>

      </section>

      {/* ====================================================
          BUY TIMBER
      ==================================================== */}

      <section className="tm-merchant-section">

        <div className="tm-merchant-section-head">

          <SectionTitle
            title="Buy — Find Trees / Timber"
            description="Browse timber listings added by TimberMart users."
          />

          <button
            type="button"
            className="tm-merchant-outline-btn"
            onClick={() => {
              setActiveSection("buy");
              setSearchText("");
            }}
          >
            View All
          </button>

        </div>

        <div className="tm-merchant-search">

          <Search size={18} />

          <input
            value={searchText}
            onChange={(e) =>
              setSearchText(
                e.target.value
              )
            }
            placeholder="Search trees, timber, logs, planks..."
          />

        </div>

        {filteredListings.length === 0 ? (

          <EmptyState
            icon="🪵"
            title="No timber listings yet"
            text="When users add timber listings, they will appear here."
          />

        ) : (

          <div className="tm-merchant-list-grid">

            {filteredListings
              .slice(
                0,
                activeSection === "buy"
                  ? filteredListings.length
                  : 6
              )
              .map((item) => (

                <TimberCard
                  key={item.id}
                  item={item}
                  currentUserId={
                    user?.id
                  }
                  onDelete={
                    deleteListing
                  }
                />

              ))}

          </div>

        )}

      </section>

      {/* ====================================================
          SELL TIMBER
      ==================================================== */}

      <section className="tm-merchant-section">

        <div className="tm-merchant-section-banner">

          <div>
            <span>
              🪵 SELL
            </span>

            <h2>
              Add Timber Listing
            </h2>

            <p>
              List timber, logs, planks or
              other wood products for buyers.
            </p>
          </div>

          <button
            type="button"
            className="tm-merchant-green-btn"
            onClick={() =>
              setShowSellForm(true)
            }
          >
            <Plus size={17} />
            Add Listing
          </button>

        </div>

        {showSellForm && (
          <div className="tm-merchant-form-card">

            <div className="tm-merchant-form-head">

              <div>
                <h3>
                  Add Timber Listing
                </h3>

                <p>
                  Enter your own product details.
                </p>
              </div>

              <button
                type="button"
                className="tm-merchant-close"
                onClick={() =>
                  setShowSellForm(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handleSellSubmit
              }
            >

              <div className="tm-merchant-form-grid">

                <Field
                  label="Listing Title *"
                  name="title"
                  value={
                    sellForm.title
                  }
                  onChange={
                    handleSellChange
                  }
                  placeholder="Example: Teak Wood Logs"
                />

                <Field
                  label="Timber / Wood Type *"
                  name="wood_type"
                  value={
                    sellForm.wood_type
                  }
                  onChange={
                    handleSellChange
                  }
                  placeholder="Enter wood type"
                />

                <Field
                  label="Product Type"
                  name="product_type"
                  value={
                    sellForm.product_type
                  }
                  onChange={
                    handleSellChange
                  }
                  placeholder="Logs / Planks / Timber"
                />

                <Field
                  label="Quantity *"
                  name="quantity"
                  value={
                    sellForm.quantity
                  }
                  onChange={
                    handleSellChange
                  }
                  placeholder="Example: 15 CMT"
                />

                <Field
                  label="Location *"
                  name="location"
                  value={
                    sellForm.location
                  }
                  onChange={
                    handleSellChange
                  }
                  placeholder="City / District / State"
                />

                <Field
                  label="Price"
                  name="price"
                  value={
                    sellForm.price
                  }
                  onChange={
                    handleSellChange
                  }
                  placeholder="Example: ₹85,000"
                />

              </div>

              <div className="tm-merchant-field">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    sellForm.description
                  }
                  onChange={
                    handleSellChange
                  }
                  rows="4"
                  placeholder="Describe your timber/product..."
                />
              </div>

              <div className="tm-merchant-form-actions">

                <button
                  type="button"
                  className="tm-merchant-outline-btn"
                  onClick={() =>
                    setShowSellForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tm-merchant-green-btn"
                >
                  <Plus size={17} />
                  Publish Listing
                </button>

              </div>

            </form>

          </div>
        )}

      </section>

      {/* ====================================================
          MY LISTINGS
      ==================================================== */}

      <section className="tm-merchant-section">

        <SectionTitle
          title="My Timber Listings"
          description="Timber listings created from your merchant account."
        />

        {myListings.length === 0 ? (

          <EmptyState
            icon="📦"
            title="You have no listings"
            text="Add your first timber listing using the button above."
            buttonText="Add Timber Listing"
            onClick={() =>
              setShowSellForm(true)
            }
          />

        ) : (

          <div className="tm-merchant-list-grid">

            {myListings.map(
              (item) => (
                <TimberCard
                  key={item.id}
                  item={item}
                  currentUserId={
                    user?.id
                  }
                  onDelete={
                    deleteListing
                  }
                />
              )
            )}

          </div>

        )}

      </section>

      {/* ====================================================
          REQUIREMENT WALL
      ==================================================== */}

      <section className="tm-merchant-section">

        <div className="tm-merchant-section-banner light">

          <div>
            <span>
              📋 REQUIREMENT WALL
            </span>

            <h2>
              What Buyers & Businesses Need
            </h2>

            <p>
              See requirements posted by
              TimberMart users and connect
              directly.
            </p>
          </div>

          <button
            type="button"
            className="tm-merchant-green-btn"
            onClick={() =>
              navigate(
                "/requirements"
              )
            }
          >
            <ClipboardList size={17} />
            Open Requirement Wall
          </button>

        </div>

        {requirements.length === 0 ? (

          <EmptyState
            icon="📋"
            title="No requirements yet"
            text="User-created requirements will appear here."
            buttonText="Post Requirement"
            onClick={() =>
              navigate(
                "/requirements"
              )
            }
          />

        ) : (

          <div className="tm-merchant-requirement-list">

            {requirements
              .slice(0, 5)
              .map(
                (item) => (
                  <div
                    className="tm-merchant-requirement"
                    key={item.id}
                  >

                    <div className="tm-merchant-req-icon">
                      📌
                    </div>

                    <div className="tm-merchant-req-main">

                      <h3>
                        {item.title}
                      </h3>

                      <div className="tm-merchant-req-meta">

                        {item.category && (
                          <span>
                            {item.category}
                          </span>
                        )}

                        {item.location && (
                          <span>
                            <MapPin size={13} />
                            {item.location}
                          </span>
                        )}

                        {item.quantity && (
                          <span>
                            📦{" "}
                            {item.quantity}
                          </span>
                        )}

                      </div>

                      {item.description && (
                        <p>
                          {item.description}
                        </p>
                      )}

                    </div>

                  </div>
                )
              )}

          </div>

        )}

      </section>

      {/* ====================================================
          JOBS
      ==================================================== */}

      <section className="tm-merchant-section">

        <div className="tm-merchant-section-head">

          <SectionTitle
            title="Jobs — Find / Post Workers"
            description="Find workers or publish your own job opening."
          />

          <button
            type="button"
            className="tm-merchant-green-btn"
            onClick={() =>
              setShowJobForm(true)
            }
          >
            <Plus size={17} />
            Post a Job
          </button>

        </div>

        {showJobForm && (
          <div className="tm-merchant-form-card">

            <div className="tm-merchant-form-head">

              <div>
                <h3>
                  Post a Job
                </h3>

                <p>
                  Add your own worker requirement.
                </p>
              </div>

              <button
                type="button"
                className="tm-merchant-close"
                onClick={() =>
                  setShowJobForm(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handleJobSubmit
              }
            >

              <div className="tm-merchant-form-grid">

                <Field
                  label="Job Title *"
                  name="title"
                  value={
                    jobForm.title
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Enter job title"
                />

                <Field
                  label="Job Type"
                  name="job_type"
                  value={
                    jobForm.job_type
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Full Time / Part Time"
                />

                <Field
                  label="Experience"
                  name="experience"
                  value={
                    jobForm.experience
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Example: 2 - 5 Years"
                />

                <Field
                  label="Salary"
                  name="salary"
                  value={
                    jobForm.salary
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Enter salary"
                />

                <Field
                  label="Location *"
                  name="location"
                  value={
                    jobForm.location
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Job location"
                />

                <Field
                  label="Number of Positions"
                  name="positions"
                  value={
                    jobForm.positions
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Example: 2"
                />

              </div>

              <div className="tm-merchant-field">

                <label>
                  Job Description
                </label>

                <textarea
                  name="description"
                  value={
                    jobForm.description
                  }
                  onChange={
                    handleJobChange
                  }
                  rows="4"
                  placeholder="Describe the job..."
                />

              </div>

              <div className="tm-merchant-form-actions">

                <button
                  type="button"
                  className="tm-merchant-outline-btn"
                  onClick={() =>
                    setShowJobForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tm-merchant-green-btn"
                >
                  <BriefcaseBusiness
                    size={17}
                  />
                  Post Job
                </button>

              </div>

            </form>

          </div>
        )}

        {jobs.length === 0 ? (

          <EmptyState
            icon="👷"
            title="No jobs posted yet"
            text="When you post a job, it will appear here."
            buttonText="Post a Job"
            onClick={() =>
              setShowJobForm(true)
            }
          />

        ) : (

          <div className="tm-merchant-jobs-grid">

            {jobs.map(
              (job) => (

                <div
                  className="tm-merchant-job-card"
                  key={job.id}
                >

                  <div className="tm-job-icon">
                    👷
                  </div>

                  <div className="tm-job-content">

                    <h3>
                      {job.title}
                    </h3>

                    {job.job_type && (
                      <span className="tm-job-tag">
                        {job.job_type}
                      </span>
                    )}

                    <div className="tm-job-info">

                      {job.location && (
                        <span>
                          <MapPin size={14} />
                          {job.location}
                        </span>
                      )}

                      {job.experience && (
                        <span>
                          🎯{" "}
                          {job.experience}
                        </span>
                      )}

                      {job.salary && (
                        <span>
                          💰{" "}
                          {job.salary}
                        </span>
                      )}

                      {job.positions && (
                        <span>
                          👥{" "}
                          {job.positions}
                        </span>
                      )}

                    </div>

                    {job.description && (
                      <p>
                        {job.description}
                      </p>
                    )}

                    {job.merchant_id ===
                      user?.id && (
                      <button
                        type="button"
                        className="tm-delete-small"
                        onClick={() =>
                          deleteJob(
                            job.id
                          )
                        }
                      >
                        <Trash2 size={14} />
                        Delete Job
                      </button>
                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* ====================================================
          PROFILE
      ==================================================== */}

      <section className="tm-merchant-profile-banner">

        <div className="tm-merchant-profile-avatar">

          {profile?.photo_url ? (
            <img
              src={
                profile.photo_url
              }
              alt="Profile"
            />
          ) : (
            <User size={27} />
          )}

        </div>

        <div>

          <span>
            MERCHANT PROFILE
          </span>

          <h3>
            {displayName}
          </h3>

          <p>
            {profile?.location ||
              "Add your location from My Profile."}
          </p>

        </div>

        <button
          type="button"
          className="tm-merchant-profile-btn"
          onClick={() =>
            navigate("/profile")
          }
        >
          <User size={16} />
          Update Profile
        </button>

      </section>

      {/* ====================================================
          DISCLAIMER
      ==================================================== */}

      <div className="tm-merchant-disclaimer">

        <strong>
          🛡️ TimberMart
        </strong>

        <span>
          TimberMart is a platform to
          connect buyers, sellers,
          businesses and workers.
        </span>

        <div>
          <span>🤝 Direct Contact</span>
          <span>🌳 Wood Industry</span>
          <span>🔒 Secure Account</span>
        </div>

      </div>

    </DashboardLayout>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="tm-merchant-stat-card">

      <div className="tm-merchant-stat-icon">
        {icon}
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>
      </div>

    </div>
  );
}

/* ============================================================
   ACTION CARD
============================================================ */

function ActionCard({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      className="tm-merchant-action-card"
      onClick={onClick}
    >

      <div className="tm-merchant-action-icon">
        {icon}
      </div>

      <div>
        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>
      </div>

    </button>
  );
}

/* ============================================================
   TIMBER CARD
============================================================ */

function TimberCard({
  item,
  currentUserId,
  onDelete,
}) {
  const isMine =
    item.user_id ===
    currentUserId;

  return (
    <article className="tm-merchant-timber-card">

      <div className="tm-timber-image-placeholder">
        🌲
      </div>

      <div className="tm-timber-body">

        <div className="tm-timber-category">
          {item.product_type ||
            item.wood_type ||
            "Timber"}
        </div>

        <h3>
          {item.title}
        </h3>

        {item.wood_type && (
          <div className="tm-timber-line">
            🌳 {item.wood_type}
          </div>
        )}

        {item.quantity && (
          <div className="tm-timber-line">
            📦 {item.quantity}
          </div>
        )}

        {item.location && (
          <div className="tm-timber-line">
            <MapPin size={14} />
            {item.location}
          </div>
        )}

        {item.price && (
          <div className="tm-timber-price">
            {item.price}
          </div>
        )}

        {item.description && (
          <p>
            {item.description}
          </p>
        )}

        <div className="tm-timber-footer">

          <span>
            {isMine
              ? "Posted by you"
              : "TimberMart user"}
          </span>

          {isMine && (
            <button
              type="button"
              className="tm-delete-small"
              onClick={() =>
                onDelete(
                  item.id
                )
              }
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}

        </div>

      </div>

    </article>
  );
}

/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="tm-merchant-field">

      <label>
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  icon,
  title,
  text,
  buttonText,
  onClick,
}) {
  return (
    <div className="tm-merchant-empty">

      <div className="tm-empty-big-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

      {buttonText && (
        <button
          type="button"
          className="tm-merchant-green-btn"
          onClick={onClick}
        >
          <Plus size={16} />
          {buttonText}
        </button>
      )}

    </div>
  );
}
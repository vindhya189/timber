import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  ClipboardList,
  MapPin,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  X,
  RefreshCw,
  Package,
  Users,
  Eye,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  DashboardLayout,
  SectionTitle,
} from "./DashboardFrame";

import { supabase } from "../supabaseClient";

import "./SawmillDashboard.css";

/*
============================================================
 TIMBERMART
 SAWMILL / WOOD BUSINESS DASHBOARD
============================================================

Flow:

🏭 Dashboard
   ↓
📋 Requirement Wall
   ↓
👷 Post Job
   ↓
🔎 Find Workers
   ↓
🧾 My Jobs
   ↓
👤 Profile
   ↓
⚙️ Settings

IMPORTANT:

No fake user data is inserted.

All:
- listings
- requirements
- jobs
- profile information

come from Supabase / user account.

============================================================
*/

export default function SawmillDashboard() {
  const navigate = useNavigate();

  /* ========================================================
     USER / PROFILE
  ======================================================== */

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  /* ========================================================
     DATA
  ======================================================== */

  const [jobs, setJobs] = useState([]);
  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [workers, setWorkers] = useState([]);

  /* ========================================================
     UI
  ======================================================== */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [searchWorkers, setSearchWorkers] =
    useState("");

  const [searchJobs, setSearchJobs] =
    useState("");

  const [showJobForm, setShowJobForm] =
    useState(false);

  /* ========================================================
     JOB FORM
  ======================================================== */

  const [jobForm, setJobForm] = useState({
    title: "",
    category: "",
    job_type: "",
    experience: "",
    salary: "",
    location: "",
    positions: "",
    accommodation: false,
    food: false,
    description: "",
  });

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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

      /* ==================================================
         PROFILE
      ================================================== */

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
          "Sawmill profile error:",
          profileError
        );
      }

      setProfile(profileData);

      /* ==================================================
         JOBS
      ================================================== */

      await loadJobs();

      /* ==================================================
         LISTINGS
      ================================================== */

      await loadListings();

      /* ==================================================
         REQUIREMENTS
      ================================================== */

      await loadRequirements();

      /* ==================================================
         WORKERS
      ================================================== */

      await loadWorkers();

    } catch (err) {
      console.error(
        "Sawmill dashboard error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load Sawmill Dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ========================================================
     LOAD JOBS
  ======================================================== */

  async function loadJobs() {
    const {
      data,
      error: jobsError,
    } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (jobsError) {
      throw jobsError;
    }

    setJobs(data || []);
  }

  /* ========================================================
     LOAD LISTINGS
  ======================================================== */

  async function loadListings() {
    const {
      data,
      error: listingsError,
    } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (listingsError) {
      throw listingsError;
    }

    setListings(data || []);
  }

  /* ========================================================
     LOAD REQUIREMENTS
  ======================================================== */

  async function loadRequirements() {
    const {
      data,
      error: requirementsError,
    } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (requirementsError) {
      throw requirementsError;
    }

    setRequirements(data || []);
  }

  /* ========================================================
     LOAD WORKERS
  ======================================================== */

  async function loadWorkers() {
    const {
      data,
      error: workersError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "worker")
      .order("created_at", {
        ascending: false,
      });

    if (workersError) {
      throw workersError;
    }

    setWorkers(data || []);
  }

  /* ========================================================
     REFRESH
  ======================================================== */

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setError("");
      setMessage("");

      await Promise.all([
        loadJobs(),
        loadListings(),
        loadRequirements(),
        loadWorkers(),
      ]);

      setMessage(
        "Dashboard refreshed successfully."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to refresh dashboard."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* ========================================================
     JOB FORM CHANGE
  ======================================================== */

  function handleJobChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setJobForm((old) => ({
      ...old,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setError("");
    setMessage("");
  }

  /* ========================================================
     POST JOB
  ======================================================== */

  async function handlePostJob(event) {
    event.preventDefault();

    if (!user?.id) {
      setError(
        "Your login session was not found."
      );
      return;
    }

    if (!jobForm.title.trim()) {
      setError(
        "Please enter Job Title."
      );
      return;
    }

    if (!jobForm.category.trim()) {
      setError(
        "Please enter Job Category."
      );
      return;
    }

    if (!jobForm.location.trim()) {
      setError(
        "Please enter Job Location."
      );
      return;
    }

    if (!jobForm.description.trim()) {
      setError(
        "Please enter Job Description."
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
        .from("jobs")
        .insert({
          user_id: user.id,

          title:
            jobForm.title.trim(),

          category:
            jobForm.category.trim(),

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

          accommodation:
            jobForm.accommodation,

          food:
            jobForm.food,

          description:
            jobForm.description.trim(),
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setJobs((old) => [
        data,
        ...old,
      ]);

      setJobForm({
        title: "",
        category: "",
        job_type: "",
        experience: "",
        salary: "",
        location: "",
        positions: "",
        accommodation: false,
        food: false,
        description: "",
      });

      setShowJobForm(false);

      setMessage(
        "Job posted successfully."
      );

    } catch (err) {
      console.error(
        "Post job error:",
        err
      );

      setError(
        err?.message ||
          "Unable to post job."
      );
    }
  }

  /* ========================================================
     DELETE JOB
  ======================================================== */

  async function deleteJob(jobId) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this job?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId)
        .eq(
          "user_id",
          user?.id
        );

      if (deleteError) {
        throw deleteError;
      }

      setJobs((old) =>
        old.filter(
          (job) =>
            job.id !== jobId
        )
      );

      setMessage(
        "Job deleted successfully."
      );

    } catch (err) {
      setError(
        err?.message ||
          "Unable to delete job."
      );
    }
  }

  /* ========================================================
     FILTER WORKERS
  ======================================================== */

  const filteredWorkers =
    useMemo(() => {
      const search =
        searchWorkers
          .trim()
          .toLowerCase();

      if (!search) {
        return workers;
      }

      return workers.filter(
        (worker) => {
          const text = `
            ${worker.name || ""}
            ${worker.location || ""}
            ${worker.bio || ""}
            ${worker.role || ""}
          `.toLowerCase();

          return text.includes(
            search
          );
        }
      );
    }, [
      workers,
      searchWorkers,
    ]);

  /* ========================================================
     FILTER JOBS
  ======================================================== */

  const filteredJobs =
    useMemo(() => {
      const search =
        searchJobs
          .trim()
          .toLowerCase();

      if (!search) {
        return jobs;
      }

      return jobs.filter(
        (job) => {
          const text = `
            ${job.title || ""}
            ${job.category || ""}
            ${job.job_type || ""}
            ${job.location || ""}
            ${job.description || ""}
          `.toLowerCase();

          return text.includes(
            search
          );
        }
      );
    }, [
      jobs,
      searchJobs,
    ]);

  /* ========================================================
     MY JOBS
  ======================================================== */

  const myJobs =
    jobs.filter(
      (job) =>
        job.user_id ===
        user?.id
    );

  /* ========================================================
     MY REQUIREMENTS
  ======================================================== */

  const myRequirements =
    requirements.filter(
      (item) =>
        item.user_id ===
        user?.id
    );

  /* ========================================================
     MY LISTINGS
  ======================================================== */

  const myListings =
    listings.filter(
      (item) =>
        item.user_id ===
        user?.id
    );

  /* ========================================================
     DISPLAY NAME
  ======================================================== */

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Sawmill";

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="tm-sawmill-loading">

        <div className="tm-sawmill-spinner" />

        <h3>
          Loading Sawmill Dashboard...
        </h3>

        <p>
          Please wait.
        </p>

      </div>
    );
  }

  /* ========================================================
     MAIN UI
  ======================================================== */

  return (
    <DashboardLayout
      role="sawmill"
      title="Sawmill / Business Dashboard"
      description="Post jobs, find workers, manage timber and connect directly."
    >

      {/* ==================================================
          MESSAGE
      ================================================== */}

      {error && (
        <div className="tm-sawmill-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="tm-sawmill-message success">
          {message}
        </div>
      )}

      {/* ==================================================
          WELCOME
      ================================================== */}

      <section className="tm-sawmill-welcome">

        <div>

          <div className="tm-sawmill-eyebrow">
            🏭 SAWMILL / BUSINESS
          </div>

          <h2>
            Hello, {displayName}! 👋
          </h2>

          <p>
            Connect with skilled workers,
            manage your timber business and
            post opportunities on TimberMart.
          </p>

          {profile?.location && (
            <div className="tm-sawmill-location">
              <MapPin size={15} />
              {profile.location}
            </div>
          )}

        </div>

        <button
          type="button"
          className="tm-sawmill-refresh"
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

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="tm-sawmill-stats">

        <Stat
          icon="👷"
          label="Active Jobs"
          value={myJobs.length}
        />

        <Stat
          icon="📋"
          label="Requirements"
          value={
            myRequirements.length
          }
        />

        <Stat
          icon="👥"
          label="Workers"
          value={workers.length}
        />

        <Stat
          icon="🪵"
          label="My Listings"
          value={myListings.length}
        />

      </div>

      {/* ==================================================
          MAIN ACTIONS
      ================================================== */}

      <section className="tm-sawmill-section">

        <SectionTitle
          title="Sawmill Tools"
          description="Everything you need to manage your business."
        />

        <div className="tm-sawmill-action-grid">

          <Action
            icon={
              <BriefcaseBusiness size={25} />
            }
            title="Post a Job"
            text="Hire workers for your sawmill."
            onClick={() =>
              setShowJobForm(true)
            }
          />

          <Action
            icon={
              <Users size={25} />
            }
            title="Find Workers"
            text="Search available workers."
            onClick={() =>
              document
                .getElementById(
                  "sawmill-workers"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          />

          <Action
            icon={
              <ClipboardList size={25} />
            }
            title="Requirement Wall"
            text="View and post requirements."
            onClick={() =>
              navigate(
                "/requirements"
              )
            }
          />

          <Action
            icon={
              <Package size={25} />
            }
            title="Timber Listings"
            text="Browse timber and wood listings."
            onClick={() =>
              document
                .getElementById(
                  "sawmill-timber"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          />

          <Action
            icon={
              <User size={25} />
            }
            title="My Profile"
            text="Update business profile."
            onClick={() =>
              navigate("/profile")
            }
          />

          <Action
            icon={<Settings size={25} />}
            title="Settings"
            text="Manage your account."
            onClick={() =>
              navigate("/settings")
            }
          />

        </div>

      </section>

      {/* ==================================================
          POST JOB
      ================================================== */}

      <section className="tm-sawmill-section">

        <div className="tm-sawmill-job-banner">

          <div>

            <span>
              👷 HIRE WORKERS
            </span>

            <h2>
              Post a Job
            </h2>

            <p>
              Find experienced workers for
              your sawmill / timber business.
            </p>

          </div>

          <button
            type="button"
            className="tm-sawmill-green-btn"
            onClick={() =>
              setShowJobForm(true)
            }
          >
            <Plus size={17} />
            Post Job
          </button>

        </div>

        {showJobForm && (
          <div className="tm-sawmill-form-card">

            <div className="tm-sawmill-form-head">

              <div>

                <h3>
                  Post a Job
                </h3>

                <p>
                  Add the job details workers
                  need to see.
                </p>

              </div>

              <button
                type="button"
                className="tm-sawmill-close"
                onClick={() =>
                  setShowJobForm(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handlePostJob
              }
            >

              <div className="tm-sawmill-form-grid">

                <Field
                  label="Job Title *"
                  name="title"
                  value={
                    jobForm.title
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Example: Sawmill Machine Operator"
                />

                <Field
                  label="Job Category *"
                  name="category"
                  value={
                    jobForm.category
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Example: Machine Operator"
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
                  label="Experience Required"
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
                  label="Monthly Salary"
                  name="salary"
                  value={
                    jobForm.salary
                  }
                  onChange={
                    handleJobChange
                  }
                  placeholder="Example: ₹18,000 - ₹25,000"
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
                  placeholder="City / District / State"
                />

                <Field
                  label="No. of Positions"
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

              <div className="tm-sawmill-check-row">

                <label>
                  <input
                    type="checkbox"
                    name="accommodation"
                    checked={
                      jobForm.accommodation
                    }
                    onChange={
                      handleJobChange
                    }
                  />

                  Accommodation Available
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="food"
                    checked={
                      jobForm.food
                    }
                    onChange={
                      handleJobChange
                    }
                  />

                  Food Available
                </label>

              </div>

              <div className="tm-sawmill-field">

                <label>
                  Job Description *
                </label>

                <textarea
                  name="description"
                  value={
                    jobForm.description
                  }
                  onChange={
                    handleJobChange
                  }
                  rows="5"
                  placeholder="Describe the work, responsibilities and requirements..."
                />

              </div>

              <div className="tm-sawmill-form-actions">

                <button
                  type="button"
                  className="tm-sawmill-outline-btn"
                  onClick={() =>
                    setShowJobForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tm-sawmill-green-btn"
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

      </section>

      {/* ==================================================
          MY JOBS
      ================================================== */}

      <section className="tm-sawmill-section">

        <div className="tm-sawmill-section-head">

          <SectionTitle
            title="My Jobs"
            description="Jobs posted from your Sawmill account."
          />

        </div>

        {myJobs.length === 0 ? (

          <Empty
            icon="👷"
            title="No jobs posted yet"
            text="Post your first worker requirement."
            button="Post a Job"
            onClick={() =>
              setShowJobForm(true)
            }
          />

        ) : (

          <div className="tm-sawmill-jobs-grid">

            {myJobs.map(
              (job) => (

                <JobCard
                  key={job.id}
                  job={job}
                  own
                  onDelete={
                    deleteJob
                  }
                />

              )
            )}

          </div>

        )}

      </section>

      {/* ==================================================
          JOB WALL
      ================================================== */}

      <section className="tm-sawmill-section">

        <SectionTitle
          title="Job Wall"
          description="See jobs posted across TimberMart."
        />

        <div className="tm-sawmill-search">

          <Search size={17} />

          <input
            value={searchJobs}
            onChange={(e) =>
              setSearchJobs(
                e.target.value
              )
            }
            placeholder="Search jobs, categories, locations..."
          />

        </div>

        {filteredJobs.length === 0 ? (

          <Empty
            icon="🔎"
            title="No jobs found"
            text="There are no matching jobs yet."
          />

        ) : (

          <div className="tm-sawmill-jobs-grid">

            {filteredJobs
              .slice(0, 8)
              .map(
                (job) => (

                  <JobCard
                    key={job.id}
                    job={job}
                    own={
                      job.user_id ===
                      user?.id
                    }
                    onDelete={
                      deleteJob
                    }
                  />

                )
              )}

          </div>

        )}

      </section>

      {/* ==================================================
          FIND WORKERS
      ================================================== */}

      <section
        id="sawmill-workers"
        className="tm-sawmill-section"
      >

        <SectionTitle
          title="Nearby / Available Workers"
          description="Workers who created a TimberMart worker profile."
        />

        <div className="tm-sawmill-search">

          <Search size={17} />

          <input
            value={
              searchWorkers
            }
            onChange={(e) =>
              setSearchWorkers(
                e.target.value
              )
            }
            placeholder="Search workers, skills, location..."
          />

        </div>

        {filteredWorkers.length === 0 ? (

          <Empty
            icon="👷"
            title="No workers found"
            text="Workers will appear here after creating their profiles."
          />

        ) : (

          <div className="tm-sawmill-workers-grid">

            {filteredWorkers
              .slice(0, 12)
              .map(
                (worker) => (

                  <WorkerCard
                    key={
                      worker.id
                    }
                    worker={
                      worker
                    }
                  />

                )
              )}

          </div>

        )}

      </section>

      {/* ==================================================
          REQUIREMENT WALL
      ================================================== */}

      <section className="tm-sawmill-section">

        <div className="tm-sawmill-requirement-banner">

          <div>

            <span>
              📋 REQUIREMENT WALL
            </span>

            <h2>
              Requirements
            </h2>

            <p>
              See what buyers, merchants and
              businesses are looking for.
            </p>

          </div>

          <button
            type="button"
            className="tm-sawmill-green-btn"
            onClick={() =>
              navigate(
                "/requirements"
              )
            }
          >
            <ClipboardList
              size={17}
            />

            Open Requirement Wall
          </button>

        </div>

        {requirements.length === 0 ? (

          <Empty
            icon="📋"
            title="No requirements yet"
            text="User-created requirements will appear here."
            button="Open Requirement Wall"
            onClick={() =>
              navigate(
                "/requirements"
              )
            }
          />

        ) : (

          <div className="tm-sawmill-requirements">

            {requirements
              .slice(0, 6)
              .map(
                (item) => (

                  <RequirementCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                  />

                )
              )}

          </div>

        )}

      </section>

      {/* ==================================================
          TIMBER
      ================================================== */}

      <section
        id="sawmill-timber"
        className="tm-sawmill-section"
      >

        <SectionTitle
          title="Timber & Wood Listings"
          description="Browse timber and wood products available on TimberMart."
        />

        {listings.length === 0 ? (

          <Empty
            icon="🪵"
            title="No timber listings yet"
            text="Timber listings will appear when users publish them."
          />

        ) : (

          <div className="tm-sawmill-timber-grid">

            {listings
              .slice(0, 8)
              .map(
                (item) => (

                  <TimberCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                  />

                )
              )}

          </div>

        )}

      </section>

      {/* ==================================================
          PROFILE
      ================================================== */}

      <section className="tm-sawmill-profile">

        <div className="tm-sawmill-profile-photo">

          {profile?.photo_url ? (

            <img
              src={
                profile.photo_url
              }
              alt="Profile"
            />

          ) : (

            <span>
              🏭
            </span>

          )}

        </div>

        <div className="tm-sawmill-profile-info">

          <span>
            SAWMILL / BUSINESS PROFILE
          </span>

          <h3>
            {displayName}
          </h3>

          <p>
            {profile?.location ||
              "Add your business location from My Profile."}
          </p>

        </div>

        <button
          type="button"
          className="tm-sawmill-outline-btn"
          onClick={() =>
            navigate("/profile")
          }
        >
          <User size={16} />
          Update Profile
        </button>

      </section>

      {/* ==================================================
          DISCLAIMER
      ================================================== */}

      <div className="tm-sawmill-disclaimer">

        <div className="tm-disclaimer-icon">
          🛡️
        </div>

        <div>

          <strong>
            TimberMart connects users directly.
          </strong>

          <p>
            We connect businesses, workers,
            buyers and sellers. Employment,
            payments and other arrangements
            are directly between the parties.
          </p>

        </div>

        <div className="tm-disclaimer-points">

          <span>
            ✓ No Commission
          </span>

          <span>
            ✓ Direct Contact
          </span>

          <span>
            ✓ Nearby Connect
          </span>

          <span>
            ✓ Secure Account
          </span>

        </div>

      </div>

    </DashboardLayout>
  );
}

/* ============================================================
   STAT
============================================================ */

function Stat({
  icon,
  label,
  value,
}) {
  return (
    <div className="tm-sawmill-stat">

      <div className="tm-sawmill-stat-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

/* ============================================================
   ACTION
============================================================ */

function Action({
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <button
      type="button"
      className="tm-sawmill-action"
      onClick={onClick}
    >

      <div className="tm-sawmill-action-icon">
        {icon}
      </div>

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>

      </div>

    </button>
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
    <div className="tm-sawmill-field">

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
   JOB CARD
============================================================ */

function JobCard({
  job,
  own,
  onDelete,
}) {
  return (
    <article className="tm-sawmill-job-card">

      <div className="tm-job-card-icon">
        👷
      </div>

      <div className="tm-job-card-content">

        <div className="tm-job-card-top">

          <div>

            <span className="tm-job-category">
              {job.category ||
                "Job"}
            </span>

            <h3>
              {job.title}
            </h3>

          </div>

          {own && (
            <button
              type="button"
              className="tm-icon-delete"
              onClick={() =>
                onDelete(
                  job.id
                )
              }
              title="Delete job"
            >
              <Trash2 size={15} />
            </button>
          )}

        </div>

        <div className="tm-job-meta">

          {job.location && (
            <span>
              <MapPin size={13} />
              {job.location}
            </span>
          )}

          {job.job_type && (
            <span>
              💼 {job.job_type}
            </span>
          )}

          {job.experience && (
            <span>
              🎯 {job.experience}
            </span>
          )}

          {job.salary && (
            <span>
              💰 {job.salary}
            </span>
          )}

          {job.positions && (
            <span>
              👥 {job.positions}
            </span>
          )}

        </div>

        <div className="tm-job-benefits">

          {job.accommodation && (
            <span>
              🏠 Accommodation
            </span>
          )}

          {job.food && (
            <span>
              🍱 Food
            </span>
          )}

        </div>

        {job.description && (
          <p>
            {job.description}
          </p>
        )}

        <div className="tm-job-card-footer">

          <span>
            {own
              ? "Posted by you"
              : "TimberMart Job"}
          </span>

          <button
            type="button"
            className="tm-view-btn"
          >
            <Eye size={14} />
            View Job
          </button>

        </div>

      </div>

    </article>
  );
}

/* ============================================================
   WORKER CARD
============================================================ */

function WorkerCard({
  worker,
}) {
  return (
    <article className="tm-sawmill-worker-card">

      <div className="tm-worker-avatar">

        {worker.photo_url ? (

          <img
            src={
              worker.photo_url
            }
            alt={
              worker.name ||
              "Worker"
            }
          />

        ) : (

          <span>
            👷
          </span>

        )}

      </div>

      <div className="tm-worker-info">

        <h3>
          {worker.name ||
            "Worker"}
        </h3>

        <span className="tm-worker-role">
          Worker / Job Seeker
        </span>

        {worker.location && (
          <div>
            <MapPin size={13} />
            {worker.location}
          </div>
        )}

        {worker.bio && (
          <p>
            {worker.bio}
          </p>
        )}

        <button
          type="button"
          className="tm-worker-profile-btn"
          onClick={() =>
            window.alert(
              "Worker profile details can be connected to a dedicated worker profile page."
            )
          }
        >
          <User size={14} />
          View Profile
        </button>

      </div>

    </article>
  );
}

/* ============================================================
   REQUIREMENT CARD
============================================================ */

function RequirementCard({
  item,
}) {
  return (
    <article className="tm-sawmill-requirement">

      <div className="tm-requirement-icon">
        📋
      </div>

      <div>

        <h3>
          {item.title}
        </h3>

        <div className="tm-requirement-meta">

          {item.category && (
            <span>
              {item.category}
            </span>
          )}

          {item.location && (
            <span>
              <MapPin size={12} />
              {item.location}
            </span>
          )}

          {item.quantity && (
            <span>
              📦 {item.quantity}
            </span>
          )}

          {item.budget && (
            <span>
              💰 {item.budget}
            </span>
          )}

        </div>

        {item.description && (
          <p>
            {item.description}
          </p>
        )}

      </div>

    </article>
  );
}

/* ============================================================
   TIMBER CARD
============================================================ */

function TimberCard({
  item,
}) {
  return (
    <article className="tm-sawmill-timber-card">

      <div className="tm-timber-placeholder">
        🌲
      </div>

      <div className="tm-timber-content">

        <span>
          {item.product_type ||
            item.wood_type ||
            "Timber"}
        </span>

        <h3>
          {item.title}
        </h3>

        {item.wood_type && (
          <p>
            🌳 {item.wood_type}
          </p>
        )}

        {item.quantity && (
          <p>
            📦 {item.quantity}
          </p>
        )}

        {item.location && (
          <p>
            <MapPin size={13} />
            {item.location}
          </p>
        )}

        {item.price && (
          <strong>
            {item.price}
          </strong>
        )}

      </div>

    </article>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function Empty({
  icon,
  title,
  text,
  button,
  onClick,
}) {
  return (
    <div className="tm-sawmill-empty">

      <div>
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

      {button && (
        <button
          type="button"
          className="tm-sawmill-green-btn"
          onClick={onClick}
        >
          <Plus size={15} />
          {button}
        </button>
      )}

    </div>
  );
}
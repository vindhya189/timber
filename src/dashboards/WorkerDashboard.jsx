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

export default function WorkerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [requirements, setRequirements] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    workType: "",
    experience: "",
    location: "",
    expectedSalary: "",
    availability: "",
    skills: "",
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

      const myProfiles = Array.isArray(savedListings)
        ? savedListings.filter(
            (item) =>
              item.role === "worker" &&
              item.userId === currentUser.id
          )
        : [];

      setProfiles(myProfiles);

      setRequirements(
        Array.isArray(savedRequirements)
          ? savedRequirements
          : []
      );
    } catch {
      setProfiles([]);
      setRequirements([]);
    }
  }, [navigate]);

  const jobRequirements = useMemo(() => {
    if (!user) return [];

    const keyword = search.trim().toLowerCase();

    return requirements
      .filter((item) => item.userId !== user.id)
      .filter((item) => {
        const category = String(
          item.category || ""
        ).toLowerCase();

        const label = String(
          item.categoryLabel || ""
        ).toLowerCase();

        const isJob =
          category === "jobs" ||
          label.includes("job") ||
          label.includes("work");

        if (!isJob) return false;

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
      .slice(0, 10);
  }, [requirements, user, search]);

  const allJobRequirements = useMemo(() => {
    if (!user) return [];

    return requirements.filter((item) => {
      const category = String(
        item.category || ""
      ).toLowerCase();

      const label = String(
        item.categoryLabel || ""
      ).toLowerCase();

      return (
        item.userId !== user.id &&
        (category === "jobs" ||
          label.includes("job") ||
          label.includes("work"))
      );
    });
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

  function saveWorkerProfile(event) {
    event.preventDefault();

    if (!user) return;

    if (!form.title.trim()) {
      showMessage("Profile title enter cheyyandi.");
      return;
    }

    if (!form.workType.trim()) {
      showMessage("Work type enter cheyyandi.");
      return;
    }

    if (!form.location.trim()) {
      showMessage("Location enter cheyyandi.");
      return;
    }

    let allListings = [];

    try {
      const saved = JSON.parse(
        localStorage.getItem(LISTINGS_KEY) || "[]"
      );

      allListings = Array.isArray(saved) ? saved : [];
    } catch {
      allListings = [];
    }

    const newProfile = {
      id: createId(),

      title: form.title.trim(),
      workType: form.workType.trim(),
      experience: form.experience.trim(),
      location: form.location.trim(),
      expectedSalary: form.expectedSalary.trim(),
      availability: form.availability.trim(),
      skills: form.skills.trim(),
      description: form.description.trim(),

      role: "worker",

      userId: user.id,
      userName: user.name || "Worker",

      createdAt: new Date().toISOString(),
    };

    const updatedListings = [
      newProfile,
      ...allListings,
    ];

    localStorage.setItem(
      LISTINGS_KEY,
      JSON.stringify(updatedListings)
    );

    setProfiles((previous) => [
      newProfile,
      ...previous,
    ]);

    setForm({
      title: "",
      workType: "",
      experience: "",
      location: "",
      expectedSalary: "",
      availability: "",
      skills: "",
      description: "",
    });

    setShowForm(false);

    showMessage("Your worker profile was added successfully.");
  }

  function deleteProfile(id) {
    if (!user) return;

    try {
      const saved = JSON.parse(
        localStorage.getItem(LISTINGS_KEY) || "[]"
      );

      const allListings = Array.isArray(saved)
        ? saved
        : [];

      const updatedListings = allListings.filter(
        (item) =>
          !(
            item.id === id &&
            item.userId === user.id &&
            item.role === "worker"
          )
      );

      localStorage.setItem(
        LISTINGS_KEY,
        JSON.stringify(updatedListings)
      );

      setProfiles((previous) =>
        previous.filter((item) => item.id !== id)
      );

      showMessage("Worker profile deleted.");
    } catch {
      showMessage("Unable to delete profile.");
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
      role="worker"
      title="Worker Dashboard"
      description="Create your work profile and find suitable job opportunities."
    >
      <div className="tm-dashboard">

        {/* =========================
            HEADER
        ========================== */}

        <div className="tm-dashboard-header">

          <div>
            <div className="tm-eyebrow">
              👷 Worker / Job Seeker
            </div>

            <h1 className="tm-dashboard-title">
              Welcome, {user?.name || "Worker"}
            </h1>

            <p className="tm-dashboard-subtitle">
              Showcase your skills and find jobs posted by businesses and customers.
            </p>
          </div>

          <button
            type="button"
            className="tm-btn tm-btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Create Work Profile
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
              <User size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                My Profiles
              </span>

              <strong className="tm-stat-value">
                {profiles.length}
              </strong>
            </div>

          </div>

          <div className="tm-stat-card">

            <div className="tm-stat-icon">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                Job Opportunities
              </span>

              <strong className="tm-stat-value">
                {allJobRequirements.length}
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
              <MapPin size={22} />
            </div>

            <div>
              <span className="tm-stat-label">
                Location
              </span>

              <strong className="tm-stat-value">
                {user?.location ? "Added" : "Add"}
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
              MY WORK PROFILES
          ========================== */}

          <section className="tm-panel">

            <SectionTitle
              title="My Work Profiles"
              description="Your skills and work profiles."
              action={
                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={16} />
                  Add Profile
                </button>
              }
            />

            {profiles.length === 0 ? (

              <div className="tm-empty">

                <div className="tm-empty-icon">
                  👷
                </div>

                <h3>
                  No work profile created
                </h3>

                <p>
                  Create your work profile so businesses and customers can discover your skills.
                </p>

                <button
                  type="button"
                  className="tm-btn tm-btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={17} />
                  Create Work Profile
                </button>

              </div>

            ) : (

              <div className="tm-list">

                {profiles.map((profile) => (

                  <div
                    className="tm-list-item"
                    key={profile.id}
                  >

                    <div className="tm-list-item-main">

                      <div className="tm-list-item-icon">
                        👷
                      </div>

                      <div>

                        <h3>
                          {profile.title}
                        </h3>

                        <div className="tm-list-meta">

                          <span>
                            {profile.workType}
                          </span>

                          {profile.experience && (
                            <span>
                              Experience: {profile.experience}
                            </span>
                          )}

                          <span>
                            <MapPin size={14} />
                            {profile.location}
                          </span>

                        </div>

                        {profile.skills && (
                          <div className="tm-requirement-extra">
                            <span>
                              Skills: {profile.skills}
                            </span>
                          </div>
                        )}

                        {profile.availability && (
                          <div className="tm-requirement-extra">
                            <span>
                              Available: {profile.availability}
                            </span>
                          </div>
                        )}

                        {profile.expectedSalary && (
                          <div className="tm-price">
                            Expected: ₹{profile.expectedSalary}
                          </div>
                        )}

                        {profile.description && (
                          <p className="tm-list-description">
                            {profile.description}
                          </p>
                        )}

                      </div>

                    </div>

                    <button
                      type="button"
                      className="tm-icon-btn tm-danger-btn"
                      title="Delete profile"
                      onClick={() =>
                        deleteProfile(profile.id)
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
              JOB OPPORTUNITIES
          ========================== */}

          <section className="tm-panel">

            <SectionTitle
              title="Job Opportunities"
              description="Jobs and work requirements posted by users."
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
                placeholder="Search jobs..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            {jobRequirements.length === 0 ? (

              <div className="tm-empty tm-empty-small">

                <div className="tm-empty-icon">
                  🔎
                </div>

                <h3>
                  No job opportunities found
                </h3>

                <p>
                  New job requirements posted by users will appear here.
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

                {jobRequirements.map((job) => (

                  <div
                    className="tm-list-item"
                    key={job.id}
                  >

                    <div className="tm-list-item-main">

                      <div className="tm-list-item-icon">
                        💼
                      </div>

                      <div>

                        <h3>
                          {job.title}
                        </h3>

                        <div className="tm-list-meta">

                          <span className="tm-tag">
                            {job.categoryLabel || "Job"}
                          </span>

                          {job.location && (
                            <span>
                              <MapPin size={14} />
                              {job.location}
                            </span>
                          )}

                        </div>

                        {job.description && (
                          <p className="tm-list-description">
                            {job.description}
                          </p>
                        )}

                        <div className="tm-requirement-extra">

                          {job.quantity && (
                            <span>
                              Workers: {job.quantity}
                            </span>
                          )}

                          {job.budget && (
                            <span>
                              Budget: {job.budget}
                            </span>
                          )}

                        </div>

                        <small>
                          Posted by {job.userName || "User"}
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
            WORKER TOOLS
        ========================== */}

        <section className="tm-panel">

          <SectionTitle
            title="Worker Tools"
            description="Everything you need to manage your work profile."
          />

          <div className="tm-feature-grid">

            <Feature
              icon="👷"
              title="Work Profile"
              description="Create and manage your skills, experience and availability."
              onClick={() => setShowForm(true)}
            />

            <Feature
              icon="💼"
              title="Find Jobs"
              description="Search the Requirement Wall for jobs and work opportunities."
              onClick={openRequirementWall}
            />

            <Feature
              icon="🛠️"
              title="Skills"
              description="Show customers and employers what kind of work you can do."
              onClick={() => setShowForm(true)}
            />

            <Feature
              icon="👤"
              title="My Profile"
              description="Update your account photo, phone, location and personal details."
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
                Add your location
              </h3>

              <p>
                Add your current location so nearby employers and customers can find you.
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
          CREATE WORK PROFILE MODAL
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
                  👷 Worker
                </div>

                <h2>
                  Create Work Profile
                </h2>

                <p>
                  Enter your actual skills and work information.
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
              onSubmit={saveWorkerProfile}
            >

              {/* TITLE */}

              <div className="tm-form-group">

                <label>
                  Profile Title *
                </label>

                <input
                  className="tm-input"
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="Example: Experienced wood worker"
                />

              </div>

              {/* WORK TYPE + EXPERIENCE */}

              <div className="tm-form-row">

                <div className="tm-form-group">

                  <label>
                    Work Type *
                  </label>

                  <input
                    className="tm-input"
                    name="workType"
                    value={form.workType}
                    onChange={updateField}
                    placeholder="Example: Furniture work"
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
                    placeholder="Example: 3 years"
                  />

                </div>

              </div>

              {/* LOCATION + SALARY */}

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
                    placeholder="Enter your location"
                  />

                </div>

                <div className="tm-form-group">

                  <label>
                    Expected Salary
                  </label>

                  <input
                    className="tm-input"
                    name="expectedSalary"
                    value={form.expectedSalary}
                    onChange={updateField}
                    placeholder="Enter expected salary"
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
                  placeholder="Example: Full time / Part time"
                />

              </div>

              {/* SKILLS */}

              <div className="tm-form-group">

                <label>
                  Skills
                </label>

                <input
                  className="tm-input"
                  name="skills"
                  value={form.skills}
                  onChange={updateField}
                  placeholder="Example: Cutting, polishing, furniture assembly"
                />

              </div>

              {/* DESCRIPTION */}

              <div className="tm-form-group">

                <label>
                  About Your Work
                </label>

                <textarea
                  className="tm-textarea"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Describe your experience, work quality and the type of work you are looking for..."
                  rows="5"
                />

              </div>

              {/* BUTTONS */}

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
                  Create Profile
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}
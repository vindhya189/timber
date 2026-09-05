import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Eye,
  Home,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./RequirementWall.css";
import TreeLoader from "../components/TreeLoader";


/* Get real device coordinates for 30 km nearby matching. */
function readBrowserCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
}

const categories = [
  "Timber",
  "Logs",
  "Wood",
  "Furniture",
  "Construction",
  "Sawmill",
  "Carpentry",
  "Other",
];

export default function RequirementWall() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [requirements, setRequirements] = useState([]);
  const [search, setSearch] = useState("");

  const [showPost, setShowPost] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    quantity: "",
    budget: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.user) {
        navigate("/login", { replace: true });
        return;
      }

      setSession(currentSession);

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .maybeSingle();

      setProfile(currentProfile);

      await loadRequirements();
    } catch (error) {
      console.error("Requirement Wall error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRequirements() {
    const { data, error } = await supabase
      .from("requirements")
      .select(`
        *,
        profiles (
          id,
          name,
          role,
          phone,
          location,
          bio,
          photo_url
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Requirement load error:", error);
      return;
    }

    setRequirements(data || []);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function createRequirement(event) {
    event.preventDefault();

    if (!session?.user?.id) return;

    if (!form.title.trim()) {
      alert("Please enter requirement title.");
      return;
    }

    if (!form.category.trim()) {
      alert("Please select a category.");
      return;
    }

    if (!form.location.trim()) {
      alert("Please enter location.");
      return;
    }

    setSaving(true);

    try {
      // Capture the requirement owner's real location.
      // If GPS is denied, the SQL trigger can fall back to
      // coordinates already saved on the user's profile.
      const coordinates = await readBrowserCoordinates();

      if (coordinates) {
        const { error: profileLocationError } = await supabase
          .from("profiles")
          .update({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          })
          .eq("id", session.user.id);

        if (profileLocationError) {
          console.warn(
            "Profile location update skipped:",
            profileLocationError
          );
        }
      }

      const { error } = await supabase.from("requirements").insert({
        user_id: session.user.id,
        title: form.title.trim(),
        category: form.category.trim().toLowerCase(),
        category_label: form.category.trim(),
        location: form.location.trim(),
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        quantity: form.quantity.trim(),
        budget: form.budget.trim(),
        description: form.description.trim(),
      });

      if (error) throw error;

      setForm({
        title: "",
        category: "",
        quantity: "",
        budget: "",
        location: "",
        description: "",
      });

      setShowPost(false);

      await loadRequirements();

      alert("✅ Requirement posted successfully!");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to post requirement.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRequirement(requirement) {
    if (requirement.user_id !== session?.user?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this requirement?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("requirements")
      .delete()
      .eq("id", requirement.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setRequirements((old) =>
      old.filter((item) => item.id !== requirement.id)
    );

    setShowDetails(false);
    setSelectedRequirement(null);
  }

  function openRequirement(requirement) {
    setSelectedRequirement(requirement);
    setShowDetails(true);
  }

  async function openProfile(userId) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setSelectedProfile(data);
      setShowProfile(true);
    }
  }

  function callUser(phone) {
    if (!phone) {
      alert("Phone number is not available.");
      return;
    }

    window.location.href = `tel:${phone}`;
  }

  function whatsappUser(phone) {
    if (!phone) {
      alert("WhatsApp number is not available.");
      return;
    }

    const clean = phone.replace(/\D/g, "");

    window.open(
      `https://wa.me/${clean}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function chatUser(userId) {
    if (!userId || userId === session?.user?.id) {
      return;
    }

    localStorage.setItem(
      "timbermart_chat_user",
      userId
    );

    alert(
      "Chat is connected. Open the chat feature from your dashboard."
    );
  }

  async function logout() {
    await supabase.auth.signOut();

    localStorage.removeItem("timbermart_selected_role");
    localStorage.removeItem("timbermart_chat_user");

    navigate("/login", {
      replace: true,
    });
  }

  const filteredRequirements = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return requirements;

    return requirements.filter((item) =>
      [
        item.title,
        item.category,
        item.category_label,
        item.quantity,
        item.location,
        item.description,
        item.profiles?.name,
        item.profiles?.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [requirements, search]);

  if (loading) {
  return (
    <TreeLoader text="Growing your requirements..." />
  );
}

  return (
    <div className="rw-app">

      {/* HEADER */}
      <header className="rw-header">

        <button
          className="rw-mobile-menu"
          onClick={() => setMobileMenu((old) => !old)}
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>

        <button
          className="rw-brand"
          onClick={() => navigate(-1)}
        >
          <span className="rw-brand-icon">🌳</span>
          <span>TimberMart</span>
        </button>

        <div className="rw-header-right">
          <button className="rw-icon-button">
            <Bell size={19} />
          </button>

          <button
            className="rw-profile-button"
            onClick={() => openProfile(session.user.id)}
          >
            <span className="rw-small-avatar">
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt=""
                />
              ) : (
                <User size={18} />
              )}
            </span>

            <span>
              {profile?.name || "User"}
            </span>
          </button>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside
        className={`rw-sidebar ${
          mobileMenu ? "rw-sidebar-open" : ""
        }`}
      >
        <div className="rw-sidebar-brand">
          <div className="rw-sidebar-logo">🌳</div>

          <div>
            <strong>TimberMart</strong>
            <span>
              {profile?.role || "Marketplace"}
            </span>
          </div>
        </div>

        <div className="rw-sidebar-user">
          <div className="rw-sidebar-avatar">
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt=""
              />
            ) : (
              <User size={22} />
            )}
          </div>

          <div>
            <strong>
              {profile?.name || "User"}
            </strong>

            <span>
              {profile?.location ||
                "Location not added"}
            </span>
          </div>
        </div>

        <nav className="rw-nav">

          <button
            onClick={() => navigate(-1)}
          >
            <Home size={19} />
            Dashboard
          </button>

          <button className="active">
            <Users size={19} />
            Requirement Wall
          </button>

          <button
            onClick={() =>
              openProfile(session.user.id)
            }
          >
            <User size={19} />
            My Profile
          </button>

          <button
            onClick={() =>
              navigate("/settings")
            }
          >
            <Settings size={19} />
            Settings
          </button>

        </nav>

        <div className="rw-sidebar-bottom">
          <button onClick={logout}>
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {mobileMenu && (
        <div
          className="rw-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* MAIN */}
      <main className="rw-main">

        <div className="rw-container">

          {/* PAGE HERO */}
          <section className="rw-hero">

            <div>
              <div className="rw-kicker">
                TIMBERMART MARKETPLACE
              </div>

              <h1>Requirement Wall</h1>

              <p>
                Find timber requirements posted by
                buyers, merchants, sawmills and other
                TimberMart users.
              </p>

              <div className="rw-hero-actions">
                <button
                  className="rw-primary"
                  onClick={() =>
                    setShowPost(true)
                  }
                >
                  <Plus size={18} />
                  Post Requirement
                </button>

                <button
                  className="rw-secondary"
                  onClick={loadRequirements}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rw-hero-art">
              📋
            </div>

          </section>

          {/* SEARCH */}
          <div className="rw-search">
            <Search size={19} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search requirements, timber, location..."
            />
          </div>

          {/* HEADING */}
          <div className="rw-section-heading">
            <div>
              <h2>Latest Requirements</h2>
              <p>
                {filteredRequirements.length} requirement
                {filteredRequirements.length !== 1
                  ? "s"
                  : ""}{" "}
                available
              </p>
            </div>

            <button
              className="rw-add-button"
              onClick={() =>
                setShowPost(true)
              }
            >
              <Plus size={17} />
              Post Requirement
            </button>
          </div>

          {/* CARDS */}
          {filteredRequirements.length === 0 ? (
            <div className="rw-empty">

              <div className="rw-empty-icon">
                📋
              </div>

              <h3>
                No requirements posted yet
              </h3>

              <p>
                Be the first person to post a timber
                requirement on TimberMart.
              </p>

              <button
                className="rw-primary"
                onClick={() =>
                  setShowPost(true)
                }
              >
                <Plus size={18} />
                Post Your Requirement
              </button>

            </div>
          ) : (
            <div className="rw-grid">

              {filteredRequirements.map(
                (requirement) => {
                  const person =
                    requirement.profiles;

                  const isMine =
                    requirement.user_id ===
                    session.user.id;

                  return (
                    <article
                      className="rw-card"
                      key={requirement.id}
                    >

                      <div className="rw-card-top">

                        <div className="rw-person">

                          <div className="rw-avatar">
                            {person?.photo_url ? (
                              <img
                                src={
                                  person.photo_url
                                }
                                alt=""
                              />
                            ) : (
                              <User size={19} />
                            )}
                          </div>

                          <div>
                            <strong>
                              {person?.name ||
                                "TimberMart User"}
                            </strong>

                            <span>
                              {person?.role ||
                                "User"}
                            </span>
                          </div>

                        </div>

                        {isMine && (
                          <span className="rw-my-badge">
                            My Post
                          </span>
                        )}

                      </div>

                      <div className="rw-category">
                        {requirement.category_label ||
                          requirement.category ||
                          "Requirement"}
                      </div>

                      <h3>
                        {requirement.title}
                      </h3>

                      <p className="rw-description">
                        {requirement.description ||
                          "No description added."}
                      </p>

                      <div className="rw-details">

                        <div>
                          <MapPin size={15} />
                          <span>
                            {requirement.location ||
                              "Location not added"}
                          </span>
                        </div>

                        {requirement.quantity && (
                          <div>
                            <span>
                              Quantity:
                            </span>
                            <strong>
                              {requirement.quantity}
                            </strong>
                          </div>
                        )}

                        {requirement.budget && (
                          <div>
                            <span>
                              Budget:
                            </span>
                            <strong>
                              ₹{requirement.budget}
                            </strong>
                          </div>
                        )}

                      </div>

                      <div className="rw-card-footer">

                        <button
                          onClick={() =>
                            openRequirement(
                              requirement
                            )
                          }
                        >
                          <Eye size={17} />
                          View
                        </button>

                        {isMine && (
                          <button
                            className="rw-delete"
                            onClick={() =>
                              deleteRequirement(
                                requirement
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

          <div className="rw-disclaimer">
            <span>ℹ️</span>
            <p>
              TimberMart only connects buyers and
              sellers. Payments, transactions,
              delivery and commission are handled
              directly between users.
            </p>
          </div>

        </div>
      </main>

      {/* POST REQUIREMENT MODAL */}
      {showPost && (
        <div
          className="rw-modal-overlay"
          onMouseDown={() =>
            !saving && setShowPost(false)
          }
        >
          <div
            className="rw-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="rw-modal-header">

              <div>
                <span>
                  📋 NEW REQUIREMENT
                </span>

                <h2>
                  Post a Requirement
                </h2>

                <p>
                  Tell TimberMart users what you
                  are looking for.
                </p>
              </div>

              <button
                className="rw-close"
                onClick={() =>
                  !saving &&
                  setShowPost(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="rw-form"
              onSubmit={createRequirement}
            >

              <div className="rw-field">
                <label>
                  Requirement Title *
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Example: Need teak wood logs"
                  required
                />
              </div>

              <div className="rw-form-row">

                <div className="rw-field">
                  <label>
                    Category *
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="rw-field">
                  <label>
                    Quantity
                  </label>

                  <input
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="Example: 5 tons"
                  />
                </div>

              </div>

              <div className="rw-form-row">

                <div className="rw-field">
                  <label>
                    Budget
                  </label>

                  <input
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    placeholder="Example: 250000"
                  />
                </div>

                <div className="rw-field">
                  <label>
                    Location *
                  </label>

                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="City / District"
                    required
                  />
                </div>

              </div>

              <div className="rw-field">
                <label>
                  Requirement Details
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe the wood, quality, quantity, preferred area, timeline or any other details..."
                />
              </div>

              <div className="rw-form-actions">

                <button
                  type="button"
                  className="rw-cancel"
                  disabled={saving}
                  onClick={() =>
                    setShowPost(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rw-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="rw-spin"
                      />
                      Posting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Publish Requirement
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetails &&
        selectedRequirement && (
          <div
            className="rw-modal-overlay"
            onMouseDown={() =>
              setShowDetails(false)
            }
          >
            <div
              className="rw-modal rw-detail-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="rw-modal-header">

                <div>
                  <span>
                    📋 REQUIREMENT
                  </span>

                  <h2>
                    {selectedRequirement.title}
                  </h2>
                </div>

                <button
                  className="rw-close"
                  onClick={() =>
                    setShowDetails(false)
                  }
                >
                  <X size={20} />
                </button>

              </div>

              <div className="rw-detail-body">

                <div className="rw-detail-grid">

                  <div>
                    <span>Category</span>
                    <strong>
                      {selectedRequirement.category_label ||
                        selectedRequirement.category ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Quantity</span>
                    <strong>
                      {selectedRequirement.quantity ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Budget</span>
                    <strong>
                      {selectedRequirement.budget
                        ? `₹${selectedRequirement.budget}`
                        : "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Location</span>
                    <strong>
                      {selectedRequirement.location ||
                        "-"}
                    </strong>
                  </div>

                </div>

                <div className="rw-description-box">
                  <h4>
                    Requirement Details
                  </h4>

                  <p>
                    {selectedRequirement.description ||
                      "No details added."}
                  </p>
                </div>

                <div className="rw-owner">

                  <div className="rw-owner-avatar">
                    {selectedRequirement.profiles
                      ?.photo_url ? (
                      <img
                        src={
                          selectedRequirement
                            .profiles.photo_url
                        }
                        alt=""
                      />
                    ) : (
                      <User size={20} />
                    )}
                  </div>

                  <div>
                    <strong>
                      {selectedRequirement.profiles
                        ?.name ||
                        "TimberMart User"}
                    </strong>

                    <span>
                      {selectedRequirement.profiles
                        ?.role ||
                        "User"}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      openProfile(
                        selectedRequirement.user_id
                      )
                    }
                  >
                    View Profile
                  </button>

                </div>

                {selectedRequirement.user_id !==
                  session.user.id && (
                  <div className="rw-contact">

                    <button
                      onClick={() =>
                        callUser(
                          selectedRequirement
                            .profiles?.phone
                        )
                      }
                    >
                      <Phone size={17} />
                      Call
                    </button>

                    <button
                      onClick={() =>
                        whatsappUser(
                          selectedRequirement
                            .profiles?.phone
                        )
                      }
                    >
                      <MessageCircle size={17} />
                      WhatsApp
                    </button>

                    <button
                      onClick={() =>
                        chatUser(
                          selectedRequirement.user_id
                        )
                      }
                    >
                      <MessageCircle size={17} />
                      Chat
                    </button>

                  </div>
                )}

                {selectedRequirement.user_id ===
                  session.user.id && (
                  <button
                    className="rw-full-delete"
                    onClick={() =>
                      deleteRequirement(
                        selectedRequirement
                      )
                    }
                  >
                    <Trash2 size={17} />
                    Delete My Requirement
                  </button>
                )}

              </div>

            </div>
          </div>
        )}

      {/* PROFILE MODAL */}
      {showProfile && selectedProfile && (
        <div
          className="rw-modal-overlay"
          onMouseDown={() =>
            setShowProfile(false)
          }
        >
          <div
            className="rw-modal rw-profile-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="rw-modal-header">
              <div>
                <span>
                  TIMBERMART PROFILE
                </span>

                <h2>
                  User Profile
                </h2>
              </div>

              <button
                className="rw-close"
                onClick={() =>
                  setShowProfile(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="rw-profile-body">

              <div className="rw-large-avatar">
                {selectedProfile.photo_url ? (
                  <img
                    src={
                      selectedProfile.photo_url
                    }
                    alt=""
                  />
                ) : (
                  <User size={38} />
                )}
              </div>

              <h3>
                {selectedProfile.name ||
                  "TimberMart User"}
              </h3>

              <span className="rw-profile-role">
                {selectedProfile.role ||
                  "User"}
              </span>

              <div className="rw-profile-info">

                <div>
                  <MapPin size={17} />
                  <span>
                    {selectedProfile.location ||
                      "Location not added"}
                  </span>
                </div>

                {selectedProfile.phone && (
                  <div>
                    <Phone size={17} />
                    <span>
                      {selectedProfile.phone}
                    </span>
                  </div>
                )}

              </div>

              {selectedProfile.bio && (
                <p className="rw-profile-bio">
                  {selectedProfile.bio}
                </p>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
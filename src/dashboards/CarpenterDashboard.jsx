import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Home,
  Image as ImageIcon,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  Star,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./CarpenterDashboard.css";
import TreeLoader from "../components/TreeLoader";

const SKILLS = [
  "Door Fitting",
  "Window Fitting",
  "Furniture Making",
  "Wood Polishing",
  "Modular Kitchen",
  "Wood Carving",
  "Staircase Work",
  "Interior Work",
  "Others",
];

export default function CarpenterDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [serviceProfile, setServiceProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [requirements, setRequirements] = useState([]);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");

  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [profileStep, setProfileStep] = useState(1);

  const [showService, setShowService] = useState(false);
  const [showRequirement, setShowRequirement] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [selectedRequirement, setSelectedRequirement] =
    useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [portfolioFiles, setPortfolioFiles] = useState([]);

  const [serviceForm, setServiceForm] = useState({
    skills: [],
    experience: "",
    work_type: "",
    past_work: "",
    location: "",
    service_area: "Within 30 km",
    availability: true,
    work_types: ["Full Time", "Part Time", "Project Based"],
    preferred_days: "All Days",
    preferred_time: "Any Time",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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

      let { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (!userProfile) {
        const newProfile = {
          id: currentSession.user.id,
          name:
            currentSession.user.user_metadata?.full_name ||
            currentSession.user.email?.split("@")[0] ||
            "Carpenter",
          role: "carpenter",
          phone: currentSession.user.phone || "",
          location: "",
          bio: "",
          photo_url: "",
        };

        const { data: created } = await supabase
          .from("profiles")
          .upsert(newProfile)
          .select()
          .single();

        userProfile = created;
      }

      if (userProfile?.role !== "carpenter") {
        navigate(`/dashboard/${userProfile.role}`, {
          replace: true,
        });
        return;
      }

      setProfile(userProfile);

      await Promise.all([
        loadServiceProfile(currentSession.user.id),
        loadPortfolio(currentSession.user.id),
        loadRequirements(),
      ]);
    } catch (error) {
      console.error("Carpenter dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadServiceProfile(userId) {
    const { data, error } = await supabase
      .from("carpenter_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Service profile error:", error);
      return;
    }

    setServiceProfile(data || null);

    if (data) {
      setServiceForm({
        skills: data.skills || [],
        experience: data.experience || "",
        work_type: data.work_type || "",
        past_work: data.past_work || "",
        location: data.location || "",
        service_area: data.service_area || "Within 30 km",
        availability: data.availability ?? true,
        work_types:
          data.work_types || [
            "Full Time",
            "Part Time",
            "Project Based",
          ],
        preferred_days:
          data.preferred_days || "All Days",
        preferred_time:
          data.preferred_time || "Any Time",
      });
    }
  }

  async function loadPortfolio(userId) {
    const { data, error } = await supabase
      .from("carpenter_portfolio")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Portfolio error:", error);
      return;
    }

    setPortfolio(data || []);
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Requirement error:", error);
      return;
    }

    setRequirements(data || []);
  }

  function toggleSkill(skill) {
    setServiceForm((old) => ({
      ...old,
      skills: old.skills.includes(skill)
        ? old.skills.filter((item) => item !== skill)
        : [...old.skills, skill],
    }));
  }

  function toggleWorkType(type) {
    setServiceForm((old) => ({
      ...old,
      work_types: old.work_types.includes(type)
        ? old.work_types.filter((item) => item !== type)
        : [...old.work_types, type],
    }));
  }

  function updateServiceField(name, value) {
    setServiceForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function saveServiceProfile() {
    if (!session?.user?.id) return;

    if (serviceForm.skills.length === 0) {
      alert("Please select at least one skill.");
      setProfileStep(1);
      return;
    }

    if (!serviceForm.experience) {
      alert("Please select your experience.");
      setProfileStep(2);
      return;
    }

    if (!serviceForm.work_type) {
      alert("Please select your work type.");
      setProfileStep(2);
      return;
    }

    if (!serviceForm.location.trim()) {
      alert("Please add your service location.");
      setProfileStep(3);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        user_id: session.user.id,
        skills: serviceForm.skills,
        experience: serviceForm.experience,
        work_type: serviceForm.work_type,
        past_work: serviceForm.past_work,
        location: serviceForm.location,
        service_area: serviceForm.service_area,
        availability: serviceForm.availability,
        work_types: serviceForm.work_types,
        preferred_days: serviceForm.preferred_days,
        preferred_time: serviceForm.preferred_time,
      };

      const { data, error } = await supabase
        .from("carpenter_profiles")
        .upsert(payload, {
          onConflict: "user_id",
        })
        .select()
        .single();

      if (error) throw error;

      setServiceProfile(data);

      if (serviceForm.location !== profile?.location) {
        await supabase
          .from("profiles")
          .update({
            location: serviceForm.location,
          })
          .eq("id", session.user.id);

        setProfile((old) => ({
          ...old,
          location: serviceForm.location,
        }));
      }

      setShowProfileWizard(false);
      setProfileStep(1);

      await loadPortfolio(session.user.id);

      alert("✅ Service profile saved successfully.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  function handlePortfolioFiles(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const remaining = 10 - portfolio.length - portfolioFiles.length;

    setPortfolioFiles((old) => [
      ...old,
      ...files.slice(0, Math.max(0, remaining)),
    ]);
  }

  async function uploadPortfolio() {
    if (!session?.user?.id || portfolioFiles.length === 0) {
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < portfolioFiles.length; i++) {
        const file = portfolioFiles[i];

        const extension =
          file.name.split(".").pop()?.toLowerCase() || "jpg";

        const path = `${session.user.id}/${Date.now()}-${i}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("carpenter-portfolio")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error(uploadError);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("carpenter-portfolio")
          .getPublicUrl(path);

        await supabase.from("carpenter_portfolio").insert({
          user_id: session.user.id,
          image_url: publicUrl,
          storage_path: path,
          sort_order: portfolio.length + i,
        });
      }

      setPortfolioFiles([]);
      await loadPortfolio(session.user.id);

      alert("📸 Portfolio updated.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Portfolio upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function deletePortfolio(item) {
    if (!window.confirm("Delete this portfolio photo?")) return;

    await supabase.storage
      .from("carpenter-portfolio")
      .remove([item.storage_path]);

    const { error } = await supabase
      .from("carpenter_portfolio")
      .delete()
      .eq("id", item.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setPortfolio((old) =>
      old.filter((image) => image.id !== item.id)
    );
  }

  function openRequirement(requirement) {
    setSelectedRequirement(requirement);
    setShowRequirement(true);
  }

  async function openUserProfile(userId) {
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
      setSelectedUser(data);
      setShowUserProfile(true);
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

    const cleanPhone = phone.replace(/\D/g, "");

    window.open(
      `https://wa.me/${cleanPhone}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function startChat(userId) {
    if (!userId || !session?.user?.id) return;

    if (userId === session.user.id) {
      alert("You cannot chat with yourself.");
      return;
    }

    const { data: person } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (person) {
      setSelectedUser(person);
    }

    await loadMessages(userId);

    setShowChat(true);
  }

  async function loadMessages(otherUserId) {
    const myId = session.user.id;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      setMessages([]);
      return;
    }

    setMessages(data || []);
  }

  useEffect(() => {
    if (!session?.user?.id || !selectedUser?.id) return;

    const channel = supabase
      .channel(`carpenter-chat-${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new;

          const belongs =
            (message.sender_id === session.user.id &&
              message.receiver_id === selectedUser.id) ||
            (message.sender_id === selectedUser.id &&
              message.receiver_id === session.user.id);

          if (belongs) {
            setMessages((old) => [...old, message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, selectedUser?.id]);

  async function sendMessage(event) {
    event.preventDefault();

    const body = messageText.trim();

    if (!body || !selectedUser?.id) return;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        receiver_id: selectedUser.id,
        body,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setMessages((old) => [...old, data]);
    setMessageText("");
  }

  async function logout() {
    await supabase.auth.signOut();

    navigate("/login", {
      replace: true,
    });
  }

  const filteredRequirements = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return requirements;

    return requirements.filter((item) =>
      [
        item.title,
        item.category,
        item.category_label,
        item.location,
        item.description,
        item.profiles?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [requirements, search]);

  const profileCompleted =
    !!serviceProfile &&
    serviceProfile.skills?.length > 0 &&
    !!serviceProfile.experience &&
    !!serviceProfile.location;

  if (loading) {
  return (
    <TreeLoader text="Growing your requirements..." />
  );
}
  return (
    <div className="carpenter-app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="carpenter-header">

        <button
          className="carpenter-menu-btn"
          onClick={() => setMobileMenu((old) => !old)}
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="carpenter-logo">
          <span>🌳</span>
          TimberMart
        </div>

        <div className="carpenter-header-right">

          <button className="carpenter-bell">
            <Bell size={20} />
          </button>

          <button
            className="carpenter-user-btn"
            onClick={() =>
              openUserProfile(session.user.id)
            }
          >
            <span className="carpenter-header-avatar">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" />
              ) : (
                <User size={18} />
              )}
            </span>

            <span>
              {profile?.name || "Carpenter"}
            </span>
          </button>

        </div>
      </header>


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`carpenter-sidebar ${
          mobileMenu ? "open" : ""
        }`}
      >

        <div className="carpenter-sidebar-top">

          <div className="carpenter-side-brand">
            <div>🪚</div>

            <section>
              <strong>TimberMart</strong>
              <span>Carpenter</span>
            </section>
          </div>


          <div className="carpenter-account-card">

            <div className="carpenter-account-avatar">
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
                {profile?.name || "Carpenter"}
              </strong>

              <span>
                {profile?.location || "Location not added"}
              </span>
            </div>

          </div>


          <nav className="carpenter-nav">

            <button
              className="active"
              onClick={() => {
                setMobileMenu(false);
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              <Home size={18} />
              Dashboard
            </button>

            <button
              onClick={() => {
                setMobileMenu(false);
                setProfileStep(1);
                setShowProfileWizard(true);
              }}
            >
              <BriefcaseBusiness size={18} />
              Create / Edit Service Profile
            </button>

            <button
              onClick={() => {
                setMobileMenu(false);
                setShowService(true);
              }}
            >
              <Eye size={18} />
              My Service Profile
            </button>

            <button
              onClick={() => {
                setMobileMenu(false);
                document
                  .getElementById("requirements")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
            >
              <Users size={18} />
              Customer Requirements
            </button>

            <button
              onClick={() => {
                setMobileMenu(false);
                openUserProfile(session.user.id);
              }}
            >
              <User size={18} />
              My Profile
            </button>

            <button
              onClick={() => navigate("/settings")}
            >
              <Settings size={18} />
              Settings
            </button>

          </nav>

        </div>


        <div className="carpenter-sidebar-bottom">

          <div className="carpenter-side-note">
            <Check size={15} />
            We Connect. You Deal Directly.
          </div>

          <button
            className="carpenter-logout"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>


      {mobileMenu && (
        <div
          className="carpenter-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="carpenter-main">

        <div className="carpenter-container">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="carpenter-hero">

            <div className="carpenter-hero-content">

              <div className="carpenter-kicker">
                🛠️ CARPENTER SERVICE
              </div>

              <h1>
                Hello, {profile?.name || "Carpenter"}!
              </h1>

              <p>
                Create your service profile,
                showcase your work and connect
                directly with customers.
              </p>


              <div className="carpenter-hero-location">
                <MapPin size={16} />
                {profile?.location ||
                  serviceProfile?.location ||
                  "Add your service location"}
              </div>


              <div className="carpenter-hero-buttons">

                <button
                  className="carpenter-primary"
                  onClick={() => {
                    setProfileStep(1);
                    setShowProfileWizard(true);
                  }}
                >
                  <Edit3 size={18} />
                  {profileCompleted
                    ? "Edit Service Profile"
                    : "Create Service Profile"}
                </button>


                <button
                  className="carpenter-outline"
                  onClick={() =>
                    document
                      .getElementById("requirements")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  <Users size={18} />
                  Find Customer Work
                </button>

              </div>

            </div>


            <div className="carpenter-hero-visual">
              <div className="carpenter-tool-circle">
                🪚
              </div>

              <div className="carpenter-wood-decoration">
                🪵
              </div>
            </div>

          </section>


          {/* =================================================
              ACCOUNT STATUS
          ================================================= */}

          <section className="carpenter-status-card">

            <div className="carpenter-status-left">

              <div className="carpenter-status-avatar">
                {profile?.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt=""
                  />
                ) : (
                  <User size={25} />
                )}
              </div>

              <div>
                <strong>
                  {profile?.name || "Carpenter"}
                </strong>

                <span>
                  Professional Carpenter
                </span>
              </div>

            </div>


            <div
              className={
                profileCompleted
                  ? "carpenter-verified"
                  : "carpenter-incomplete"
              }
            >
              {profileCompleted ? (
                <>
                  <Check size={15} />
                  Profile Complete
                </>
              ) : (
                <>
                  <Edit3 size={15} />
                  Complete Profile
                </>
              )}
            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="carpenter-section">

            <div className="carpenter-section-title">

              <div>
                <h2>Carpenter Tools</h2>
                <p>
                  Manage your service and customer connections.
                </p>
              </div>

            </div>


            <div className="carpenter-tools-grid">

              <button
                onClick={() => {
                  setProfileStep(1);
                  setShowProfileWizard(true);
                }}
              >
                <span>🛠️</span>
                <strong>Create / Edit Service Profile</strong>
                <small>
                  Add skills and experience
                </small>
              </button>


              <button
                onClick={() => setShowService(true)}
              >
                <span>📋</span>
                <strong>My Service Profile</strong>
                <small>
                  View your public profile
                </small>
              </button>


              <button
                onClick={() =>
                  document
                    .getElementById("requirements")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                <span>📋</span>
                <strong>Customer Requirements</strong>
                <small>
                  Find nearby customer work
                </small>
              </button>


              <button
                onClick={() =>
                  document
                    .getElementById("portfolio")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                <span>📸</span>
                <strong>My Portfolio</strong>
                <small>
                  Showcase your best work
                </small>
              </button>

            </div>

          </section>


          {/* =================================================
              PROFILE PROGRESS
          ================================================= */}

          {!profileCompleted && (

            <section className="carpenter-profile-progress">

              <div className="carpenter-progress-icon">
                🛠️
              </div>

              <div className="carpenter-progress-text">

                <strong>
                  Complete your service profile
                </strong>

                <p>
                  Add your skills, experience,
                  location and portfolio so
                  customers can find you.
                </p>

              </div>

              <button
                onClick={() => {
                  setProfileStep(1);
                  setShowProfileWizard(true);
                }}
              >
                Complete Now
                <ChevronRight size={17} />
              </button>

            </section>

          )}


          {/* =================================================
              PORTFOLIO
          ================================================= */}

          <section
            className="carpenter-section"
            id="portfolio"
          >

            <div className="carpenter-section-title">

              <div>
                <h2>My Portfolio</h2>

                <p>
                  Show customers your best woodwork.
                </p>
              </div>

              <label className="carpenter-add-photo">

                <Plus size={17} />
                Add Photos

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePortfolioFiles}
                />

              </label>

            </div>


            {portfolioFiles.length > 0 && (

              <div className="carpenter-upload-bar">

                <span>
                  {portfolioFiles.length} photo(s) selected
                </span>

                <button
                  onClick={uploadPortfolio}
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload Photos"}
                </button>

              </div>

            )}


            {portfolio.length === 0 ? (

              <div className="carpenter-empty">

                <div>📸</div>

                <h3>
                  No portfolio photos yet
                </h3>

                <p>
                  Add photos of your doors,
                  furniture, kitchens and other
                  completed work.
                </p>

              </div>

            ) : (

              <div className="carpenter-portfolio-grid">

                {portfolio.map((item) => (

                  <div
                    className="carpenter-portfolio-card"
                    key={item.id}
                  >

                    <img
                      src={item.image_url}
                      alt="Carpenter portfolio"
                    />

                    <button
                      onClick={() =>
                        deletePortfolio(item)
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                ))}

              </div>

            )}

          </section>


          {/* =================================================
              CUSTOMER REQUIREMENTS
          ================================================= */}

          <section
            className="carpenter-section"
            id="requirements"
          >

            <div className="carpenter-section-title">

              <div>
                <h2>Customer Requirements</h2>

                <p>
                  Connect with customers looking
                  for carpentry work.
                </p>
              </div>

            </div>


            <div className="carpenter-search">

              <Search size={18} />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search requirements, location, work type..."
              />

            </div>


            {filteredRequirements.length === 0 ? (

              <div className="carpenter-empty">

                <div>📋</div>

                <h3>
                  No customer requirements yet
                </h3>

                <p>
                  Customer requirements posted
                  on TimberMart will appear here.
                </p>

              </div>

            ) : (

              <div className="carpenter-requirements">

                {filteredRequirements.map(
                  (requirement) => {

                    const person =
                      requirement.profiles;

                    return (
                      <article
                        className="carpenter-requirement"
                        key={requirement.id}
                      >

                        <div className="carpenter-requirement-user">

                          <div className="carpenter-customer-avatar">

                            {person?.photo_url ? (
                              <img
                                src={person.photo_url}
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
                                "Customer"}
                            </span>

                          </div>

                        </div>


                        <h3>
                          {requirement.title}
                        </h3>


                        <p>
                          {requirement.description ||
                            "No description added."}
                        </p>


                        <div className="carpenter-requirement-meta">

                          <span>
                            <MapPin size={14} />
                            {requirement.location ||
                              "Location not added"}
                          </span>

                          {requirement.quantity && (
                            <span>
                              Quantity:{" "}
                              {requirement.quantity}
                            </span>
                          )}

                          {requirement.budget && (
                            <span>
                              Budget: ₹
                              {requirement.budget}
                            </span>
                          )}

                        </div>


                        <div className="carpenter-requirement-footer">

                          <small>
                            {person?.location ||
                              requirement.location ||
                              ""}
                          </small>

                          <button
                            onClick={() =>
                              openRequirement(
                                requirement
                              )
                            }
                          >
                            <Eye size={16} />
                            View
                          </button>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            )}

          </section>


          {/* =================================================
              FOOTER DISCLAIMER
          ================================================= */}

          <footer className="carpenter-footer">

            <div>
              <Check size={18} />
              <span>No Commission</span>
            </div>

            <div>
              <Phone size={18} />
              <span>Direct Contact</span>
            </div>

            <div>
              <Users size={18} />
              <span>100% Secure</span>
            </div>

            <div className="carpenter-footer-main">
              🤝
              <strong>
                We Connect. You Deal Directly.
              </strong>
            </div>

          </footer>

        </div>

      </main>


      {/* =====================================================
          SERVICE PROFILE WIZARD
      ===================================================== */}

      {showProfileWizard && (

        <div
          className="carpenter-modal-overlay"
          onMouseDown={() =>
            !saving &&
            setShowProfileWizard(false)
          }
        >

          <div
            className="carpenter-modal carpenter-wizard"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="carpenter-modal-header">

              <div>
                <span>CARPENTER PROFILE</span>
                <h2>
                  {profileStep === 1 &&
                    "Create Service Profile"}
                  {profileStep === 2 &&
                    "Add Experience"}
                  {profileStep === 3 &&
                    "Add Location"}
                  {profileStep === 4 &&
                    "Add Portfolio"}
                  {profileStep === 5 &&
                    "Set Availability"}
                </h2>

                <p>
                  Let customers know about your
                  skills and work.
                </p>
              </div>


              <button
                className="carpenter-close"
                onClick={() =>
                  setShowProfileWizard(false)
                }
              >
                <X size={20} />
              </button>

            </div>


            {/* STEP INDICATOR */}

            <div className="carpenter-steps">

              {[
                "Skills",
                "Experience",
                "Location",
                "Portfolio",
                "Availability",
              ].map((label, index) => {

                const step = index + 1;

                return (
                  <div
                    key={label}
                    className={
                      profileStep >= step
                        ? "active"
                        : ""
                    }
                  >
                    <span>{step}</span>
                    <small>{label}</small>
                  </div>
                );

              })}

            </div>


            <div className="carpenter-wizard-body">

              {/* STEP 1 */}

              {profileStep === 1 && (

                <div className="carpenter-wizard-step">

                  <h3>
                    Your Skills
                  </h3>

                  <p>
                    Select all services you provide.
                  </p>


                  <div className="carpenter-skills">

                    {SKILLS.map((skill) => (

                      <button
                        type="button"
                        key={skill}
                        className={
                          serviceForm.skills.includes(
                            skill
                          )
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          toggleSkill(skill)
                        }
                      >

                        <span>
                          {serviceForm.skills.includes(
                            skill
                          ) ? (
                            <Check size={15} />
                          ) : null}
                        </span>

                        {skill}

                      </button>

                    ))}

                  </div>


                  <button
                    className="carpenter-wizard-next"
                    onClick={() => {

                      if (
                        serviceForm.skills.length === 0
                      ) {
                        alert(
                          "Select at least one skill."
                        );
                        return;
                      }

                      setProfileStep(2);
                    }}
                  >
                    Continue
                    <ChevronRight size={17} />
                  </button>

                </div>

              )}


              {/* STEP 2 */}

              {profileStep === 2 && (

                <div className="carpenter-wizard-step">

                  <h3>
                    Your Experience
                  </h3>

                  <p>
                    Tell customers about your
                    experience.
                  </p>


                  <label>
                    Total Experience
                  </label>

                  <select
                    value={serviceForm.experience}
                    onChange={(e) =>
                      updateServiceField(
                        "experience",
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select experience
                    </option>
                    <option>Less than 1 Year</option>
                    <option>1-3 Years</option>
                    <option>3-5 Years</option>
                    <option>5-8 Years</option>
                    <option>8+ Years</option>
                  </select>


                  <label>
                    Work Type
                  </label>

                  <select
                    value={serviceForm.work_type}
                    onChange={(e) =>
                      updateServiceField(
                        "work_type",
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select work type
                    </option>
                    <option>Carpentry</option>
                    <option>Furniture</option>
                    <option>Interior Woodwork</option>
                    <option>Doors & Windows</option>
                    <option>Kitchen Work</option>
                    <option>General Woodwork</option>
                  </select>


                  <label>
                    Past Work Details
                  </label>

                  <textarea
                    rows="5"
                    maxLength="200"
                    value={serviceForm.past_work}
                    onChange={(e) =>
                      updateServiceField(
                        "past_work",
                        e.target.value
                      )
                    }
                    placeholder="Tell customers about your previous work..."
                  />


                  <div className="carpenter-wizard-buttons">

                    <button
                      onClick={() =>
                        setProfileStep(1)
                      }
                    >
                      Back
                    </button>

                    <button
                      className="primary"
                      onClick={() => {

                        if (
                          !serviceForm.experience ||
                          !serviceForm.work_type
                        ) {
                          alert(
                            "Please complete experience details."
                          );
                          return;
                        }

                        setProfileStep(3);
                      }}
                    >
                      Continue
                      <ChevronRight size={17} />
                    </button>

                  </div>

                </div>

              )}


              {/* STEP 3 */}

              {profileStep === 3 && (

                <div className="carpenter-wizard-step">

                  <h3>
                    Service Location
                  </h3>

                  <p>
                    Where do you provide your services?
                  </p>


                  <label>
                    Primary Location
                  </label>

                  <div className="carpenter-input-icon">

                    <MapPin size={17} />

                    <input
                      value={serviceForm.location}
                      onChange={(e) =>
                        updateServiceField(
                          "location",
                          e.target.value
                        )
                      }
                      placeholder="City, District, State"
                    />

                  </div>


                  <label>
                    Service Area
                  </label>

                  <select
                    value={serviceForm.service_area}
                    onChange={(e) =>
                      updateServiceField(
                        "service_area",
                        e.target.value
                      )
                    }
                  >
                    <option>Within 10 km</option>
                    <option>Within 20 km</option>
                    <option>Within 30 km</option>
                    <option>Within 50 km</option>
                    <option>Anywhere in my district</option>
                  </select>


                  <div className="carpenter-location-preview">
                    <MapPin size={35} />
                    <span>
                      Your service location
                    </span>
                  </div>


                  <div className="carpenter-wizard-buttons">

                    <button
                      onClick={() =>
                        setProfileStep(2)
                      }
                    >
                      Back
                    </button>

                    <button
                      className="primary"
                      onClick={() => {

                        if (
                          !serviceForm.location.trim()
                        ) {
                          alert(
                            "Please add your location."
                          );
                          return;
                        }

                        setProfileStep(4);
                      }}
                    >
                      Continue
                      <ChevronRight size={17} />
                    </button>

                  </div>

                </div>

              )}


              {/* STEP 4 */}

              {profileStep === 4 && (

                <div className="carpenter-wizard-step">

                  <h3>
                    Add Portfolio
                  </h3>

                  <p>
                    Show customers your best work.
                  </p>


                  <label className="carpenter-wizard-upload">

                    <Camera size={27} />

                    <strong>
                      Add Work Photos
                    </strong>

                    <span>
                      Maximum 10 photos
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePortfolioFiles}
                    />

                  </label>


                  {portfolioFiles.length > 0 && (

                    <div className="carpenter-selected-photos">

                      {portfolioFiles.map(
                        (file, index) => (

                          <div key={index}>
                            <img
                              src={URL.createObjectURL(file)}
                              alt=""
                            />
                          </div>

                        )
                      )}

                    </div>

                  )}


                  <div className="carpenter-wizard-buttons">

                    <button
                      onClick={() =>
                        setProfileStep(3)
                      }
                    >
                      Back
                    </button>

                    <button
                      className="primary"
                      onClick={() =>
                        setProfileStep(5)
                      }
                    >
                      Continue
                      <ChevronRight size={17} />
                    </button>

                  </div>

                </div>

              )}


              {/* STEP 5 */}

              {profileStep === 5 && (

                <div className="carpenter-wizard-step">

                  <h3>
                    Set Availability
                  </h3>

                  <p>
                    When are you available for work?
                  </p>


                  <div className="carpenter-availability-toggle">

                    <div>
                      <strong>
                        Available Now
                      </strong>

                      <span>
                        Customers can contact you
                      </span>
                    </div>

                    <button
                      className={
                        serviceForm.availability
                          ? "on"
                          : ""
                      }
                      onClick={() =>
                        updateServiceField(
                          "availability",
                          !serviceForm.availability
                        )
                      }
                    >
                      <span />
                    </button>

                  </div>


                  <label>
                    Preferred Work Type
                  </label>

                  <div className="carpenter-work-types">

                    {[
                      "Full Time",
                      "Part Time",
                      "Project Based",
                    ].map((type) => (

                      <button
                        key={type}
                        className={
                          serviceForm.work_types.includes(
                            type
                          )
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          toggleWorkType(type)
                        }
                      >
                        <Check size={15} />
                        {type}
                      </button>

                    ))}

                  </div>


                  <label>
                    Preferred Days
                  </label>

                  <select
                    value={serviceForm.preferred_days}
                    onChange={(e) =>
                      updateServiceField(
                        "preferred_days",
                        e.target.value
                      )
                    }
                  >
                    <option>All Days</option>
                    <option>Weekdays</option>
                    <option>Weekends</option>
                    <option>Monday - Friday</option>
                  </select>


                  <label>
                    Preferred Time
                  </label>

                  <select
                    value={serviceForm.preferred_time}
                    onChange={(e) =>
                      updateServiceField(
                        "preferred_time",
                        e.target.value
                      )
                    }
                  >
                    <option>Any Time</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>


                  <div className="carpenter-wizard-buttons">

                    <button
                      onClick={() =>
                        setProfileStep(4)
                      }
                    >
                      Back
                    </button>

                    <button
                      className="primary"
                      onClick={saveServiceProfile}
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : "Complete Profile"}
                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          SERVICE PROFILE VIEW
      ===================================================== */}

      {showService && (

        <div
          className="carpenter-modal-overlay"
          onMouseDown={() =>
            setShowService(false)
          }
        >

          <div
            className="carpenter-modal carpenter-service-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="carpenter-modal-header">

              <div>
                <span>
                  SERVICE PROFILE
                </span>

                <h2>
                  {profile?.name || "Carpenter"}
                </h2>

                <p>
                  Professional Carpenter
                </p>
              </div>

              <button
                className="carpenter-close"
                onClick={() =>
                  setShowService(false)
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="carpenter-service-body">

              <div className="carpenter-service-avatar">

                {profile?.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt=""
                  />
                ) : (
                  <User size={40} />
                )}

              </div>


              <h2>
                {profile?.name || "Carpenter"}
              </h2>

              <span className="carpenter-service-role">
                Professional Carpenter
              </span>


              <div className="carpenter-service-rating">
                <Star size={16} fill="currentColor" />
                <span>
                  Profile based on your information
                </span>
              </div>


              <div className="carpenter-service-contact">

                <span>
                  <MapPin size={16} />
                  {serviceProfile?.location ||
                    profile?.location ||
                    "Location not added"}
                </span>

                <span>
                  <Clock3 size={16} />
                  {serviceProfile?.availability
                    ? "Available Now"
                    : "Currently Unavailable"}
                </span>

              </div>


              <div className="carpenter-service-section">

                <h4>
                  Skills
                </h4>

                <div className="carpenter-service-tags">

                  {(serviceProfile?.skills || []).map(
                    (skill) => (
                      <span key={skill}>
                        {skill}
                      </span>
                    )
                  )}

                </div>

              </div>


              <div className="carpenter-service-section">

                <h4>
                  Experience
                </h4>

                <p>
                  {serviceProfile?.experience ||
                    "Not added"}
                </p>

              </div>


              <div className="carpenter-service-section">

                <h4>
                  About My Work
                </h4>

                <p>
                  {serviceProfile?.past_work ||
                    "No work details added yet."}
                </p>

              </div>


              {portfolio.length > 0 && (

                <div className="carpenter-service-section">

                  <h4>
                    Portfolio
                  </h4>

                  <div className="carpenter-mini-portfolio">

                    {portfolio.map((item) => (

                      <img
                        key={item.id}
                        src={item.image_url}
                        alt=""
                      />

                    ))}

                  </div>

                </div>

              )}


              <button
                className="carpenter-edit-service"
                onClick={() => {
                  setShowService(false);
                  setProfileStep(1);
                  setShowProfileWizard(true);
                }}
              >
                <Edit3 size={17} />
                Edit Service Profile
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          REQUIREMENT DETAILS
      ===================================================== */}

      {showRequirement &&
        selectedRequirement && (

          <div
            className="carpenter-modal-overlay"
            onMouseDown={() =>
              setShowRequirement(false)
            }
          >

            <div
              className="carpenter-modal carpenter-requirement-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="carpenter-modal-header">

                <div>
                  <span>
                    CUSTOMER REQUIREMENT
                  </span>

                  <h2>
                    {selectedRequirement.title}
                  </h2>
                </div>

                <button
                  className="carpenter-close"
                  onClick={() =>
                    setShowRequirement(false)
                  }
                >
                  <X size={20} />
                </button>

              </div>


              <div className="carpenter-detail-body">

                <div className="carpenter-detail-grid">

                  <div>
                    <span>
                      Work Type
                    </span>

                    <strong>
                      {selectedRequirement.category_label ||
                        selectedRequirement.category ||
                        "Carpentry"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Quantity
                    </span>

                    <strong>
                      {selectedRequirement.quantity ||
                        "-"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Budget
                    </span>

                    <strong>
                      {selectedRequirement.budget
                        ? `₹${selectedRequirement.budget}`
                        : "Negotiable"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Location
                    </span>

                    <strong>
                      {selectedRequirement.location ||
                        "-"}
                    </strong>
                  </div>

                </div>


                <div className="carpenter-detail-description">

                  <h4>
                    Requirement Details
                  </h4>

                  <p>
                    {selectedRequirement.description ||
                      "No additional description."}
                  </p>

                </div>


                <div className="carpenter-customer-detail">

                  <div className="carpenter-customer-avatar">

                    {selectedRequirement.profiles
                      ?.photo_url ? (
                      <img
                        src={
                          selectedRequirement
                            .profiles
                            .photo_url
                        }
                        alt=""
                      />
                    ) : (
                      <User size={22} />
                    )}

                  </div>


                  <div>

                    <strong>
                      {selectedRequirement.profiles
                        ?.name ||
                        "TimberMart User"}
                    </strong>

                    <span>
                      Customer
                    </span>

                  </div>


                  <button
                    onClick={() =>
                      openUserProfile(
                        selectedRequirement.user_id
                      )
                    }
                  >
                    View Profile
                  </button>

                </div>


                {selectedRequirement.user_id !==
                  session.user.id && (

                  <div className="carpenter-contact-actions">

                    <button
                      onClick={() =>
                        callUser(
                          selectedRequirement
                            .profiles?.phone
                        )
                      }
                    >
                      <Phone size={18} />
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
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>

                    <button
                      onClick={() =>
                        startChat(
                          selectedRequirement.user_id
                        )
                      }
                    >
                      <MessageCircle size={18} />
                      Chat
                    </button>

                  </div>

                )}

              </div>

            </div>

          </div>
        )}


      {/* =====================================================
          USER PROFILE
      ===================================================== */}

      {showUserProfile &&
        selectedUser && (

          <div
            className="carpenter-modal-overlay"
            onMouseDown={() =>
              setShowUserProfile(false)
            }
          >

            <div
              className="carpenter-modal carpenter-user-profile-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <button
                className="carpenter-profile-close"
                onClick={() =>
                  setShowUserProfile(false)
                }
              >
                <X size={20} />
              </button>


              <div className="carpenter-profile-cover">
                🌳
              </div>


              <div className="carpenter-profile-content">

                <div className="carpenter-big-avatar">

                  {selectedUser.photo_url ? (
                    <img
                      src={selectedUser.photo_url}
                      alt=""
                    />
                  ) : (
                    <User size={38} />
                  )}

                </div>


                <h2>
                  {selectedUser.name ||
                    "TimberMart User"}
                </h2>


                <span>
                  {selectedUser.role ||
                    "User"}
                </span>


                {selectedUser.location && (

                  <p>
                    <MapPin size={15} />
                    {selectedUser.location}
                  </p>

                )}


                {selectedUser.bio && (

                  <div className="carpenter-user-bio">
                    {selectedUser.bio}
                  </div>

                )}


                {selectedUser.id ===
                session.user.id ? (

                  <button
                    className="carpenter-profile-edit"
                    onClick={() =>
                      navigate("/profile")
                    }
                  >
                    <Edit3 size={17} />
                    Edit Profile
                  </button>

                ) : (

                  <div className="carpenter-contact-actions">

                    <button
                      onClick={() =>
                        callUser(
                          selectedUser.phone
                        )
                      }
                    >
                      <Phone size={18} />
                      Call
                    </button>

                    <button
                      onClick={() =>
                        whatsappUser(
                          selectedUser.phone
                        )
                      }
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>

                    <button
                      onClick={() =>
                        startChat(
                          selectedUser.id
                        )
                      }
                    >
                      <MessageCircle size={18} />
                      Chat
                    </button>

                  </div>

                )}

              </div>

            </div>

          </div>
        )}


      {/* =====================================================
          CHAT
      ===================================================== */}

      {showChat &&
        selectedUser && (

          <div
            className="carpenter-modal-overlay"
            onMouseDown={() =>
              setShowChat(false)
            }
          >

            <div
              className="carpenter-chat"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="carpenter-chat-header">

                <div>

                  <div className="carpenter-chat-avatar">

                    {selectedUser.photo_url ? (
                      <img
                        src={
                          selectedUser.photo_url
                        }
                        alt=""
                      />
                    ) : (
                      <User size={19} />
                    )}

                  </div>

                  <div>
                    <strong>
                      {selectedUser.name ||
                        "TimberMart User"}
                    </strong>

                    <span>
                      {selectedUser.role ||
                        "Customer"}
                    </span>
                  </div>

                </div>


                <button
                  onClick={() =>
                    setShowChat(false)
                  }
                >
                  <X size={20} />
                </button>

              </div>


              <div className="carpenter-chat-messages">

                {messages.length === 0 ? (

                  <div className="carpenter-chat-empty">

                    <MessageCircle size={34} />

                    <h3>
                      Start Conversation
                    </h3>

                    <p>
                      Send a message to{" "}
                      {selectedUser.name ||
                        "this customer"}.
                    </p>

                  </div>

                ) : (

                  messages.map((message) => {

                    const mine =
                      message.sender_id ===
                      session.user.id;

                    return (
                      <div
                        key={message.id}
                        className={
                          mine
                            ? "carpenter-message mine"
                            : "carpenter-message"
                        }
                      >
                        {message.body}
                      </div>
                    );

                  })

                )}

              </div>


              <form
                className="carpenter-chat-form"
                onSubmit={sendMessage}
              >

                <input
                  value={messageText}
                  onChange={(e) =>
                    setMessageText(
                      e.target.value
                    )
                  }
                  placeholder="Type a message..."
                />

                <button type="submit">
                  <Send size={18} />
                </button>

              </form>

            </div>

          </div>
        )}

    </div>
  );
}
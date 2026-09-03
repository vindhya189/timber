import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Eye,
  Home,
  Image as ImageIcon,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase } from "../supabaseClient";
import "./RequirementWall.css";
import TreeLoader from "../components/TreeLoader";


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

  // =====================================================
  // PAGE STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [requirements, setRequirements] = useState([]);
  const [search, setSearch] = useState("");

  // =====================================================
  // POST MODAL
  // =====================================================

  const [showPost, setShowPost] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    quantity: "",
    budget: "",
    location: "",
    description: "",
  });

  const [requirementPhotos, setRequirementPhotos] =
    useState([]);

  const [photoPreviews, setPhotoPreviews] =
    useState([]);

  // =====================================================
  // DETAIL MODAL
  // =====================================================

  const [selectedRequirement, setSelectedRequirement] =
    useState(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [activePhoto, setActivePhoto] =
    useState(null);

  // =====================================================
  // PROFILE MODAL
  // =====================================================

  const [selectedProfile, setSelectedProfile] =
    useState(null);

  const [showProfile, setShowProfile] =
    useState(false);

  // =====================================================
  // CHAT
  // =====================================================

  const [chatUser, setChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);


  // =====================================================
  // LOAD PAGE
  // =====================================================

  useEffect(() => {
    loadPage();
  }, []);


  async function loadPage() {

    try {

      setLoading(true);

      const {
        data: {
          session: currentSession,
        },
      } = await supabase.auth.getSession();

      if (!currentSession?.user) {

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setSession(currentSession);


      const {
        data: currentProfile,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .maybeSingle();


      setProfile(currentProfile);

      await loadRequirements();

    } catch (error) {

      console.error(
        "Requirement Wall error:",
        error
      );

    } finally {

      setLoading(false);

    }
  }


  // =====================================================
  // LOAD REQUIREMENTS + PHOTOS + PROFILE
  // =====================================================

  async function loadRequirements() {

    const {
      data,
      error,
    } = await supabase
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
        ),
        requirement_images (
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
        "Requirement load error:",
        error
      );

      return;
    }


    const sortedData = (data || []).map(
      (item) => ({
        ...item,

        requirement_images:
          [...(item.requirement_images || [])]
            .sort(
              (a, b) =>
                (a.sort_order || 0) -
                (b.sort_order || 0)
            ),
      })
    );


    setRequirements(sortedData);
  }


  // =====================================================
  // FORM CHANGE
  // =====================================================

  function handleChange(event) {

    const {
      name,
      value,
    } = event.target;


    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }


  // =====================================================
  // PHOTO SELECT
  // =====================================================

  function handlePhotoSelect(event) {

    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;


    const validFiles = files
      .filter(
        (file) =>
          file.type.startsWith("image/")
      )
      .filter(
        (file) =>
          file.size <= 5 * 1024 * 1024
      )
      .slice(
        0,
        6 - requirementPhotos.length
      );


    if (validFiles.length === 0) {

      alert(
        "Please select image files up to 5 MB each."
      );

      return;
    }


    setRequirementPhotos((old) => [
      ...old,
      ...validFiles,
    ]);


    setPhotoPreviews((old) => [
      ...old,
      ...validFiles.map((file) =>
        URL.createObjectURL(file)
      ),
    ]);


    event.target.value = "";
  }


  function removePhoto(index) {

    setRequirementPhotos((old) =>
      old.filter((_, i) => i !== index)
    );


    setPhotoPreviews((old) =>
      old.filter((_, i) => i !== index)
    );
  }


  // =====================================================
  // CREATE REQUIREMENT
  // =====================================================

  async function createRequirement(event) {

    event.preventDefault();


    if (!session?.user?.id) return;


    if (!form.title.trim()) {

      alert(
        "Please enter requirement title."
      );

      return;
    }


    if (!form.category.trim()) {

      alert(
        "Please select a category."
      );

      return;
    }


    if (!form.location.trim()) {

      alert(
        "Please enter location."
      );

      return;
    }


    setSaving(true);


    try {

      // -------------------------------------------------
      // CREATE REQUIREMENT
      // -------------------------------------------------

      const {
        data: requirement,
        error,
      } = await supabase
        .from("requirements")
        .insert({
          user_id: session.user.id,
          title: form.title.trim(),
          category:
            form.category
              .trim()
              .toLowerCase(),
          category_label:
            form.category.trim(),
          location:
            form.location.trim(),
          quantity:
            form.quantity.trim(),
          budget:
            form.budget.trim(),
          description:
            form.description.trim(),
        })
        .select()
        .single();


      if (error) throw error;


      // -------------------------------------------------
      // UPLOAD REQUIREMENT PHOTOS
      // -------------------------------------------------

      for (
        let index = 0;
        index < requirementPhotos.length;
        index++
      ) {

        const file =
          requirementPhotos[index];


        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";


        const storagePath =
          `requirements/${session.user.id}/${requirement.id}/${Date.now()}-${index}.${extension}`;


        const {
          error: uploadError,
        } = await supabase.storage
          .from("listing-photos")
          .upload(
            storagePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
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
          data: publicData,
        } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(
            storagePath
          );


        await supabase
          .from("requirement_images")
          .insert({
            requirement_id:
              requirement.id,

            user_id:
              session.user.id,

            image_url:
              publicData.publicUrl,

            storage_path:
              storagePath,

            sort_order:
              index,
          });
      }


      // -------------------------------------------------
      // RESET
      // -------------------------------------------------

      setForm({
        title: "",
        category: "",
        quantity: "",
        budget: "",
        location: "",
        description: "",
      });


      setRequirementPhotos([]);
      setPhotoPreviews([]);

      setShowPost(false);


      await loadRequirements();


      alert(
        "✅ Requirement posted successfully!"
      );


    } catch (error) {

      console.error(error);

      alert(
        error.message ||
          "Unable to post requirement."
      );

    } finally {

      setSaving(false);

    }
  }


  // =====================================================
  // OPEN REQUIREMENT
  // =====================================================

  function openRequirement(requirement) {

    setSelectedRequirement(
      requirement
    );

    setActivePhoto(
      requirement
        .requirement_images?.[0]
        ?.image_url || null
    );

    setShowDetails(true);
  }


  // =====================================================
  // OPEN PROFILE
  // =====================================================

  async function openProfile(userId) {

    if (!userId) return;


    const {
      data,
      error,
    } = await supabase
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


  // =====================================================
  // CALL
  // =====================================================

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


  // =====================================================
  // WHATSAPP
  // =====================================================

  function whatsappUser(phone) {

    if (!phone) {

      alert(
        "WhatsApp number is not available."
      );

      return;
    }


    const clean =
      phone.replace(/\D/g, "");


    const whatsappNumber =
      clean.length === 10
        ? `91${clean}`
        : clean;


    window.open(
      `https://wa.me/${whatsappNumber}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  // =====================================================
  // OPEN CHAT
  // =====================================================

  async function openChat(userId) {

    if (
      !userId ||
      userId === session?.user?.id
    ) {
      return;
    }


    setChatUser({
      id: userId,
    });


    setChatMessages([]);

    setChatText("");

    setChatLoading(true);


    const {
      data: person,
    } = await supabase
      .from("profiles")
      .select(
        "id,name,role,phone,location,photo_url"
      )
      .eq("id", userId)
      .maybeSingle();


    setChatUser(person);


    await loadChatMessages(userId);

    setChatLoading(false);
  }


  // =====================================================
  // LOAD CHAT
  // =====================================================

  async function loadChatMessages(
    receiverId
  ) {

    if (!session?.user?.id) return;


    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`
      )
      .order("created_at", {
        ascending: true,
      });


    if (error) {

      console.error(
        "Chat load error:",
        error
      );

      return;
    }


    setChatMessages(data || []);
  }


  // =====================================================
  // SEND CHAT MESSAGE
  // =====================================================

  async function sendChatMessage() {

    const text =
      chatText.trim();


    if (
      !text ||
      !chatUser?.id ||
      !session?.user?.id
    ) {
      return;
    }


    setChatSending(true);


    try {

      const {
        data,
        error,
      } = await supabase
        .from("messages")
        .insert({
          sender_id:
            session.user.id,

          receiver_id:
            chatUser.id,

          body: text,
        })
        .select()
        .single();


      if (error) throw error;


      setChatMessages((old) => [
        ...old,
        data,
      ]);


      setChatText("");


    } catch (error) {

      console.error(error);

      alert(
        error.message ||
          "Message could not be sent."
      );

    } finally {

      setChatSending(false);
    }
  }


  // =====================================================
  // REALTIME CHAT
  // =====================================================

  useEffect(() => {

    if (
      !session?.user?.id ||
      !chatUser?.id
    ) {
      return;
    }


    const channel =
      supabase
        .channel(
          `requirement-chat-${session.user.id}-${chatUser.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {

            const message =
              payload.new;


            const belongsToChat =
              (
                message.sender_id ===
                  session.user.id &&
                message.receiver_id ===
                  chatUser.id
              ) ||
              (
                message.sender_id ===
                  chatUser.id &&
                message.receiver_id ===
                  session.user.id
              );


            if (!belongsToChat) {
              return;
            }


            setChatMessages((old) => {

              if (
                old.some(
                  (item) =>
                    item.id ===
                    message.id
                )
              ) {
                return old;
              }


              return [
                ...old,
                message,
              ];
            });
          }
        )
        .subscribe();


    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, [
    session?.user?.id,
    chatUser?.id,
  ]);


  // =====================================================
  // DELETE REQUIREMENT
  // =====================================================

  async function deleteRequirement(
    requirement
  ) {

    if (
      requirement.user_id !==
      session?.user?.id
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        "Are you sure you want to delete this requirement?"
      );


    if (!confirmed) return;


    const {
      error,
    } = await supabase
      .from("requirements")
      .delete()
      .eq(
        "id",
        requirement.id
      )
      .eq(
        "user_id",
        session.user.id
      );


    if (error) {

      alert(error.message);

      return;
    }


    setRequirements((old) =>
      old.filter(
        (item) =>
          item.id !==
          requirement.id
      )
    );


    setShowDetails(false);

    setSelectedRequirement(null);
  }


  // =====================================================
  // LOGOUT
  // =====================================================

  async function logout() {

    await supabase.auth.signOut();


    localStorage.removeItem(
      "timbermart_selected_role"
    );

    localStorage.removeItem(
      "timbermart_chat_user"
    );


    navigate("/login", {
      replace: true,
    });
  }


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredRequirements =
    useMemo(() => {

      const q =
        search
          .trim()
          .toLowerCase();


      if (!q) {
        return requirements;
      }


      return requirements.filter(
        (item) =>
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

    }, [
      requirements,
      search,
    ]);


  // =====================================================
  // LOADER
  // =====================================================

  if (loading) {

    return (
      <TreeLoader
        text="Growing your requirements..."
      />
    );
  }


  return (
    <div className="rw-app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="rw-header">

        <button
          className="rw-mobile-menu"
          onClick={() =>
            setMobileMenu(
              (old) => !old
            )
          }
        >
          {mobileMenu ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>


        <button
          className="rw-brand"
          onClick={() =>
            navigate(-1)
          }
        >
          <span className="rw-brand-icon">
            🌳
          </span>

          <span>
            TimberMart
          </span>
        </button>


        <div className="rw-header-right">

          <button className="rw-icon-button">
            <Bell size={19} />
          </button>


          <button
            className="rw-profile-button"
            onClick={() =>
              openProfile(
                session.user.id
              )
            }
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
              {profile?.name ||
                "User"}
            </span>

          </button>

        </div>

      </header>


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`rw-sidebar ${
          mobileMenu
            ? "rw-sidebar-open"
            : ""
        }`}
      >

        <div className="rw-sidebar-brand">

          <div className="rw-sidebar-logo">
            🌳
          </div>

          <div>

            <strong>
              TimberMart
            </strong>

            <span>
              {profile?.role ||
                "Marketplace"}
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
              {profile?.name ||
                "User"}
            </strong>

            <span>
              {profile?.location ||
                "Location not added"}
            </span>

          </div>

        </div>


        <nav className="rw-nav">

          <button
            onClick={() =>
              navigate(-1)
            }
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
              openProfile(
                session.user.id
              )
            }
          >
            <User size={19} />
            My Profile
          </button>


          <button
            onClick={() =>
              navigate(
                "/settings"
              )
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
          onClick={() =>
            setMobileMenu(false)
          }
        />

      )}


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="rw-main">

        <div className="rw-container">

          <section className="rw-hero">

            <div>

              <div className="rw-kicker">
                TIMBERMART MARKETPLACE
              </div>

              <h1>
                Requirement Wall
              </h1>

              <p>
                Find timber requirements
                posted by buyers,
                merchants, sawmills and
                other TimberMart users.
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
                  onClick={
                    loadRequirements
                  }
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
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search requirements, timber, location..."
            />

          </div>


          <div className="rw-section-heading">

            <div>

              <h2>
                Latest Requirements
              </h2>

              <p>
                {filteredRequirements.length}{" "}
                requirement
                {filteredRequirements.length !==
                1
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


          {/* =================================================
              REQUIREMENT CARDS
          ================================================= */}

          {filteredRequirements.length ===
          0 ? (

            <div className="rw-empty">

              <div className="rw-empty-icon">
                📋
              </div>

              <h3>
                No requirements posted yet
              </h3>

              <p>
                Be the first person to
                post a timber requirement
                on TimberMart.
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

                  const photos =
                    requirement
                      .requirement_images ||
                    [];

                  const isMine =
                    requirement.user_id ===
                    session.user.id;


                  return (

                    <article
                      className="rw-card"
                      key={
                        requirement.id
                      }
                      onClick={() =>
                        openRequirement(
                          requirement
                        )
                      }
                    >

                      {/* PHOTO */}

                      {photos.length > 0 ? (

                        <div className="rw-card-photo">

                          <img
                            src={
                              photos[0]
                                .image_url
                            }
                            alt={
                              requirement.title
                            }
                          />

                          {photos.length >
                            1 && (

                            <span className="rw-photo-count">
                              <ImageIcon
                                size={14}
                              />
                              {photos.length}
                            </span>

                          )}

                        </div>

                      ) : (

                        <div className="rw-card-photo rw-no-photo">

                          <ImageIcon
                            size={34}
                          />

                          <span>
                            No photo
                          </span>

                        </div>

                      )}


                      <div className="rw-card-content">

                        <div className="rw-card-top">

                          <div
                            className="rw-person"
                            onClick={(e) => {
                              e.stopPropagation();

                              openProfile(
                                requirement.user_id
                              );
                            }}
                          >

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
                                ₹
                                {
                                  requirement.budget
                                }
                              </strong>
                            </div>

                          )}

                        </div>


                        <div className="rw-card-footer">

                          <button
                            onClick={(e) => {

                              e.stopPropagation();

                              openRequirement(
                                requirement
                              );

                            }}
                          >
                            <Eye size={17} />
                            View
                          </button>


                          {isMine && (

                            <button
                              className="rw-delete"
                              onClick={(e) => {

                                e.stopPropagation();

                                deleteRequirement(
                                  requirement
                                );

                              }}
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          )}

                        </div>

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
              TimberMart only connects
              buyers and sellers.
              Payments, transactions,
              delivery and commission
              are handled directly
              between users.
            </p>

          </div>

        </div>

      </main>


      {/* =================================================
          POST REQUIREMENT MODAL
      ================================================= */}

      {showPost && (

        <div
          className="rw-modal-overlay"
          onMouseDown={() =>
            !saving &&
            setShowPost(false)
          }
        >

          <div
            className="rw-modal rw-post-modal"
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
                  Tell TimberMart users
                  what you are looking for.
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
              onSubmit={
                createRequirement
              }
            >

              <div className="rw-field">

                <label>
                  Requirement Title *
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={
                    handleChange
                  }
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
                    value={
                      form.category
                    }
                    onChange={
                      handleChange
                    }
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
                    value={
                      form.quantity
                    }
                    onChange={
                      handleChange
                    }
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
                    value={
                      form.budget
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: 250000"
                  />

                </div>


                <div className="rw-field">

                  <label>
                    Location *
                  </label>

                  <input
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="City / District"
                    required
                  />

                </div>

              </div>


              {/* =================================================
                  PHOTO UPLOAD
              ================================================= */}

              <div className="rw-photo-upload">

                <div className="rw-photo-upload-title">

                  <div>
                    <strong>
                      Requirement Photos
                    </strong>

                    <span>
                      Upload up to 6 photos
                    </span>
                  </div>

                  <ImageIcon size={20} />

                </div>


                <label className="rw-upload-box">

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={
                      handlePhotoSelect
                    }
                    disabled={
                      requirementPhotos.length >= 6
                    }
                  />

                  <ImageIcon
                    size={27}
                  />

                  <strong>
                    Add Photos
                  </strong>

                  <span>
                    JPG, PNG, WEBP • Max 5 MB
                    each
                  </span>

                </label>


                {photoPreviews.length >
                  0 && (

                  <div className="rw-upload-previews">

                    {photoPreviews.map(
                      (
                        preview,
                        index
                      ) => (

                        <div
                          className="rw-preview-item"
                          key={`${preview}-${index}`}
                        >

                          <img
                            src={preview}
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
                            <X size={15} />
                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              <div className="rw-field">

                <label>
                  Requirement Details
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
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
                      <CheckCircle2
                        size={17}
                      />

                      Publish Requirement
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          REQUIREMENT DETAIL
      ================================================= */}

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
                  {
                    selectedRequirement.title
                  }
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

              {/* =================================================
                  LARGE PHOTO
              ================================================= */}

              {selectedRequirement
                .requirement_images
                ?.length > 0 && (

                <div className="rw-gallery">

                  <div className="rw-main-image">

                    <img
                      src={
                        activePhoto ||
                        selectedRequirement
                          .requirement_images[0]
                          .image_url
                      }
                      alt={
                        selectedRequirement.title
                      }
                    />

                  </div>


                  <div className="rw-thumbnail-row">

                    {selectedRequirement
                      .requirement_images
                      .map((photo) => (

                        <button
                          key={photo.id}
                          className={
                            activePhoto ===
                            photo.image_url
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setActivePhoto(
                              photo.image_url
                            )
                          }
                        >

                          <img
                            src={
                              photo.image_url
                            }
                            alt=""
                          />

                        </button>

                      ))}

                  </div>

                </div>

              )}


              <div className="rw-detail-grid">

                <div>
                  <span>
                    Category
                  </span>

                  <strong>
                    {
                      selectedRequirement.category_label ||
                      selectedRequirement.category ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Quantity
                  </span>

                  <strong>
                    {
                      selectedRequirement.quantity ||
                      "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Budget
                  </span>

                  <strong>
                    {
                      selectedRequirement.budget
                        ? `₹${selectedRequirement.budget}`
                        : "-"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Location
                  </span>

                  <strong>
                    {
                      selectedRequirement.location ||
                      "-"
                    }
                  </strong>
                </div>

              </div>


              <div className="rw-description-box">

                <h4>
                  Requirement Details
                </h4>

                <p>
                  {
                    selectedRequirement.description ||
                    "No details added."
                  }
                </p>

              </div>


              {/* OWNER */}

              <div className="rw-owner">

                <div className="rw-owner-avatar">

                  {selectedRequirement
                    .profiles
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

                    <User size={20} />

                  )}

                </div>


                <div>

                  <strong>
                    {
                      selectedRequirement
                        .profiles
                        ?.name ||
                      "TimberMart User"
                    }
                  </strong>

                  <span>
                    {
                      selectedRequirement
                        .profiles
                        ?.role ||
                      "User"
                    }
                  </span>

                </div>


                <button
                  onClick={() =>
                    openProfile(
                      selectedRequirement
                        .user_id
                    )
                  }
                >
                  View Profile
                </button>

              </div>


              {/* CONTACT */}

              {selectedRequirement.user_id !==
                session.user.id && (

                <div className="rw-contact">

                  <button
                    className="rw-call"
                    onClick={() =>
                      callUser(
                        selectedRequirement
                          .profiles
                          ?.phone
                      )
                    }
                  >
                    <Phone size={17} />
                    Call
                  </button>


                  <button
                    className="rw-whatsapp"
                    onClick={() =>
                      whatsappUser(
                        selectedRequirement
                          .profiles
                          ?.phone
                      )
                    }
                  >
                    <MessageCircle
                      size={17}
                    />
                    WhatsApp
                  </button>


                  <button
                    className="rw-chat"
                    onClick={() =>
                      openChat(
                        selectedRequirement
                          .user_id
                      )
                    }
                  >
                    <MessageCircle
                      size={17}
                    />
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


      {/* =================================================
          PROFILE MODAL
      ================================================= */}

      {showProfile &&
        selectedProfile && (

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
                    {
                      selectedProfile.location ||
                      "Location not added"
                    }
                  </span>

                </div>


                {selectedProfile.phone && (

                  <div>

                    <Phone size={17} />

                    <span>
                      {
                        selectedProfile.phone
                      }
                    </span>

                  </div>

                )}

              </div>


              {selectedProfile.bio && (

                <p className="rw-profile-bio">
                  {selectedProfile.bio}
                </p>

              )}


              {selectedProfile.id !==
                session.user.id && (

                <div className="rw-contact">

                  <button
                    className="rw-call"
                    onClick={() =>
                      callUser(
                        selectedProfile.phone
                      )
                    }
                  >
                    <Phone size={17} />
                    Call
                  </button>


                  <button
                    className="rw-whatsapp"
                    onClick={() =>
                      whatsappUser(
                        selectedProfile.phone
                      )
                    }
                  >
                    <MessageCircle
                      size={17}
                    />
                    WhatsApp
                  </button>


                  <button
                    className="rw-chat"
                    onClick={() =>
                      openChat(
                        selectedProfile.id
                      )
                    }
                  >
                    <MessageCircle
                      size={17}
                    />
                    Chat
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          REAL CHAT WINDOW
      ================================================= */}

      {chatUser && (

        <div className="rw-chat-window">

          <div className="rw-chat-header">

            <div className="rw-chat-person">

              <div className="rw-chat-avatar">

                {chatUser.photo_url ? (

                  <img
                    src={
                      chatUser.photo_url
                    }
                    alt=""
                  />

                ) : (

                  <User size={19} />

                )}

              </div>


              <div>

                <strong>
                  {chatUser.name ||
                    "TimberMart User"}
                </strong>

                <span>
                  {chatUser.role ||
                    "User"}
                </span>

              </div>

            </div>


            <button
              onClick={() =>
                setChatUser(null)
              }
            >
              <X size={19} />
            </button>

          </div>


          <div className="rw-chat-messages">

            {chatLoading ? (

              <div className="rw-chat-loading">

                <Loader2
                  className="rw-spin"
                  size={25}
                />

                Loading chat...

              </div>

            ) : chatMessages.length ===
              0 ? (

              <div className="rw-chat-empty">

                <MessageCircle
                  size={32}
                />

                <strong>
                  Start the conversation
                </strong>

                <span>
                  Send a message to
                  connect directly.
                </span>

              </div>

            ) : (

              chatMessages.map(
                (message) => {

                  const mine =
                    message.sender_id ===
                    session.user.id;


                  return (

                    <div
                      key={message.id}
                      className={
                        mine
                          ? "rw-message mine"
                          : "rw-message"
                      }
                    >

                      <div className="rw-message-bubble">
                        {message.body}
                      </div>

                    </div>

                  );

                }
              )

            )}

          </div>


          <div className="rw-chat-input">

            <input
              value={chatText}
              onChange={(e) =>
                setChatText(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {

                  e.preventDefault();

                  sendChatMessage();

                }

              }}
              placeholder="Type your message..."
            />


            <button
              onClick={
                sendChatMessage
              }
              disabled={
                chatSending ||
                !chatText.trim()
              }
            >

              {chatSending ? (

                <Loader2
                  size={18}
                  className="rw-spin"
                />

              ) : (

                <Send size={18} />

              )}

            </button>

          </div>

        </div>

      )}

    </div>
  );
}
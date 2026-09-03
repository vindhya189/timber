import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Briefcase,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Home,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  Send,
  Settings,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./WorkerDashboard.css";
import TreeLoader from "../components/TreeLoader";

const WORKER_SKILLS = [
  "Sawmill Machine Operator",
  "Log Cutting",
  "Timber Measurement",
  "Log Sorting",
  "Machine Maintenance",
  "Loading / Unloading",
  "Carpenter Helper",
  "Forklift Operator",
  "Other",
];

const WORK_TYPES = [
  "Full Time",
  "Part Time",
  "Project Based",
];

export default function WorkerDashboard() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);

  const [search, setSearch] = useState("");

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [showProfile, setShowProfile] = useState(false);
  const [showJob, setShowJob] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  const [showEmployer, setShowEmployer] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [form, setForm] = useState({
    age: "",
    gender: "",
    location: "",
    experience: "",
    experience_details: "",
    skills: [],
    work_type: "Full Time",
    expected_salary: "",
    availability: "Available Now",
  });

  useEffect(() => {
    loadWorkerDashboard();
  }, []);

  async function loadWorkerDashboard() {
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

      let { data: userProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentSession.user.id)
          .maybeSingle();

      if (profileError) {
        console.error(profileError);
      }

      if (!userProfile) {
        const newProfile = {
          id: currentSession.user.id,
          name:
            currentSession.user.user_metadata?.full_name ||
            currentSession.user.email?.split("@")[0] ||
            "Worker",
          role: "worker",
          phone: currentSession.user.phone || "",
          location: "",
          bio: "",
          photo_url: "",
        };

        const { data: createdProfile, error } =
          await supabase
            .from("profiles")
            .upsert(newProfile)
            .select()
            .single();

        if (error) throw error;

        userProfile = createdProfile;
      }

      if (userProfile.role !== "worker") {
        navigate(`/dashboard/${userProfile.role}`, {
          replace: true,
        });
        return;
      }

      setProfile(userProfile);

      await Promise.all([
        loadWorkerProfile(currentSession.user.id),
        loadJobs(),
        loadApplications(currentSession.user.id),
      ]);
    } catch (error) {
      console.error("Worker dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkerProfile(userId) {
    const { data, error } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Worker profile:", error);
      return;
    }

    setWorkerProfile(data || null);

    if (data) {
      setForm({
        age: data.age || "",
        gender: data.gender || "",
        location: data.location || "",
        experience: data.experience || "",
        experience_details:
          data.experience_details || "",
        skills: data.skills || [],
        work_type: data.work_type || "Full Time",
        expected_salary:
          data.expected_salary || "",
        availability:
          data.availability || "Available Now",
      });
    }
  }

  async function loadJobs() {
    const { data, error } = await supabase
      .from("jobs")
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
      console.error("Jobs:", error);
      return;
    }

    setJobs(data || []);
  }

  async function loadApplications(userId) {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("worker_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Applications:", error);
      return;
    }

    setApplications(data || []);
  }

  function updateForm(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  function toggleSkill(skill) {
    setForm((old) => ({
      ...old,
      skills: old.skills.includes(skill)
        ? old.skills.filter((item) => item !== skill)
        : [...old.skills, skill],
    }));
  }

  function selectPhoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadWorkerPhoto() {
    if (!photoFile || !session?.user?.id) {
      return profile?.photo_url || "";
    }

    const extension =
      photoFile.name.split(".").pop()?.toLowerCase() ||
      "jpg";

    const path =
      `${session.user.id}/worker-${Date.now()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("worker-photos")
        .upload(path, photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      console.error(uploadError);
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("worker-photos")
      .getPublicUrl(path);

    return publicUrl;
  }

  async function saveWorkerProfile() {
    if (!session?.user?.id) return;

    if (!form.location.trim()) {
      alert("Please enter your location.");
      setWizardStep(2);
      return;
    }

    if (!form.experience) {
      alert("Please select your experience.");
      setWizardStep(2);
      return;
    }

    if (form.skills.length === 0) {
      alert("Please select at least one skill.");
      setWizardStep(3);
      return;
    }

    if (!form.work_type) {
      alert("Please select work type.");
      setWizardStep(4);
      return;
    }

    setSaving(true);

    try {
      let photoUrl = profile?.photo_url || "";

      if (photoFile) {
        photoUrl = await uploadWorkerPhoto();
      }

      const workerPayload = {
        user_id: session.user.id,
        age: form.age || null,
        gender: form.gender || null,
        location: form.location,
        experience: form.experience,
        experience_details:
          form.experience_details || "",
        skills: form.skills,
        work_type: form.work_type,
        expected_salary:
          form.expected_salary || "",
        availability: form.availability,
      };

      const { data: savedWorker, error } =
        await supabase
          .from("worker_profiles")
          .upsert(workerPayload, {
            onConflict: "user_id",
          })
          .select()
          .single();

      if (error) throw error;

      const { data: updatedProfile, error: profileUpdateError } =
        await supabase
          .from("profiles")
          .update({
            location: form.location,
            photo_url: photoUrl,
          })
          .eq("id", session.user.id)
          .select()
          .single();

      if (profileUpdateError) {
        console.error(profileUpdateError);
      }

      setWorkerProfile(savedWorker);

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      setPhotoFile(null);
      setPhotoPreview("");

      setShowWizard(false);
      setWizardStep(1);

      alert("✅ Worker profile registered successfully.");

      await loadWorkerProfile(session.user.id);
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "Unable to save worker profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function openJob(job) {
    setSelectedJob(job);
    setSelectedEmployer(job.profiles || null);
    setShowJob(true);
  }

  async function openEmployerProfile(userId) {
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
      setSelectedEmployer(data);
      setShowEmployer(true);
    }
  }

  async function applyForJob(job) {
    if (!session?.user?.id) return;

    const alreadyApplied = applications.some(
      (application) =>
        application.job_id === job.id
    );

    if (alreadyApplied) {
      alert("You already applied for this job.");
      return;
    }

    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        job_id: job.id,
        worker_id: session.user.id,
        status: "Applied",
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setApplications((old) => [data, ...old]);

    alert("✅ Application submitted.");

    setShowJob(false);
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
    if (!userId) return;

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
      setSelectedEmployer(person);
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
    if (!session?.user?.id || !selectedEmployer?.id) {
      return;
    }

    const channel = supabase
      .channel(
        `worker-chat-${selectedEmployer.id}`
      )
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
            (message.sender_id ===
              session.user.id &&
              message.receiver_id ===
                selectedEmployer.id) ||
            (message.sender_id ===
              selectedEmployer.id &&
              message.receiver_id ===
                session.user.id);

          if (belongs) {
            setMessages((old) => [
              ...old,
              message,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    session?.user?.id,
    selectedEmployer?.id,
  ]);

  async function sendMessage(event) {
    event.preventDefault();

    const body = messageText.trim();

    if (!body || !selectedEmployer?.id) {
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        receiver_id: selectedEmployer.id,
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

  const filteredJobs = useMemo(() => {
    const value = search.trim().toLowerCase();

    let result = jobs;

    if (value) {
      result = result.filter((job) =>
        [
          job.title,
          job.category,
          job.job_type,
          job.experience,
          job.salary,
          job.location,
          job.description,
          job.profiles?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(value)
      );
    }

    return result;
  }, [jobs, search]);

  const profileCompleted =
    !!workerProfile &&
    !!workerProfile.location &&
    !!workerProfile.experience &&
    workerProfile.skills?.length > 0 &&
    !!workerProfile.work_type;

  const appliedJobIds = new Set(
    applications.map((item) => item.job_id)
  );

  if (loading) {
  return (
    <TreeLoader text="Growing your requirements..." />
  );
}

  return (
    <div className="worker-app">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="worker-header">

        <button
          className="worker-menu-btn"
          onClick={() =>
            setMobileMenu((old) => !old)
          }
        >
          {mobileMenu ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>


        <div className="worker-logo">
          <span>🌳</span>
          TimberMart
        </div>


        <div className="worker-header-right">

          <button className="worker-notification">
            <Bell size={20} />
          </button>


          <button
            className="worker-header-user"
            onClick={() => {
              setSelectedEmployer(profile);
              setShowEmployer(true);
            }}
          >

            <span className="worker-header-avatar">

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
              {profile?.name || "Worker"}
            </span>

          </button>

        </div>

      </header>


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`worker-sidebar ${
          mobileMenu ? "open" : ""
        }`}
      >

        <div>

          <div className="worker-sidebar-brand">

            <div>👷</div>

            <section>
              <strong>TimberMart</strong>
              <span>Worker</span>
            </section>

          </div>


          <div className="worker-account">

            <div className="worker-account-avatar">

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
                {profile?.name || "Worker"}
              </strong>

              <span>
                {profile?.location ||
                  "Location not added"}
              </span>

            </div>

          </div>


          <nav className="worker-nav">

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
                setWizardStep(1);
                setShowWizard(true);
              }}
            >
              <Edit3 size={18} />
              Create / Edit Profile
            </button>


            <button
              onClick={() => {
                setMobileMenu(false);
                setSelectedEmployer(profile);
                setShowEmployer(true);
              }}
            >
              <User size={18} />
              My Profile
            </button>


            <button
              onClick={() =>
                document
                  .getElementById("jobs")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              <Briefcase size={18} />
              Find Jobs
            </button>


            <button
              onClick={() =>
                document
                  .getElementById("applications")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              <Check size={18} />
              My Applications
            </button>


            <button
              onClick={() =>
                navigate("/settings")
              }
            >
              <Settings size={18} />
              Settings
            </button>

          </nav>

        </div>


        <div className="worker-sidebar-bottom">

          <div className="worker-direct-note">
            🤝 We Connect. You Deal Directly.
          </div>

          <button
            className="worker-logout"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>


      {mobileMenu && (
        <div
          className="worker-overlay"
          onClick={() =>
            setMobileMenu(false)
          }
        />
      )}


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="worker-main">

        <div className="worker-container">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="worker-hero">

            <div className="worker-hero-content">

              <span className="worker-kicker">
                👷 WORKER
              </span>

              <h1>
                Hello, {profile?.name || "Worker"}!
              </h1>

              <p>
                Find suitable timber jobs,
                build your career and connect
                directly with employers.
              </p>


              <div className="worker-location">

                <MapPin size={16} />

                {profile?.location ||
                  workerProfile?.location ||
                  "Add your location"}

              </div>


              <div className="worker-hero-actions">

                <button
                  className="worker-primary"
                  onClick={() => {
                    setWizardStep(1);
                    setShowWizard(true);
                  }}
                >
                  <Edit3 size={17} />

                  {profileCompleted
                    ? "Edit Profile"
                    : "Create Profile"}

                </button>


                <button
                  className="worker-secondary"
                  onClick={() =>
                    document
                      .getElementById("jobs")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  <Briefcase size={17} />
                  Find Jobs
                </button>

              </div>

            </div>


            <div className="worker-hero-art">

              <div className="worker-person">
                👷
              </div>

              <div className="worker-wood">
                🪵
              </div>

            </div>

          </section>


          {/* =================================================
              ACCOUNT
          ================================================= */}

          <section className="worker-account-status">

            <div className="worker-status-left">

              <div className="worker-status-avatar">

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
                  {profile?.name || "Worker"}
                </strong>

                <span>
                  {workerProfile?.skills?.[0] ||
                    "Worker Profile"}
                </span>

              </div>

            </div>


            <div
              className={
                profileCompleted
                  ? "worker-status-complete"
                  : "worker-status-incomplete"
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
                  Profile Incomplete
                </>
              )}
            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="worker-section">

            <div className="worker-section-title">

              <div>
                <h2>Worker Tools</h2>

                <p>
                  Find jobs and manage your worker profile.
                </p>
              </div>

            </div>


            <div className="worker-tools">

              <button
                onClick={() => {
                  setWizardStep(1);
                  setShowWizard(true);
                }}
              >
                <span>📝</span>

                <strong>
                  Create Profile
                </strong>

                <small>
                  Register your skills
                </small>
              </button>


              <button
                onClick={() =>
                  document
                    .getElementById("jobs")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                <span>🔎</span>

                <strong>
                  Find Jobs
                </strong>

                <small>
                  Search suitable jobs
                </small>
              </button>


              <button
                onClick={() =>
                  document
                    .getElementById("applications")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                <span>📄</span>

                <strong>
                  My Jobs
                </strong>

                <small>
                  View applications
                </small>
              </button>


              <button
                onClick={() => {
                  setSelectedEmployer(profile);
                  setShowEmployer(true);
                }}
              >
                <span>👤</span>

                <strong>
                  My Profile
                </strong>

                <small>
                  View your public profile
                </small>
              </button>

            </div>

          </section>


          {/* =================================================
              PROFILE INCOMPLETE
          ================================================= */}

          {!profileCompleted && (

            <section className="worker-profile-banner">

              <div className="worker-banner-icon">
                📝
              </div>

              <div>

                <strong>
                  Complete your worker profile
                </strong>

                <p>
                  Employers can find you based on
                  your skills, experience and location.
                </p>

              </div>

              <button
                onClick={() => {
                  setWizardStep(1);
                  setShowWizard(true);
                }}
              >
                Complete Now
                <ChevronRight size={16} />
              </button>

            </section>

          )}


          {/* =================================================
              JOB WALL
          ================================================= */}

          <section
            className="worker-section"
            id="jobs"
          >

            <div className="worker-section-title">

              <div>

                <h2>
                  Find Jobs
                </h2>

                <p>
                  Jobs posted by timber businesses
                  and employers.
                </p>

              </div>

              <span className="worker-job-count">
                {filteredJobs.length} Jobs
              </span>

            </div>


            <div className="worker-job-search">

              <Search size={18} />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search jobs, company, location..."
              />

            </div>


            {filteredJobs.length === 0 ? (

              <div className="worker-empty">

                <div>🔎</div>

                <h3>
                  No jobs found
                </h3>

                <p>
                  Jobs posted by employers will
                  appear here.
                </p>

              </div>

            ) : (

              <div className="worker-jobs-grid">

                {filteredJobs.map((job) => {

                  const applied =
                    appliedJobIds.has(job.id);

                  return (
                    <article
                      className="worker-job-card"
                      key={job.id}
                    >

                      <div className="worker-job-top">

                        <div className="worker-company-avatar">

                          {job.profiles?.photo_url ? (
                            <img
                              src={
                                job.profiles.photo_url
                              }
                              alt=""
                            />
                          ) : (
                            <Briefcase size={20} />
                          )}

                        </div>


                        <div>

                          <strong>
                            {job.profiles?.name ||
                              "Timber Business"}
                          </strong>

                          <span>
                            {job.location ||
                              job.profiles?.location ||
                              "Location not added"}
                          </span>

                        </div>

                      </div>


                      <div className="worker-job-badge">
                        {job.category ||
                          "Timber Job"}
                      </div>


                      <h3>
                        {job.title}
                      </h3>


                      <p>
                        {job.description ||
                          "No job description added."}
                      </p>


                      <div className="worker-job-details">

                        <span>
                          <Briefcase size={14} />
                          {job.job_type ||
                            "Work Type not added"}
                        </span>

                        <span>
                          <Clock3 size={14} />
                          {job.experience ||
                            "Experience not specified"}
                        </span>

                        <span>
                          💰
                          {job.salary ||
                            "Salary not specified"}
                        </span>

                      </div>


                      <div className="worker-job-footer">

                        <small>
                          {job.positions
                            ? `${job.positions} position(s)`
                            : ""}
                        </small>


                        <button
                          onClick={() =>
                            openJob(job)
                          }
                        >
                          <Eye size={16} />
                          View
                        </button>

                      </div>


                      {applied && (
                        <div className="worker-applied">
                          <Check size={14} />
                          Applied
                        </div>
                      )}

                    </article>
                  );
                })}

              </div>

            )}

          </section>


          {/* =================================================
              APPLICATIONS
          ================================================= */}

          <section
            className="worker-section"
            id="applications"
          >

            <div className="worker-section-title">

              <div>

                <h2>
                  My Applications
                </h2>

                <p>
                  Track jobs you have applied for.
                </p>

              </div>

            </div>


            {applications.length === 0 ? (

              <div className="worker-empty">

                <div>📄</div>

                <h3>
                  No applications yet
                </h3>

                <p>
                  Apply for a job and your
                  application will appear here.
                </p>

              </div>

            ) : (

              <div className="worker-applications">

                {applications.map((application) => {

                  const job = jobs.find(
                    (item) =>
                      item.id ===
                      application.job_id
                  );

                  return (
                    <div
                      className="worker-application"
                      key={application.id}
                    >

                      <div className="worker-application-icon">
                        💼
                      </div>

                      <div>

                        <strong>
                          {job?.title ||
                            "Job Application"}
                        </strong>

                        <span>
                          Applied on{" "}
                          {new Date(
                            application.created_at
                          ).toLocaleDateString()}
                        </span>

                      </div>

                      <span
                        className={`worker-application-status ${String(
                          application.status ||
                            "Applied"
                        ).toLowerCase()}`}
                      >
                        {application.status ||
                          "Applied"}
                      </span>

                    </div>
                  );
                })}

              </div>

            )}

          </section>


          {/* =================================================
              DISCLAIMER
          ================================================= */}

          <footer className="worker-footer">

            <div className="worker-footer-note">

              <strong>
                🌳 TimberMart only connects users.
              </strong>

              <span>
                We do not provide jobs directly.
              </span>

            </div>


            <div>
              <Check size={18} />
              No Commission
            </div>


            <div>
              <Phone size={18} />
              Direct Contact
            </div>


            <div>
              <MapPin size={18} />
              Nearby Jobs
            </div>


            <div>
              🛡️
              100% Secure
            </div>


            <div className="worker-footer-connect">
              🤝
              <strong>
                We Connect. You Deal Directly.
              </strong>
            </div>

          </footer>

        </div>

      </main>


      {/* =====================================================
          CREATE WORKER PROFILE WIZARD
      ===================================================== */}

      {showWizard && (

        <div
          className="worker-modal-overlay"
          onMouseDown={() =>
            !saving &&
            setShowWizard(false)
          }
        >

          <div
            className="worker-modal worker-wizard"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="worker-modal-header">

              <div>

                <span>
                  WORKER PROFILE
                </span>

                <h2>

                  {wizardStep === 1 &&
                    "Create Profile"}

                  {wizardStep === 2 &&
                    "Profile Details"}

                  {wizardStep === 3 &&
                    "Skills"}

                  {wizardStep === 4 &&
                    "Work & Salary"}

                  {wizardStep === 5 &&
                    "Review Profile"}

                </h2>

                <p>
                  Build your worker profile to
                  find suitable jobs.
                </p>

              </div>


              <button
                onClick={() =>
                  setShowWizard(false)
                }
              >
                <X size={20} />
              </button>

            </div>


            {/* STEPS */}

            <div className="worker-steps">

              {[
                "Basic Info",
                "Details",
                "Skills",
                "Work",
                "Review",
              ].map((item, index) => {

                const step = index + 1;

                return (
                  <div
                    key={item}
                    className={
                      wizardStep >= step
                        ? "active"
                        : ""
                    }
                  >

                    <span>
                      {step}
                    </span>

                    <small>
                      {item}
                    </small>

                  </div>
                );

              })}

            </div>


            <div className="worker-wizard-body">

              {/* =================================================
                  STEP 1
              ================================================= */}

              {wizardStep === 1 && (

                <div className="worker-wizard-step">

                  <h3>
                    Create Profile
                  </h3>

                  <p>
                    Add your profile photo and
                    basic information.
                  </p>


                  <label className="worker-photo-upload">

                    <div className="worker-photo-circle">

                      {photoPreview ||
                      profile?.photo_url ? (

                        <img
                          src={
                            photoPreview ||
                            profile.photo_url
                          }
                          alt=""
                        />

                      ) : (

                        <Camera size={27} />

                      )}

                    </div>


                    <strong>
                      Add Photo
                    </strong>

                    <span>
                      Profile photo
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={selectPhoto}
                    />

                  </label>


                  <label>
                    Full Name
                  </label>

                  <input
                    className="worker-input"
                    value={
                      profile?.name || ""
                    }
                    readOnly
                  />


                  <label>
                    Age
                  </label>

                  <input
                    className="worker-input"
                    type="number"
                    min="18"
                    max="70"
                    value={form.age}
                    onChange={(e) =>
                      updateForm(
                        "age",
                        e.target.value
                      )
                    }
                    placeholder="Enter your age"
                  />


                  <label>
                    Gender
                  </label>

                  <select
                    className="worker-input"
                    value={form.gender}
                    onChange={(e) =>
                      updateForm(
                        "gender",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select gender
                    </option>

                    <option>
                      Male
                    </option>

                    <option>
                      Female
                    </option>

                    <option>
                      Other
                    </option>

                  </select>


                  <div className="worker-wizard-buttons">

                    <button
                      className="primary"
                      onClick={() =>
                        setWizardStep(2)
                      }
                    >
                      Next
                      <ChevronRight size={17} />
                    </button>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 2
              ================================================= */}

              {wizardStep === 2 && (

                <div className="worker-wizard-step">

                  <h3>
                    Profile Details
                  </h3>

                  <p>
                    Tell employers where you work
                    and your experience.
                  </p>


                  <label>
                    Location *
                  </label>

                  <div className="worker-input-icon">

                    <MapPin size={17} />

                    <input
                      value={form.location}
                      onChange={(e) =>
                        updateForm(
                          "location",
                          e.target.value
                        )
                      }
                      placeholder="City, District, State"
                    />

                  </div>


                  <label>
                    Experience *
                  </label>

                  <select
                    className="worker-input"
                    value={form.experience}
                    onChange={(e) =>
                      updateForm(
                        "experience",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select experience
                    </option>

                    <option>
                      Fresher
                    </option>

                    <option>
                      1 Year
                    </option>

                    <option>
                      2 Years
                    </option>

                    <option>
                      3 Years
                    </option>

                    <option>
                      5 Years
                    </option>

                    <option>
                      8+ Years
                    </option>

                  </select>


                  <label>
                    Work Experience Details
                  </label>

                  <textarea
                    className="worker-input"
                    rows="5"
                    maxLength="200"
                    value={
                      form.experience_details
                    }
                    onChange={(e) =>
                      updateForm(
                        "experience_details",
                        e.target.value
                      )
                    }
                    placeholder="Describe your previous work experience..."
                  />


                  <div className="worker-wizard-buttons">

                    <button
                      onClick={() =>
                        setWizardStep(1)
                      }
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>

                    <button
                      className="primary"
                      onClick={() => {

                        if (
                          !form.location.trim()
                        ) {
                          alert(
                            "Please enter your location."
                          );
                          return;
                        }

                        if (!form.experience) {
                          alert(
                            "Please select experience."
                          );
                          return;
                        }

                        setWizardStep(3);
                      }}
                    >
                      Next
                      <ChevronRight size={17} />
                    </button>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 3
              ================================================= */}

              {wizardStep === 3 && (

                <div className="worker-wizard-step">

                  <h3>
                    Select Your Skills
                  </h3>

                  <p>
                    Select all the jobs you can do.
                  </p>


                  <div className="worker-skills">

                    {WORKER_SKILLS.map((skill) => {

                      const selected =
                        form.skills.includes(skill);

                      return (
                        <button
                          key={skill}
                          className={
                            selected
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            toggleSkill(skill)
                          }
                        >

                          <span>
                            {selected && (
                              <Check size={14} />
                            )}
                          </span>

                          {skill}

                        </button>
                      );

                    })}

                  </div>


                  <div className="worker-wizard-buttons">

                    <button
                      onClick={() =>
                        setWizardStep(2)
                      }
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>

                    <button
                      className="primary"
                      onClick={() => {

                        if (
                          form.skills.length === 0
                        ) {
                          alert(
                            "Select at least one skill."
                          );
                          return;
                        }

                        setWizardStep(4);
                      }}
                    >
                      Next
                      <ChevronRight size={17} />
                    </button>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 4
              ================================================= */}

              {wizardStep === 4 && (

                <div className="worker-wizard-step">

                  <h3>
                    Work & Salary
                  </h3>

                  <p>
                    Tell employers your preferred
                    work and salary.
                  </p>


                  <label>
                    Work Type *
                  </label>

                  <select
                    className="worker-input"
                    value={form.work_type}
                    onChange={(e) =>
                      updateForm(
                        "work_type",
                        e.target.value
                      )
                    }
                  >

                    {WORK_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                        >
                          {type}
                        </option>
                      )
                    )}

                  </select>


                  <label>
                    Expected Salary / Wage
                  </label>

                  <input
                    className="worker-input"
                    value={
                      form.expected_salary
                    }
                    onChange={(e) =>
                      updateForm(
                        "expected_salary",
                        e.target.value
                      )
                    }
                    placeholder="Example: ₹18,000 - ₹22,000 / Month"
                  />


                  <label>
                    Availability
                  </label>

                  <select
                    className="worker-input"
                    value={
                      form.availability
                    }
                    onChange={(e) =>
                      updateForm(
                        "availability",
                        e.target.value
                      )
                    }
                  >

                    <option>
                      Available Now
                    </option>

                    <option>
                      Available Soon
                    </option>

                    <option>
                      Not Available
                    </option>

                  </select>


                  <div className="worker-available-preview">

                    <span
                      className={
                        form.availability ===
                        "Available Now"
                          ? "dot on"
                          : "dot"
                      }
                    />

                    {form.availability}

                  </div>


                  <div className="worker-wizard-buttons">

                    <button
                      onClick={() =>
                        setWizardStep(3)
                      }
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>

                    <button
                      className="primary"
                      onClick={() =>
                        setWizardStep(5)
                      }
                    >
                      Review
                      <ChevronRight size={17} />
                    </button>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 5
              ================================================= */}

              {wizardStep === 5 && (

                <div className="worker-wizard-step">

                  <h3>
                    Review Profile
                  </h3>

                  <p>
                    Check your details before
                    registering your profile.
                  </p>


                  <div className="worker-review">

                    <div className="worker-review-avatar">

                      {photoPreview ||
                      profile?.photo_url ? (

                        <img
                          src={
                            photoPreview ||
                            profile.photo_url
                          }
                          alt=""
                        />

                      ) : (

                        <User size={35} />

                      )}

                    </div>


                    <h3>
                      {profile?.name ||
                        "Worker"}
                    </h3>


                    <div className="worker-review-row">
                      <span>
                        Location
                      </span>

                      <strong>
                        {form.location ||
                          "-"}
                      </strong>
                    </div>


                    <div className="worker-review-row">
                      <span>
                        Experience
                      </span>

                      <strong>
                        {form.experience ||
                          "-"}
                      </strong>
                    </div>


                    <div className="worker-review-row">
                      <span>
                        Work Type
                      </span>

                      <strong>
                        {form.work_type ||
                          "-"}
                      </strong>
                    </div>


                    <div className="worker-review-row">
                      <span>
                        Expected Salary
                      </span>

                      <strong>
                        {form.expected_salary ||
                          "Not specified"}
                      </strong>
                    </div>


                    <div className="worker-review-row">
                      <span>
                        Availability
                      </span>

                      <strong>
                        {form.availability}
                      </strong>
                    </div>


                    <div className="worker-review-skills">

                      {form.skills.map(
                        (skill) => (
                          <span key={skill}>
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                  </div>


                  <div className="worker-wizard-buttons">

                    <button
                      onClick={() =>
                        setWizardStep(4)
                      }
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>

                    <button
                      className="primary"
                      onClick={
                        saveWorkerProfile
                      }
                      disabled={saving}
                    >
                      {saving
                        ? "Registering..."
                        : "Register Profile"}
                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          JOB DETAILS
      ===================================================== */}

      {showJob && selectedJob && (

        <div
          className="worker-modal-overlay"
          onMouseDown={() =>
            setShowJob(false)
          }
        >

          <div
            className="worker-modal worker-job-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="worker-modal-header">

              <div>

                <span>
                  JOB DETAILS
                </span>

                <h2>
                  {selectedJob.title}
                </h2>

                <p>
                  {selectedJob.profiles?.name ||
                    "Timber Employer"}
                </p>

              </div>


              <button
                onClick={() =>
                  setShowJob(false)
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="worker-job-detail-body">

              <div className="worker-job-detail-company">

                <div className="worker-company-avatar big">

                  {selectedJob.profiles
                    ?.photo_url ? (
                    <img
                      src={
                        selectedJob.profiles
                          .photo_url
                      }
                      alt=""
                    />
                  ) : (
                    <Briefcase size={27} />
                  )}

                </div>


                <div>

                  <strong>
                    {selectedJob.profiles?.name ||
                      "Timber Employer"}
                  </strong>

                  <span>
                    {selectedJob.location ||
                      selectedJob.profiles
                        ?.location ||
                      "Location not added"}
                  </span>

                </div>


                <button
                  onClick={() =>
                    openEmployerProfile(
                      selectedJob.user_id
                    )
                  }
                >
                  <User size={15} />
                  Profile
                </button>

              </div>


              <div className="worker-job-detail-grid">

                <div>
                  <span>
                    Work Type
                  </span>

                  <strong>
                    {selectedJob.job_type ||
                      "Not specified"}
                  </strong>
                </div>


                <div>
                  <span>
                    Experience
                  </span>

                  <strong>
                    {selectedJob.experience ||
                      "Not specified"}
                  </strong>
                </div>


                <div>
                  <span>
                    Salary
                  </span>

                  <strong>
                    {selectedJob.salary ||
                      "Not specified"}
                  </strong>
                </div>


                <div>
                  <span>
                    Positions
                  </span>

                  <strong>
                    {selectedJob.positions ||
                      "Not specified"}
                  </strong>
                </div>

              </div>


              <div className="worker-job-description">

                <h4>
                  Job Description
                </h4>

                <p>
                  {selectedJob.description ||
                    "No description provided."}
                </p>

              </div>


              <div className="worker-job-description">

                <h4>
                  Location
                </h4>

                <p>
                  <MapPin size={16} />
                  {selectedJob.location ||
                    "Location not specified"}
                </p>

              </div>


              <div className="worker-contact-actions">

                <button
                  onClick={() =>
                    callUser(
                      selectedJob.profiles?.phone
                    )
                  }
                >
                  <Phone size={18} />
                  Call
                </button>


                <button
                  onClick={() =>
                    whatsappUser(
                      selectedJob.profiles?.phone
                    )
                  }
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>


                <button
                  onClick={() =>
                    startChat(
                      selectedJob.user_id
                    )
                  }
                >
                  <MessageCircle size={18} />
                  Chat
                </button>

              </div>


              <button
                className="worker-apply-button"
                disabled={appliedJobIds.has(
                  selectedJob.id
                )}
                onClick={() =>
                  applyForJob(selectedJob)
                }
              >

                {appliedJobIds.has(
                  selectedJob.id
                ) ? (
                  <>
                    <Check size={18} />
                    Already Applied
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Apply for Job
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          EMPLOYER / USER PROFILE
      ===================================================== */}

      {showEmployer && selectedEmployer && (

        <div
          className="worker-modal-overlay"
          onMouseDown={() =>
            setShowEmployer(false)
          }
        >

          <div
            className="worker-modal worker-user-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="worker-profile-cover">
              🌳
            </div>


            <button
              className="worker-profile-close"
              onClick={() =>
                setShowEmployer(false)
              }
            >
              <X size={20} />
            </button>


            <div className="worker-user-content">

              <div className="worker-big-avatar">

                {selectedEmployer.photo_url ? (
                  <img
                    src={
                      selectedEmployer.photo_url
                    }
                    alt=""
                  />
                ) : (
                  <User size={40} />
                )}

              </div>


              <h2>
                {selectedEmployer.name ||
                  "TimberMart User"}
              </h2>


              <span className="worker-user-role">
                {selectedEmployer.id ===
                session.user.id
                  ? "Worker"
                  : selectedEmployer.role ||
                    "Employer"}
              </span>


              {selectedEmployer.location && (

                <p className="worker-user-location">
                  <MapPin size={15} />
                  {selectedEmployer.location}
                </p>

              )}


              {selectedEmployer.bio && (

                <div className="worker-user-bio">
                  {selectedEmployer.bio}
                </div>

              )}


              {selectedEmployer.id ===
              session.user.id ? (

                <button
                  className="worker-edit-profile"
                  onClick={() => {
                    setShowEmployer(false);
                    setWizardStep(1);
                    setShowWizard(true);
                  }}
                >
                  <Edit3 size={17} />
                  Edit Worker Profile
                </button>

              ) : (

                <div className="worker-contact-actions">

                  <button
                    onClick={() =>
                      callUser(
                        selectedEmployer.phone
                      )
                    }
                  >
                    <Phone size={18} />
                    Call
                  </button>


                  <button
                    onClick={() =>
                      whatsappUser(
                        selectedEmployer.phone
                      )
                    }
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </button>


                  <button
                    onClick={() =>
                      startChat(
                        selectedEmployer.id
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

      {showChat && selectedEmployer && (

        <div
          className="worker-modal-overlay"
          onMouseDown={() =>
            setShowChat(false)
          }
        >

          <div
            className="worker-chat"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="worker-chat-header">

              <div>

                <div className="worker-chat-avatar">

                  {selectedEmployer.photo_url ? (
                    <img
                      src={
                        selectedEmployer.photo_url
                      }
                      alt=""
                    />
                  ) : (
                    <User size={19} />
                  )}

                </div>


                <div>

                  <strong>
                    {selectedEmployer.name ||
                      "TimberMart User"}
                  </strong>

                  <span>
                    {selectedEmployer.role ||
                      "Employer"}
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


            <div className="worker-chat-messages">

              {messages.length === 0 ? (

                <div className="worker-chat-empty">

                  <MessageCircle size={35} />

                  <h3>
                    Start Conversation
                  </h3>

                  <p>
                    Send a message to{" "}
                    {selectedEmployer.name ||
                      "this employer"}.
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
                          ? "worker-message mine"
                          : "worker-message"
                      }
                    >
                      {message.body}
                    </div>
                  );

                })

              )}

            </div>


            <form
              className="worker-chat-form"
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
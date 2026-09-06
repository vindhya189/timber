import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  BellRing,
  Check,
  CheckCircle2,
  Globe2,
  ImagePlus,
  LocateFixed,
  UploadCloud,
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
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SawmillDashboard.css";
import TreeLoader from "../components/TreeLoader";

const JOB_CATEGORIES = [
  "Machine Operator",
  "Saw Mill Operator",
  "Timber Cutter",
  "Log Cutter",
  "Log Loading",
  "Wood Processing",
  "Timber Measurement",
  "Machine Maintenance",
  "Other",
];

const JOB_TYPES = [
  "Full Time",
  "Part Time",
  "Project Based",
];

const EXPERIENCE_OPTIONS = [
  "Fresher",
  "1 - 2 Years",
  "2 - 5 Years",
  "5 - 8 Years",
  "8+ Years",
];

export default function SawmillDashboard() {
  const navigate = useNavigate();

  /* =====================================================
     AUTH / PROFILE
  ===================================================== */

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  /* =====================================================
     DATA
  ===================================================== */

  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [applications, setApplications] = useState([]);

  const [timberListings, setTimberListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [supplierMode, setSupplierMode] = useState("");
  const [showTimberModal, setShowTimberModal] = useState(false);
  const [timberSaving, setTimberSaving] = useState(false);
  const [timberPhotos, setTimberPhotos] = useState([]);
  const [timberForm, setTimberForm] = useState({
    title: "",
    wood_type: "Teak",
    product_type: "Timber",
    quantity: "",
    location: "",
    price: "",
    description: "",
  });

  /* =====================================================
     UI
  ===================================================== */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);

  const [searchJobs, setSearchJobs] = useState("");
  const [searchWorkers, setSearchWorkers] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");

  /* =====================================================
     JOB WIZARD
  ===================================================== */

  const [showPostJob, setShowPostJob] = useState(false);
  const [jobStep, setJobStep] = useState(1);

  const [jobForm, setJobForm] = useState({
    title: "",
    category: "",
    job_type: "Full Time",
    experience: "",
    salary: "",
    location: "",
    positions: "1",
    accommodation: false,
    food: false,
    description: "",
  });

  /* =====================================================
     MODALS
  ===================================================== */

  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] =
    useState(false);

  const [selectedWorker, setSelectedWorker] =
    useState(null);
  const [showWorkerProfile, setShowWorkerProfile] =
    useState(false);

  const [showMyProfile, setShowMyProfile] =
    useState(false);

  const [showApplications, setShowApplications] =
    useState(false);

  /* =====================================================
     CHAT
  ===================================================== */

  const [chatUser, setChatUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

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
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.user) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setSession(currentSession);

      let { data: userProfile, error } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentSession.user.id)
          .maybeSingle();

      if (error) {
        console.error(error);
      }

      if (!userProfile) {
        const newProfile = {
          id: currentSession.user.id,
          name:
            currentSession.user.user_metadata
              ?.full_name ||
            currentSession.user.email?.split(
              "@"
            )[0] ||
            "Sawmill",
          role: "sawmill",
          phone:
            currentSession.user.phone || "",
          location: "",
          bio: "",
          photo_url: "",
        };

        const { data, error: createError } =
          await supabase
            .from("profiles")
            .insert(newProfile)
            .select()
            .single();

        if (createError) {
          throw createError;
        }

        userProfile = data;
      }

      if (userProfile.role !== "sawmill") {
        navigate(
          `/dashboard/${userProfile.role}`,
          {
            replace: true,
          }
        );
        return;
      }

      setProfile(userProfile);

      setTimberForm((old) => ({
        ...old,
        location: userProfile.location || "",
      }));

      await Promise.all([
        loadJobs(currentSession.user.id),
        loadWorkers(),
        loadApplications(currentSession.user.id),
        loadTimberListings(),
        loadRequirements(),
        loadNotifications(currentSession.user.id),
      ]);
    } catch (error) {
      console.error(
        "Sawmill dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOAD JOBS
  ===================================================== */

  async function loadJobs(userId) {
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
      console.error("Jobs error:", error);
      return;
    }

    setJobs(data || []);
  }

  /* =====================================================
     LOAD WORKERS
  ===================================================== */

  async function loadWorkers() {
    const { data: workerData, error } =
      await supabase
        .from("worker_profiles")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Worker profiles:",
        error
      );
      return;
    }

    if (!workerData?.length) {
      setWorkers([]);
      return;
    }

    const userIds = workerData.map(
      (item) => item.user_id
    );

    const { data: profilesData } =
      await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

    const profileMap = {};

    (profilesData || []).forEach((item) => {
      profileMap[item.id] = item;
    });

    const merged = workerData.map(
      (worker) => ({
        ...worker,
        profile:
          profileMap[worker.user_id] || null,
      })
    );

    setWorkers(merged);
  }

  /* =====================================================
     LOAD APPLICATIONS
  ===================================================== */

  async function loadApplications(userId) {
    const { data: myJobs, error } =
      await supabase
        .from("jobs")
        .select("id")
        .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    const jobIds =
      myJobs?.map((job) => job.id) || [];

    if (!jobIds.length) {
      setApplications([]);
      return;
    }

    const { data: applicationData, error: appError } =
      await supabase
        .from("job_applications")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", {
          ascending: false,
        });

    if (appError) {
      console.error(
        "Application error:",
        appError
      );
      return;
    }

    if (!applicationData?.length) {
      setApplications([]);
      return;
    }

    const workerIds = [
      ...new Set(
        applicationData.map(
          (item) => item.worker_id
        )
      ),
    ];

    const { data: workerProfiles } =
      await supabase
        .from("profiles")
        .select("*")
        .in("id", workerIds);

    const profileMap = {};

    (workerProfiles || []).forEach(
      (person) => {
        profileMap[person.id] = person;
      }
    );

    const jobMap = {};

    (myJobs || []).forEach((job) => {
      jobMap[job.id] = job;
    });

    const result = applicationData.map(
      (application) => ({
        ...application,
        worker:
          profileMap[application.worker_id] ||
          null,
      })
    );

    setApplications(result);
  }


  /* =====================================================
     MARKETPLACE / REQUIREMENTS / NOTIFICATIONS
  ===================================================== */

  function getListingImages(item) {
    const nested = Array.isArray(item?.listing_images)
      ? [...item.listing_images]
          .filter((x) => x?.image_url)
          .sort(
            (a, b) =>
              Number(a?.sort_order || 0) - Number(b?.sort_order || 0)
          )
          .map((x) => x.image_url)
      : [];

    if (nested.length) return [...new Set(nested)];

    const candidates = [];
    if (item?.image_url) candidates.push(item.image_url);
    if (item?.photo_url) candidates.push(item.photo_url);

    for (const key of ["image_urls", "images", "photos"]) {
      const value = item?.[key];
      if (Array.isArray(value)) candidates.push(...value.filter(Boolean));
      else if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) candidates.push(...parsed.filter(Boolean));
        } catch {
          if (value.startsWith("http")) candidates.push(value);
        }
      }
    }

    return [...new Set(candidates)];
  }

  function getRequirementImages(item) {
    const candidates = [];
    for (const key of [
      "image_url",
      "photo_url",
      "image_urls",
      "images",
      "photos",
      "photo_urls",
    ]) {
      const value = item?.[key];
      if (Array.isArray(value)) candidates.push(...value.filter(Boolean));
      else if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) candidates.push(...parsed.filter(Boolean));
          else if (value.startsWith("http")) candidates.push(value);
        } catch {
          if (value.startsWith("http")) candidates.push(value);
        }
      }
    }
    if (Array.isArray(item?.requirement_images)) {
      candidates.push(
        ...item.requirement_images
          .map((x) => x?.image_url || x?.url)
          .filter(Boolean)
      );
    }
    return [...new Set(candidates)];
  }

  async function loadTimberListings() {
    let { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        listing_images (
          id,
          image_url,
          storage_path,
          sort_order
        )
      `)
      .in("role", [
        "farmer",
        "merchant",
        "sawmill",
        "sawmill_business",
        "carpenter",
        "timber_merchant",
      ])
      .order("created_at", { ascending: false });

    if (error) {
      const fallback = await supabase
        .from("listings")
        .select("*")
        .in("role", [
          "farmer",
          "merchant",
          "sawmill",
          "sawmill_business",
          "carpenter",
          "timber_merchant",
        ])
        .order("created_at", { ascending: false });
      data = fallback.data || [];
      error = fallback.error;
    }

    if (error) {
      console.error("Timber listings:", error);
      setTimberListings([]);
      return;
    }

    setTimberListings(data || []);
  }

  async function loadRequirements() {
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Requirements:", error);
      setRequirements([]);
      return;
    }

    let result = data || [];
    const ids = result.map((x) => x.id).filter(Boolean);

    if (ids.length) {
      const { data: imagesData } = await supabase
        .from("requirement_images")
        .select("id, requirement_id, image_url, storage_path, sort_order")
        .in("requirement_id", ids)
        .order("sort_order", { ascending: true });

      if (imagesData?.length) {
        const map = {};
        imagesData.forEach((img) => {
          if (!map[img.requirement_id]) map[img.requirement_id] = [];
          if (img.image_url) map[img.requirement_id].push(img.image_url);
        });
        result = result.map((item) => ({
          ...item,
          requirement_images: map[item.id] || [],
        }));
      }
    }

    setRequirements(result);
  }

  async function loadNotifications(userId = session?.user?.id) {
    if (!userId) return;
    setNotificationLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Notifications:", error);
      setNotifications([]);
    } else {
      setNotifications(data || []);
    }

    setNotificationLoading(false);
  }

  async function markNotificationRead(id) {
    if (!id) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", session?.user?.id);

    setNotifications((old) =>
      old.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  }

  async function markAllNotificationsRead() {
    if (!session?.user?.id) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    setNotifications((old) =>
      old.map((item) => ({ ...item, is_read: true }))
    );
  }

  async function updateSawmillLocation() {
    if (!session?.user?.id || !navigator.geolocation) {
      alert("Location service is not available in this browser.");
      return;
    }

    setLocationUpdating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          let location = profile?.location || "GPS location";
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            if (response.ok) {
              const data = await response.json();
              location =
                data?.display_name ||
                data?.address?.city ||
                data?.address?.town ||
                data?.address?.village ||
                location;
            }
          } catch {
            // keep fallback location
          }

          const { data, error } = await supabase
            .from("profiles")
            .update({
              latitude,
              longitude,
              location,
            })
            .eq("id", session.user.id)
            .select()
            .single();

          if (error) throw error;

          setProfile(data);
          setJobForm((old) => ({ ...old, location }));
          setTimberForm((old) => ({ ...old, location }));
          alert("✅ Business location updated.");
        } catch (error) {
          console.error("Location update:", error);
          alert(error?.message || "Unable to update location.");
        } finally {
          setLocationUpdating(false);
        }
      },
      (error) => {
        console.error(error);
        setLocationUpdating(false);
        alert("Please allow location permission and try again.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function chooseSupplierMode(mode) {
    setSupplierMode(mode);
    setMobileMenu(false);
    window.setTimeout(() => {
      document
        .getElementById("sawmill-timber-marketplace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const visibleTimberListings = useMemo(() => {
    return timberListings.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      const isMine = item.user_id === session?.user?.id;
      return isMine || !status || status === "approved" || status === "active";
    });
  }, [timberListings, session?.user?.id]);

  const filteredSupplierListings = useMemo(() => {
    if (!supplierMode) return visibleTimberListings;

    const text = visibleTimberListings
      .map((item) =>
        [
          item.title,
          item.wood_type,
          item.product_type,
          item.description,
          item.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
      )
      .map((value) => value);

    const matcher =
      supplierMode === "patta"
        ? /(patta\s*teak|patta|indian teak|native teak|farm teak)/i
        : /(imported teak|burma teak|myanmar teak|african teak|malaysian teak|indonesia|imported|foreign teak)/i;

    return visibleTimberListings.filter((item, index) =>
      matcher.test(text[index] || "")
    );
  }, [supplierMode, visibleTimberListings]);

  const unreadNotifications = notifications.filter(
    (item) => !item.is_read
  ).length;

  async function submitTimberListing(event) {
    event.preventDefault();

    if (!session?.user?.id) return;

    if (!timberForm.title.trim() || !timberForm.wood_type.trim()) {
      alert("Please enter listing title and wood type.");
      return;
    }

    if (!timberPhotos.length) {
      alert("Please upload at least one timber photo.");
      return;
    }

    setTimberSaving(true);

    try {
      const payload = {
        user_id: session.user.id,
        role: "sawmill",
        status: "pending",
        title: timberForm.title.trim(),
        wood_type: timberForm.wood_type.trim(),
        product_type: timberForm.product_type,
        quantity: timberForm.quantity.trim(),
        location:
          timberForm.location.trim() || profile?.location || "",
        latitude: profile?.latitude ?? null,
        longitude: profile?.longitude ?? null,
        price: timberForm.price.trim(),
        description: timberForm.description.trim() || null,
      };

      const { data: listing, error } = await supabase
        .from("listings")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      let uploadedCount = 0;

      for (let index = 0; index < timberPhotos.length; index += 1) {
        const file = timberPhotos[index];
        const safeName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, "-")
          .toLowerCase();
        const storagePath = `${session.user.id}/${listing.id}/${Date.now()}-${index}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          console.error("Photo upload:", uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(storagePath);

        const imageUrl = publicUrlData?.publicUrl;
        if (!imageUrl) continue;

        const { error: imageError } = await supabase
          .from("listing_images")
          .insert({
            listing_id: listing.id,
            user_id: session.user.id,
            image_url: imageUrl,
            storage_path: storagePath,
            sort_order: index,
          });

        if (!imageError) uploadedCount += 1;
      }

      if (!uploadedCount) {
        await supabase.from("listings").delete().eq("id", listing.id);
        throw new Error("No photo could be uploaded. Please try again.");
      }

      await supabase.rpc("notify_admin_new_listing", {
        p_listing_id: listing.id,
      });

      await loadTimberListings();

      setShowTimberModal(false);
      setTimberPhotos([]);
      setTimberForm({
        title: "",
        wood_type: "Teak",
        product_type: "Timber",
        quantity: "",
        location: profile?.location || "",
        price: "",
        description: "",
      });

      alert(
        "✅ Timber listing submitted. It is pending Admin approval."
      );
    } catch (error) {
      console.error("Timber listing:", error);
      alert(error?.message || "Unable to post timber listing.");
    } finally {
      setTimberSaving(false);
    }
  }

  function handleTimberPhotoSelect(event) {
    const selected = Array.from(event.target.files || []).filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );

    setTimberPhotos((old) =>
      [...old, ...selected].slice(0, 10)
    );

    event.target.value = "";
  }

  function removeTimberPhoto(index) {
    setTimberPhotos((old) => old.filter((_, i) => i !== index));
  }

  function openListingGallery(listing) {
    setSelectedListing(listing);
    setGalleryIndex(0);
  }

  function openRequirementGallery(requirement) {
    setSelectedRequirement(requirement);
    setGalleryIndex(0);
  }

  async function openNotification(item) {
    await markNotificationRead(item.id);
    setNotificationOpen(false);

    if (item.listing_id) {
      const { data } = await supabase
        .from("listings")
        .select(`
          *,
          listing_images (
            id,
            image_url,
            storage_path,
            sort_order
          )
        `)
        .eq("id", item.listing_id)
        .maybeSingle();

      if (data) {
        openListingGallery(data);
        return;
      }
    }
  }

  /* =====================================================
     FORM
  ===================================================== */


  function updateJobForm(name, value) {
    setJobForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  function resetJobForm() {
    setJobForm({
      title: "",
      category: "",
      job_type: "Full Time",
      experience: "",
      salary: "",
      location: profile?.location || "",
      positions: "1",
      accommodation: false,
      food: false,
      description: "",
    });

    setJobStep(1);
  }

  /* =====================================================
     POST JOB
  ===================================================== */

  async function postJob() {
    if (!session?.user?.id) {
      return;
    }

    if (!jobForm.title.trim()) {
      alert("Please enter job title.");
      setJobStep(1);
      return;
    }

    if (!jobForm.category) {
      alert("Please select job category.");
      setJobStep(1);
      return;
    }

    if (!jobForm.experience) {
      alert("Please select required experience.");
      setJobStep(1);
      return;
    }

    if (!jobForm.salary.trim()) {
      alert("Please enter salary.");
      setJobStep(2);
      return;
    }

    if (!jobForm.location.trim()) {
      alert("Please enter location.");
      setJobStep(2);
      return;
    }

    if (!jobForm.description.trim()) {
      alert("Please enter job description.");
      setJobStep(2);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        user_id: session.user.id,
        title: jobForm.title.trim(),
        category: jobForm.category,
        job_type: jobForm.job_type,
        experience: jobForm.experience,
        salary: jobForm.salary.trim(),
        location: jobForm.location.trim(),
        positions:
          jobForm.positions || "1",
        accommodation:
          jobForm.accommodation,
        food: jobForm.food,
        description:
          jobForm.description.trim(),
      };

      const { data, error } =
        await supabase
          .from("jobs")
          .insert(payload)
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
          .single();

      if (error) {
        throw error;
      }

      setJobs((old) => [
        data,
        ...old,
      ]);

      setShowPostJob(false);
      setJobStep(1);

      resetJobForm();

      alert(
        "✅ Job posted successfully!"
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to post job."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE JOB
  ===================================================== */

  async function deleteJob(job) {
    if (
      !window.confirm(
        "Delete this job?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job.id)
      .eq(
        "user_id",
        session.user.id
      );

    if (error) {
      alert(error.message);
      return;
    }

    setJobs((old) =>
      old.filter(
        (item) => item.id !== job.id
      )
    );

    setShowJobDetails(false);
  }

  /* =====================================================
     APPLICATION STATUS
  ===================================================== */

  async function updateApplication(
    application,
    status
  ) {
    const { error } =
      await supabase
        .from("job_applications")
        .update({
          status,
        })
        .eq(
          "id",
          application.id
        );

    if (error) {
      alert(error.message);
      return;
    }

    setApplications((old) =>
      old.map((item) =>
        item.id === application.id
          ? {
              ...item,
              status,
            }
          : item
      )
    );
  }

  /* =====================================================
     JOB DETAILS
  ===================================================== */

  function openJob(job) {
    setSelectedJob(job);
    setShowJobDetails(true);
  }

  /* =====================================================
     WORKER PROFILE
  ===================================================== */

  function openWorker(worker) {
    setSelectedWorker(worker);
    setShowWorkerProfile(true);
  }

  /* =====================================================
     CONTACT
  ===================================================== */

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

  function whatsappUser(phone) {
    if (!phone) {
      alert(
        "WhatsApp number is not available."
      );
      return;
    }

    let cleanPhone =
      phone.replace(/\D/g, "");

    if (
      cleanPhone.length === 10
    ) {
      cleanPhone =
        "91" + cleanPhone;
    }

    window.open(
      `https://wa.me/${cleanPhone}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =====================================================
     CHAT
  ===================================================== */

  async function openChat(user) {
    if (!user?.id) return;

    if (
      user.id === session.user.id
    ) {
      alert(
        "You cannot chat with yourself."
      );
      return;
    }

    setChatUser(user);

    await loadMessages(user.id);

    setShowChat(true);
  }

  async function loadMessages(
    receiverId
  ) {
    const myId =
      session.user.id;

    const { data, error } =
      await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${myId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${myId})`
        )
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Messages:",
        error
      );

      setMessages([]);
      return;
    }

    setMessages(data || []);
  }

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
          `sawmill-chat-${chatUser.id}`
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

            const belongs =
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

            if (belongs) {
              setMessages((old) => {
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

  async function sendMessage(e) {
    e.preventDefault();

    const body =
      messageText.trim();

    if (
      !body ||
      !chatUser?.id
    ) {
      return;
    }

    const { data, error } =
      await supabase
        .from("messages")
        .insert({
          sender_id:
            session.user.id,
          receiver_id:
            chatUser.id,
          body,
        })
        .select()
        .single();

    if (error) {
      alert(error.message);
      return;
    }

    setMessages((old) => [
      ...old,
      data,
    ]);

    setMessageText("");
  }

  /* =====================================================
     PROFILE
  ===================================================== */

  function openMyProfile() {
    setShowMyProfile(true);
  }

  /* =====================================================
     FILTER JOBS
  ===================================================== */

  const myJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.user_id ===
          session?.user?.id
      ),
    [
      jobs,
      session?.user?.id,
    ]
  );

  const jobWall = useMemo(() => {
    const value =
      searchJobs
        .trim()
        .toLowerCase();

    if (!value) {
      return jobs;
    }

    return jobs.filter(
      (job) =>
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
  }, [
    jobs,
    searchJobs,
  ]);

  /* =====================================================
     FILTER WORKERS
  ===================================================== */

  const workerWall =
    useMemo(() => {
      const value =
        searchWorkers
          .trim()
          .toLowerCase();

      if (!value) {
        return workers;
      }

      return workers.filter(
        (worker) =>
          [
            worker.profile?.name,
            worker.profile?.location,
            worker.experience,
            worker.work_type,
            worker.expected_salary,
            ...(worker.skills ||
              []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(value)
      );
    }, [
      workers,
      searchWorkers,
    ]);


  /* =====================================================
     LIVE MARKETPLACE / NOTIFICATIONS
  ===================================================== */

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`sawmill-live-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => loadNotifications(session.user.id)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listings",
        },
        () => loadTimberListings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function logout() {
    await supabase.auth.signOut();

    navigate("/login", {
      replace: true,
    });
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
  return (
    <TreeLoader text="Growing your requirements..." />
  );
}

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div className="sawmill-app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sawmill-header">

        <button
          className="sawmill-menu-btn"
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


        <div className="sawmill-logo">
          <span>
            🌳
          </span>

          TimberMart
        </div>


        <div className="sawmill-header-right">

          <button
            className="sawmill-bell"
            onClick={() => setNotificationOpen(true)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="sawmill-bell-badge">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </button>


          <button
            className="sawmill-header-profile"
            onClick={
              openMyProfile
            }
          >

            <span className="sawmill-header-avatar">

              {profile?.photo_url ? (
                <img
                  src={
                    profile.photo_url
                  }
                  alt=""
                />
              ) : (
                <Building2
                  size={18}
                />
              )}

            </span>

            <span>
              {profile?.name ||
                "Sawmill"}
            </span>

          </button>

        </div>

      </header>


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`sawmill-sidebar ${
          mobileMenu
            ? "open"
            : ""
        }`}
      >

        <div>

          <div className="sawmill-brand">

            <div>
              🏭
            </div>

            <section>

              <strong>
                TimberMart
              </strong>

              <span>
                Sawmill / Business
              </span>

            </section>

          </div>


          <div className="sawmill-business-card">

            <div className="sawmill-business-avatar">

              {profile?.photo_url ? (
                <img
                  src={
                    profile.photo_url
                  }
                  alt=""
                />
              ) : (
                <Building2
                  size={22}
                />
              )}

            </div>

            <div>

              <strong>
                {profile?.name ||
                  "Sawmill"}
              </strong>

              <span>
                {profile?.location ||
                  "Location not added"}
              </span>

            </div>

          </div>


          <nav className="sawmill-nav">

            <button
              className={
                activeTab ===
                "dashboard"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setActiveTab(
                  "dashboard"
                );

                setMobileMenu(
                  false
                );

                window.scrollTo({
                  top: 0,
                  behavior:
                    "smooth",
                });
              }}
            >
              <Home size={18} />
              Dashboard
            </button>


            <button
              onClick={() => {
                setJobStep(1);

                setJobForm(
                  (old) => ({
                    ...old,
                    location:
                      profile?.location ||
                      "",
                  })
                );

                setShowPostJob(
                  true
                );

                setMobileMenu(
                  false
                );
              }}
            >
              <Briefcase
                size={18}
              />
              Post a Job
            </button>


            <button
              onClick={() => {
                document
                  .getElementById(
                    "job-wall"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  });

                setMobileMenu(
                  false
                );
              }}
            >
              <Search size={18} />
              Job Wall
            </button>


            <button
              onClick={() => {
                document
                  .getElementById(
                    "workers"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  });

                setMobileMenu(
                  false
                );
              }}
            >
              <Users size={18} />
              Find Workers
            </button>


            <button
              onClick={() => {
                setShowApplications(
                  true
                );

                setMobileMenu(
                  false
                );
              }}
            >
              <Check size={18} />
              Job Applications
            </button>


            <button
              onClick={() => {
                document
                  .getElementById("sawmill-timber-marketplace")
                  ?.scrollIntoView({ behavior: "smooth" });
                setMobileMenu(false);
              }}
            >
              <Building2 size={18} />
              Timber Listings
            </button>

            <button
              onClick={() => chooseSupplierMode("patta")}
            >
              🌿
              Patta Teak Suppliers
              <b>
                {visibleTimberListings.filter((item) =>
                  /(patta\s*teak|patta|indian teak|native teak|farm teak)/i.test(
                    `${item.title || ""} ${item.wood_type || ""} ${item.description || ""}`
                  )
                ).length}
              </b>
            </button>

            <button
              onClick={() => chooseSupplierMode("imported")}
            >
              <Globe2 size={18} />
              Imported Teak Suppliers
              <b>
                {visibleTimberListings.filter((item) =>
                  /(imported teak|burma teak|myanmar teak|african teak|malaysian teak|imported|foreign teak)/i.test(
                    `${item.title || ""} ${item.wood_type || ""} ${item.description || ""}`
                  )
                ).length}
              </b>
            </button>

            <button
              onClick={() => {
                setNotificationOpen(true);
                setMobileMenu(false);
              }}
            >
              <Bell size={18} />
              Notifications
              {unreadNotifications > 0 && <b>{unreadNotifications}</b>}
            </button>

            <button
              onClick={updateSawmillLocation}
              disabled={locationUpdating}
            >
              <LocateFixed size={18} />
              {locationUpdating ? "Updating..." : "Update My Location"}
            </button>

            <div className="sawmill-nav-divider" />

            <button
              onClick={() => {
                openMyProfile();

                setMobileMenu(
                  false
                );
              }}
            >
              <User size={18} />
              My Profile
            </button>


            <button
              onClick={() =>
                navigate(
                  "/settings"
                )
              }
            >
              <Settings
                size={18}
              />
              Settings
            </button>

          </nav>

        </div>


        <div className="sawmill-sidebar-bottom">

          <div className="sawmill-connect-note">
            🤝 We Connect. You Deal Directly.
          </div>

          <button
            className="sawmill-logout"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>


      {mobileMenu && (
        <div
          className="sawmill-overlay"
          onClick={() =>
            setMobileMenu(
              false
            )
          }
        />
      )}


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="sawmill-main">

        <div className="sawmill-container">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="sawmill-hero">

            <div>

              <span className="sawmill-kicker">
                🏭 SAWMILL / BUSINESS
              </span>

              <h1>
                Hello,{" "}
                {profile?.name ||
                  "Business"}!
              </h1>

              <p>
                Hire the right workers
                and connect directly
                with skilled people
                nearby.
              </p>


              <div className="sawmill-location">

                <MapPin size={15} />

                {profile?.location ||
                  "Add your business location"}

              </div>


              <div className="sawmill-hero-actions">

                <button
                  className="sawmill-primary"
                  onClick={() => {
                    resetJobForm();

                    setJobForm(
                      (old) => ({
                        ...old,
                        location:
                          profile?.location ||
                          "",
                      })
                    );

                    setShowPostJob(
                      true
                    );
                  }}
                >
                  <Briefcase
                    size={17}
                  />
                  Post a Job
                </button>


                <button
                  className="sawmill-secondary"
                  onClick={updateSawmillLocation}
                  disabled={locationUpdating}
                >
                  <LocateFixed size={17} />
                  {locationUpdating ? "Updating..." : "Update GPS"}
                </button>

                <button
                  className="sawmill-secondary"
                  onClick={() =>
                    document
                      .getElementById(
                        "workers"
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                >
                  <Users size={17} />
                  Find Workers
                </button>

              </div>

            </div>


            <div className="sawmill-hero-art">

              <div>
                🏭
              </div>

              <span>
                🪵
              </span>

            </div>

          </section>


          {/* =================================================
              ACCOUNT BAR
          ================================================= */}

          <section className="sawmill-account">

            <div className="sawmill-account-left">

              <div className="sawmill-account-photo">

                {profile?.photo_url ? (
                  <img
                    src={
                      profile.photo_url
                    }
                    alt=""
                  />
                ) : (
                  <Building2
                    size={24}
                  />
                )}

              </div>


              <div>

                <strong>
                  {profile?.name ||
                    "Sawmill / Business"}
                </strong>

                <span>
                  Verified TimberMart Business
                </span>

              </div>

            </div>


            <div className="sawmill-verified">
              ✓ Active Account
            </div>

          </section>


          {/* =================================================
              STATS
          ================================================= */}

          <section className="sawmill-stats">

            <div>

              <span className="sawmill-stat-icon">
                💼
              </span>

              <strong>
                {myJobs.length}
              </strong>

              <small>
                Active Jobs
              </small>

            </div>


            <div>

              <span className="sawmill-stat-icon">
                👷
              </span>

              <strong>
                {workers.length}
              </strong>

              <small>
                Worker Profiles
              </small>

            </div>


            <div>

              <span className="sawmill-stat-icon">
                📄
              </span>

              <strong>
                {applications.length}
              </strong>

              <small>
                Applications
              </small>

            </div>


            <div>

              <span className="sawmill-stat-icon">
                📍
              </span>

              <strong>
                {profile?.location ||
                  "—"}
              </strong>

              <small>
                Business Location
              </small>

            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="sawmill-section">

            <div className="sawmill-section-heading">

              <div>

                <h2>
                  Sawmill Tools
                </h2>

                <p>
                  Manage jobs and connect
                  with workers.
                </p>

              </div>

            </div>


            <div className="sawmill-tools">

              <button
                onClick={() => {
                  resetJobForm();

                  setJobForm(
                    (old) => ({
                      ...old,
                      location:
                        profile?.location ||
                        "",
                    })
                  );

                  setShowPostJob(
                    true
                  );
                }}
              >

                <span>
                  📋
                </span>

                <strong>
                  Post Job
                </strong>

                <small>
                  Find skilled workers
                </small>

              </button>


              <button
                onClick={() =>
                  document
                    .getElementById(
                      "workers"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    })
                }
              >

                <span>
                  👷
                </span>

                <strong>
                  Find Workers
                </strong>

                <small>
                  View nearby profiles
                </small>

              </button>


              <button
                onClick={() =>
                  document
                    .getElementById(
                      "job-wall"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    })
                }
              >

                <span>
                  🔎
                </span>

                <strong>
                  Job Wall
                </strong>

                <small>
                  View posted jobs
                </small>

              </button>


              <button
                onClick={() =>
                  setShowApplications(
                    true
                  )
                }
              >

                <span>
                  📄
                </span>

                <strong>
                  Applications
                </strong>

                <small>
                  Review workers
                </small>

              </button>

            </div>

          </section>


          {/* =================================================
              MY JOBS
          ================================================= */}

          <section className="sawmill-section">

            <div className="sawmill-section-heading">

              <div>

                <h2>
                  My Jobs
                </h2>

                <p>
                  Jobs posted by your business.
                </p>

              </div>

              <button
                className="sawmill-outline-small"
                onClick={() => {
                  resetJobForm();

                  setShowPostJob(
                    true
                  );
                }}
              >
                <Briefcase
                  size={14}
                />
                Post Job
              </button>

            </div>


            {myJobs.length === 0 ? (

              <div className="sawmill-empty">

                <div>
                  📋
                </div>

                <h3>
                  No jobs posted yet
                </h3>

                <p>
                  Create your first job
                  to connect with workers.
                </p>

                <button
                  onClick={() => {
                    resetJobForm();

                    setShowPostJob(
                      true
                    );
                  }}
                >
                  Post Your First Job
                </button>

              </div>

            ) : (

              <div className="sawmill-myjobs">

                {myJobs.map((job) => (

                  <article
                    className="sawmill-myjob"
                    key={job.id}
                  >

                    <div className="sawmill-myjob-icon">
                      💼
                    </div>

                    <div>

                      <strong>
                        {job.title}
                      </strong>

                      <span>
                        {job.category}
                        {" • "}
                        {job.location}
                      </span>

                      <small>
                        {job.salary ||
                          "Salary not specified"}
                      </small>

                    </div>


                    <button
                      onClick={() =>
                        openJob(job)
                      }
                    >
                      <Eye size={15} />
                      View
                    </button>

                  </article>

                ))}

              </div>

            )}

          </section>


          {/* =================================================
              JOB WALL
          ================================================= */}

          <section
            className="sawmill-section"
            id="job-wall"
          >

            <div className="sawmill-section-heading">

              <div>

                <h2>
                  Job Wall
                </h2>

                <p>
                  All jobs posted by TimberMart
                  businesses.
                </p>

              </div>

              <span className="sawmill-count">
                {jobWall.length} Jobs
              </span>

            </div>


            <div className="sawmill-search">

              <Search size={18} />

              <input
                value={
                  searchJobs
                }
                onChange={(e) =>
                  setSearchJobs(
                    e.target.value
                  )
                }
                placeholder="Search jobs, company, location..."
              />

            </div>


            {jobWall.length === 0 ? (

              <div className="sawmill-empty">

                <div>
                  🔎
                </div>

                <h3>
                  No jobs found
                </h3>

                <p>
                  Posted jobs will appear
                  here automatically.
                </p>

              </div>

            ) : (

              <div className="sawmill-jobs-grid">

                {jobWall.map((job) => (

                  <article
                    className="sawmill-job-card"
                    key={job.id}
                  >

                    <div className="sawmill-job-company">

                      <div className="sawmill-company-avatar">

                        {job.profiles
                          ?.photo_url ? (
                          <img
                            src={
                              job.profiles
                                .photo_url
                            }
                            alt=""
                          />
                        ) : (
                          <Building2
                            size={19}
                          />
                        )}

                      </div>


                      <div>

                        <strong>
                          {job.profiles?.name ||
                            "Timber Business"}
                        </strong>

                        <span>
                          {job.location ||
                            job.profiles
                              ?.location ||
                            "Location not added"}
                        </span>

                      </div>

                    </div>


                    <span className="sawmill-job-category">
                      {job.category ||
                        "Timber Job"}
                    </span>


                    <h3>
                      {job.title}
                    </h3>


                    <p>
                      {job.description ||
                        "No description provided."}
                    </p>


                    <div className="sawmill-job-info">

                      <span>
                        <Briefcase
                          size={14}
                        />
                        {job.job_type ||
                          "Work Type"}
                      </span>

                      <span>
                        <Clock3
                          size={14}
                        />
                        {job.experience ||
                          "Experience"}
                      </span>

                      <span>
                        💰
                        {job.salary ||
                          "Salary"}
                      </span>

                    </div>


                    <div className="sawmill-job-bottom">

                      <small>
                        {job.positions
                          ? `${job.positions} Position(s)`
                          : ""}
                      </small>

                      <button
                        onClick={() =>
                          openJob(job)
                        }
                      >
                        <Eye size={15} />
                        View
                      </button>

                    </div>

                  </article>

                ))}

              </div>

            )}

          </section>


          {/* =================================================
              NEARBY WORKERS
          ================================================= */}

          <section
            className="sawmill-section"
            id="workers"
          >

            <div className="sawmill-section-heading">

              <div>

                <h2>
                  Nearby Workers
                </h2>

                <p>
                  Find workers based on
                  skills and experience.
                </p>

              </div>

              <span className="sawmill-count">
                {workerWall.length} Workers
              </span>

            </div>


            <div className="sawmill-search">

              <Search size={18} />

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


            {workerWall.length === 0 ? (

              <div className="sawmill-empty">

                <div>
                  👷
                </div>

                <h3>
                  No worker profiles found
                </h3>

                <p>
                  Workers who create profiles
                  will appear here.
                </p>

              </div>

            ) : (

              <div className="sawmill-workers-grid">

                {workerWall.map(
                  (worker) => (

                    <article
                      className="sawmill-worker-card"
                      key={
                        worker.id
                      }
                    >

                      <div className="sawmill-worker-top">

                        <div className="sawmill-worker-avatar">

                          {worker.profile
                            ?.photo_url ? (
                            <img
                              src={
                                worker
                                  .profile
                                  .photo_url
                              }
                              alt=""
                            />
                          ) : (
                            <User
                              size={25}
                            />
                          )}

                        </div>


                        <div>

                          <strong>
                            {worker
                              .profile
                              ?.name ||
                              "Worker"}
                          </strong>

                          <span>
                            {worker
                              .skills
                              ?.slice(
                                0,
                                2
                              )
                              .join(
                                " • "
                              ) ||
                              "Skilled Worker"}
                          </span>

                        </div>


                        {worker.availability ===
                          "Available Now" && (

                          <i>
                            Available
                          </i>

                        )}

                      </div>


                      <div className="sawmill-worker-location">

                        <MapPin
                          size={13}
                        />

                        {worker.location ||
                          worker
                            .profile
                            ?.location ||
                          "Location not added"}

                      </div>


                      <div className="sawmill-worker-meta">

                        <span>
                          Experience
                          <strong>
                            {worker.experience ||
                              "—"}
                          </strong>
                        </span>

                        <span>
                          Work Type
                          <strong>
                            {worker.work_type ||
                              "—"}
                          </strong>
                        </span>

                        <span>
                          Salary
                          <strong>
                            {worker.expected_salary ||
                              "—"}
                          </strong>
                        </span>

                      </div>


                      <div className="sawmill-worker-skills">

                        {(worker.skills ||
                          [])
                          .slice(
                            0,
                            5
                          )
                          .map(
                            (skill) => (
                              <span
                                key={
                                  skill
                                }
                              >
                                {skill}
                              </span>
                            )
                          )}

                      </div>


                      <button
                        className="sawmill-view-worker"
                        onClick={() =>
                          openWorker(
                            worker
                          )
                        }
                      >
                        <User
                          size={15}
                        />
                        View Profile
                      </button>

                    </article>

                  )
                )}

              </div>

            )}

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="sawmill-footer">

            <div className="sawmill-footer-note">

              <strong>
                🛡️ TimberMart only connects users.
              </strong>

              <span>
                We do not provide payments,
                transactions, employment,
                delivery or other arrangements.
              </span>

            </div>


            <div>
              ✓ No Commission
            </div>


            <div>
              <Phone size={16} />
              Direct Contact
            </div>


            <div>
              <MapPin size={16} />
              Nearby Connect
            </div>


            <div>
              🛡️ 100% Secure
            </div>


            <div className="sawmill-footer-direct">
              🤝
              <strong>
                We Connect. You Deal Directly.
              </strong>
            </div>

          </footer>

        </div>

      </main>


      {/* =====================================================
          POST JOB MODAL
      ===================================================== */}

      {showPostJob && (

        <div
          className="sawmill-modal-overlay"
          onMouseDown={() =>
            !saving &&
            setShowPostJob(
              false
            )
          }
        >

          <div
            className="sawmill-modal sawmill-post-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="sawmill-modal-header">

              <div>

                <span>
                  POST A JOB
                </span>

                <h2>
                  {jobStep === 1 &&
                    "Job Details"}

                  {jobStep === 2 &&
                    "Requirements"}

                  {jobStep === 3 &&
                    "Preview Job"}

                </h2>

                <p>
                  Find the right worker
                  for your business.
                </p>

              </div>


              <button
                onClick={() =>
                  setShowPostJob(
                    false
                  )
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="sawmill-job-steps">

              {[
                "Job Info",
                "Requirements",
                "Preview",
              ].map(
                (item, index) => {

                  const step =
                    index + 1;

                  return (
                    <div
                      key={item}
                      className={
                        jobStep >=
                        step
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
                }
              )}

            </div>


            <div className="sawmill-post-body">

              {/* =================================================
                  STEP 1
              ================================================= */}

              {jobStep === 1 && (

                <div>

                  <label>
                    Job Title *
                  </label>

                  <input
                    className="sawmill-input"
                    value={
                      jobForm.title
                    }
                    onChange={(e) =>
                      updateJobForm(
                        "title",
                        e.target.value
                      )
                    }
                    placeholder="Example: Sawmill Machine Operator"
                  />


                  <label>
                    Job Category *
                  </label>

                  <select
                    className="sawmill-input"
                    value={
                      jobForm.category
                    }
                    onChange={(e) =>
                      updateJobForm(
                        "category",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select category
                    </option>

                    {JOB_CATEGORIES.map(
                      (category) => (
                        <option
                          key={
                            category
                          }
                        >
                          {category}
                        </option>
                      )
                    )}

                  </select>


                  <label>
                    Job Type *
                  </label>

                  <select
                    className="sawmill-input"
                    value={
                      jobForm.job_type
                    }
                    onChange={(e) =>
                      updateJobForm(
                        "job_type",
                        e.target.value
                      )
                    }
                  >

                    {JOB_TYPES.map(
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
                    Experience Required *
                  </label>

                  <select
                    className="sawmill-input"
                    value={
                      jobForm.experience
                    }
                    onChange={(e) =>
                      updateJobForm(
                        "experience",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select experience
                    </option>

                    {EXPERIENCE_OPTIONS.map(
                      (experience) => (
                        <option
                          key={
                            experience
                          }
                        >
                          {experience}
                        </option>
                      )
                    )}

                  </select>


                  <label>
                    No. of Positions
                  </label>

                  <input
                    className="sawmill-input"
                    type="number"
                    min="1"
                    value={
                      jobForm.positions
                    }
                    onChange={(e) =>
                      updateJobForm(
                        "positions",
                        e.target.value
                      )
                    }
                  />


                  <div className="sawmill-modal-buttons">

                    <button
                      className="primary"
                      onClick={() => {

                        if (
                          !jobForm.title.trim()
                        ) {
                          alert(
                            "Enter job title."
                          );
                          return;
                        }

                        if (
                          !jobForm.category
                        ) {
                          alert(
                            "Select job category."
                          );
                          return;
                        }

                        if (
                          !jobForm.experience
                        ) {
                          alert(
                            "Select experience."
                          );
                          return;
                        }

                        setJobStep(
                          2
                        );
                      }}
                    >
                      Next
                      <ChevronRight
                        size={17}
                      />
                    </button>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 2
              ================================================= */}

              {jobStep === 2 && (

                <div>

                  <label>
                    Monthly Salary / Wage *
                  </label>

                  <input
                    className="sawmill-input"
                    value={
                      jobForm.salary
                    }
                    onChange={(e) =>
                      updateJobForm(
                        "salary",
                        e.target.value
                      )
                    }
                    placeholder="Example: ₹18,000 - ₹25,000 / Month"
                  />


                  <label>
                    Location *
                  </label>

                  <div className="sawmill-input-icon">

                    <MapPin size={17} />

                    <input
                      value={
                        jobForm.location
                      }
                      onChange={(e) =>
                        updateJobForm(
                          "location",
                          e.target.value
                        )
                      }
                      placeholder="Rajahmundry, Andhra Pradesh"
                    />

                  </div>


                  <div className="sawmill-switch-row">

                    <div>

                      <strong>
                        Accommodation
                      </strong>

                      <small>
                        Provide accommodation
                        for the worker
                      </small>

                    </div>


                    <button
                      type="button"
                      className={
                        jobForm.accommodation
                          ? "on"
                          : ""
                      }
                      onClick={() =>
                        updateJobForm(
                          "accommodation",
                          !jobForm.accommodation
                        )
                      }
                    >
                      <span />
                    </button>

                  </div>


                  <div className="sawmill-switch-row">

                    <div>

                      <strong>
                        Food
                      </strong>

                      <small>
                        Food facility available
                      </small>

                    </div>


                    <button
                      type="button"
                      className={
                        jobForm.food
                          ? "on"
                          : ""
                      }
                      onClick={() =>
                        updateJobForm(
                          "food",
                          !jobForm.food
                        )
                      }
                    >
                      <span />
                    </button>

                  </div>


                  <label>
                    Job Description *
                  </label>

                  <textarea
                    className="sawmill-input"
                    rows="6"
                    maxLength="500"
                    value={
                      jobForm.description
                    }
                    onChange={(e) =>
                      updateJobForm(
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Describe the work, responsibilities and requirements..."
                  />


                  <div className="sawmill-character-count">
                    {
                      jobForm.description
                        .length
                    }
                    / 500
                  </div>


                  <div className="sawmill-modal-buttons">

                    <button
                      onClick={() =>
                        setJobStep(
                          1
                        )
                      }
                    >
                      <ChevronLeft
                        size={16}
                      />
                      Back
                    </button>


                    <button
                      className="primary"
                      onClick={() => {

                        if (
                          !jobForm.salary.trim()
                        ) {
                          alert(
                            "Enter salary."
                          );
                          return;
                        }

                        if (
                          !jobForm.location.trim()
                        ) {
                          alert(
                            "Enter location."
                          );
                          return;
                        }

                        if (
                          !jobForm.description.trim()
                        ) {
                          alert(
                            "Enter job description."
                          );
                          return;
                        }

                        setJobStep(
                          3
                        );
                      }}
                    >
                      Preview
                      <ChevronRight
                        size={17}
                      />
                    </button>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 3
              ================================================= */}

              {jobStep === 3 && (

                <div>

                  <div className="sawmill-preview-card">

                    <div className="sawmill-preview-icon">
                      💼
                    </div>

                    <h3>
                      {jobForm.title}
                    </h3>

                    <span className="sawmill-preview-category">
                      {jobForm.category}
                    </span>


                    <div className="sawmill-preview-row">
                      <span>
                        Job Type
                      </span>

                      <strong>
                        {jobForm.job_type}
                      </strong>
                    </div>


                    <div className="sawmill-preview-row">
                      <span>
                        Experience
                      </span>

                      <strong>
                        {jobForm.experience}
                      </strong>
                    </div>


                    <div className="sawmill-preview-row">
                      <span>
                        Salary
                      </span>

                      <strong>
                        {jobForm.salary}
                      </strong>
                    </div>


                    <div className="sawmill-preview-row">
                      <span>
                        Positions
                      </span>

                      <strong>
                        {jobForm.positions}
                      </strong>
                    </div>


                    <div className="sawmill-preview-row">
                      <span>
                        Location
                      </span>

                      <strong>
                        {jobForm.location}
                      </strong>
                    </div>


                    <div className="sawmill-preview-row">
                      <span>
                        Accommodation
                      </span>

                      <strong>
                        {jobForm.accommodation
                          ? "Available"
                          : "Not Available"}
                      </strong>
                    </div>


                    <div className="sawmill-preview-row">
                      <span>
                        Food
                      </span>

                      <strong>
                        {jobForm.food
                          ? "Available"
                          : "Not Available"}
                      </strong>
                    </div>


                    <div className="sawmill-preview-description">

                      <strong>
                        Description
                      </strong>

                      <p>
                        {jobForm.description}
                      </p>

                    </div>

                  </div>


                  <div className="sawmill-modal-buttons">

                    <button
                      onClick={() =>
                        setJobStep(
                          2
                        )
                      }
                    >
                      <ChevronLeft
                        size={16}
                      />
                      Back
                    </button>


                    <button
                      className="primary"
                      disabled={
                        saving
                      }
                      onClick={
                        postJob
                      }
                    >
                      {saving
                        ? "Posting..."
                        : "Post Job"}
                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          JOB DETAILS MODAL
      ===================================================== */}

      {showJobDetails &&
        selectedJob && (

          <div
            className="sawmill-modal-overlay"
            onMouseDown={() =>
              setShowJobDetails(
                false
              )
            }
          >

            <div
              className="sawmill-modal sawmill-job-details-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="sawmill-modal-header">

                <div>

                  <span>
                    JOB DETAILS
                  </span>

                  <h2>
                    {selectedJob.title}
                  </h2>

                  <p>
                    {selectedJob.profiles
                      ?.name ||
                      "Timber Business"}
                  </p>

                </div>


                <button
                  onClick={() =>
                    setShowJobDetails(
                      false
                    )
                  }
                >
                  <X size={20} />
                </button>

              </div>


              <div className="sawmill-job-detail-body">

                <div className="sawmill-job-company large">

                  <div className="sawmill-company-avatar large">

                    {selectedJob
                      .profiles
                      ?.photo_url ? (
                      <img
                        src={
                          selectedJob
                            .profiles
                            .photo_url
                        }
                        alt=""
                      />
                    ) : (
                      <Building2
                        size={27}
                      />
                    )}

                  </div>


                  <div>

                    <strong>
                      {selectedJob
                        .profiles
                        ?.name ||
                        "Timber Business"}
                    </strong>

                    <span>
                      {selectedJob.location ||
                        selectedJob
                          .profiles
                          ?.location ||
                        "Location not added"}
                    </span>

                  </div>

                </div>


                <div className="sawmill-detail-grid">

                  <div>
                    <span>
                      Category
                    </span>

                    <strong>
                      {selectedJob.category ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Work Type
                    </span>

                    <strong>
                      {selectedJob.job_type ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Experience
                    </span>

                    <strong>
                      {selectedJob.experience ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Salary
                    </span>

                    <strong>
                      {selectedJob.salary ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Positions
                    </span>

                    <strong>
                      {selectedJob.positions ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Accommodation
                    </span>

                    <strong>
                      {selectedJob.accommodation
                        ? "Available"
                        : "Not Available"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Food
                    </span>

                    <strong>
                      {selectedJob.food
                        ? "Available"
                        : "Not Available"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Location
                    </span>

                    <strong>
                      {selectedJob.location ||
                        "—"}
                    </strong>
                  </div>

                </div>


                <div className="sawmill-description">

                  <h4>
                    Job Description
                  </h4>

                  <p>
                    {selectedJob.description ||
                      "No description provided."}
                  </p>

                </div>


                <div className="sawmill-contact-buttons">

                  <button
                    onClick={() =>
                      callUser(
                        selectedJob
                          .profiles
                          ?.phone
                      )
                    }
                  >
                    <Phone size={17} />
                    Call
                  </button>


                  <button
                    onClick={() =>
                      whatsappUser(
                        selectedJob
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
                    onClick={() =>
                      openChat(
                        selectedJob
                          .profiles
                      )
                    }
                  >
                    <MessageCircle
                      size={17}
                    />
                    Chat
                  </button>

                </div>


                {selectedJob.user_id ===
                  session.user.id && (

                  <button
                    className="sawmill-delete-job"
                    onClick={() =>
                      deleteJob(
                        selectedJob
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />
                    Delete Job
                  </button>

                )}

              </div>

            </div>

          </div>

        )}


      {/* =====================================================
          WORKER PROFILE
      ===================================================== */}

      {showWorkerProfile &&
        selectedWorker && (

          <div
            className="sawmill-modal-overlay"
            onMouseDown={() =>
              setShowWorkerProfile(
                false
              )
            }
          >

            <div
              className="sawmill-modal sawmill-worker-profile-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="sawmill-profile-cover">
                🌳
              </div>


              <button
                className="sawmill-profile-close"
                onClick={() =>
                  setShowWorkerProfile(
                    false
                  )
                }
              >
                <X size={20} />
              </button>


              <div className="sawmill-worker-profile-body">

                <div className="sawmill-big-worker-avatar">

                  {selectedWorker
                    .profile
                    ?.photo_url ? (
                    <img
                      src={
                        selectedWorker
                          .profile
                          .photo_url
                      }
                      alt=""
                    />
                  ) : (
                    <User
                      size={39}
                    />
                  )}

                </div>


                <h2>
                  {selectedWorker
                    .profile
                    ?.name ||
                    "Worker"}
                </h2>


                <span className="sawmill-profile-role">
                  {selectedWorker
                    .skills?.[0] ||
                    "Skilled Worker"}
                </span>


                <p className="sawmill-profile-location">
                  <MapPin size={15} />
                  {selectedWorker
                    .location ||
                    selectedWorker
                      .profile
                      ?.location ||
                    "Location not added"}
                </p>


                <div className="sawmill-profile-availability">

                  <span
                    className={
                      selectedWorker
                        .availability ===
                      "Available Now"
                        ? "green"
                        : ""
                    }
                  />

                  {selectedWorker
                    .availability ||
                    "Availability not specified"}

                </div>


                <div className="sawmill-worker-profile-info">

                  <div>
                    <span>
                      Experience
                    </span>

                    <strong>
                      {selectedWorker
                        .experience ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Work Type
                    </span>

                    <strong>
                      {selectedWorker
                        .work_type ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Expected Salary
                    </span>

                    <strong>
                      {selectedWorker
                        .expected_salary ||
                        "—"}
                    </strong>
                  </div>

                </div>


                <div className="sawmill-profile-skills">

                  <h4>
                    Skills
                  </h4>

                  <div>

                    {(selectedWorker
                      .skills ||
                      []
                    ).map(
                      (skill) => (
                        <span
                          key={skill}
                        >
                          {skill}
                        </span>
                      )
                    )}

                  </div>

                </div>


                {selectedWorker
                  .experience_details && (

                  <div className="sawmill-profile-about">

                    <h4>
                      About / Experience
                    </h4>

                    <p>
                      {
                        selectedWorker
                          .experience_details
                      }
                    </p>

                  </div>

                )}


                <div className="sawmill-contact-buttons">

                  <button
                    onClick={() =>
                      callUser(
                        selectedWorker
                          .profile
                          ?.phone
                      )
                    }
                  >
                    <Phone size={17} />
                    Call
                  </button>


                  <button
                    onClick={() =>
                      whatsappUser(
                        selectedWorker
                          .profile
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
                    onClick={() =>
                      openChat(
                        selectedWorker
                          .profile
                      )
                    }
                  >
                    <MessageCircle
                      size={17}
                    />
                    Chat
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}


      {/* =====================================================
          MY PROFILE
      ===================================================== */}

      {showMyProfile &&
        profile && (

          <div
            className="sawmill-modal-overlay"
            onMouseDown={() =>
              setShowMyProfile(
                false
              )
            }
          >

            <div
              className="sawmill-modal sawmill-worker-profile-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="sawmill-profile-cover">
                🏭
              </div>


              <button
                className="sawmill-profile-close"
                onClick={() =>
                  setShowMyProfile(
                    false
                  )
                }
              >
                <X size={20} />
              </button>


              <div className="sawmill-worker-profile-body">

                <div className="sawmill-big-worker-avatar">

                  {profile.photo_url ? (
                    <img
                      src={
                        profile.photo_url
                      }
                      alt=""
                    />
                  ) : (
                    <Building2
                      size={39}
                    />
                  )}

                </div>


                <h2>
                  {profile.name ||
                    "Sawmill"}
                </h2>


                <span className="sawmill-profile-role">
                  Sawmill / Business
                </span>


                <p className="sawmill-profile-location">

                  <MapPin size={15} />

                  {profile.location ||
                    "Location not added"}

                </p>


                {profile.bio && (

                  <div className="sawmill-profile-about">

                    <h4>
                      About Business
                    </h4>

                    <p>
                      {profile.bio}
                    </p>

                  </div>

                )}


                <button
                  className="sawmill-edit-profile"
                  onClick={() =>
                    navigate(
                      "/profile"
                    )
                  }
                >
                  <Edit3
                    size={16}
                  />
                  Edit Profile
                </button>

              </div>

            </div>

          </div>

        )}


      {/* =====================================================
          APPLICATIONS
      ===================================================== */}

      {showApplications && (

        <div
          className="sawmill-modal-overlay"
          onMouseDown={() =>
            setShowApplications(
              false
            )
          }
        >

          <div
            className="sawmill-modal sawmill-applications-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="sawmill-modal-header">

              <div>

                <span>
                  WORKERS
                </span>

                <h2>
                  Job Applications
                </h2>

                <p>
                  Review workers who applied
                  to your jobs.
                </p>

              </div>


              <button
                onClick={() =>
                  setShowApplications(
                    false
                  )
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="sawmill-applications-body">

              {applications.length ===
              0 ? (

                <div className="sawmill-empty">

                  <div>
                    📄
                  </div>

                  <h3>
                    No applications yet
                  </h3>

                  <p>
                    Worker applications
                    will appear here.
                  </p>

                </div>

              ) : (

                <div className="sawmill-application-list">

                  {applications.map(
                    (application) => (

                      <div
                        className="sawmill-application"
                        key={
                          application.id
                        }
                      >

                        <div className="sawmill-application-avatar">

                          {application.worker
                            ?.photo_url ? (
                            <img
                              src={
                                application
                                  .worker
                                  .photo_url
                              }
                              alt=""
                            />
                          ) : (
                            <User
                              size={22}
                            />
                          )}

                        </div>


                        <div className="sawmill-application-info">

                          <strong>
                            {application
                              .worker
                              ?.name ||
                              "Worker"}
                          </strong>

                          <span>
                            Application
                            Status:{" "}
                            {application.status ||
                              "Applied"}
                          </span>

                        </div>


                        <button
                          onClick={() =>
                            openWorker(
                              {
                                profile:
                                  application.worker,
                                user_id:
                                  application.worker_id,
                                skills:
                                  [],
                                experience:
                                  "",
                                work_type:
                                  "",
                                expected_salary:
                                  "",
                                availability:
                                  "Available",
                              }
                            )
                          }
                        >
                          <Eye
                            size={15}
                          />
                          Profile
                        </button>


                        <button
                          onClick={() =>
                            callUser(
                              application
                                .worker
                                ?.phone
                            )
                          }
                        >
                          <Phone
                            size={15}
                          />
                          Call
                        </button>


                        <button
                          onClick={() =>
                            openChat(
                              application.worker
                            )
                          }
                        >
                          <MessageCircle
                            size={15}
                          />
                          Chat
                        </button>


                        <select
                          value={
                            application.status ||
                            "Applied"
                          }
                          onChange={(e) =>
                            updateApplication(
                              application,
                              e.target.value
                            )
                          }
                        >
                          <option>
                            Applied
                          </option>

                          <option>
                            Shortlisted
                          </option>

                          <option>
                            Selected
                          </option>

                          <option>
                            Rejected
                          </option>
                        </select>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </div>

      )}



      {/* =====================================================
          TIMBER LISTING MODAL
      ===================================================== */}
      {showTimberModal && (
        <div
          className="sawmill-modal-overlay"
          onMouseDown={() => !timberSaving && setShowTimberModal(false)}
        >
          <div
            className="sawmill-modal sawmill-timber-create-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="sawmill-modal-header">
              <div>
                <span>SELL TIMBER</span>
                <h2>Post a Timber Listing</h2>
                <p>
                  Upload real timber photos. Your listing goes to Admin for approval.
                </p>
              </div>

              <button onClick={() => setShowTimberModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form className="sawmill-timber-form" onSubmit={submitTimberListing}>
              <div className="sawmill-form-grid">
                <div>
                  <label>Listing Title *</label>
                  <input
                    className="sawmill-input"
                    value={timberForm.title}
                    onChange={(e) =>
                      setTimberForm((old) => ({
                        ...old,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Example: Premium Teak Timber Planks"
                  />
                </div>

                <div>
                  <label>Wood Type *</label>
                  <select
                    className="sawmill-input"
                    value={timberForm.wood_type}
                    onChange={(e) =>
                      setTimberForm((old) => ({
                        ...old,
                        wood_type: e.target.value,
                      }))
                    }
                  >
                    <option>Teak</option>
                    <option>Patta Teak</option>
                    <option>Indian Teak</option>
                    <option>Burma Teak</option>
                    <option>Imported Teak</option>
                    <option>Neem</option>
                    <option>Pine</option>
                    <option>Rosewood</option>
                    <option>Eucalyptus</option>
                  </select>
                </div>

                <div>
                  <label>Product Type</label>
                  <select
                    className="sawmill-input"
                    value={timberForm.product_type}
                    onChange={(e) =>
                      setTimberForm((old) => ({
                        ...old,
                        product_type: e.target.value,
                      }))
                    }
                  >
                    <option>Timber</option>
                    <option>Timber Planks</option>
                    <option>Logs</option>
                    <option>Beams</option>
                    <option>Battens</option>
                    <option>Sawn Wood</option>
                  </select>
                </div>

                <div>
                  <label>Quantity</label>
                  <input
                    className="sawmill-input"
                    value={timberForm.quantity}
                    onChange={(e) =>
                      setTimberForm((old) => ({
                        ...old,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="Example: 50 CFT"
                  />
                </div>

                <div>
                  <label>Price</label>
                  <input
                    className="sawmill-input"
                    value={timberForm.price}
                    onChange={(e) =>
                      setTimberForm((old) => ({
                        ...old,
                        price: e.target.value,
                      }))
                    }
                    placeholder="Example: 45000"
                  />
                </div>

                <div>
                  <label>Location</label>
                  <div className="sawmill-input-icon">
                    <MapPin size={17} />
                    <input
                      value={timberForm.location}
                      onChange={(e) =>
                        setTimberForm((old) => ({
                          ...old,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Business location"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label>Description</label>
                <textarea
                  className="sawmill-input"
                  rows="4"
                  value={timberForm.description}
                  onChange={(e) =>
                    setTimberForm((old) => ({
                      ...old,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe timber grade, size, age, finish and availability..."
                />
              </div>

              <div className="sawmill-upload-box">
                <div className="sawmill-upload-title">
                  <div>
                    <UploadCloud size={22} />
                    <strong>Upload Timber Photos</strong>
                    <small>
                      JPG, PNG or WebP • up to 5 MB each • up to 10 photos
                    </small>
                  </div>

                  <label className="sawmill-upload-btn">
                    <ImagePlus size={16} />
                    Choose Photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleTimberPhotoSelect}
                    />
                  </label>
                </div>

                {timberPhotos.length > 0 && (
                  <div className="sawmill-upload-preview">
                    {timberPhotos.map((file, index) => (
                      <div className="sawmill-upload-thumb" key={`${file.name}-${index}`}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                        />
                        <button
                          type="button"
                          onClick={() => removeTimberPhoto(index)}
                        >
                          <X size={14} />
                        </button>
                        {index === 0 && <span>Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sawmill-approval-note">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Admin approval required</strong>
                  <span>
                    After posting, the listing will remain Pending until an
                    administrator approves it.
                  </span>
                </div>
              </div>

              <div className="sawmill-modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowTimberModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary"
                  disabled={timberSaving}
                >
                  {timberSaving ? "Uploading..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          NOTIFICATION DRAWER
      ===================================================== */}
      {notificationOpen && (
        <div
          className="sawmill-notification-overlay"
          onMouseDown={() => setNotificationOpen(false)}
        >
          <aside
            className="sawmill-notification-drawer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="sawmill-notification-head">
              <div>
                <span>LIVE ALERTS</span>
                <h2>Notifications</h2>
                <p>
                  Admin approvals, nearby listings and TimberMart updates.
                </p>
              </div>

              <button onClick={() => setNotificationOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="sawmill-notification-actions">
              <span>{notifications.length} total</span>
              <button onClick={markAllNotificationsRead}>
                Mark all read
              </button>
            </div>

            <div className="sawmill-notification-list">
              {notificationLoading ? (
                <div className="sawmill-notification-empty">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="sawmill-notification-empty">
                  <BellRing size={28} />
                  <strong>No notifications yet</strong>
                  <span>
                    New admin, approval and nearby notifications will appear here.
                  </span>
                </div>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    className={`sawmill-notification-item ${
                      item.is_read ? "" : "unread"
                    }`}
                    onClick={() => openNotification(item)}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                      />
                    ) : (
                      <div className="sawmill-notification-icon">
                        {item.source === "admin" ||
                        item.source === "admin_post"
                          ? "🛡️"
                          : item.distance_km
                          ? "📍"
                          : "🔔"}
                      </div>
                    )}

                    <div>
                      <div className="sawmill-notification-title">
                        <strong>{item.title || "TimberMart Notification"}</strong>
                        {!item.is_read && <i />}
                      </div>

                      {(item.source === "admin" ||
                        item.source === "admin_post" ||
                        item.sender_name === "TimberMart Admin") && (
                        <span className="sawmill-admin-badge">
                          TIMBERMART ADMIN
                        </span>
                      )}

                      <p>{item.message || ""}</p>

                      {item.distance_km != null && (
                        <small>
                          📍 {Number(item.distance_km).toFixed(1)} km away
                        </small>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================
          TIMBER GALLERY
      ===================================================== */}
      {selectedListing && (
        <div
          className="sawmill-gallery-overlay"
          onMouseDown={() => setSelectedListing(null)}
        >
          <div
            className="sawmill-gallery-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="sawmill-gallery-head">
              <div>
                <span>TIMBER LISTING</span>
                <h2>
                  {selectedListing.title || "Timber Listing"}
                </h2>
                <p>
                  {selectedListing.location || "Location not added"}
                </p>
              </div>

              <button onClick={() => setSelectedListing(null)}>
                <X size={20} />
              </button>
            </div>

            {getListingImages(selectedListing).length > 0 ? (
              <>
                <div className="sawmill-gallery-main">
                  <img
                    src={
                      getListingImages(selectedListing)[galleryIndex] ||
                      getListingImages(selectedListing)[0]
                    }
                    alt={selectedListing.title || "Timber"}
                  />

                  {getListingImages(selectedListing).length > 1 && (
                    <>
                      <button
                        className="sawmill-gallery-nav left"
                        onClick={() =>
                          setGalleryIndex((index) =>
                            index === 0
                              ? getListingImages(selectedListing).length - 1
                              : index - 1
                          )
                        }
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <button
                        className="sawmill-gallery-nav right"
                        onClick={() =>
                          setGalleryIndex((index) =>
                            index === getListingImages(selectedListing).length - 1
                              ? 0
                              : index + 1
                          )
                        }
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  <span className="sawmill-gallery-counter">
                    {galleryIndex + 1} / {getListingImages(selectedListing).length}
                  </span>
                </div>

                <div className="sawmill-gallery-thumbs">
                  {getListingImages(selectedListing).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      className={index === galleryIndex ? "active" : ""}
                      onClick={() => setGalleryIndex(index)}
                    >
                      <img src={image} alt="" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="sawmill-gallery-no-photo">
                🪵
                <span>No photos uploaded</span>
              </div>
            )}

            <div className="sawmill-gallery-info">
              <div>
                <small>Wood Type</small>
                <strong>
                  {selectedListing.wood_type || "Timber"}
                </strong>
              </div>
              <div>
                <small>Quantity</small>
                <strong>
                  {selectedListing.quantity || "On request"}
                </strong>
              </div>
              <div>
                <small>Price</small>
                <strong>
                  {selectedListing.price
                    ? `₹ ${selectedListing.price}`
                    : "On contact"}
                </strong>
              </div>
              <div>
                <small>Status</small>
                <strong>
                  {String(selectedListing.status || "Approved")}
                </strong>
              </div>
            </div>

            {selectedListing.description && (
              <p className="sawmill-gallery-description">
                {selectedListing.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          REQUIREMENT GALLERY
      ===================================================== */}
      {selectedRequirement && (
        <div
          className="sawmill-gallery-overlay"
          onMouseDown={() => setSelectedRequirement(null)}
        >
          <div
            className="sawmill-gallery-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="sawmill-gallery-head">
              <div>
                <span>REQUIREMENT</span>
                <h2>
                  {selectedRequirement.title || "Customer Requirement"}
                </h2>
                <p>
                  {selectedRequirement.location || "Location not added"}
                </p>
              </div>

              <button onClick={() => setSelectedRequirement(null)}>
                <X size={20} />
              </button>
            </div>

            {getRequirementImages(selectedRequirement).length > 0 ? (
              <>
                <div className="sawmill-gallery-main">
                  <img
                    src={
                      getRequirementImages(selectedRequirement)[galleryIndex] ||
                      getRequirementImages(selectedRequirement)[0]
                    }
                    alt={selectedRequirement.title || "Requirement"}
                  />

                  {getRequirementImages(selectedRequirement).length > 1 && (
                    <>
                      <button
                        className="sawmill-gallery-nav left"
                        onClick={() =>
                          setGalleryIndex((index) =>
                            index === 0
                              ? getRequirementImages(selectedRequirement).length - 1
                              : index - 1
                          )
                        }
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <button
                        className="sawmill-gallery-nav right"
                        onClick={() =>
                          setGalleryIndex((index) =>
                            index === getRequirementImages(selectedRequirement).length - 1
                              ? 0
                              : index + 1
                          )
                        }
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  <span className="sawmill-gallery-counter">
                    {galleryIndex + 1} / {getRequirementImages(selectedRequirement).length}
                  </span>
                </div>

                <div className="sawmill-gallery-thumbs">
                  {getRequirementImages(selectedRequirement).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      className={index === galleryIndex ? "active" : ""}
                      onClick={() => setGalleryIndex(index)}
                    >
                      <img src={image} alt="" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="sawmill-gallery-no-photo">
                📋
                <span>No photos uploaded</span>
              </div>
            )}

            <div className="sawmill-gallery-info">
              <div>
                <small>Category</small>
                <strong>
                  {selectedRequirement.category_label ||
                    selectedRequirement.category ||
                    "Requirement"}
                </strong>
              </div>

              <div>
                <small>Quantity</small>
                <strong>
                  {selectedRequirement.quantity || "On request"}
                </strong>
              </div>

              <div>
                <small>Budget</small>
                <strong>
                  {selectedRequirement.budget
                    ? `₹ ${selectedRequirement.budget}`
                    : "Not specified"}
                </strong>
              </div>

              <div>
                <small>Location</small>
                <strong>
                  {selectedRequirement.location || "Not added"}
                </strong>
              </div>
            </div>

            {selectedRequirement.description && (
              <p className="sawmill-gallery-description">
                {selectedRequirement.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          CHAT MODAL
      ===================================================== */}

      {showChat &&
        chatUser && (

          <div
            className="sawmill-modal-overlay"
            onMouseDown={() =>
              setShowChat(
                false
              )
            }
          >

            <div
              className="sawmill-chat"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              <div className="sawmill-chat-header">

                <div>

                  <div className="sawmill-chat-avatar">

                    {chatUser.photo_url ? (
                      <img
                        src={
                          chatUser.photo_url
                        }
                        alt=""
                      />
                    ) : (
                      <User
                        size={18}
                      />
                    )}

                  </div>


                  <div>

                    <strong>
                      {chatUser.name ||
                        "TimberMart User"}
                    </strong>

                    <span>
                      {chatUser.role ||
                        "Worker"}
                    </span>

                  </div>

                </div>


                <button
                  onClick={() =>
                    setShowChat(
                      false
                    )
                  }
                >
                  <X size={20} />
                </button>

              </div>


              <div className="sawmill-chat-messages">

                {messages.length ===
                0 ? (

                  <div className="sawmill-chat-empty">

                    <MessageCircle
                      size={35}
                    />

                    <h3>
                      Start Conversation
                    </h3>

                    <p>
                      Send a message to{" "}
                      {chatUser.name ||
                        "this worker"}.
                    </p>

                  </div>

                ) : (

                  messages.map(
                    (message) => {

                      const mine =
                        message.sender_id ===
                        session.user.id;

                      return (
                        <div
                          key={
                            message.id
                          }
                          className={
                            mine
                              ? "sawmill-message mine"
                              : "sawmill-message"
                          }
                        >
                          {message.body}
                        </div>
                      );
                    }
                  )

                )}

              </div>


              <form
                className="sawmill-chat-form"
                onSubmit={
                  sendMessage
                }
              >

                <input
                  value={
                    messageText
                  }
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
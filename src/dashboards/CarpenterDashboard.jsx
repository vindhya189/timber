import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  LocateFixed,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Home,
  Image as ImageIcon,
  Upload,
  ShieldCheck,
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
  "Door Fitting","Window Fitting","Furniture Making","Furniture Design",
  "Hand Design Work","Hand Carving","Wood Carving","Traditional Wood Craft",
  "Custom Furniture","Furniture Repair","Wood Polishing","Modular Kitchen",
  "Staircase Work","Interior Woodwork","Doors & Windows","Pooja Mandir Making",
  "Bed Making","Sofa & Chair Making","Dining Table Making","Office Furniture",
  "Wood Turning","CNC Wood Work","UPVC / Wood Combination Work","General Woodwork",
  "Others",
];

const DASHBOARD_LANGUAGES = {
  en: "English", te: "తెలుగు", hi: "हिन्दी", ta: "தமிழ்", kn: "ಕನ್ನಡ",
};

const TRANSLATIONS = {
  en: {
    Dashboard:"Dashboard","Create / Edit Service Profile":"Create / Edit Service Profile",
    "My Service Profile":"My Service Profile","Customer Requirements":"Customer Requirements",
    Notifications:"Notifications","Update Location":"Update Location","Updating Location...":"Updating Location...",
    "My Profile":"My Profile",Settings:"Settings",Logout:"Logout","TimberMart":"TimberMart",
    "Carpenter":"Carpenter","Location not added":"Location not added","Hello,":"Hello,",
    "CARPENTER SERVICE":"CARPENTER SERVICE","No Commission":"No Commission","Direct Contact":"Direct Contact",
    "100% Secure":"100% Secure","We Connect. You Deal Directly.":"We Connect. You Deal Directly.",
    "Timber Listings":"Timber Listings","Refresh":"Refresh","View":"View","Loading notifications...":"Loading notifications...",
    "No notifications":"No notifications","Mark all read":"Mark all read","Post Timber Listing":"Post Timber Listing",
    "Nearest Timber Deals":"Nearest Timber Deals","Expires":"Expires","Expired":"Expired",
    "Available":"Available","Available Now":"Available Now","Furniture Making":"Furniture Making",
    "Hand Design Work":"Hand Design Work","Furniture Design":"Furniture Design","Custom Furniture":"Custom Furniture",
    "Hand Carving":"Hand Carving","Traditional Wood Craft":"Traditional Wood Craft",
  },
  te: {
    Dashboard:"డ్యాష్‌బోర్డ్","Create / Edit Service Profile":"సర్వీస్ ప్రొఫైల్ సృష్టించండి / మార్చండి",
    "My Service Profile":"నా సర్వీస్ ప్రొఫైల్","Customer Requirements":"కస్టమర్ అవసరాలు",
    Notifications:"నోటిఫికేషన్లు","Update Location":"లొకేషన్ అప్‌డేట్","Updating Location...":"లొకేషన్ అప్‌డేట్ అవుతోంది...",
    "My Profile":"నా ప్రొఫైల్",Settings:"సెట్టింగ్స్",Logout:"లాగౌట్",TimberMart:"టింబర్‌మార్ట్",
    Carpenter:"కార్పెంటర్","Location not added":"లొకేషన్ జోడించలేదు","CARPENTER SERVICE":"కార్పెంటర్ సర్వీస్",
    "No Commission":"కమీషన్ లేదు","Direct Contact":"నేరుగా సంప్రదించండి","100% Secure":"100% సురక్షితం",
    "We Connect. You Deal Directly.":"మేము కనెక్ట్ చేస్తాం. మీరు నేరుగా డీల్ చేయండి.",
    "Timber Listings":"టింబర్ లిస్టింగ్స్","Refresh":"రిఫ్రెష్","View":"చూడండి",
    "Loading notifications...":"నోటిఫికేషన్లు లోడ్ అవుతున్నాయి...","No notifications":"నోటిఫికేషన్లు లేవు",
    "Mark all read":"అన్నీ చదివినవిగా చేయండి","Post Timber Listing":"టింబర్ లిస్టింగ్ పోస్ట్ చేయండి",
    "Nearest Timber Deals":"దగ్గరలోని టింబర్ డీల్స్","Expires":"గడువు","Expired":"గడువు ముగిసింది",
    "Available":"అందుబాటులో ఉంది","Available Now":"ఇప్పుడు అందుబాటులో ఉంది","Furniture Making":"ఫర్నిచర్ తయారీ",
    "Hand Design Work":"హ్యాండ్ డిజైన్ వర్క్","Furniture Design":"ఫర్నిచర్ డిజైన్","Custom Furniture":"కస్టమ్ ఫర్నిచర్",
    "Hand Carving":"చేతి చెక్కడం","Traditional Wood Craft":"సాంప్రదాయ వుడ్ క్రాఫ్ట్",
  },
  hi: {
    Dashboard:"डैशबोर्ड","Create / Edit Service Profile":"सर्विस प्रोफ़ाइल बनाएं / संपादित करें",
    "My Service Profile":"मेरी सर्विस प्रोफ़ाइल","Customer Requirements":"ग्राहक आवश्यकताएं",
    Notifications:"सूचनाएं","Update Location":"लोकेशन अपडेट","Updating Location...":"लोकेशन अपडेट हो रहा है...",
    "My Profile":"मेरी प्रोफ़ाइल",Settings:"सेटिंग्स",Logout:"लॉगआउट",TimberMart:"टिम्बरमार्ट",
    Carpenter:"बढ़ई","Location not added":"लोकेशन नहीं जोड़ी गई","CARPENTER SERVICE":"बढ़ई सेवा",
    "No Commission":"कोई कमीशन नहीं","Direct Contact":"सीधा संपर्क","100% Secure":"100% सुरक्षित",
    "We Connect. You Deal Directly.":"हम जोड़ते हैं। आप सीधे सौदा करें।","Timber Listings":"टिम्बर लिस्टिंग",
    Refresh:"रिफ्रेश",View:"देखें","Loading notifications...":"सूचनाएं लोड हो रही हैं...","No notifications":"कोई सूचनाएं नहीं",
    "Mark all read":"सभी को पढ़ा हुआ करें","Post Timber Listing":"टिम्बर लिस्टिंग पोस्ट करें",
    "Nearest Timber Deals":"नज़दीकी टिम्बर डील्स",Expires:"समाप्ति",Expired:"समाप्त",
    Available:"उपलब्ध","Available Now":"अभी उपलब्ध","Furniture Making":"फर्नीचर बनाना",
    "Hand Design Work":"हैंड डिजाइन कार्य","Furniture Design":"फर्नीचर डिजाइन","Custom Furniture":"कस्टम फर्नीचर",
    "Hand Carving":"हाथ से नक्काशी","Traditional Wood Craft":"पारंपरिक लकड़ी शिल्प",
  },
  ta: {
    Dashboard:"டாஷ்போர்டு","Create / Edit Service Profile":"சேவை சுயவிவரத்தை உருவாக்கு / திருத்து",
    "My Service Profile":"என் சேவை சுயவிவரம்","Customer Requirements":"வாடிக்கையாளர் தேவைகள்",
    Notifications:"அறிவிப்புகள்","Update Location":"இருப்பிடத்தை புதுப்பி","Updating Location...":"இருப்பிடம் புதுப்பிக்கப்படுகிறது...",
    "My Profile":"என் சுயவிவரம்",Settings:"அமைப்புகள்",Logout:"வெளியேறு",TimberMart:"டிம்பர்மார்ட்",
    Carpenter:"தச்சர்","Location not added":"இருப்பிடம் சேர்க்கப்படவில்லை","CARPENTER SERVICE":"தச்சர் சேவை",
    "No Commission":"கமிஷன் இல்லை","Direct Contact":"நேரடி தொடர்பு","100% Secure":"100% பாதுகாப்பானது",
    "We Connect. You Deal Directly.":"நாங்கள் இணைக்கிறோம். நீங்கள் நேரடியாக ஒப்பந்தம் செய்யுங்கள்.",
    "Timber Listings":"மரப் பட்டியல்கள்",Refresh:"புதுப்பி",View:"பார்க்க",
    "Loading notifications...":"அறிவிப்புகள் ஏற்றப்படுகின்றன...","No notifications":"அறிவிப்புகள் இல்லை",
    "Mark all read":"அனைத்தையும் படித்ததாக குறி","Post Timber Listing":"மரப் பட்டியலை பதிவு செய்",
    "Nearest Timber Deals":"அருகிலுள்ள மர ஒப்பந்தங்கள்",Expires:"காலாவதி",Expired:"காலாவதி",
    Available:"கிடைக்கும்","Available Now":"இப்போது கிடைக்கும்","Furniture Making":"தளபாடம் தயாரித்தல்",
    "Hand Design Work":"கை வடிவமைப்பு வேலை","Furniture Design":"தளபாட வடிவமைப்பு","Custom Furniture":"தனிப்பயன் தளபாடம்",
    "Hand Carving":"கை செதுக்குதல்","Traditional Wood Craft":"பாரம்பரிய மரக் கைவினை",
  },
  kn: {
    Dashboard:"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್","Create / Edit Service Profile":"ಸೇವಾ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ / ಸಂಪಾದಿಸಿ",
    "My Service Profile":"ನನ್ನ ಸೇವಾ ಪ್ರೊಫೈಲ್","Customer Requirements":"ಗ್ರಾಹಕರ ಅಗತ್ಯಗಳು",
    Notifications:"ಅಧಿಸೂಚನೆಗಳು","Update Location":"ಸ್ಥಳ ನವೀಕರಿಸಿ","Updating Location...":"ಸ್ಥಳ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
    "My Profile":"ನನ್ನ ಪ್ರೊಫೈಲ್",Settings:"ಸೆಟ್ಟಿಂಗ್‌ಗಳು",Logout:"ಲಾಗ್‌ಔಟ್",TimberMart:"ಟಿಂಬರ್‌ಮಾರ್ಟ್",
    Carpenter:"ಬಡಗಿ","Location not added":"ಸ್ಥಳ ಸೇರಿಸಲಾಗಿಲ್ಲ","CARPENTER SERVICE":"ಬಡಗಿ ಸೇವೆ",
    "No Commission":"ಕಮಿಷನ್ ಇಲ್ಲ","Direct Contact":"ನೇರ ಸಂಪರ್ಕ","100% Secure":"100% ಸುರಕ್ಷಿತ",
    "We Connect. You Deal Directly.":"ನಾವು ಸಂಪರ್ಕಿಸುತ್ತೇವೆ. ನೀವು ನೇರವಾಗಿ ವ್ಯವಹರಿಸಿ.",
    "Timber Listings":"ಟಿಂಬರ್ ಪಟ್ಟಿಗಳು",Refresh:"ರಿಫ್ರೆಶ್",View:"ವೀಕ್ಷಿಸಿ",
    "Loading notifications...":"ಅಧಿಸೂಚನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...","No notifications":"ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ",
    "Mark all read":"ಎಲ್ಲವನ್ನೂ ಓದಿದಂತೆ ಗುರುತಿಸಿ","Post Timber Listing":"ಟಿಂಬರ್ ಪಟ್ಟಿಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ",
    "Nearest Timber Deals":"ಹತ್ತಿರದ ಟಿಂಬರ್ ವ್ಯವಹಾರಗಳು",Expires:"ಅವಧಿ",Expired:"ಅವಧಿ ಮುಗಿದಿದೆ",
    Available:"ಲಭ್ಯವಿದೆ","Available Now":"ಈಗ ಲಭ್ಯವಿದೆ","Furniture Making":"ಫರ್ನಿಚರ್ ತಯಾರಿಕೆ",
    "Hand Design Work":"ಹ್ಯಾಂಡ್ ಡಿಸೈನ್ ಕೆಲಸ","Furniture Design":"ಫರ್ನಿಚರ್ ಡಿಸೈನ್","Custom Furniture":"ಕಸ್ಟಮ್ ಫರ್ನಿಚರ್",
    "Hand Carving":"ಕೈ ಕೆತ್ತನೆ","Traditional Wood Craft":"ಸಾಂಪ್ರದಾಯಿಕ ಮರದ ಕಲೆ",
  }
};

const SKILL_LABELS = {
  "Door Fitting":["Door Fitting","డోర్ ఫిట్టింగ్","दरवाज़ा फिटिंग","கதவு பொருத்துதல்","ಬಾಗಿಲು ಫಿಟ್ಟಿಂಗ್"],
  "Window Fitting":["Window Fitting","విండో ఫిట్టింగ్","खिड़की फिटिंग","ஜன்னல் பொருத்துதல்","ಕಿಟಕಿ ಫಿಟ್ಟಿಂಗ್"],
  "Furniture Making":["Furniture Making","ఫర్నిచర్ తయారీ","फर्नीचर बनाना","தளபாடம் தயாரித்தல்","ಫರ್ನಿಚರ್ ತಯಾರಿಕೆ"],
  "Furniture Design":["Furniture Design","ఫర్నిచర్ డిజైన్","फर्नीचर डिजाइन","தளபாட வடிவமைப்பு","ಫರ್ನಿಚರ್ ಡಿಸೈನ್"],
  "Hand Design Work":["Hand Design Work","హ్యాండ్ డిజైన్ వర్క్","हैंड डिजाइन कार्य","கை வடிவமைப்பு வேலை","ಹ್ಯಾಂಡ್ ಡಿಸೈನ್ ಕೆಲಸ"],
  "Hand Carving":["Hand Carving","చేతి చెక్కడం","हाथ से नक्काशी","கை செதுக்குதல்","ಕೈ ಕೆತ್ತನೆ"],
  "Wood Carving":["Wood Carving","వుడ్ కార్వింగ్","लकड़ी की नक्काशी","மர செதுக்குதல்","ಮರ ಕೆತ್ತನೆ"],
  "Traditional Wood Craft":["Traditional Wood Craft","సాంప్రదాయ వుడ్ క్రాఫ్ట్","पारंपरिक लकड़ी शिल्प","பாரம்பரிய மரக் கைவினை","ಸಾಂಪ್ರದಾಯಿಕ ಮರದ ಕಲೆ"],
  "Custom Furniture":["Custom Furniture","కస్టమ్ ఫర్నిచర్","कस्टम फर्नीचर","தனிப்பயன் தளபாடம்","ಕಸ್ಟಮ್ ಫರ್ನಿಚರ್"],
};


export default function CarpenterDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [serviceProfile, setServiceProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [timberListings, setTimberListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [locationUpdatedAt, setLocationUpdatedAt] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showListing, setShowListing] = useState(false);
  const [showTimberForm, setShowTimberForm] = useState(false);
  const [timberSaving, setTimberSaving] = useState(false);
  const [timberError, setTimberError] = useState("");
  const [timberPhotos, setTimberPhotos] = useState([]);
  const [timberPhotoPreviews, setTimberPhotoPreviews] = useState([]);
  const [timberForm, setTimberForm] = useState({ title:"", category:"timber_products", tree_type:"", quantity:"", quantity_unit:"Ton", price:"", condition:"", location:"", description:"" });

  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [dashboardLanguage, setDashboardLanguage] = useState(
    () => localStorage.getItem("timbermart_carpenter_language") || "en"
  );

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

  const tx = (key) => TRANSLATIONS[dashboardLanguage]?.[key] || TRANSLATIONS.en[key] || key;
  const skillLabel = (skill) => {
    const row = SKILL_LABELS[skill];
    return row ? (row[{en:0,te:1,hi:2,ta:3,kn:4}[dashboardLanguage]] || row[0]) : skill;
  };
  const formatExpiry = (date) => {
    if (!date) return "";
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return `${tx("Expired")}`;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${tx("Expires")}: ${days}d ${hours}h`;
  };

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
        loadTimberListings(currentSession.user.id),
        loadNotifications(currentSession.user.id),
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


  /* =========================================================
     TIMBER LISTINGS
     Loads listing_images so mobile/desktop can show ALL photos.
  ========================================================= */
  async function loadTimberListings(userId = session?.user?.id) {
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        listing_images (
          id,
          image_url,
          storage_path,
          sort_order,
          display_order
        ),
        profiles (
          id,
          name,
          role,
          phone,
          location,
          photo_url
        )
      `)
      .in("role", ["farmer", "merchant", "timber_merchant", "sawmill", "sawmill_business", "carpenter"])
      .or(`status.eq.approved,user_id.eq.${userId || "00000000-0000-0000-0000-000000000000"}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Carpenter timber listings error:", error);
      setTimberListings([]);
      return;
    }

    setTimberListings(data || []);
  }

  function getAllImages(item) {
    if (!item) return [];

    const relationImages = Array.isArray(item.listing_images)
      ? item.listing_images
          .slice()
          .sort(
            (a, b) =>
              Number(a.display_order ?? a.sort_order ?? 0) -
              Number(b.display_order ?? b.sort_order ?? 0)
          )
          .map((image) => image?.image_url)
          .filter(Boolean)
      : [];

    const directImages = [
      item.image_url,
      item.photo_url,
      ...(Array.isArray(item.images) ? item.images : []),
      ...(Array.isArray(item.image_urls) ? item.image_urls : []),
      ...(Array.isArray(item.photos) ? item.photos : []),
    ].filter(Boolean);

    return [...new Set([...relationImages, ...directImages])];
  }

  function getRequirementImages(item) {
    if (!item) return [];
    const values = [
      item.image_url,
      item.photo_url,
      ...(Array.isArray(item.images) ? item.images : []),
      ...(Array.isArray(item.image_urls) ? item.image_urls : []),
      ...(Array.isArray(item.photos) ? item.photos : []),
    ];
    return [...new Set(values.filter(Boolean))];
  }

  /* =========================================================
     CREATE TIMBER LISTING — DIRECT PHOTO UPLOAD + ADMIN APPROVAL
  ========================================================= */
  function openTimberForm() {
    setTimberError("");
    setTimberForm((p) => ({ ...p, location: profile?.location || serviceProfile?.location || "" }));
    setShowTimberForm(true);
  }

  function handleTimberPhotos(event) {
    const files = Array.from(event.target.files || []);
    const valid = files.filter((file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024);
    if (files.length !== valid.length) setTimberError("Only image files up to 5 MB each are allowed.");
    const next = [...timberPhotos, ...valid].slice(0, 8);
    setTimberPhotos(next);
    setTimberPhotoPreviews(next.map((file) => URL.createObjectURL(file)));
    event.target.value = "";
  }

  function removeTimberPhoto(index) {
    const next = timberPhotos.filter((_, i) => i !== index);
    setTimberPhotos(next);
    setTimberPhotoPreviews(next.map((file) => URL.createObjectURL(file)));
  }

  async function publishCarpenterTimberListing(event) {
    event.preventDefault();
    const userId = session?.user?.id;
    if (!userId) return setTimberError("Your session has expired. Please login again.");
    const location = timberForm.location.trim() || profile?.location || serviceProfile?.location || "";
    if (!timberForm.title.trim() || !timberForm.tree_type.trim() || !timberForm.quantity.trim()) return setTimberError("Please enter title, wood type and quantity.");
    if (!location) return setTimberError("Please update your GPS location before posting.");
    if (!timberPhotos.length) return setTimberError("Please upload at least one timber photo.");
    try {
      setTimberSaving(true); setTimberError("");
      const { data: listing, error: listingError } = await supabase.from("listings").insert({
        user_id: userId, role: "carpenter", status: "pending", category: timberForm.category,
        tree_type: timberForm.tree_type.trim(), title: timberForm.title.trim(), wood_type: timberForm.tree_type.trim(),
        product_type: timberForm.tree_type.trim(), quantity: timberForm.quantity.trim(), quantity_unit: timberForm.quantity_unit,
        price: timberForm.price.trim() || null, condition: timberForm.condition.trim() || null, location,
        description: timberForm.description.trim() || null,
        latitude: profile?.latitude ?? null,
        longitude: profile?.longitude ?? null,
        contact_preference: "Call / WhatsApp / Chat"
      }).select("*").single();
      if (listingError) throw listingError;
      let uploaded = 0;
      for (let i=0; i<timberPhotos.length; i++) {
        const file = timberPhotos[i];
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${listing.id}/${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, file, { cacheControl:"3600", upsert:false, contentType:file.type });
        if (uploadError) { console.error(uploadError); continue; }
        const { data: urlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
        const imageUrl = urlData?.publicUrl;
        if (!imageUrl) continue;
        const { error: imageError } = await supabase.from("listing_images").insert({ listing_id:listing.id, user_id:userId, image_url:imageUrl, storage_path:path, sort_order:i });
        if (!imageError) uploaded++;
      }
      if (!uploaded) { await supabase.from("listings").delete().eq("id", listing.id); throw new Error("Photos could not be uploaded. Check Supabase Storage policies."); }
      setShowTimberForm(false); setTimberPhotos([]); setTimberPhotoPreviews([]);
      setTimberForm({ title:"", category:"timber_products", tree_type:"", quantity:"", quantity_unit:"Ton", price:"", condition:"", location:profile?.location || serviceProfile?.location || "", description:"" });
      await loadTimberListings(); await loadNotifications(userId);
      alert("Timber listing submitted successfully. Admin approval is pending.");
    } catch (error) { setTimberError(error?.message || "Unable to submit timber listing."); }
    finally { setTimberSaving(false); }
  }

  /* =========================================================
     NOTIFICATIONS
     Admin announcements/posts arrive in this same inbox.
  ========================================================= */
  async function loadNotifications(userId = session?.user?.id) {
    if (!userId) return;

    setNotificationLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Carpenter notifications error:", error);
      setNotifications([]);
    } else {
      setNotifications(data || []);
    }

    setNotificationLoading(false);
  }

  async function markNotificationRead(notificationId) {
    if (!notificationId || !session?.user?.id) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", session.user.id);

    if (!error) {
      setNotifications((old) =>
        old.map((item) =>
          item.id === notificationId
            ? { ...item, is_read: true }
            : item
        )
      );
    }
  }

  async function markAllNotificationsRead() {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications((old) =>
        old.map((item) => ({ ...item, is_read: true }))
      );
    }
  }

  async function openCarpenterNotification(notification) {
    if (!notification) return;

    await markNotificationRead(notification.id);

    if (
      notification.listing_id ||
      notification.post_type === "listing"
    ) {
      const listingId =
        notification.listing_id || notification.post_id;

      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          listing_images (
            id,
            image_url,
            storage_path,
            sort_order,
            display_order
          ),
          profiles (
            id,
            name,
            role,
            phone,
            location,
            photo_url
          )
        `)
        .eq("id", listingId)
        .maybeSingle();

      if (!error && data) {
        setSelectedListing(data);
        setShowListing(true);
        setShowNotifications(false);
      }
      return;
    }

    if (notification.post_id) {
      const { data, error } = await supabase
        .from("admin_posts")
        .select("*")
        .eq("id", notification.post_id)
        .maybeSingle();

      if (!error && data) {
        setSelectedListing(null);
        setShowNotifications(false);
        alert(
          `${data.title}\n\n${data.message}`
        );
      }
    }
  }

  /* =========================================================
     LOCATION
     Browser GPS only. Coordinates are stored privately.
  ========================================================= */
  async function updateCarpenterLocation() {
    if (!session?.user?.id) return;

    if (!navigator.geolocation) {
      alert("Location is not supported by this browser.");
      return;
    }

    setLocationUpdating(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      let readableLocation = profile?.location || "";

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          const geo = await response.json();
          const address = geo.address || {};

          readableLocation =
            [
              address.city ||
                address.town ||
                address.village ||
                address.municipality,
              address.district ||
                address.county,
              address.state,
            ]
              .filter(Boolean)
              .join(", ") ||
            geo.display_name ||
            readableLocation;
        }
      } catch (geoError) {
        console.warn("Reverse geocoding failed:", geoError);
      }

      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update({
          latitude,
          longitude,
          location: readableLocation,
        })
        .eq("id", session.user.id)
        .select("*")
        .single();

      if (error) throw error;

      setProfile(updatedProfile || {
        ...profile,
        latitude,
        longitude,
        location: readableLocation,
      });

      setServiceForm((old) => ({
        ...old,
        location: readableLocation || old.location,
      }));

      setLocationUpdatedAt(new Date().toISOString());
      alert("📍 Location updated successfully.");
    } catch (error) {
      console.error("Carpenter location update error:", error);
      alert(
        error?.message ||
          "Unable to update your location. Please allow browser location access."
      );
    } finally {
      setLocationUpdating(false);
    }
  }

  /* =========================================================
     LIVE NOTIFICATIONS + LISTINGS
  ========================================================= */
  useEffect(() => {
    if (!session?.user?.id) return;

    const notificationChannel = supabase
      .channel(`carpenter-notifications-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          setNotifications((old) => [
            payload.new,
            ...old.filter((item) => item.id !== payload.new.id),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const channel = supabase
      .channel("carpenter-timber-listings-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listings",
        },
        () => {
          loadTimberListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    <div className={`carpenter-app carpenter-lang-${dashboardLanguage}`} lang={dashboardLanguage}>

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
          <label className="carpenter-language-picker" title="Language">
            <span>🌐</span>
            <select value={dashboardLanguage} onChange={(e) => {
              const value = e.target.value;
              setDashboardLanguage(value);
              localStorage.setItem("timbermart_carpenter_language", value);
            }}>
              {Object.entries(DASHBOARD_LANGUAGES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>

          <button
            className="carpenter-bell"
            title="Notifications"
            onClick={() => {
              setShowNotifications(true);
              loadNotifications(session?.user?.id);
            }}
          >
            <Bell size={20} />
            {notifications.filter((item) => !item.is_read).length > 0 && (
              <span className="carpenter-notification-count">
                {Math.min(
                  notifications.filter((item) => !item.is_read).length,
                  99
                )}
              </span>
            )}
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
                setShowNotifications(true);
                loadNotifications(session.user.id);
              }}
            >
              <Bell size={18} />
              Notifications
              {notifications.filter((item) => !item.is_read).length > 0 && (
                <span className="carpenter-side-notification-badge">
                  {Math.min(
                    notifications.filter((item) => !item.is_read).length,
                    99
                  )}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setMobileMenu(false);
                updateCarpenterLocation();
              }}
              disabled={locationUpdating}
            >
              <LocateFixed size={18} />
              {locationUpdating ? "Updating Location..." : "Update Location"}
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


              <div className="carpenter-location-card">
                <div className="carpenter-hero-location">
                  <MapPin size={16} />
                  {profile?.location ||
                    serviceProfile?.location ||
                    "Location not added"}
                </div>

                <div className="carpenter-location-actions">
                  <span className={profile?.latitude && profile?.longitude ? "gps-on" : "gps-off"}>
                    <span className="gps-dot" />
                    {profile?.latitude && profile?.longitude
                      ? "GPS Location Saved"
                      : "GPS Location Not Set"}
                  </span>

                  <button
                    type="button"
                    onClick={updateCarpenterLocation}
                    disabled={locationUpdating}
                  >
                    <LocateFixed size={15} />
                    {locationUpdating ? "Updating..." : "Update Location"}
                  </button>
                </div>
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
                <strong>{tx("Create / Edit Service Profile")}</strong>
                <small>
                  Add skills and experience
                </small>
              </button>


              <button
                onClick={() => setShowService(true)}
              >
                <span>📋</span>
                <strong>{tx("My Service Profile")}</strong>
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
                <strong>{tx("Customer Requirements")}</strong>
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

              <button className="carpenter-tool-highlight" onClick={openTimberForm}>
                <span>🪵</span><strong>Post Timber Listing</strong><small>Upload photos & send for Admin approval</small>
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

          <section className="carpenter-listing-create-card" id="post-timber">
            <div className="carpenter-listing-create-copy"><div className="carpenter-listing-create-icon">🪵</div><div>
              <span className="carpenter-section-kicker">SELL ON TIMBERMART</span><h2>Post Timber Listing</h2>
              <p>Upload real timber photos directly from your phone. New listings go to Admin Approval Center before buyers can see them.</p>
              <div className="carpenter-approval-flow"><span><strong>1</strong> Upload</span><ChevronRight size={15}/><span><strong>2</strong> Admin Review</span><ChevronRight size={15}/><span><strong>3</strong> Approved</span></div>
            </div></div><button className="carpenter-post-timber-btn" type="button" onClick={openTimberForm}><Plus size={18}/> Post Timber</button>
          </section>

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
                <h2>{tx("Customer Requirements")}</h2>

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

                        {getRequirementImages(requirement).length > 0 && (
                          <div className="carpenter-requirement-images">
                            {getRequirementImages(requirement)
                              .map((image, index) => (
                                <img
                                  key={`${requirement.id}-image-${index}`}
                                  src={image}
                                  alt={`${requirement.title || "Requirement"} ${index + 1}`}
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ))}
                            {getRequirementImages(requirement).length > 6 && (
                              <span>
                                +{getRequirementImages(requirement).length - 6}
                              </span>
                            )}
                          </div>
                        )}

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
              TIMBER LISTINGS
              ALL listing photos are shown and mobile friendly.
          ================================================= */}
          <section className="carpenter-section" id="timber-listings">
            <div className="carpenter-section-title">
              <div>
                <span className="carpenter-section-kicker">TIMBER MARKETPLACE</span>
                <h2>{tx("Timber Listings")}</h2>
                <p>
                  View standing trees and timber products posted on TimberMart.
                </p>
              </div>

              <button
                type="button"
                className="carpenter-refresh-btn"
                onClick={loadTimberListings}
              >
                ↻ Refresh
              </button>
            </div>

            {timberListings.length === 0 ? (
              <div className="carpenter-empty">
                <div>🪵</div>
                <h3>No timber listings available</h3>
                <p>New farmer, merchant and sawmill listings will appear here.</p>
              </div>
            ) : (
              <div className="carpenter-listing-grid">
                {timberListings.map((listing) => {
                  const images = getAllImages(listing);
                  const seller = listing.profiles;
                  const isTree = listing.category === "standing_trees";

                  return (
                    <article className="carpenter-timber-card" key={listing.id}>
                      <button
                        type="button"
                        className="carpenter-listing-photo-button"
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowListing(true);
                        }}
                      >
                        {images.length > 0 ? (
                          <div className="carpenter-listing-photo-grid">
                            {images.map((image, index) => (
                              <img
                                key={`${listing.id}-${image}-${index}`}
                                src={image}
                                alt={`${listing.title || "Timber"} ${index + 1}`}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ))}
                            {images.length > 6 && (
                              <span className="carpenter-more-photos">
                                +{images.length - 6} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="carpenter-listing-placeholder">
                            {isTree ? "🌳" : "🪵"}
                          </div>
                        )}
                      </button>

                      <div className="carpenter-timber-card-body">
                        <span className="carpenter-listing-type">
                          {isTree ? "🌳 Standing Tree" : "🪵 Timber Product"}
                        </span>
                        <span className={`carpenter-listing-status ${String(listing.status || "").toLowerCase()}`}>
                          {String(listing.status || "pending").toLowerCase() === "approved" ? "✓ Approved" : String(listing.status || "pending").toLowerCase() === "rejected" ? "✕ Rejected" : "◷ Pending Admin Approval"}
                        </span>
                        <span className={`carpenter-listing-expiry ${new Date(listing.expires_at || new Date(new Date(listing.created_at).getTime() + 15*86400000)) <= new Date() ? "expired" : ""}`}>
                          {formatExpiry(listing.expires_at || new Date(new Date(listing.created_at).getTime() + 15*86400000))}
                        </span>

                        <h3>{listing.title || listing.wood_type || "Timber Listing"}</h3>

                        <p>
                          {listing.description ||
                            listing.subcategory ||
                            listing.wood_type ||
                            "Timber available on TimberMart."}
                        </p>

                        <div className="carpenter-listing-meta">
                          <span>
                            <MapPin size={14} />
                            {listing.location ||
                              seller?.location ||
                              "Location not added"}
                          </span>

                          {listing.quantity != null && (
                            <span>Qty: {listing.quantity}</span>
                          )}
                        </div>

                        <div className="carpenter-listing-footer">
                          <small>
                            {seller?.name || "TimberMart Seller"}
                          </small>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowListing(true);
                            }}
                          >
                            View <Eye size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* =================================================
              FOOTER DISCLAIMER
          ================================================= */}

          <footer className="carpenter-footer">

            <div>
              <Check size={18} />
              <span>{tx("No Commission")}</span>
            </div>

            <div>
              <Phone size={18} />
              <span>{tx("Direct Contact")}</span>
            </div>

            <div>
              <Users size={18} />
              <span>{tx("100% Secure")}</span>
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

                {getRequirementImages(selectedRequirement).length > 0 && (
                  <div className="carpenter-requirement-detail-images">
                    {getRequirementImages(selectedRequirement).map(
                      (image, index) => (
                        <img
                          key={`${selectedRequirement.id}-detail-${index}`}
                          src={image}
                          alt={`${selectedRequirement.title || "Requirement"} ${index + 1}`}
                        />
                      )
                    )}
                  </div>
                )}

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

      {/* =====================================================
          NOTIFICATIONS PANEL
      ===================================================== */}
      {showNotifications && (
        <div
          className="carpenter-notification-overlay"
          onMouseDown={() => setShowNotifications(false)}
        >
          <aside
            className="carpenter-notification-panel"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="carpenter-notification-header">
              <div>
                <span>UPDATES</span>
                <h2>{tx("Notifications")}</h2>
                <small>TimberMart updates & admin announcements</small>
              </div>
              <button type="button" onClick={() => setShowNotifications(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="carpenter-notification-actions">
              {notifications.some((item) => !item.is_read) && (
                <button type="button" onClick={markAllNotificationsRead}>
                  Mark all read
                </button>
              )}
            </div>

            <div className="carpenter-notification-body">
              {notificationLoading ? (
                <div className="carpenter-notification-empty">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="carpenter-notification-empty">
                  <Bell size={36} />
                  <strong>No notifications</strong>
                  <p>Admin announcements and TimberMart activity will appear here.</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const adminNotification =
                    notification.source === "admin" ||
                    notification.source === "admin_post" ||
                    notification.sender_name === "TimberMart Admin";

                  return (
                    <button
                      type="button"
                      key={notification.id}
                      className={`carpenter-notification-item ${
                        !notification.is_read ? "unread" : ""
                      } ${notification.type === "nearest_deal" || notification.notification_type === "nearest_deal" ? "nearest-deal" : ""}`}
                      onClick={() => openCarpenterNotification(notification)}
                    >
                      <div className="carpenter-notification-icon">
                        {adminNotification
                          ? "📢"
                          : notification.type === "message"
                          ? "💬"
                          : notification.type === "nearest_deal" || notification.notification_type === "nearest_deal"
                          ? "📍"
                          : notification.post_type === "listing"
                          ? "🪵"
                          : "🔔"}
                      </div>

                      <div className="carpenter-notification-content">
                        {adminNotification && (
                          <span className="carpenter-admin-badge">TIMBERMART ADMIN</span>
                        )}
                        <strong>{notification.type === "nearest_deal" ? tx("Nearest Timber Deals") : (notification.title || "TimberMart Notification")}</strong>
                        <p>{notification.message || "You have a new TimberMart update."}</p>

                        {notification.image_url && (
                          <img
                            className="carpenter-notification-image"
                            src={notification.image_url}
                            alt="TimberMart announcement"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}

                        <small>
                          {notification.created_at
                            ? new Date(notification.created_at).toLocaleString()
                            : ""}
                        </small>
                      </div>

                      {!notification.is_read && <span className="carpenter-notification-dot" />}
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}

      {showTimberForm && (
        <div className="carpenter-modal-overlay" onMouseDown={() => !timberSaving && setShowTimberForm(false)}>
          <div className="carpenter-modal carpenter-timber-create-modal" onMouseDown={(e)=>e.stopPropagation()}>
            <div className="carpenter-modal-head"><div><span className="carpenter-section-kicker">NEW LISTING</span><h2>Post Timber Listing</h2><p>Upload photos directly — no photo URL required.</p></div><button className="carpenter-close" type="button" onClick={()=>!timberSaving&&setShowTimberForm(false)}><X size={20}/></button></div>
            <form className="carpenter-timber-form" onSubmit={publishCarpenterTimberListing}>
              {timberError && <div className="carpenter-form-error">{timberError}</div>}
              <div className="carpenter-form-grid">
                <label>Listing Title *<input value={timberForm.title} onChange={e=>setTimberForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Seasoned Teak Wood"/></label>
                <label>Wood / Timber Type *<input value={timberForm.tree_type} onChange={e=>setTimberForm(p=>({...p,tree_type:e.target.value}))} placeholder="Teak, Rosewood, Pine..."/></label>
                <label>Quantity *<input value={timberForm.quantity} onChange={e=>setTimberForm(p=>({...p,quantity:e.target.value}))} placeholder="10"/></label>
                <label>Unit<select value={timberForm.quantity_unit} onChange={e=>setTimberForm(p=>({...p,quantity_unit:e.target.value}))}><option>Ton</option><option>Kg</option><option>CFT</option><option>Piece</option><option>Load</option></select></label>
                <label>Expected Price<input value={timberForm.price} onChange={e=>setTimberForm(p=>({...p,price:e.target.value}))} placeholder="₹ Expected price"/></label>
                <label>Condition<select value={timberForm.condition} onChange={e=>setTimberForm(p=>({...p,condition:e.target.value}))}><option value="">Select condition</option><option>Fresh</option><option>Seasoned</option><option>Dry</option><option>Used / Reclaimed</option></select></label>
              </div>
              <label className="carpenter-full-field">Location *<div className="carpenter-location-input-row"><MapPin size={17}/><input value={timberForm.location} onChange={e=>setTimberForm(p=>({...p,location:e.target.value}))} placeholder="Current / saved location"/><button type="button" onClick={updateCarpenterLocation}><LocateFixed size={15}/> Update GPS</button></div></label>
              <label className="carpenter-full-field">Description<textarea rows="4" value={timberForm.description} onChange={e=>setTimberForm(p=>({...p,description:e.target.value}))} placeholder="Describe timber quality, dimensions, usage, availability..."/></label>
              <div className="carpenter-photo-upload-box"><div className="carpenter-photo-upload-top"><div><strong><ImageIcon size={18}/> Timber Photos *</strong><small>Up to 8 photos · JPG/PNG/WebP · max 5 MB each</small></div><label className="carpenter-upload-photo-btn"><Upload size={17}/> Choose Photos<input type="file" accept="image/*" multiple onChange={handleTimberPhotos}/></label></div>
                {timberPhotoPreviews.length ? <div className="carpenter-timber-preview-grid">{timberPhotoPreviews.map((src,i)=><div className="carpenter-timber-preview" key={`${src}-${i}`}><img src={src} alt={`Timber ${i+1}`}/><button type="button" onClick={()=>removeTimberPhoto(i)}><X size={15}/></button>{i===0&&<span>Cover</span>}</div>)}</div> : <div className="carpenter-upload-empty"><Camera size={28}/><strong>Select timber photos</strong><span>Real photos help Admin review faster.</span></div>}
              </div>
              <div className="carpenter-approval-note"><ShieldCheck size={21}/><div><strong>Admin approval required</strong><span>Listing is saved as <b>Pending</b> and sent to Admin Approval Center.</span></div></div>
              <div className="carpenter-form-actions"><button type="button" className="carpenter-secondary-btn" disabled={timberSaving} onClick={()=>setShowTimberForm(false)}>Cancel</button><button type="submit" className="carpenter-primary-btn" disabled={timberSaving}>{timberSaving?"Uploading & submitting...":"Submit for Admin Approval"}{!timberSaving&&<Check size={17}/>}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          TIMBER LISTING DETAIL MODAL
      ===================================================== */}
      {showListing && selectedListing && (
        <div
          className="carpenter-modal-overlay"
          onMouseDown={() => setShowListing(false)}
        >
          <div
            className="carpenter-modal carpenter-listing-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="carpenter-modal-header">
              <div>
                <span>TIMBER LISTING</span>
                <h2>
                  {selectedListing.title ||
                    selectedListing.wood_type ||
                    "Timber Listing"}
                </h2>
              </div>
              <button className="carpenter-close" type="button" onClick={() => setShowListing(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="carpenter-listing-detail-body">
              {getAllImages(selectedListing).length > 0 ? (
                <div className="carpenter-detail-image-gallery">
                  {getAllImages(selectedListing).map((image, index) => (
                    <img
                      key={`${selectedListing.id}-full-${index}`}
                      src={image}
                      alt={`${selectedListing.title || "Timber"} ${index + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="carpenter-listing-detail-placeholder">
                  {selectedListing.category === "standing_trees" ? "🌳" : "🪵"}
                </div>
              )}

              <div className="carpenter-detail-grid">
                <div>
                  <span>Category</span>
                  <strong>
                    {selectedListing.category === "standing_trees"
                      ? "Standing Trees"
                      : "Timber Products"}
                  </strong>
                </div>
                <div>
                  <span>Wood Type</span>
                  <strong>
                    {selectedListing.wood_type || selectedListing.subcategory || "-"}
                  </strong>
                </div>
                <div>
                  <span>Quantity</span>
                  <strong>{selectedListing.quantity ?? "-"}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>
                    {selectedListing.location ||
                      selectedListing.profiles?.location ||
                      "-"}
                  </strong>
                </div>
                <div className="carpenter-expiry-detail">
                  <span>{tx("Expires")}</span>
                  <strong>{formatExpiry(selectedListing.expires_at || new Date(new Date(selectedListing.created_at).getTime() + 15*86400000))}</strong>
                </div>
              </div>

              <div className="carpenter-detail-description">
                <h4>Description</h4>
                <p>{selectedListing.description || "No additional description."}</p>
              </div>

              <div className="carpenter-customer-detail">
                <div className="carpenter-customer-avatar">
                  {selectedListing.profiles?.photo_url ? (
                    <img src={selectedListing.profiles.photo_url} alt="" />
                  ) : (
                    <User size={22} />
                  )}
                </div>
                <div>
                  <strong>{selectedListing.profiles?.name || "TimberMart Seller"}</strong>
                  <span>{selectedListing.profiles?.role || "Seller"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
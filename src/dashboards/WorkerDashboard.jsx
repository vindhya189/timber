import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Briefcase,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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
import { watermarkImage } from "../watermarkImage";

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

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "te", label: "తెలుగు" },
  { id: "hi", label: "हिन्दी" },
  { id: "ta", label: "தமிழ்" },
  { id: "kn", label: "ಕನ್ನಡ" },
];

const TRANSLATIONS = {
  en: {
    Dashboard: "Dashboard",
    "Create / Edit Profile": "Create / Edit Profile",
    "My Profile": "My Profile",
    "Find Jobs": "Find Jobs",
    "My Applications": "My Applications",
    Settings: "Settings",
    Logout: "Logout",
    "We Connect. You Deal Directly.": "We Connect. You Deal Directly.",
    WORKER: "WORKER",
    "Hello, {name}!": "Hello, {name}!",
    "Find suitable timber jobs, build your career and connect directly with employers.": "Find suitable timber jobs, build your career and connect directly with employers.",
    "Add your location": "Add your location",
    "Edit Profile": "Edit Profile",
    "Create Profile": "Create Profile",
    "Worker Tools": "Worker Tools",
    "Find jobs and manage your worker profile.": "Find jobs and manage your worker profile.",
    "Register your skills": "Register your skills",
    "Search suitable jobs": "Search suitable jobs",
    "View applications": "View applications",
    "View your public profile": "View your public profile",
    "Complete your worker profile": "Complete your worker profile",
    "Employers can find you based on your skills, experience and location.": "Employers can find you based on your skills, experience and location.",
    "Complete Now": "Complete Now",
    "Jobs posted by timber businesses and employers.": "Jobs posted by timber businesses and employers.",
    Jobs: "Jobs",
    "Search jobs, company, location...": "Search jobs, company, location...",
    "No jobs found": "No jobs found",
    "Jobs posted by employers will appear here.": "Jobs posted by employers will appear here.",
    "Timber Business": "Timber Business",
    "Timber Job": "Timber Job",
    "No job description added.": "No job description added.",
    "Work Type not added": "Work Type not added",
    "Experience not specified": "Experience not specified",
    "Salary not specified": "Salary not specified",
    "Applied": "Applied",
    "Job Application": "Job Application",
    "Profile Details": "Profile Details",
    "Basic Info": "Basic Info",
    Details: "Details",
    Skills: "Skills",
    Work: "Work",
    Review: "Review",
    "Upload Photo": "Upload Photo",
    "Change Photo": "Change Photo",
    "Personal details": "Personal details",
    "Age": "Age",
    "Gender": "Gender",
    "Select gender": "Select gender",
    "Male": "Male",
    "Female": "Female",
    "Other": "Other",
    "Location": "Location",
    "City, District, State": "City, District, State",
    "Professional details": "Professional details",
    "Experience": "Experience",
    "Select experience": "Select experience",
    "No experience": "No experience",
    "Less than 1 year": "Less than 1 year",
    "1-3 years": "1-3 years",
    "3-5 years": "3-5 years",
    "5+ years": "5+ years",
    "Experience Details": "Experience Details",
    "Describe your previous work experience...": "Describe your previous work experience...",
    "Select at least one skill.": "Select at least one skill.",
    "Work & Salary": "Work & Salary",
    "Tell employers your preferred work and salary.": "Tell employers your preferred work and salary.",
    "Work Type": "Work Type",
    "Expected Salary / Wage": "Expected Salary / Wage",
    "Example: ₹18,000 - ₹22,000 / Month": "Example: ₹18,000 - ₹22,000 / Month",
    Availability: "Availability",
    "Review Profile": "Review Profile",
    "Check your details before registering your profile.": "Check your details before registering your profile.",
    "Not specified": "Not specified",
    "Registering...": "Registering...",
    "Register Profile": "Register Profile",
    "JOB DETAILS": "JOB DETAILS",
    "Timber Employer": "Timber Employer",
    "Profile": "Profile",
    "Job Description": "Job Description",
    "No description provided.": "No description provided.",
    "Location not specified": "Location not specified",
    Call: "Call",
    WhatsApp: "WhatsApp",
    Chat: "Chat",
    "Already Applied": "Already Applied",
    "Apply for Job": "Apply for Job",
    Employer: "Employer",
    "Employer profile": "Employer profile",
    "Edit Worker Profile": "Edit Worker Profile",
    "Start Conversation": "Start Conversation",
    "Send a message to": "Send a message to",
    "Type a message...": "Type a message...",
    Worker: "Worker",
    "Worker Profile": "Worker Profile",
    "Location not added": "Location not added",
    "Please enter your location.": "Please enter your location.",
    "Please select your experience.": "Please select your experience.",
    "Please select at least one skill.": "Please select at least one skill.",
    "Please select work type.": "Please select work type.",
    "✅ Worker profile registered successfully.": "✅ Worker profile registered successfully.",
    "Unable to save worker profile.": "Unable to save worker profile.",
    "You already applied for this job.": "You already applied for this job.",
    "✅ Application submitted.": "✅ Application submitted.",
    "Phone number is not available.": "Phone number is not available.",
    "WhatsApp number is not available.": "WhatsApp number is not available.",
    "You cannot chat with yourself.": "You cannot chat with yourself.",
    "Growing your requirements...": "Growing your requirements...",
    "Back": "Back",
    "Next": "Next",
    "Review": "Review",
    "Previous": "Previous",
    "Save": "Save",
    "Available Now": "Available Now",
    "Available Soon": "Available Soon",
    "Not Available": "Not Available",
    "Full Time": "Full Time",
    "Part Time": "Part Time",
    "Project Based": "Project Based",
    "Sawmill Machine Operator": "Sawmill Machine Operator",
    "Log Cutting": "Log Cutting",
    "Timber Measurement": "Timber Measurement",
    "Log Sorting": "Log Sorting",
    "Machine Maintenance": "Machine Maintenance",
    "Loading / Unloading": "Loading / Unloading",
    "Carpenter Helper": "Carpenter Helper",
    "Forklift Operator": "Forklift Operator",
  },
  te: {
    Dashboard: "డాష్‌బోర్డ్",
    "Create / Edit Profile": "ప్రొఫైల్ సృష్టించు / మార్చు",
    "My Profile": "నా ప్రొఫైల్",
    "Find Jobs": "ఉద్యోగాలు చూడండి",
    "My Applications": "నా అప్లికేషన్లు",
    Settings: "సెట్టింగ్స్",
    Logout: "లాగ్‌అవుట్",
    "We Connect. You Deal Directly.": "మేము కలుపుతాం. మీరు నేరుగా వ్యవహరించండి.",
    WORKER: "వర్కర్",
    "Hello, {name}!": "హలో, {name}!",
    "Find suitable timber jobs, build your career and connect directly with employers.": "మీకు సరైన టింబర్ ఉద్యోగాలను కనుగొని, కెరీర్‌ను అభివృద్ధి చేసుకుని, యజమానులతో నేరుగా కనెక్ట్ అవ్వండి.",
    "Add your location": "మీ లొకేషన్ జోడించండి",
    "Edit Profile": "ప్రొఫైల్ మార్చు",
    "Create Profile": "ప్రొఫైల్ సృష్టించు",
    "Worker Tools": "వర్కర్ టూల్స్",
    "Find jobs and manage your worker profile.": "ఉద్యోగాలు కనుగొని మీ వర్కర్ ప్రొఫైల్‌ను నిర్వహించండి.",
    "Register your skills": "మీ నైపుణ్యాలను నమోదు చేయండి",
    "Search suitable jobs": "సరైన ఉద్యోగాలను శోధించండి",
    "View applications": "అప్లికేషన్లు చూడండి",
    "View your public profile": "మీ పబ్లిక్ ప్రొఫైల్ చూడండి",
    "Complete your worker profile": "మీ వర్కర్ ప్రొఫైల్ పూర్తి చేయండి",
    "Employers can find you based on your skills, experience and location.": "మీ నైపుణ్యాలు, అనుభవం, లొకేషన్ ఆధారంగా యజమానులు మిమ్మల్ని కనుగొనగలరు.",
    "Complete Now": "ఇప్పుడే పూర్తి చేయండి",
    "Jobs posted by timber businesses and employers.": "టింబర్ వ్యాపారాలు మరియు యజమానులు పోస్ట్ చేసిన ఉద్యోగాలు.",
    Jobs: "ఉద్యోగాలు",
    "Search jobs, company, location...": "ఉద్యోగం, కంపెనీ, లొకేషన్ శోధించండి...",
    "No jobs found": "ఉద్యోగాలు కనిపించలేదు",
    "Jobs posted by employers will appear here.": "యజమానులు పోస్ట్ చేసిన ఉద్యోగాలు ఇక్కడ కనిపిస్తాయి.",
    "Timber Business": "టింబర్ బిజినెస్",
    "Timber Job": "టింబర్ ఉద్యోగం",
    "No job description added.": "ఉద్యోగ వివరణ లేదు.",
    "Work Type not added": "వర్క్ టైప్ జోడించలేదు",
    "Experience not specified": "అనుభవం ఇవ్వలేదు",
    "Salary not specified": "జీతం ఇవ్వలేదు",
    "Applied": "అప్లై చేశారు",
    "Job Application": "జాబ్ అప్లికేషన్",
    "Profile Details": "ప్రొఫైల్ వివరాలు",
    "Basic Info": "ప్రాథమిక సమాచారం",
    Details: "వివరాలు",
    Skills: "నైపుణ్యాలు",
    Work: "పని",
    Review: "సమీక్ష",
    "Upload Photo": "ఫోటో అప్లోడ్ చేయండి",
    "Change Photo": "ఫోటో మార్చండి",
    "Personal details": "వ్యక్తిగత వివరాలు",
    Age: "వయస్సు",
    Gender: "లింగం",
    "Select gender": "లింగం ఎంచుకోండి",
    Male: "పురుషుడు",
    Female: "మహిళ",
    Other: "ఇతర",
    Location: "లొకేషన్",
    "City, District, State": "నగరం, జిల్లా, రాష్ట్రం",
    "Professional details": "వృత్తి వివరాలు",
    Experience: "అనుభవం",
    "Select experience": "అనుభవం ఎంచుకోండి",
    "No experience": "అనుభవం లేదు",
    "Less than 1 year": "1 సంవత్సరం కంటే తక్కువ",
    "1-3 years": "1-3 సంవత్సరాలు",
    "3-5 years": "3-5 సంవత్సరాలు",
    "5+ years": "5+ సంవత్సరాలు",
    "Experience Details": "అనుభవ వివరాలు",
    "Describe your previous work experience...": "మీ గత పని అనుభవాన్ని వివరించండి...",
    "Select at least one skill.": "కనీసం ఒక నైపుణ్యాన్ని ఎంచుకోండి.",
    "Work & Salary": "పని & జీతం",
    "Tell employers your preferred work and salary.": "మీకు నచ్చిన పని మరియు జీతాన్ని యజమానులకు తెలియజేయండి.",
    "Work Type": "పని రకం",
    "Expected Salary / Wage": "ఆశించిన జీతం / వేతనం",
    "Example: ₹18,000 - ₹22,000 / Month": "ఉదాహరణ: ₹18,000 - ₹22,000 / నెల",
    Availability: "అందుబాటు",
    "Review Profile": "ప్రొఫైల్ సమీక్ష",
    "Check your details before registering your profile.": "ప్రొఫైల్ నమోదు చేసే ముందు వివరాలు తనిఖీ చేయండి.",
    "Not specified": "ఇవ్వలేదు",
    "Registering...": "నమోదు చేస్తున్నాం...",
    "Register Profile": "ప్రొఫైల్ నమోదు చేయండి",
    "JOB DETAILS": "ఉద్యోగ వివరాలు",
    "Timber Employer": "టింబర్ యజమాని",
    Profile: "ప్రొఫైల్",
    "Job Description": "ఉద్యోగ వివరణ",
    "No description provided.": "వివరణ ఇవ్వలేదు.",
    "Location not specified": "లొకేషన్ ఇవ్వలేదు",
    Call: "కాల్",
    WhatsApp: "వాట్సాప్",
    Chat: "చాట్",
    "Already Applied": "ఇప్పటికే అప్లై చేశారు",
    "Apply for Job": "ఉద్యోగానికి అప్లై చేయండి",
    Employer: "యజమాని",
    "Edit Worker Profile": "వర్కర్ ప్రొఫైల్ మార్చు",
    "Start Conversation": "సంభాషణ ప్రారంభించండి",
    "Send a message to": "మెసేజ్ పంపండి",
    "Type a message...": "మెసేజ్ టైప్ చేయండి...",
    Worker: "వర్కర్",
    "Worker Profile": "వర్కర్ ప్రొఫైల్",
    "Location not added": "లొకేషన్ జోడించలేదు",
    "Please enter your location.": "దయచేసి లొకేషన్ నమోదు చేయండి.",
    "Please select your experience.": "దయచేసి అనుభవం ఎంచుకోండి.",
    "Please select at least one skill.": "దయచేసి కనీసం ఒక నైపుణ్యాన్ని ఎంచుకోండి.",
    "Please select work type.": "దయచేసి పని రకం ఎంచుకోండి.",
    "✅ Worker profile registered successfully.": "✅ వర్కర్ ప్రొఫైల్ విజయవంతంగా నమోదు అయింది.",
    "Unable to save worker profile.": "వర్కర్ ప్రొఫైల్ సేవ్ చేయలేకపోయాం.",
    "You already applied for this job.": "మీరు ఇప్పటికే ఈ ఉద్యోగానికి అప్లై చేశారు.",
    "✅ Application submitted.": "✅ అప్లికేషన్ సమర్పించబడింది.",
    "Phone number is not available.": "ఫోన్ నంబర్ అందుబాటులో లేదు.",
    "WhatsApp number is not available.": "వాట్సాప్ నంబర్ అందుబాటులో లేదు.",
    "You cannot chat with yourself.": "మీతో మీరు చాట్ చేయలేరు.",
    "Growing your requirements...": "మీ ఉద్యోగ అవకాశాలను సిద్ధం చేస్తున్నాం...",
    Back: "వెనుకకు",
    Next: "తర్వాత",
    Previous: "మునుపటి",
    Save: "సేవ్",
    "Available Now": "ఇప్పుడే అందుబాటులో ఉంది",
    "Available Soon": "త్వరలో అందుబాటులో ఉంటుంది",
    "Not Available": "అందుబాటులో లేదు",
    "Full Time": "పూర్తి సమయం",
    "Part Time": "పార్ట్ టైమ్",
    "Project Based": "ప్రాజెక్ట్ ఆధారితం",
    "Sawmill Machine Operator": "సా మిల్ మెషిన్ ఆపరేటర్",
    "Log Cutting": "లాగ్ కట్టింగ్",
    "Timber Measurement": "టింబర్ కొలత",
    "Log Sorting": "లాగ్ సార్టింగ్",
    "Machine Maintenance": "మెషిన్ నిర్వహణ",
    "Loading / Unloading": "లోడింగ్ / అన్‌లోడింగ్",
    "Carpenter Helper": "కార్పెంటర్ హెల్పర్",
    "Forklift Operator": "ఫోర్క్‌లిఫ్ట్ ఆపరేటర్",
  },
  hi: {
    Dashboard: "डैशबोर्ड",
    "Create / Edit Profile": "प्रोफ़ाइल बनाएं / बदलें",
    "My Profile": "मेरी प्रोफ़ाइल",
    "Find Jobs": "नौकरियां खोजें",
    "My Applications": "मेरे आवेदन",
    Settings: "सेटिंग्स",
    Logout: "लॉगआउट",
    "We Connect. You Deal Directly.": "हम जोड़ते हैं। आप सीधे व्यवहार करें।",
    WORKER: "वर्कर",
    "Hello, {name}!": "नमस्ते, {name}!",
    "Find suitable timber jobs, build your career and connect directly with employers.": "उपयुक्त टिम्बर नौकरियां खोजें, करियर बनाएं और नियोक्ताओं से सीधे जुड़ें।",
    "Add your location": "अपना स्थान जोड़ें",
    "Edit Profile": "प्रोफ़ाइल बदलें",
    "Create Profile": "प्रोफ़ाइल बनाएं",
    "Worker Tools": "वर्कर टूल्स",
    "Find jobs and manage your worker profile.": "नौकरियां खोजें और अपनी वर्कर प्रोफ़ाइल संभालें।",
    "Register your skills": "अपने कौशल दर्ज करें",
    "Search suitable jobs": "उपयुक्त नौकरियां खोजें",
    "View applications": "आवेदन देखें",
    "View your public profile": "अपनी सार्वजनिक प्रोफ़ाइल देखें",
    "Complete your worker profile": "अपनी वर्कर प्रोफ़ाइल पूरी करें",
    "Employers can find you based on your skills, experience and location.": "नियोक्ता आपके कौशल, अनुभव और स्थान के आधार पर आपको खोज सकते हैं।",
    "Complete Now": "अभी पूरा करें",
    "Jobs posted by timber businesses and employers.": "टिम्बर व्यवसायों और नियोक्ताओं द्वारा पोस्ट की गई नौकरियां।",
    Jobs: "नौकरियां",
    "Search jobs, company, location...": "नौकरी, कंपनी, स्थान खोजें...",
    "No jobs found": "कोई नौकरी नहीं मिली",
    "Jobs posted by employers will appear here.": "नियोक्ताओं द्वारा पोस्ट की गई नौकरियां यहां दिखाई देंगी।",
    "Timber Business": "टिम्बर व्यवसाय",
    "Timber Job": "टिम्बर नौकरी",
    "No job description added.": "नौकरी का विवरण नहीं है।",
    "Work Type not added": "कार्य प्रकार नहीं दिया गया",
    "Experience not specified": "अनुभव नहीं दिया गया",
    "Salary not specified": "वेतन नहीं दिया गया",
    "Applied": "आवेदन किया",
    "Job Application": "जॉब आवेदन",
    "Profile Details": "प्रोफ़ाइल विवरण",
    "Basic Info": "मूल जानकारी",
    Details: "विवरण",
    Skills: "कौशल",
    Work: "कार्य",
    Review: "समीक्षा",
    "Upload Photo": "फोटो अपलोड करें",
    "Change Photo": "फोटो बदलें",
    "Personal details": "व्यक्तिगत विवरण",
    Age: "उम्र",
    Gender: "लिंग",
    "Select gender": "लिंग चुनें",
    Male: "पुरुष",
    Female: "महिला",
    Other: "अन्य",
    Location: "स्थान",
    "City, District, State": "शहर, जिला, राज्य",
    "Professional details": "पेशेवर विवरण",
    Experience: "अनुभव",
    "Select experience": "अनुभव चुनें",
    "No experience": "अनुभव नहीं",
    "Less than 1 year": "1 साल से कम",
    "1-3 years": "1-3 साल",
    "3-5 years": "3-5 साल",
    "5+ years": "5+ साल",
    "Experience Details": "अनुभव विवरण",
    "Describe your previous work experience...": "अपने पिछले काम के अनुभव का वर्णन करें...",
    "Select at least one skill.": "कम से कम एक कौशल चुनें।",
    "Work & Salary": "काम और वेतन",
    "Tell employers your preferred work and salary.": "नियोक्ताओं को अपना पसंदीदा काम और वेतन बताएं।",
    "Work Type": "काम का प्रकार",
    "Expected Salary / Wage": "अपेक्षित वेतन / मजदूरी",
    Availability: "उपलब्धता",
    "Review Profile": "प्रोफ़ाइल समीक्षा",
    "Check your details before registering your profile.": "प्रोफ़ाइल पंजीकृत करने से पहले अपने विवरण जांचें।",
    "Not specified": "निर्दिष्ट नहीं",
    "Registering...": "पंजीकरण हो रहा है...",
    "Register Profile": "प्रोफ़ाइल पंजीकृत करें",
    "JOB DETAILS": "नौकरी विवरण",
    "Timber Employer": "टिम्बर नियोक्ता",
    Profile: "प्रोफ़ाइल",
    "Job Description": "नौकरी विवरण",
    "No description provided.": "विवरण नहीं दिया गया।",
    "Location not specified": "स्थान निर्दिष्ट नहीं",
    Call: "कॉल",
    WhatsApp: "व्हाट्सऐप",
    Chat: "चैट",
    "Already Applied": "पहले ही आवेदन किया",
    "Apply for Job": "नौकरी के लिए आवेदन करें",
    Employer: "नियोक्ता",
    "Edit Worker Profile": "वर्कर प्रोफ़ाइल बदलें",
    "Start Conversation": "बातचीत शुरू करें",
    "Send a message to": "को संदेश भेजें",
    "Type a message...": "संदेश लिखें...",
    Worker: "वर्कर",
    "Worker Profile": "वर्कर प्रोफ़ाइल",
    "Location not added": "स्थान नहीं जोड़ा गया",
    "Please enter your location.": "कृपया अपना स्थान दर्ज करें।",
    "Please select your experience.": "कृपया अपना अनुभव चुनें।",
    "Please select at least one skill.": "कृपया कम से कम एक कौशल चुनें।",
    "Please select work type.": "कृपया काम का प्रकार चुनें।",
    "✅ Worker profile registered successfully.": "✅ वर्कर प्रोफ़ाइल सफलतापूर्वक पंजीकृत हुई।",
    "Unable to save worker profile.": "वर्कर प्रोफ़ाइल सेव नहीं हो सकी।",
    "You already applied for this job.": "आपने पहले ही इस नौकरी के लिए आवेदन किया है।",
    "✅ Application submitted.": "✅ आवेदन जमा किया गया।",
    "Phone number is not available.": "फोन नंबर उपलब्ध नहीं है।",
    "WhatsApp number is not available.": "व्हाट्सऐप नंबर उपलब्ध नहीं है।",
    "You cannot chat with yourself.": "आप खुद से चैट नहीं कर सकते।",
    "Growing your requirements...": "आपके अवसर तैयार किए जा रहे हैं...",
    Back: "पीछे",
    Next: "आगे",
    Previous: "पिछला",
    Save: "सेव",
    "Available Now": "अभी उपलब्ध",
    "Available Soon": "जल्द उपलब्ध",
    "Not Available": "उपलब्ध नहीं",
    "Full Time": "फुल टाइम",
    "Part Time": "पार्ट टाइम",
    "Project Based": "प्रोजेक्ट आधारित",
    "Sawmill Machine Operator": "सॉमिल मशीन ऑपरेटर",
    "Log Cutting": "लॉग कटिंग",
    "Timber Measurement": "टिम्बर माप",
    "Log Sorting": "लॉग सॉर्टिंग",
    "Machine Maintenance": "मशीन मेंटेनेंस",
    "Loading / Unloading": "लोडिंग / अनलोडिंग",
    "Carpenter Helper": "कारपेंटर हेल्पर",
    "Forklift Operator": "फोर्कलिफ्ट ऑपरेटर",
  },
  ta: {
    Dashboard: "டாஷ்போர்டு",
    "Create / Edit Profile": "சுயவிவரம் உருவாக்கு / திருத்து",
    "My Profile": "என் சுயவிவரம்",
    "Find Jobs": "வேலைகளை தேடு",
    "My Applications": "என் விண்ணப்பங்கள்",
    Settings: "அமைப்புகள்",
    Logout: "வெளியேறு",
    "We Connect. You Deal Directly.": "நாங்கள் இணைக்கிறோம். நீங்கள் நேரடியாக தொடர்புகொள்ளுங்கள்.",
    WORKER: "வேலை தேடுபவர்",
    "Hello, {name}!": "வணக்கம், {name}!",
    "Find suitable timber jobs, build your career and connect directly with employers.": "பொருத்தமான மர வேலைகளை கண்டுபிடித்து, உங்கள் திறனை வளர்த்து, முதலாளிகளுடன் நேரடியாக இணைக.",
    "Add your location": "இருப்பிடத்தைச் சேர்க்கவும்",
    "Edit Profile": "சுயவிவரத்தைத் திருத்து",
    "Create Profile": "சுயவிவரத்தை உருவாக்கு",
    "Worker Tools": "பணி கருவிகள்",
    "Find jobs and manage your worker profile.": "வேலைகளைத் தேடி உங்கள் சுயவிவரத்தை நிர்வகிக்கவும்.",
    "Register your skills": "உங்கள் திறன்களை பதிவு செய்யவும்",
    "Search suitable jobs": "பொருத்தமான வேலைகளை தேடவும்",
    "View applications": "விண்ணப்பங்களை பார்க்கவும்",
    "View your public profile": "பொது சுயவிவரத்தை பார்க்கவும்",
    "Complete your worker profile": "உங்கள் சுயவிவரத்தை முடிக்கவும்",
    "Employers can find you based on your skills, experience and location.": "உங்கள் திறன், அனுபவம், இருப்பிடத்தின் அடிப்படையில் முதலாளிகள் உங்களை கண்டுபிடிக்கலாம்.",
    "Complete Now": "இப்போது முடிக்கவும்",
    "Jobs posted by timber businesses and employers.": "மர வணிகங்கள் மற்றும் முதலாளிகள் வெளியிட்ட வேலைகள்.",
    Jobs: "வேலைகள்",
    "Search jobs, company, location...": "வேலை, நிறுவனம், இருப்பிடம் தேடவும்...",
    "No jobs found": "வேலைகள் கிடைக்கவில்லை",
    "Jobs posted by employers will appear here.": "முதலாளிகள் வெளியிடும் வேலைகள் இங்கே தோன்றும்.",
    "Timber Business": "மர வணிகம்",
    "Timber Job": "மர வேலை",
    "No job description added.": "வேலை விவரம் இல்லை.",
    "Work Type not added": "வேலை வகை இல்லை",
    "Experience not specified": "அனுபவம் குறிப்பிடப்படவில்லை",
    "Salary not specified": "சம்பளம் குறிப்பிடப்படவில்லை",
    "Applied": "விண்ணப்பித்தது",
    "Job Application": "வேலை விண்ணப்பம்",
    "Profile Details": "சுயவிவர விவரங்கள்",
    "Basic Info": "அடிப்படை தகவல்",
    Details: "விவரங்கள்",
    Skills: "திறன்கள்",
    Work: "பணி",
    Review: "மதிப்பாய்வு",
    "Upload Photo": "புகைப்படம் பதிவேற்றவும்",
    "Change Photo": "புகைப்படத்தை மாற்றவும்",
    "Personal details": "தனிப்பட்ட விவரங்கள்",
    Age: "வயது",
    Gender: "பாலினம்",
    "Select gender": "பாலினத்தை தேர்வு செய்யவும்",
    Male: "ஆண்",
    Female: "பெண்",
    Other: "மற்றவை",
    Location: "இருப்பிடம்",
    "City, District, State": "நகரம், மாவட்டம், மாநிலம்",
    "Professional details": "தொழில்முறை விவரங்கள்",
    Experience: "அனுபவம்",
    "Select experience": "அனுபவத்தை தேர்வு செய்யவும்",
    "No experience": "அனுபவம் இல்லை",
    "Less than 1 year": "1 ஆண்டுக்கு குறைவாக",
    "1-3 years": "1-3 ஆண்டுகள்",
    "3-5 years": "3-5 ஆண்டுகள்",
    "5+ years": "5+ ஆண்டுகள்",
    "Experience Details": "அனுபவ விவரங்கள்",
    "Describe your previous work experience...": "உங்கள் முந்தைய வேலை அனுபவத்தை விவரிக்கவும்...",
    "Select at least one skill.": "குறைந்தது ஒரு திறனை தேர்வு செய்யவும்.",
    "Work & Salary": "பணி & சம்பளம்",
    "Tell employers your preferred work and salary.": "உங்கள் விருப்பமான பணி மற்றும் சம்பளத்தை முதலாளிகளுக்கு தெரிவிக்கவும்.",
    "Work Type": "பணி வகை",
    "Expected Salary / Wage": "எதிர்பார்க்கும் சம்பளம் / கூலி",
    Availability: "கிடைக்கும் நிலை",
    "Review Profile": "சுயவிவர மதிப்பாய்வு",
    "Check your details before registering your profile.": "பதிவு செய்வதற்கு முன் உங்கள் விவரங்களை சரிபார்க்கவும்.",
    "Not specified": "குறிப்பிடப்படவில்லை",
    "Registering...": "பதிவு செய்கிறது...",
    "Register Profile": "சுயவிவரத்தை பதிவு செய்யவும்",
    "JOB DETAILS": "வேலை விவரங்கள்",
    "Timber Employer": "மர வணிக முதலாளி",
    Profile: "சுயவிவரம்",
    "Job Description": "வேலை விவரம்",
    "No description provided.": "விவரம் இல்லை.",
    "Location not specified": "இருப்பிடம் குறிப்பிடப்படவில்லை",
    Call: "அழைப்பு",
    WhatsApp: "வாட்ஸ்அப்",
    Chat: "அரட்டை",
    "Already Applied": "ஏற்கனவே விண்ணப்பித்துவிட்டீர்கள்",
    "Apply for Job": "வேலைக்கு விண்ணப்பிக்கவும்",
    Employer: "முதலாளி",
    "Edit Worker Profile": "வொர்க்கர் சுயவிவரத்தைத் திருத்து",
    "Start Conversation": "உரையாடலை தொடங்கு",
    "Send a message to": "செய்தி அனுப்பவும்",
    "Type a message...": "செய்தியை தட்டச்சு செய்யவும்...",
    Worker: "வொர்க்கர்",
    "Worker Profile": "வொர்க்கர் சுயவிவரம்",
    "Location not added": "இருப்பிடம் சேர்க்கப்படவில்லை",
    "Please enter your location.": "உங்கள் இருப்பிடத்தை உள்ளிடவும்.",
    "Please select your experience.": "உங்கள் அனுபவத்தைத் தேர்வு செய்யவும்.",
    "Please select at least one skill.": "குறைந்தது ஒரு திறனைத் தேர்வு செய்யவும்.",
    "Please select work type.": "பணி வகையைத் தேர்வு செய்யவும்.",
    "✅ Worker profile registered successfully.": "✅ வொர்க்கர் சுயவிவரம் வெற்றிகரமாக பதிவு செய்யப்பட்டது.",
    "Unable to save worker profile.": "வொர்க்கர் சுயவிவரத்தை சேமிக்க முடியவில்லை.",
    "You already applied for this job.": "இந்த வேலைக்கு ஏற்கனவே விண்ணப்பித்துவிட்டீர்கள்.",
    "✅ Application submitted.": "✅ விண்ணப்பம் சமர்ப்பிக்கப்பட்டது.",
    "Phone number is not available.": "தொலைபேசி எண் இல்லை.",
    "WhatsApp number is not available.": "வாட்ஸ்அப் எண் இல்லை.",
    "You cannot chat with yourself.": "உங்களுடன் நீங்களே அரட்டை செய்ய முடியாது.",
    "Growing your requirements...": "உங்கள் வாய்ப்புகளைத் தயாரிக்கிறோம்...",
    Back: "பின்",
    Next: "அடுத்து",
    Previous: "முந்தைய",
    Save: "சேமி",
    "Available Now": "இப்போது கிடைக்கும்",
    "Available Soon": "விரைவில் கிடைக்கும்",
    "Not Available": "கிடைக்கவில்லை",
    "Full Time": "முழுநேரம்",
    "Part Time": "பகுதி நேரம்",
    "Project Based": "திட்ட அடிப்படை",
    "Sawmill Machine Operator": "சாமில் இயந்திர இயக்குநர்",
    "Log Cutting": "மரக்கட்டை வெட்டுதல்",
    "Timber Measurement": "மர அளவீடு",
    "Log Sorting": "மரக்கட்டை வகைப்படுத்துதல்",
    "Machine Maintenance": "இயந்திர பராமரிப்பு",
    "Loading / Unloading": "ஏற்றுதல் / இறக்குதல்",
    "Carpenter Helper": "தச்சர் உதவியாளர்",
    "Forklift Operator": "ஃபோர்க்லிஃப்ட் இயக்குநர்",
  },
  kn: {
    Dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "Create / Edit Profile": "ಪ್ರೊಫೈಲ್ ರಚಿಸಿ / ಬದಲಿಸಿ",
    "My Profile": "ನನ್ನ ಪ್ರೊಫೈಲ್",
    "Find Jobs": "ಕೆಲಸ ಹುಡುಕಿ",
    "My Applications": "ನನ್ನ ಅರ್ಜಿಗಳು",
    Settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
    Logout: "ಲಾಗ್ ಔಟ್",
    "We Connect. You Deal Directly.": "ನಾವು ಸಂಪರ್ಕಿಸುತ್ತೇವೆ. ನೀವು ನೇರವಾಗಿ ವ್ಯವಹರಿಸಿ.",
    WORKER: "ಕಾರ್ಮಿಕ",
    "Hello, {name}!": "ನಮಸ್ಕಾರ, {name}!",
    "Find suitable timber jobs, build your career and connect directly with employers.": "ಸೂಕ್ತವಾದ ಮರದ ಕೆಲಸಗಳನ್ನು ಹುಡುಕಿ, ವೃತ್ತಿ ಬೆಳೆಸಿ ಮತ್ತು ಉದ್ಯೋಗದಾತರೊಂದಿಗೆ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.",
    "Add your location": "ನಿಮ್ಮ ಸ್ಥಳ ಸೇರಿಸಿ",
    "Edit Profile": "ಪ್ರೊಫೈಲ್ ಬದಲಿಸಿ",
    "Create Profile": "ಪ್ರೊಫೈಲ್ ರಚಿಸಿ",
    "Worker Tools": "ಕಾರ್ಮಿಕ ಸಾಧನಗಳು",
    "Find jobs and manage your worker profile.": "ಕೆಲಸಗಳನ್ನು ಹುಡುಕಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ನಿರ್ವಹಿಸಿ.",
    "Register your skills": "ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳನ್ನು ನೋಂದಣಿ ಮಾಡಿ",
    "Search suitable jobs": "ಸೂಕ್ತ ಕೆಲಸಗಳನ್ನು ಹುಡುಕಿ",
    "View applications": "ಅರ್ಜಿಗಳನ್ನು ನೋಡಿ",
    "View your public profile": "ಸಾರ್ವಜನಿಕ ಪ್ರೊಫೈಲ್ ನೋಡಿ",
    "Complete your worker profile": "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ",
    "Employers can find you based on your skills, experience and location.": "ನಿಮ್ಮ ಕೌಶಲ್ಯ, ಅನುಭವ ಮತ್ತು ಸ್ಥಳದ ಆಧಾರದಲ್ಲಿ ಉದ್ಯೋಗದಾತರು ನಿಮ್ಮನ್ನು ಕಂಡುಕೊಳ್ಳಬಹುದು.",
    "Complete Now": "ಈಗ ಪೂರ್ಣಗೊಳಿಸಿ",
    "Jobs posted by timber businesses and employers.": "ಮರದ ವ್ಯವಹಾರಗಳು ಮತ್ತು ಉದ್ಯೋಗದಾತರು ಪೋಸ್ಟ್ ಮಾಡಿದ ಕೆಲಸಗಳು.",
    Jobs: "ಕೆಲಸಗಳು",
    "Search jobs, company, location...": "ಕೆಲಸ, ಕಂಪನಿ, ಸ್ಥಳ ಹುಡುಕಿ...",
    "No jobs found": "ಕೆಲಸಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    "Jobs posted by employers will appear here.": "ಉದ್ಯೋಗದಾತರು ಪೋಸ್ಟ್ ಮಾಡುವ ಕೆಲಸಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    "Timber Business": "ಮರದ ವ್ಯವಹಾರ",
    "Timber Job": "ಮರದ ಕೆಲಸ",
    "No job description added.": "ಕೆಲಸದ ವಿವರಣೆ ಇಲ್ಲ.",
    "Work Type not added": "ಕೆಲಸದ ಪ್ರಕಾರ ಇಲ್ಲ",
    "Experience not specified": "ಅನುಭವ ನೀಡಿಲ್ಲ",
    "Salary not specified": "ವೇತನ ನೀಡಿಲ್ಲ",
    "Applied": "ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ",
    "Job Application": "ಉದ್ಯೋಗ ಅರ್ಜಿ",
    "Profile Details": "ಪ್ರೊಫೈಲ್ ವಿವರಗಳು",
    "Basic Info": "ಮೂಲ ಮಾಹಿತಿ",
    Details: "ವಿವರಗಳು",
    Skills: "ಕೌಶಲ್ಯಗಳು",
    Work: "ಕೆಲಸ",
    Review: "ಪರಿಶೀಲನೆ",
    "Upload Photo": "ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
    "Change Photo": "ಫೋಟೋ ಬದಲಿಸಿ",
    "Personal details": "ವೈಯಕ್ತಿಕ ವಿವರಗಳು",
    Age: "ವಯಸ್ಸು",
    Gender: "ಲಿಂಗ",
    "Select gender": "ಲಿಂಗ ಆಯ್ಕೆಮಾಡಿ",
    Male: "ಪುರುಷ",
    Female: "ಮಹಿಳೆ",
    Other: "ಇತರೆ",
    Location: "ಸ್ಥಳ",
    "City, District, State": "ನಗರ, ಜಿಲ್ಲೆ, ರಾಜ್ಯ",
    "Professional details": "ವೃತ್ತಿಪರ ವಿವರಗಳು",
    Experience: "ಅನುಭವ",
    "Select experience": "ಅನುಭವ ಆಯ್ಕೆಮಾಡಿ",
    "No experience": "ಅನುಭವ ಇಲ್ಲ",
    "Less than 1 year": "1 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ",
    "1-3 years": "1-3 ವರ್ಷ",
    "3-5 years": "3-5 ವರ್ಷ",
    "5+ years": "5+ ವರ್ಷ",
    "Experience Details": "ಅನುಭವದ ವಿವರಗಳು",
    "Describe your previous work experience...": "ನಿಮ್ಮ ಹಿಂದಿನ ಕೆಲಸದ ಅನುಭವವನ್ನು ವಿವರಿಸಿ...",
    "Select at least one skill.": "ಕನಿಷ್ಠ ಒಂದು ಕೌಶಲ್ಯ ಆಯ್ಕೆಮಾಡಿ.",
    "Work & Salary": "ಕೆಲಸ ಮತ್ತು ವೇತನ",
    "Tell employers your preferred work and salary.": "ನಿಮ್ಮ ಇಷ್ಟದ ಕೆಲಸ ಮತ್ತು ವೇತನವನ್ನು ಉದ್ಯೋಗದಾತರಿಗೆ ತಿಳಿಸಿ.",
    "Work Type": "ಕೆಲಸದ ಪ್ರಕಾರ",
    "Expected Salary / Wage": "ನಿರೀಕ್ಷಿತ ವೇತನ / ಕೂಲಿ",
    Availability: "ಲಭ್ಯತೆ",
    "Review Profile": "ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲನೆ",
    "Check your details before registering your profile.": "ನೋಂದಣಿ ಮಾಡುವ ಮೊದಲು ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "Not specified": "ನಿರ್ದಿಷ್ಟಪಡಿಸಿಲ್ಲ",
    "Registering...": "ನೋಂದಣಿ ಆಗುತ್ತಿದೆ...",
    "Register Profile": "ಪ್ರೊಫೈಲ್ ನೋಂದಣಿ ಮಾಡಿ",
    "JOB DETAILS": "ಕೆಲಸದ ವಿವರಗಳು",
    "Timber Employer": "ಮರದ ಉದ್ಯೋಗದಾತ",
    Profile: "ಪ್ರೊಫೈಲ್",
    "Job Description": "ಕೆಲಸದ ವಿವರಣೆ",
    "No description provided.": "ವಿವರಣೆ ನೀಡಿಲ್ಲ.",
    "Location not specified": "ಸ್ಥಳ ನೀಡಿಲ್ಲ",
    Call: "ಕಾಲ್",
    WhatsApp: "ವಾಟ್ಸ್ಆಪ್",
    Chat: "ಚಾಟ್",
    "Already Applied": "ಈಗಾಗಲೇ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ",
    "Apply for Job": "ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    Employer: "ಉದ್ಯೋಗದಾತ",
    "Edit Worker Profile": "ಕಾರ್ಮಿಕ ಪ್ರೊಫೈಲ್ ಬದಲಿಸಿ",
    "Start Conversation": "ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ",
    "Send a message to": "ಸಂದೇಶ ಕಳುಹಿಸಿ",
    "Type a message...": "ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...",
    Worker: "ಕಾರ್ಮಿಕ",
    "Worker Profile": "ಕಾರ್ಮಿಕ ಪ್ರೊಫೈಲ್",
    "Location not added": "ಸ್ಥಳ ಸೇರಿಸಿಲ್ಲ",
    "Please enter your location.": "ದಯವಿಟ್ಟು ಸ್ಥಳ ನಮೂದಿಸಿ.",
    "Please select your experience.": "ದಯವಿಟ್ಟು ಅನುಭವ ಆಯ್ಕೆಮಾಡಿ.",
    "Please select at least one skill.": "ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಕೌಶಲ್ಯ ಆಯ್ಕೆಮಾಡಿ.",
    "Please select work type.": "ದಯವಿಟ್ಟು ಕೆಲಸದ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ.",
    "✅ Worker profile registered successfully.": "✅ ಕಾರ್ಮಿಕ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ.",
    "Unable to save worker profile.": "ಕಾರ್ಮಿಕ ಪ್ರೊಫೈಲ್ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    "You already applied for this job.": "ನೀವು ಈಗಾಗಲೇ ಈ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ್ದೀರಿ.",
    "✅ Application submitted.": "✅ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.",
    "Phone number is not available.": "ಫೋನ್ ಸಂಖ್ಯೆ ಲಭ್ಯವಿಲ್ಲ.",
    "WhatsApp number is not available.": "ವಾಟ್ಸ್ಆಪ್ ಸಂಖ್ಯೆ ಲಭ್ಯವಿಲ್ಲ.",
    "You cannot chat with yourself.": "ನೀವು ನಿಮ್ಮೊಂದಿಗೆ ಚಾಟ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    "Growing your requirements...": "ನಿಮ್ಮ ಅವಕಾಶಗಳನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದ್ದೇವೆ...",
    Back: "ಹಿಂದೆ",
    Next: "ಮುಂದೆ",
    Previous: "ಹಿಂದಿನ",
    Save: "ಉಳಿಸಿ",
    "Available Now": "ಈಗ ಲಭ್ಯ",
    "Available Soon": "ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯ",
    "Not Available": "ಲಭ್ಯವಿಲ್ಲ",
    "Full Time": "ಪೂರ್ಣಕಾಲಿಕ",
    "Part Time": "ಅರೆಕಾಲಿಕ",
    "Project Based": "ಯೋಜನೆ ಆಧಾರಿತ",
    "Sawmill Machine Operator": "ಸಾಮಿಲ್ ಯಂತ್ರ ಆಪರೇಟರ್",
    "Log Cutting": "ಲಾಗ್ ಕಟಿಂಗ್",
    "Timber Measurement": "ಮರದ ಅಳತೆ",
    "Log Sorting": "ಲಾಗ್ ವಿಂಗಡಣೆ",
    "Machine Maintenance": "ಯಂತ್ರ ನಿರ್ವಹಣೆ",
    "Loading / Unloading": "ಲೋಡಿಂಗ್ / ಅನ್‌ಲೋಡಿಂಗ್",
    "Carpenter Helper": "ಬಡಗಿ ಸಹಾಯಕ",
    "Forklift Operator": "ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಆಪರೇಟರ್",
  },
};


const EXTRA_TRANSLATIONS = {
  en: {
    "Worker Tools": "Worker Tools",
    "Search suitable jobs": "Search suitable jobs",
    "View applications": "View applications",
    "View your public profile": "View your public profile",
    "Profile Complete": "Profile Complete",
    "Profile Incomplete": "Profile Incomplete",
    "No applications yet": "No applications yet",
    "Track jobs you have applied for.": "Track jobs you have applied for.",
    "Apply for a job and your application will appear here.": "Apply for a job and your application will appear here.",
    "View": "View",
    "position(s)": "position(s)",
    "TimberMart only connects users.": "TimberMart only connects users.",
    "We do not provide jobs directly.": "We do not provide jobs directly.",
    "Personal details": "Personal details",
    "Photo": "Photo",
  },
  te: {
    "Worker Tools": "వర్కర్ టూల్స్",
    "Search suitable jobs": "సరైన ఉద్యోగాలను శోధించండి",
    "View applications": "అప్లికేషన్లు చూడండి",
    "View your public profile": "మీ పబ్లిక్ ప్రొఫైల్ చూడండి",
    "Profile Complete": "ప్రొఫైల్ పూర్తయింది",
    "Profile Incomplete": "ప్రొఫైల్ పూర్తి కాలేదు",
    "No applications yet": "ఇంకా అప్లికేషన్లు లేవు",
    "Track jobs you have applied for.": "మీరు అప్లై చేసిన ఉద్యోగాలను ట్రాక్ చేయండి.",
    "Apply for a job and your application will appear here.": "ఉద్యోగానికి అప్లై చేస్తే మీ అప్లికేషన్ ఇక్కడ కనిపిస్తుంది.",
    "View": "చూడండి",
    "position(s)": "పొజిషన్‌లు",
    "TimberMart only connects users.": "TimberMart వినియోగదారులను మాత్రమే కనెక్ట్ చేస్తుంది.",
    "We do not provide jobs directly.": "మేము నేరుగా ఉద్యోగాలు అందించము.",
    "Personal details": "వ్యక్తిగత వివరాలు",
    "Photo": "ఫోటో",
  },
  hi: {
    "Worker Tools": "वर्कर टूल्स",
    "Search suitable jobs": "उपयुक्त नौकरियां खोजें",
    "View applications": "आवेदन देखें",
    "View your public profile": "अपनी सार्वजनिक प्रोफ़ाइल देखें",
    "Profile Complete": "प्रोफ़ाइल पूरी है",
    "Profile Incomplete": "प्रोफ़ाइल अधूरी है",
    "No applications yet": "अभी कोई आवेदन नहीं",
    "Track jobs you have applied for.": "आपने जिन नौकरियों के लिए आवेदन किया है उन्हें ट्रैक करें।",
    "Apply for a job and your application will appear here.": "नौकरी के लिए आवेदन करें और आपका आवेदन यहां दिखाई देगा।",
    "View": "देखें",
    "position(s)": "पद",
    "TimberMart only connects users.": "TimberMart केवल उपयोगकर्ताओं को जोड़ता है।",
    "We do not provide jobs directly.": "हम सीधे नौकरी प्रदान नहीं करते।",
    "Personal details": "व्यक्तिगत विवरण",
    "Photo": "फोटो",
  },
  ta: {
    "Worker Tools": "பணி கருவிகள்",
    "Search suitable jobs": "பொருத்தமான வேலைகளை தேடவும்",
    "View applications": "விண்ணப்பங்களை பார்க்கவும்",
    "View your public profile": "பொது சுயவிவரத்தை பார்க்கவும்",
    "Profile Complete": "சுயவிவரம் முடிந்தது",
    "Profile Incomplete": "சுயவிவரம் முழுமையில்லை",
    "No applications yet": "இன்னும் விண்ணப்பங்கள் இல்லை",
    "Track jobs you have applied for.": "நீங்கள் விண்ணப்பித்த வேலைகளை கண்காணிக்கவும்.",
    "Apply for a job and your application will appear here.": "வேலைக்கு விண்ணப்பித்தால் உங்கள் விண்ணப்பம் இங்கே தோன்றும்.",
    "View": "பார்க்கவும்",
    "position(s)": "பதவிகள்",
    "TimberMart only connects users.": "TimberMart பயனர்களை இணைக்கிறது.",
    "We do not provide jobs directly.": "நாங்கள் நேரடியாக வேலை வழங்கவில்லை.",
    "Personal details": "தனிப்பட்ட விவரங்கள்",
    "Photo": "புகைப்படம்",
  },
  kn: {
    "Worker Tools": "ಕಾರ್ಮಿಕ ಸಾಧನಗಳು",
    "Search suitable jobs": "ಸೂಕ್ತ ಕೆಲಸಗಳನ್ನು ಹುಡುಕಿ",
    "View applications": "ಅರ್ಜಿಗಳನ್ನು ನೋಡಿ",
    "View your public profile": "ಸಾರ್ವಜನಿಕ ಪ್ರೊಫೈಲ್ ನೋಡಿ",
    "Profile Complete": "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಂಡಿದೆ",
    "Profile Incomplete": "ಪ್ರೊಫೈಲ್ ಅಪೂರ್ಣವಾಗಿದೆ",
    "No applications yet": "ಇನ್ನೂ ಅರ್ಜಿಗಳಿಲ್ಲ",
    "Track jobs you have applied for.": "ನೀವು ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ಕೆಲಸಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
    "Apply for a job and your application will appear here.": "ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದರೆ ನಿಮ್ಮ ಅರ್ಜಿ ಇಲ್ಲಿ ಕಾಣುತ್ತದೆ.",
    "View": "ನೋಡಿ",
    "position(s)": "ಹುದ್ದೆಗಳು",
    "TimberMart only connects users.": "TimberMart ಬಳಕೆದಾರರನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.",
    "We do not provide jobs directly.": "ನಾವು ನೇರವಾಗಿ ಕೆಲಸ ನೀಡುವುದಿಲ್ಲ.",
    "Personal details": "ವೈಯಕ್ತಿಕ ವಿವರಗಳು",
    "Photo": "ಫೋಟೋ",
  },
};

export default function WorkerDashboard() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState(null);
  const [premiumPlanName, setPremiumPlanName] = useState("");
  const [countdownTick, setCountdownTick] = useState(Date.now());

  const [chatInbox, setChatInbox] = useState([]);
  const [showChatInbox, setShowChatInbox] = useState(false);
  const [chatInboxLoading, setChatInboxLoading] = useState(false);
  const [chatSearch, setChatSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("timbermart_worker_language") || "en");

  function t(key) {
    return (
      EXTRA_TRANSLATIONS[language]?.[key] ||
      TRANSLATIONS[language]?.[key] ||
      EXTRA_TRANSLATIONS.en[key] ||
      TRANSLATIONS.en[key] ||
      key
    );
  }

  useEffect(() => {
    localStorage.setItem("timbermart_worker_language", language);
  }, [language]);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdownTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return undefined;
    const refresh = () => refreshPremiumStatus(session.user.id);
    refresh();
    const timer = window.setInterval(refresh, 10000);
    const onFocus = () => refresh();
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session?.user?.id]);

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
        refreshPremiumStatus(currentSession.user.id),
      ]);

      loadChatInbox(currentSession.user.id);
    } catch (error) {
      console.error("Worker dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getJobExpiry(job) {
    if (job?.expires_at) {
      const value = new Date(job.expires_at).getTime();
      if (Number.isFinite(value)) return value;
    }
    if (job?.created_at) {
      const value = new Date(job.created_at).getTime();
      if (Number.isFinite(value)) return value + 15 * 86400000;
    }
    return Infinity;
  }

  function getCountdown(expiry) {
    if (!Number.isFinite(expiry)) return { expired: false, label: "Active" };
    const diff = expiry - countdownTick;
    if (diff <= 0) return { expired: true, label: "EXPIRED" };
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { expired: false, label: `${days}d ${hours}h ${minutes}m ${seconds}s` };
  }

  async function refreshPremiumStatus(userId = session?.user?.id) {
    if (!userId) return false;
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("id,plan_id,plan_name,status,started_at,expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Worker premium status:", error);
      setIsPremium(false);
      setPremiumExpiresAt(null);
      return false;
    }
    const active = !!data?.expires_at && new Date(data.expires_at).getTime() > Date.now();
    setIsPremium(active);
    setPremiumExpiresAt(active ? data.expires_at : null);
    setPremiumPlanName(active ? data.plan_name || data.plan_id || "Premium" : "");
    return active;
  }

  async function loadChatInbox(userId = session?.user?.id) {
    if (!userId) return;
    setChatInboxLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("messages")
        .select("id,sender_id,receiver_id,body,created_at")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const latestByUser = new Map();
      (rows || []).forEach((row) => {
        const otherId = row.sender_id === userId ? row.receiver_id : row.sender_id;
        if (otherId && !latestByUser.has(otherId)) latestByUser.set(otherId, row);
      });
      const ids = [...latestByUser.keys()];
      if (!ids.length) { setChatInbox([]); return; }
      const { data: people, error: peopleError } = await supabase
        .from("profiles")
        .select("id,name,role,location,photo_url,phone")
        .in("id", ids);
      if (peopleError) throw peopleError;
      const peopleMap = new Map((people || []).map((person) => [person.id, person]));
      setChatInbox(ids.map((id) => ({ user: peopleMap.get(id), lastMessage: latestByUser.get(id) })).filter((item) => item.user));
    } catch (error) {
      console.error("Worker chat inbox:", error);
      setChatInbox([]);
    } finally {
      setChatInboxLoading(false);
    }
  }

  async function openChatFromInbox(user) {
    if (!user?.id) return;
    setShowChatInbox(false);
    setChatSearch("");
    await startChat(user.id);
  }

  function nextJob(step) {
    if (!selectedJob || filteredJobs.length < 2) return;
    const index = filteredJobs.findIndex((job) => job.id === selectedJob.id);
    const nextIndex = (index + step + filteredJobs.length) % filteredJobs.length;
    openJob(filteredJobs[nextIndex]);
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

  async function selectPhoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const watermarkedFile = await watermarkImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.84,
        centerText: "TimberMart",
        bottomTitle: "🌳 TimberMart",
        bottomSubtitle: "Timber Marketplace",
      });

      setPhotoFile(watermarkedFile);
      setPhotoPreview(URL.createObjectURL(watermarkedFile));
    } catch (error) {
      console.error("Watermark photo error:", error);
      alert(error.message || "Unable to process the photo.");
    }
  }

  async function uploadWorkerPhoto() {
    if (!photoFile || !session?.user?.id) {
      return profile?.photo_url || "";
    }

    const path =
      `${session.user.id}/worker-${Date.now()}.webp`;

    const { error: uploadError } =
      await supabase.storage
        .from("worker-photos")
        .upload(path, photoFile, {
          cacheControl: "31536000",
          contentType: "image/webp",
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
      alert(t("Please enter your location."));
      setWizardStep(2);
      return;
    }

    if (!form.experience) {
      alert(t("Please select your experience."));
      setWizardStep(2);
      return;
    }

    if (form.skills.length === 0) {
      alert(t("Please select at least one skill."));
      setWizardStep(3);
      return;
    }

    if (!form.work_type) {
      alert(t("Please select work type."));
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

      alert(t("✅ Worker profile registered successfully."));

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
      alert(t("You already applied for this job."));
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

    alert(t("✅ Application submitted."));

    setShowJob(false);
  }

  function callUser(phone) {
    if (!phone) {
      alert(t("Phone number is not available."));
      return;
    }

    window.location.href = `tel:${phone}`;
  }

  function whatsappUser(phone) {
    if (!phone) {
      alert(t("WhatsApp number is not available."));
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
      alert(t("You cannot chat with yourself."));
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
    loadChatInbox();
  }

  async function logout() {
    await supabase.auth.signOut();

    navigate("/login", {
      replace: true,
    });
  }

  const filteredJobs = useMemo(() => {
    const value = search.trim().toLowerCase();

    let result = jobs.filter((job) => !getCountdown(getJobExpiry(job)).expired);

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
    <TreeLoader text={t("Growing your requirements...")} />
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

          <label className="worker-language-picker" title="Language">
            <span>文</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Language"
            >
              {LANGUAGES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

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
              {profile?.name || t("Worker")}
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
                {profile?.name || t("Worker")}
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
              onClick={() => {
                setMobileMenu(false);
                document
                  .getElementById("jobs")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
            >
              <Briefcase size={18} />
              Find Jobs
            </button>


            <button
              onClick={() => {
                setMobileMenu(false);
                document
                  .getElementById("applications")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
            >
              <Check size={18} />
              My Applications
            </button>


            <button
              onClick={() => {
                setMobileMenu(false);
                setShowChatInbox(true);
                loadChatInbox();
              }}
            >
              <MessageCircle size={18} />
              Chats
            </button>

            <button
              className={isPremium ? "worker-premium-nav active-premium" : "worker-premium-nav"}
              onClick={() => {
                setMobileMenu(false);
                navigate("/premium");
              }}
            >
              <Star size={18} />
              {isPremium ? "PREMIUM HOLDER" : "GO PREMIUM"}
            </button>

            <button
              onClick={() => {
                setMobileMenu(false);
                navigate("/settings");
              }}
            >
              <Settings size={18} />
              Settings
            </button>

          </nav>

        </div>


        <div className="worker-sidebar-bottom">

          <div className="worker-direct-note">
            🤝 {t("We Connect. You Deal Directly.")}
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
                👷 {t("WORKER")}
              </span>

              <h1>
                {t("Hello, {name}!").replace("{name}", profile?.name || t("Worker"))}
              </h1>

              <p>
                {t("Find suitable timber jobs, build your career and connect directly with employers.")}
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
                    ? t("Edit Profile")
                    : t("Create Profile")}

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
                  {t("Find Jobs")}
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
                  {profile?.name || t("Worker")}
                </strong>

                <span>
                  {workerProfile?.skills?.[0] ||
                    t("Worker Profile")}
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
                  {t("Profile Complete")}
                </>
              ) : (
                <>
                  <Edit3 size={15} />
                  {t("Profile Incomplete")}
                </>
              )}
            </div>

            <div className={isPremium ? "worker-premium-badge holder" : "worker-premium-badge"}>
              <Star size={14} />
              <span>{isPremium ? "PREMIUM HOLDER" : "GO PREMIUM"}</span>
              {isPremium && premiumExpiresAt ? (
                <small>{premiumPlanName} · valid until {new Date(premiumExpiresAt).toLocaleDateString()}</small>
              ) : (
                <button type="button" onClick={() => navigate("/premium")}>Upgrade</button>
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
                  {t("Find jobs and manage your worker profile.")}
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
                  {t("Register your skills")}
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
                  {t("Find Jobs")}
                </strong>

                <small>
                  {t("Search suitable jobs")}
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
                  {t("My Jobs")}
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
                  {t("My Profile")}
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
                  {t("Complete your worker profile")}
                </strong>

                <p>
                  {t("Employers can find you based on your skills, experience and location.")}
                </p>

              </div>

              <button
                onClick={() => {
                  setWizardStep(1);
                  setShowWizard(true);
                }}
              >
                {t("Complete Now")}
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
                  {t("Find Jobs")}
                </h2>

                <p>
                  {t("Jobs posted by timber businesses and employers.")}
                </p>

              </div>

              <span className="worker-job-count">
                {filteredJobs.length} {t("Jobs")}
              </span>

            </div>


            <div className="worker-job-search">

              <Search size={18} />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder={t("Search jobs, company, location...")}
              />

            </div>


            {filteredJobs.length === 0 ? (

              <div className="worker-empty">

                <div>🔎</div>

                <h3>
                  {t("No jobs found")}
                </h3>

                <p>
                  {t("Jobs posted by employers will appear here.")}
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
                              t("Timber Business")}
                          </strong>

                          <span>
                            {job.location ||
                              job.profiles?.location ||
                              t("Location not added")}
                          </span>

                        </div>

                      </div>


                      <div className="worker-job-badge">
                        {job.category ||
                          t("Timber Job")}
                      </div>


                      <h3>
                        {job.title}
                      </h3>


                      <p>
                        {job.description ||
                          t("No job description added.")}
                      </p>


                      <div className="worker-job-details">

                        <span>
                          <Briefcase size={14} />
                          {job.job_type ||
                            t("Work Type not added")}
                        </span>

                        <span>
                          <Clock3 size={14} />
                          {job.experience ||
                            t("Experience not specified")}
                        </span>

                        <span>
                          💰
                          {job.salary ||
                            t("Salary not specified")}
                        </span>

                      </div>


                      <div className="worker-listing-expiry">
                        <Clock3 size={14} />
                        <span>Listing expires in</span>
                        <strong>{getCountdown(getJobExpiry(job)).label}</strong>
                      </div>

                      <div className="worker-job-footer">

                        <small>
                          {job.positions
                            ? `${job.positions} ${t("position(s)")}`
                            : ""}
                        </small>


                        <button
                          onClick={() =>
                            openJob(job)
                          }
                        >
                          <Eye size={16} />
                          {t("View")}
                        </button>

                      </div>


                      {applied && (
                        <div className="worker-applied">
                          <Check size={14} />
                          {t("Applied")}
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
                  {t("My Applications")}
                </h2>

                <p>
                  {t("Track jobs you have applied for.")}
                </p>

              </div>

            </div>


            {applications.length === 0 ? (

              <div className="worker-empty">

                <div>📄</div>

                <h3>
                  {t("No applications yet")}
                </h3>

                <p>
                  {t("Apply for a job and your application will appear here.")}
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
                          {t("Applied")} on{" "}
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
                🌳 {t("TimberMart only connects users.")}
              </strong>

              <span>
                {t("We do not provide jobs directly.")}
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
                    {t("Create Profile")}
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
                      {t("Profile")} photo
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
                    {t("Profile Details")}
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
                      placeholder={t("City, District, State")}
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
                    {t("Work")} Experience Details
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
                    placeholder={t("Describe your previous work experience...")}
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
                    {t("Work")} & Salary
                  </h3>

                  <p>
                    Tell employers your preferred
                    work and salary.
                  </p>


                  <label>
                    {t("Work")} Type *
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
                    {t("Expected Salary / Wage")}
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
                    placeholder={t("Example: ₹18,000 - ₹22,000 / Month")}
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

                    {t(form.availability)}

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
                      {t("Review")}
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
                    {t("Review")} Profile
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
                        {t("Location")}
                      </span>

                      <strong>
                        {form.location ||
                          "-"}
                      </strong>
                    </div>


                    <div className="worker-review-row">
                      <span>
                        {t("Experience")}
                      </span>

                      <strong>
                        {form.experience ||
                          "-"}
                      </strong>
                    </div>


                    <div className="worker-review-row">
                      <span>
                        {t("Work")} Type
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
                        {t("Availability")}
                      </span>

                      <strong>
                        {t(form.availability)}
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
                        ? t("Registering...")
                        : t("Register Profile")}
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
                    t("Timber Employer")}
                </p>

              </div>


              <div className="worker-modal-nav-actions">
                <button type="button" onClick={() => nextJob(-1)} aria-label="Previous listing"><ChevronLeft size={19} /></button>
                <button type="button" onClick={() => nextJob(1)} aria-label="Next listing"><ChevronRight size={19} /></button>
                <button type="button" onClick={() => setShowJob(false)} aria-label="Close"><X size={20} /></button>
              </div>

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
                    {t("Work")} Type
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

                <div className="worker-detail-expiry">
                  <span>Listing Expiry</span>
                  <strong>{getCountdown(getJobExpiry(selectedJob)).label}</strong>
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
                  {t("Call")}
                </button>


                <button
                  onClick={() =>
                    whatsappUser(
                      selectedJob.profiles?.phone
                    )
                  }
                >
                  <MessageCircle size={18} />
                  {t("WhatsApp")}
                </button>


                <button
                  onClick={() =>
                    startChat(
                      selectedJob.user_id
                    )
                  }
                >
                  <MessageCircle size={18} />
                  {t("Chat")}
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
                    {t("Already Applied")}
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {t("Apply for Job")}
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
                  ? t("Worker")
                  : selectedEmployer.role ||
                    t("Employer")}
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
                  {t("Edit Worker Profile")}
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
                    {t("Call")}
                  </button>


                  <button
                    onClick={() =>
                      whatsappUser(
                        selectedEmployer.phone
                      )
                    }
                  >
                    <MessageCircle size={18} />
                    {t("WhatsApp")}
                  </button>


                  <button
                    onClick={() =>
                      startChat(
                        selectedEmployer.id
                      )
                    }
                  >
                    <MessageCircle size={18} />
                    {t("Chat")}
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          WHATSAPP-STYLE CHAT INBOX
      ===================================================== */}

      {showChatInbox && (
        <div className="worker-chat-inbox-overlay" onMouseDown={() => setShowChatInbox(false)}>
          <aside className="worker-chat-inbox" onMouseDown={(e) => e.stopPropagation()}>
            <header className="worker-chat-inbox-header">
              <div><span>MESSAGES</span><h2>Chats</h2></div>
              <div className="worker-chat-inbox-actions">
                <button type="button" onClick={() => loadChatInbox()} aria-label="Refresh chats"><RefreshCw size={17} /></button>
                <button type="button" onClick={() => setShowChatInbox(false)} aria-label="Close"><X size={18} /></button>
              </div>
            </header>
            <div className="worker-chat-search">
              <Search size={16} />
              <input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="Search chats..." />
            </div>
            <div className="worker-chat-inbox-list">
              {chatInboxLoading ? (
                <div className="worker-chat-inbox-empty"><TreeLoader /></div>
              ) : chatInbox.filter(({ user }) => {
                const q = chatSearch.trim().toLowerCase();
                return !q || `${user?.name || ""} ${user?.role || ""} ${user?.location || ""}`.toLowerCase().includes(q);
              }).length === 0 ? (
                <div className="worker-chat-inbox-empty">
                  <MessageCircle size={38} />
                  <strong>No chats yet</strong>
                  <span>Start a conversation from a job or employer.</span>
                </div>
              ) : (
                chatInbox.filter(({ user }) => {
                  const q = chatSearch.trim().toLowerCase();
                  return !q || `${user?.name || ""} ${user?.role || ""} ${user?.location || ""}`.toLowerCase().includes(q);
                }).map(({ user, lastMessage }) => (
                  <button key={user.id} type="button" className="worker-chat-row" onClick={() => openChatFromInbox(user)}>
                    <span className="worker-chat-row-avatar">
                      {user.photo_url ? <img src={user.photo_url} alt="" /> : <User size={19} />}
                    </span>
                    <span className="worker-chat-row-copy">
                      <strong>{user.name || "TimberMart User"}</strong>
                      <small>{lastMessage?.body || "Start conversation"}</small>
                    </span>
                    <time>{lastMessage?.created_at ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</time>
                  </button>
                ))
              )}
            </div>
          </aside>
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
                      t("Employer")}
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
                    {t("Start Conversation")}
                  </h3>

                  <p>
                    Send a message to{" "}
                    {selectedEmployer.name ||
                      t("Employer")}.
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
                placeholder={t("Type a message...")}
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
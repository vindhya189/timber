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
  ArrowLeft,
  ArrowRight,
  Camera,
  Languages,
  TreePine,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SawmillDashboard.css";
import TreeLoader from "../components/TreeLoader";

/* ================= EMBEDDED SELL TREE FORM ================= */

/* =========================================================
   TIMBERMART SELL TREE / WOOD FORM
   Languages: English / తెలుగు / हिन्दी
   Sawmill-safe: listing role comes from the logged-in profile.

   IMPORTANT:
   - Database stores canonical English values.
   - UI labels change with the selected language.
   - Teak / wood / firewood sub-types are stored separately
     so every dashboard can filter the same records.
========================================================= */

const LANGUAGES = [
  { id: "en", label: "English", native: "English" },
  { id: "te", label: "Telugu", native: "తెలుగు" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
];

const CATEGORY_OPTIONS = [
  {
    id: "indian_trees",
    icon: "🌳",
    label: { en: "Indian Trees", te: "భారతీయ చెట్లు", hi: "भारतीय पेड़" },
    description: {
      en: "Standing trees and individual trees",
      te: "నిలువుగా ఉన్న చెట్లు మరియు వ్యక్తిగత చెట్లు",
      hi: "खड़े पेड़ और व्यक्तिगत पेड़",
    },
  },
  {
    id: "plantations",
    icon: "🌱",
    label: { en: "Plantations", te: "ప్లాంటేషన్స్", hi: "प्लांटेशन" },
    description: {
      en: "Farm and plantation-grown timber",
      te: "వ్యవసాయ భూమి మరియు ప్లాంటేషన్‌లో పెంచిన కలప",
      hi: "खेत और प्लांटेशन में उगाई गई लकड़ी",
    },
  },
  {
    id: "wood_products",
    icon: "🪵",
    label: { en: "Wood Products", te: "వుడ్ ప్రొడక్ట్స్", hi: "लकड़ी के उत्पाद" },
    description: {
      en: "Logs, timber, reclaimed and processed wood",
      te: "లాగ్స్, టింబర్, పాత/రీక్లెయిమ్డ్ మరియు ప్రాసెస్ చేసిన కలప",
      hi: "लॉग, टिम्बर, पुरानी/रीक्लेम्ड और प्रोसेस्ड लकड़ी",
    },
  },
  {
    id: "firewood",
    icon: "🔥",
    label: { en: "Firewood", te: "కట్టెలు / ఫైర్‌వుడ్", hi: "जलाऊ लकड़ी" },
    description: {
      en: "Firewood sold by species or mixed load",
      te: "చెట్టు రకం లేదా మిక్స్‌డ్ లోడ్‌గా అమ్మే కట్టెలు",
      hi: "प्रजाति या मिश्रित लोड के अनुसार जलाऊ लकड़ी",
    },
  },
];

const TREE_TYPES = {
  indian_trees: [
    "Teak",
    "Neem",
    "Rosewood",
    "Mango",
    "Tamarind",
    "Eucalyptus",
    "Melia Dubia",
    "Casuarina",
    "Subabul",
    "Babul",
    "Jackfruit",
    "Mahogany",
    "Sandalwood",
    "Indian Laurel",
    "Pongamia",
    "Acacia",
    "Rain Tree",
    "Other Indian Tree",
  ],
  plantations: [
    "Casuarina Plantation",
    "Eucalyptus Plantation",
    "Melia Dubia Plantation",
    "Subabul Plantation",
    "Teak Plantation",
    "Bamboo Plantation",
    "Poplar Plantation",
    "Other Plantation",
  ],
  wood_products: [
    "Timber Logs",
    "Sawn Timber",
    "Wooden Planks",
    "Wooden Beams",
    "Wooden Poles",
    "Wooden Boards",
    "Plywood / Boards",
    "Sawdust",
    "Wood Chips",
    "Timber Offcuts",
    "Other Wood Product",
  ],
};

const TEAK_TYPES = [
  "Balarsa Teak",
  "Indian Patta Teak",
  "Indian Local Teak",
  "Bastar Teak",
  "MP Teak",
  "Gujarat Local Teak",
  "Maharashtra Local Teak",
  "Dandeli Teak",
  "Nilambur Teak",
  "Kerala Teak",
  "South Indian Teak",
  "Central Indian Teak",
  "Farm-Grown Teak",
  "Plantation Teak",
  "Other Teak",
];

const WOOD_TYPE_OPTIONS = [
  "Old Wood",
  "Old Teak",
  "Old Wood Furniture",
  "Reclaimed Wood",
  "Reclaimed Teak",
  "Salvaged Wood",
  "Salvaged Teak",
  "Used Wooden Doors",
  "Used Wooden Windows",
  "Used Wooden Beams",
  "Used Wooden Planks",
  "Timber Offcuts",
  "Sawmill Waste",
  "Mixed Old Wood",
  "Other Old Wood",
];

const FIREWOOD_TYPES = [
  "Jeedi / Cashew",
  "Mamidi / Mango",
  "Thati / Palm",
  "Kobari / Coconut",
  "Teak",
  "Neem",
  "Eucalyptus",
  "Babul / Acacia",
  "Subabul",
  "Casuarina",
  "Tamarind",
  "Prosopis",
  "Bamboo",
  "Mixed Hardwood",
  "Mixed Firewood",
  "Other Firewood",
];

const UNITS = [
  "Trees",
  "Logs",
  "Tonnes",
  "Cubic Feet",
  "Cubic Metres",
  "Pieces",
  "Load",
  "Bundles",
];

const CONDITIONS = ["Fresh", "Good", "Seasoned", "Dry", "Mixed"];

const HARVEST_STATUS = [
  "Ready for sale",
  "Ready for harvest",
  "Harvesting soon",
  "Future harvest",
];

const TEXT = {
  en: {
    sellTimber: "Sell Timber",
    language: "Language",
    step: "STEP",
    category: "Category",
    details: "Details",
    photos: "Photos",
    review: "Review",
    whatSelling: "What are you selling?",
    categoryHelp: "Select a category first. The relevant type options will appear automatically.",
    selectType: "Select type",
    selectTreeType: "Select tree type",
    selectProduct: "Select wood product",
    selectFirewood: "Select firewood type",
    teakType: "Teak type",
    woodType: "Wood type",
    woodTypeHelp: "Choose the old, reclaimed or used wood type if applicable.",
    teakHelp: "Choose the specific teak variety/source.",
    aboutTimber: "Tell buyers about your timber",
    detailsHelp: "Add clear details so nearby buyers can understand your listing.",
    title: "Listing title",
    titlePlaceholderTree: "Example: Mature teak trees for sale",
    titlePlaceholderPlantation: "Example: Casuarina plantation for sale",
    titlePlaceholderWood: "Example: Old teak wooden beams for sale",
    titlePlaceholderFirewood: "Example: Dry mango firewood for sale",
    location: "Location",
    locationPlaceholder: "Village / Town / District",
    quantity: "Quantity",
    quantityPlaceholder: "Example: 25",
    quantityUnit: "Quantity unit",
    selectUnit: "Select unit",
    plantationArea: "Plantation area (Acres)",
    enterArea: "Enter total plantation area",
    treeAge: "Tree age",
    treeAgePlaceholder: "Example: 12 years",
    diameter: "Average diameter",
    diameterPlaceholder: "Example: 18 inches",
    volume: "Estimated volume",
    volumePlaceholder: "Example: 500 CFT",
    condition: "Condition",
    selectCondition: "Select condition",
    status: "Sale / Harvest status",
    selectStatus: "Select status",
    price: "Expected price",
    pricePlaceholder: "Example: ₹2,50,000 or ₹1,200 / CFT",
    description: "Description",
    descriptionPlaceholder: "Add useful information about quality, access road, location, harvesting, timber condition, etc.",
    addPhotos: "Add photos",
    photoHelp: "Real photos help buyers understand your timber before contacting you.",
    photoFormat: "JPG, PNG or WEBP · Maximum 5 MB each",
    upTo6: "Up to 10 photos",
    photoTips: "Photo tips",
    photoTipsText: "Upload clear photos of the tree, timber, plantation area or wood product. Avoid blurry or unrelated images.",
    mainPhoto: "Main photo",
    reviewTitle: "Review your listing",
    reviewHelp: "Check the information before publishing it to TimberMart.",
    expectedPrice: "Expected Price",
    listingPhotos: "Photos",
    descriptionLabel: "Description",
    publishNote: "Submit your listing for Admin review. It will become visible to buyers only after Admin approval.",
    cancel: "Cancel",
    back: "Back",
    continue: "Continue",
    publish: "Publish Listing",
    publishing: "Publishing...",
    successTitle: "Listing Submitted for Approval ✅",
    successText: "Your timber listing was submitted successfully and is now waiting for Admin approval.",
    successSmall: "After Admin approval, buyers can view your listing and contact you directly.",
    callChat: "Call / WhatsApp / Chat",
    required: "Required",
    chooseCategory: "Please select a category.",
    chooseType: "Please select a tree or product type.",
    chooseTeak: "Please select a teak type.",
    chooseWood: "Please select a wood type.",
    chooseFirewood: "Please select a firewood type.",
    enterTitle: "Please enter a listing title.",
    enterLocation: "Please enter the location.",
    enterQuantity: "Please enter the quantity.",
    chooseUnit: "Please select the quantity unit.",
    enterArea: "Please enter plantation area in acres.",
    enterPrice: "Please enter your expected price.",
    uploadError: "Unable to publish your listing. Please try again.",
  },
  te: {
    sellTimber: "కలప అమ్మండి",
    language: "భాష",
    step: "దశ",
    category: "కేటగిరీ",
    details: "వివరాలు",
    photos: "ఫోటోలు",
    review: "రివ్యూ",
    whatSelling: "మీరు ఏమి అమ్ముతున్నారు?",
    categoryHelp: "ముందుగా కేటగిరీ ఎంచుకోండి. దానికి సంబంధించిన టైప్ ఆప్షన్లు కనిపిస్తాయి.",
    selectType: "టైప్ ఎంచుకోండి",
    selectTreeType: "చెట్టు రకం ఎంచుకోండి",
    selectProduct: "వుడ్ ప్రొడక్ట్ ఎంచుకోండి",
    selectFirewood: "కట్టెల రకం ఎంచుకోండి",
    teakType: "టీక్ రకం",
    woodType: "వుడ్ రకం",
    woodTypeHelp: "పాత, రీక్లెయిమ్డ్ లేదా ఉపయోగించిన కలప రకాన్ని ఎంచుకోండి.",
    teakHelp: "నిర్దిష్ట టీక్ రకం / ప్రాంతాన్ని ఎంచుకోండి.",
    aboutTimber: "మీ కలప గురించి వివరాలు ఇవ్వండి",
    detailsHelp: "కొనుగోలుదారులు సులభంగా అర్థం చేసుకునేలా వివరాలు ఇవ్వండి.",
    title: "లిస్టింగ్ టైటిల్",
    titlePlaceholderTree: "ఉదా: మెచ్యూర్ టీక్ చెట్లు అమ్మకానికి",
    titlePlaceholderPlantation: "ఉదా: క్యాసువరినా ప్లాంటేషన్ అమ్మకానికి",
    titlePlaceholderWood: "ఉదా: పాత టీక్ వుడ్ బీమ్స్ అమ్మకానికి",
    titlePlaceholderFirewood: "ఉదా: ఎండిన మామిడి కట్టెలు అమ్మకానికి",
    location: "ప్రదేశం",
    locationPlaceholder: "గ్రామం / పట్టణం / జిల్లా",
    quantity: "పరిమాణం",
    quantityPlaceholder: "ఉదా: 25",
    quantityUnit: "పరిమాణ యూనిట్",
    selectUnit: "యూనిట్ ఎంచుకోండి",
    plantationArea: "ప్లాంటేషన్ విస్తీర్ణం (ఎకరాలు)",
    enterArea: "మొత్తం ప్లాంటేషన్ విస్తీర్ణం ఇవ్వండి",
    treeAge: "చెట్టు వయస్సు",
    treeAgePlaceholder: "ఉదా: 12 సంవత్సరాలు",
    diameter: "సగటు వ్యాసం",
    diameterPlaceholder: "ఉదా: 18 ఇంచులు",
    volume: "అంచనా వాల్యూమ్",
    volumePlaceholder: "ఉదా: 500 CFT",
    condition: "స్థితి",
    selectCondition: "స్థితి ఎంచుకోండి",
    status: "అమ్మకం / హార్వెస్ట్ స్థితి",
    selectStatus: "స్థితి ఎంచుకోండి",
    price: "అంచనా ధర",
    pricePlaceholder: "ఉదా: ₹2,50,000 లేదా ₹1,200 / CFT",
    description: "వివరణ",
    descriptionPlaceholder: "నాణ్యత, రోడ్డు, ప్రదేశం, హార్వెస్టింగ్, కలప స్థితి గురించి సమాచారం ఇవ్వండి.",
    addPhotos: "ఫోటోలు జోడించండి",
    photoHelp: "కొనుగోలుదారులకు కలపను అర్థం చేసుకోవడానికి నిజమైన ఫోటోలు సహాయపడతాయి.",
    photoFormat: "JPG, PNG లేదా WEBP · ఒక్కోటి గరిష్టంగా 5 MB",
    upTo6: "గరిష్టంగా 6 ఫోటోలు",
    photoTips: "ఫోటో సూచనలు",
    photoTipsText: "చెట్టు, కలప, ప్లాంటేషన్ లేదా వుడ్ ప్రొడక్ట్ ఫోటోలు స్పష్టంగా అప్లోడ్ చేయండి.",
    mainPhoto: "ముఖ్య ఫోటో",
    reviewTitle: "మీ లిస్టింగ్‌ను రివ్యూ చేయండి",
    reviewHelp: "TimberMartలో ప్రచురించే ముందు వివరాలను చెక్ చేయండి.",
    expectedPrice: "అంచనా ధర",
    listingPhotos: "ఫోటోలు",
    descriptionLabel: "వివరణ",
    publishNote: "మీ లిస్టింగ్ ముందుగా Admin review కు వెళ్తుంది. Admin approve చేసిన తర్వాతే buyers కు కనిపిస్తుంది.",
    cancel: "రద్దు",
    back: "వెనుకకు",
    continue: "కొనసాగించండి",
    publish: "లిస్టింగ్ ప్రచురించండి",
    publishing: "ప్రచురిస్తోంది...",
    successTitle: "లిస్టింగ్ ప్రచురించబడింది 🎉",
    successText: "మీ కలప లిస్టింగ్ విజయవంతంగా TimberMartలో ప్రచురించబడింది.",
    successSmall: "కొనుగోలుదారులు ఇప్పుడు లిస్టింగ్ చూసి మిమ్మల్ని సంప్రదించవచ్చు.",
    callChat: "కాల్ / WhatsApp / చాట్",
    required: "అవసరం",
    chooseCategory: "దయచేసి కేటగిరీ ఎంచుకోండి.",
    chooseType: "దయచేసి చెట్టు లేదా ప్రొడక్ట్ టైప్ ఎంచుకోండి.",
    chooseTeak: "దయచేసి టీక్ రకం ఎంచుకోండి.",
    chooseWood: "దయచేసి వుడ్ రకం ఎంచుకోండి.",
    chooseFirewood: "దయచేసి కట్టెల రకం ఎంచుకోండి.",
    enterTitle: "దయచేసి లిస్టింగ్ టైటిల్ ఇవ్వండి.",
    enterLocation: "దయచేసి ప్రదేశం ఇవ్వండి.",
    enterQuantity: "దయచేసి పరిమాణం ఇవ్వండి.",
    chooseUnit: "దయచేసి పరిమాణ యూనిట్ ఎంచుకోండి.",
    enterArea: "దయచేసి ప్లాంటేషన్ విస్తీర్ణం ఇవ్వండి.",
    enterPrice: "దయచేసి అంచనా ధర ఇవ్వండి.",
    uploadError: "లిస్టింగ్ ప్రచురించలేకపోయాము. మళ్లీ ప్రయత్నించండి.",
  },
  hi: {
    sellTimber: "लकड़ी बेचें",
    language: "भाषा",
    step: "चरण",
    category: "श्रेणी",
    details: "विवरण",
    photos: "फोटो",
    review: "समीक्षा",
    whatSelling: "आप क्या बेच रहे हैं?",
    categoryHelp: "पहले श्रेणी चुनें। संबंधित प्रकार अपने आप दिखाई देंगे।",
    selectType: "प्रकार चुनें",
    selectTreeType: "पेड़ का प्रकार चुनें",
    selectProduct: "लकड़ी का उत्पाद चुनें",
    selectFirewood: "जलाऊ लकड़ी का प्रकार चुनें",
    teakType: "सागौन का प्रकार",
    woodType: "लकड़ी का प्रकार",
    woodTypeHelp: "पुरानी, रीक्लेम्ड या इस्तेमाल की गई लकड़ी का प्रकार चुनें।",
    teakHelp: "विशिष्ट सागौन प्रकार / स्रोत चुनें।",
    aboutTimber: "अपनी लकड़ी के बारे में बताएं",
    detailsHelp: "खरीदारों को आपकी लिस्टिंग समझने के लिए स्पष्ट जानकारी दें।",
    title: "लिस्टिंग शीर्षक",
    titlePlaceholderTree: "उदाहरण: परिपक्व सागौन के पेड़ बिक्री के लिए",
    titlePlaceholderPlantation: "उदाहरण: कैसुअरीना प्लांटेशन बिक्री के लिए",
    titlePlaceholderWood: "उदाहरण: पुरानी सागौन की बीम बिक्री के लिए",
    titlePlaceholderFirewood: "उदाहरण: सूखी आम की जलाऊ लकड़ी बिक्री के लिए",
    location: "स्थान",
    locationPlaceholder: "गांव / शहर / जिला",
    quantity: "मात्रा",
    quantityPlaceholder: "उदाहरण: 25",
    quantityUnit: "मात्रा इकाई",
    selectUnit: "इकाई चुनें",
    plantationArea: "प्लांटेशन क्षेत्र (एकड़)",
    enterArea: "कुल प्लांटेशन क्षेत्र दर्ज करें",
    treeAge: "पेड़ की उम्र",
    treeAgePlaceholder: "उदाहरण: 12 वर्ष",
    diameter: "औसत व्यास",
    diameterPlaceholder: "उदाहरण: 18 इंच",
    volume: "अनुमानित वॉल्यूम",
    volumePlaceholder: "उदाहरण: 500 CFT",
    condition: "स्थिति",
    selectCondition: "स्थिति चुनें",
    status: "बिक्री / कटाई स्थिति",
    selectStatus: "स्थिति चुनें",
    price: "अपेक्षित कीमत",
    pricePlaceholder: "उदाहरण: ₹2,50,000 या ₹1,200 / CFT",
    description: "विवरण",
    descriptionPlaceholder: "गुणवत्ता, सड़क, स्थान, कटाई और लकड़ी की स्थिति की जानकारी दें।",
    addPhotos: "फोटो जोड़ें",
    photoHelp: "वास्तविक फोटो खरीदारों को लकड़ी समझने में मदद करते हैं।",
    photoFormat: "JPG, PNG या WEBP · प्रत्येक अधिकतम 5 MB",
    upTo6: "अधिकतम 6 फोटो",
    photoTips: "फोटो सुझाव",
    photoTipsText: "पेड़, लकड़ी, प्लांटेशन या वुड प्रोडक्ट की साफ फोटो अपलोड करें।",
    mainPhoto: "मुख्य फोटो",
    reviewTitle: "अपनी लिस्टिंग की समीक्षा करें",
    reviewHelp: "TimberMart पर प्रकाशित करने से पहले जानकारी जांचें।",
    expectedPrice: "अपेक्षित कीमत",
    listingPhotos: "फोटो",
    descriptionLabel: "विवरण",
    publishNote: "आपकी लिस्टिंग पहले Admin review में जाएगी। Admin approval के बाद ही buyers इसे देख पाएंगे।",
    cancel: "रद्द करें",
    back: "पीछे",
    continue: "जारी रखें",
    publish: "लिस्टिंग प्रकाशित करें",
    publishing: "प्रकाशित हो रहा है...",
    successTitle: "लिस्टिंग प्रकाशित हो गई 🎉",
    successText: "आपकी लकड़ी की लिस्टिंग TimberMart पर सफलतापूर्वक प्रकाशित हो गई है।",
    successSmall: "खरीदार अब आपकी लिस्टिंग देखकर आपसे संपर्क कर सकते हैं।",
    callChat: "कॉल / WhatsApp / चैट",
    required: "आवश्यक",
    chooseCategory: "कृपया श्रेणी चुनें।",
    chooseType: "कृपया पेड़ या उत्पाद का प्रकार चुनें।",
    chooseTeak: "कृपया सागौन का प्रकार चुनें।",
    chooseWood: "कृपया लकड़ी का प्रकार चुनें।",
    chooseFirewood: "कृपया जलाऊ लकड़ी का प्रकार चुनें।",
    enterTitle: "कृपया लिस्टिंग शीर्षक दर्ज करें।",
    enterLocation: "कृपया स्थान दर्ज करें।",
    enterQuantity: "कृपया मात्रा दर्ज करें।",
    chooseUnit: "कृपया मात्रा इकाई चुनें।",
    enterArea: "कृपया प्लांटेशन क्षेत्र दर्ज करें।",
    enterPrice: "कृपया अपेक्षित कीमत दर्ज करें।",
    uploadError: "लिस्टिंग प्रकाशित नहीं हो सकी। फिर से प्रयास करें।",
  },
};

const OPTION_LABELS = {
  "Balarsa Teak": { te: "బలార్సా టీక్", hi: "बलारसा सागौन" },
  "Indian Patta Teak": { te: "ఇండియన్ పట్టా టీక్", hi: "इंडियन पट्टा सागौन" },
  "Indian Local Teak": { te: "ఇండియన్ లోకల్ టీక్", hi: "इंडियन लोकल सागौन" },
  "Bastar Teak": { te: "బస్తర్ టీక్", hi: "बस्तर सागौन" },
  "MP Teak": { te: "MP టీక్", hi: "MP सागौन" },
  "Gujarat Local Teak": { te: "గుజరాత్ లోకల్ టీక్", hi: "गुजरात लोकल सागौन" },
  "Maharashtra Local Teak": { te: "మహారాష్ట్ర లోకల్ టీక్", hi: "महाराष्ट्र लोकल सागौन" },
  "Dandeli Teak": { te: "దండేలి టీక్", hi: "दांडेली सागौन" },
  "Nilambur Teak": { te: "నీలాంబర్ టీక్", hi: "नीलांबर सागौन" },
  "Kerala Teak": { te: "కేరళ టీక్", hi: "केरल सागौन" },
  "South Indian Teak": { te: "సౌత్ ఇండియన్ టీక్", hi: "दक्षिण भारतीय सागौन" },
  "Central Indian Teak": { te: "సెంట్రల్ ఇండియన్ టీక్", hi: "मध्य भारतीय सागौन" },
  "Farm-Grown Teak": { te: "ఫార్మ్-గ్రోన్ టీక్", hi: "फार्म में उगाया गया सागौन" },
  "Plantation Teak": { te: "ప్లాంటేషన్ టీక్", hi: "प्लांटेशन सागौन" },
  "Other Teak": { te: "ఇతర టీక్", hi: "अन्य सागौन" },

  "Old Wood": { te: "పాత వుడ్", hi: "पुरानी लकड़ी" },
  "Old Teak": { te: "పాత టీక్", hi: "पुरानी सागौन" },
  "Old Wood Furniture": { te: "పాత వుడ్ ఫర్నిచర్", hi: "पुराना लकड़ी का फर्नीचर" },
  "Reclaimed Wood": { te: "రీక్లెయిమ్డ్ వుడ్", hi: "रीक्लेम्ड लकड़ी" },
  "Reclaimed Teak": { te: "రీక్లెయిమ్డ్ టీక్", hi: "रीक्लेम्ड सागौन" },
  "Salvaged Wood": { te: "సాల్వేజ్డ్ వుడ్", hi: "साल्वेज्ड लकड़ी" },
  "Salvaged Teak": { te: "సాల్వేజ్డ్ టీక్", hi: "साल्वेज्ड सागौन" },
  "Used Wooden Doors": { te: "వాడిన చెక్క తలుపులు", hi: "पुराने लकड़ी के दरवाजे" },
  "Used Wooden Windows": { te: "వాడిన చెక్క కిటికీలు", hi: "पुरानी लकड़ी की खिड़कियां" },
  "Used Wooden Beams": { te: "వాడిన చెక్క బీమ్స్", hi: "पुरानी लकड़ी की बीम" },
  "Used Wooden Planks": { te: "వాడిన చెక్క పలకలు", hi: "पुरानी लकड़ी की पट्टियां" },
  "Timber Offcuts": { te: "టింబర్ మిగులు ముక్కలు", hi: "टिम्बर के बचे टुकड़े" },
  "Sawmill Waste": { te: "సా మిల్ వ్యర్థ కలప", hi: "सॉमिल की बची लकड़ी" },
  "Mixed Old Wood": { te: "మిక్స్‌డ్ పాత వుడ్", hi: "मिश्रित पुरानी लकड़ी" },
  "Other Old Wood": { te: "ఇతర పాత వుడ్", hi: "अन्य पुरानी लकड़ी" },

  "Jeedi / Cashew": { te: "జీడి / జీడిమామిడి", hi: "काजू" },
  "Mamidi / Mango": { te: "మామిడి", hi: "आम" },
  "Thati / Palm": { te: "తాటి", hi: "ताड़" },
  "Kobari / Coconut": { te: "కొబ్బరి", hi: "नारियल" },
  "Teak": { te: "టీక్", hi: "सागौन" },
  "Neem": { te: "వేప", hi: "नीम" },
  "Eucalyptus": { te: "యూకలిప్టస్", hi: "नीलगिरी" },
  "Babul / Acacia": { te: "బాబుల్ / అకేషియా", hi: "बबूल / बबूलिया" },
  "Subabul": { te: "సుబాబుల్", hi: "सुबबूल" },
  "Casuarina": { te: "క్యాసువరినా", hi: "कैसुअरीना" },
  "Tamarind": { te: "చింత", hi: "इमली" },
  "Prosopis": { te: "ప్రోసోపిస్", hi: "प्रोसोपिस" },
  "Bamboo": { te: "వెదురు", hi: "बांस" },
  "Mixed Hardwood": { te: "మిక్స్‌డ్ హార్డ్‌వుడ్", hi: "मिश्रित हार्डवुड" },
  "Mixed Firewood": { te: "మిక్స్‌డ్ ఫైర్‌వుడ్", hi: "मिश्रित जलाऊ लकड़ी" },
  "Other Firewood": { te: "ఇతర ఫైర్‌వుడ్", hi: "अन्य जलाऊ लकड़ी" },
};

const GENERIC_LABELS = {
  "Teak": { te: "టీక్", hi: "सागौन" },
  "Neem": { te: "వేప", hi: "नीम" },
  "Rosewood": { te: "రోజ్‌వుడ్", hi: "रोज़वुड" },
  "Mango": { te: "మామిడి", hi: "आम" },
  "Tamarind": { te: "చింత", hi: "इमली" },
  "Eucalyptus": { te: "యూకలిప్టస్", hi: "नीलगिरी" },
  "Melia Dubia": { te: "మెలియా డుబియా", hi: "मेलिया डुबिया" },
  "Casuarina": { te: "క్యాసువరినా", hi: "कैसुअरीना" },
  "Subabul": { te: "సుబాబుల్", hi: "सुबबूल" },
  "Babul": { te: "బాబుల్", hi: "बबूल" },
  "Jackfruit": { te: "పనస", hi: "कटहल" },
  "Mahogany": { te: "మహాగని", hi: "महोगनी" },
  "Sandalwood": { te: "చందనం", hi: "चंदन" },
  "Indian Laurel": { te: "ఇండియన్ లారెల్", hi: "इंडियन लॉरेल" },
  "Pongamia": { te: "కానుగ", hi: "करंज" },
  "Acacia": { te: "అకేషియా", hi: "बबूलिया" },
  "Rain Tree": { te: "రెయిన్ ట్రీ", hi: "रेन ट्री" },
  "Other Indian Tree": { te: "ఇతర భారతీయ చెట్టు", hi: "अन्य भारतीय पेड़" },
  "Casuarina Plantation": { te: "క్యాసువరినా ప్లాంటేషన్", hi: "कैसुअरीना प्लांटेशन" },
  "Eucalyptus Plantation": { te: "యూకలిప్టస్ ప్లాంటేషన్", hi: "नीलगिरी प्लांटेशन" },
  "Melia Dubia Plantation": { te: "మెలియా డుబియా ప్లాంటేషన్", hi: "मेलिया डुबिया प्लांटेशन" },
  "Subabul Plantation": { te: "సుబాబుల్ ప్లాంటేషన్", hi: "सुबबूल प्लांटेशन" },
  "Teak Plantation": { te: "టీక్ ప్లాంటేషన్", hi: "सागौन प्लांटेशन" },
  "Bamboo Plantation": { te: "వెదురు ప్లాంటేషన్", hi: "बांस प्लांटेशन" },
  "Poplar Plantation": { te: "పాప్లర్ ప్లాంటేషన్", hi: "पॉपलर प्लांटेशन" },
  "Other Plantation": { te: "ఇతర ప్లాంటేషన్", hi: "अन्य प्लांटेशन" },
  "Timber Logs": { te: "టింబర్ లాగ్స్", hi: "टिम्बर लॉग" },
  "Sawn Timber": { te: "సాన్ టింబర్", hi: "सॉ टिम्बर" },
  "Wooden Planks": { te: "చెక్క పలకలు", hi: "लकड़ी की पट्टियां" },
  "Wooden Beams": { te: "చెక్క బీమ్స్", hi: "लकड़ी की बीम" },
  "Wooden Poles": { te: "చెక్క పోల్స్", hi: "लकड़ी के पोल" },
  "Wooden Boards": { te: "చెక్క బోర్డులు", hi: "लकड़ी के बोर्ड" },
  "Plywood / Boards": { te: "ప్లైవుడ్ / బోర్డులు", hi: "प्लाईवुड / बोर्ड" },
  "Sawdust": { te: "సా డస్ట్", hi: "बुरादा" },
  "Wood Chips": { te: "వుడ్ చిప్స్", hi: "लकड़ी के चिप्स" },
  "Timber Offcuts": { te: "టింబర్ మిగులు ముక్కలు", hi: "टिम्बर के बचे टुकड़े" },
  "Other Wood Product": { te: "ఇతర వుడ్ ప్రొడక్ట్", hi: "अन्य लकड़ी उत्पाद" },
};

function getOptionLabel(value, language) {
  if (!value) return "";
  if (language === "en") return value;
  return (
    OPTION_LABELS[value]?.[language] ||
    GENERIC_LABELS[value]?.[language] ||
    value
  );
}

function getText(language, key) {
  return TEXT[language]?.[key] || TEXT.en[key] || key;
}

function SellTreeForm({ user, profile, onClose, onPublished }) {
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState("en");

  const [form, setForm] = useState({
    category: "",
    tree_type: "",
    teak_type: "",
    wood_type_detail: "",
    firewood_type: "",
    product_type: "",
    title: "",
    location: profile?.location || "",
    quantity: "",
    quantity_unit: "",
    acreage: "",
    tree_age: "",
    diameter: "",
    estimated_volume: "",
    condition: "",
    harvest_status: "",
    price: "",
    description: "",
    contact_preference: "Call / WhatsApp / Chat",
  });

  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isPlantation = form.category === "plantations";
  const isWoodProduct = form.category === "wood_products";
  const isTree = form.category === "indian_trees";
  const isFirewood = form.category === "firewood";
  const isTeak = form.tree_type === "Teak" || form.tree_type === "Teak Plantation";

  const currentTypes = useMemo(() => {
    if (!form.category) return [];
    if (form.category === "firewood") return FIREWOOD_TYPES;
    return TREE_TYPES[form.category] || [];
  }, [form.category]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCategoryChange(value) {
    setForm((prev) => ({
      ...prev,
      category: value,
      tree_type: "",
      teak_type: "",
      wood_type_detail: "",
      firewood_type: "",
      product_type: "",
      acreage: "",
      quantity: "",
      quantity_unit: "",
      tree_age: "",
      diameter: "",
      estimated_volume: "",
      condition: "",
      harvest_status: "",
    }));
    setErrorMessage("");
  }

  function handlePrimaryTypeChange(value) {
    setForm((prev) => ({
      ...prev,
      tree_type: value,
      teak_type: "",
      wood_type_detail: "",
      firewood_type: "",
      product_type: isWoodProduct ? value : "",
    }));
    setErrorMessage("");
  }

  function handlePhotos(event) {
    const selected = Array.from(event.target.files || []);
    const valid = selected.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );
    setPhotos((prev) => [...prev, ...valid].slice(0, 10));
    event.target.value = "";
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function validateStepOne() {
    if (!form.category) {
      setErrorMessage(getText(language, "chooseCategory"));
      return false;
    }
    if (!form.tree_type) {
      setErrorMessage(
        isFirewood
          ? getText(language, "chooseFirewood")
          : getText(language, "chooseType")
      );
      return false;
    }
    if (isTeak && !form.teak_type) {
      setErrorMessage(getText(language, "chooseTeak"));
      return false;
    }
    if (isWoodProduct && !form.wood_type_detail) {
      setErrorMessage(getText(language, "chooseWood"));
      return false;
    }
    return true;
  }

  function validateStepTwo() {
    if (!form.title.trim()) {
      setErrorMessage(getText(language, "enterTitle"));
      return false;
    }
    if (!form.location.trim()) {
      setErrorMessage(getText(language, "enterLocation"));
      return false;
    }
    if (!form.quantity.trim()) {
      setErrorMessage(getText(language, "enterQuantity"));
      return false;
    }
    if (!form.quantity_unit) {
      setErrorMessage(getText(language, "chooseUnit"));
      return false;
    }
    if (isPlantation && !form.acreage) {
      setErrorMessage(getText(language, "enterArea"));
      return false;
    }
    return true;
  }

  function validateStepThree() {
    if (!form.price.trim()) {
      setErrorMessage(getText(language, "enterPrice"));
      return false;
    }
    return true;
  }

  function nextStep() {
    setErrorMessage("");
    if (step === 1 && !validateStepOne()) return;
    if (step === 2 && !validateStepTwo()) return;
    if (step < 4) setStep((prev) => prev + 1);
  }

  function previousStep() {
    setErrorMessage("");
    if (step > 1) setStep((prev) => prev - 1);
  }

  async function publishListing() {
    if (!validateStepThree()) return;

    if (!user?.id) {
      setErrorMessage("User session not found. Please log in again.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const selectedSubtype =
        form.teak_type || form.wood_type_detail || form.firewood_type || null;

      const subtypeGroup = form.teak_type
        ? "teak"
        : form.wood_type_detail
          ? "wood"
          : form.firewood_type
            ? "firewood"
            : null;

      const canonicalWoodType =
        form.wood_type_detail ||
        form.firewood_type ||
        form.tree_type ||
        null;

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          role: profile?.role || user?.user_metadata?.role || "sawmill",
          status: "pending",
          category: form.category,
          tree_type: form.tree_type,
          title: form.title.trim(),
          wood_type: canonicalWoodType,
          product_type: form.product_type || null,

          // NEW: structured subtype fields for every dashboard
          subtype_group: subtypeGroup,
          subtype: selectedSubtype,
          teak_type: form.teak_type || null,
          wood_type_detail: form.wood_type_detail || null,
          firewood_type: form.firewood_type || null,
          listing_language: language,

          location: form.location.trim(),
          quantity: form.quantity.trim(),
          quantity_unit: form.quantity_unit,
          acreage: isPlantation ? Number(form.acreage) : null,
          tree_age: form.tree_age.trim() || null,
          diameter: form.diameter.trim() || null,
          estimated_volume: form.estimated_volume.trim() || null,
          condition: form.condition || null,
          harvest_status: form.harvest_status || null,
          price: form.price.trim(),
          description: form.description.trim() || null,
          contact_preference: form.contact_preference,
          expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (listingError) throw listingError;

      for (let index = 0; index < photos.length; index++) {
        const file = photos[index];
        const extension = file.name.split(".").pop() || "jpg";
        const storagePath =
          `${user.id}/${listing.id}/${Date.now()}-${index}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(storagePath);

        const publicUrl = publicUrlData?.publicUrl;
        if (!publicUrl) continue;

        const { error: imageError } = await supabase
          .from("listing_images")
          .insert({
            listing_id: listing.id,
            user_id: user.id,
            image_url: publicUrl,
            storage_path: storagePath,
            sort_order: index,
          });

        if (imageError) console.error("Listing image database error:", imageError);
      }

      setStep(5);
      if (onPublished) {
        setTimeout(() => onPublished(listing), 900);
      }
    } catch (error) {
      console.error("Publish listing error:", error);
      setErrorMessage(error?.message || getText(language, "uploadError"));
    } finally {
      setSaving(false);
    }
  }

  const category = CATEGORY_OPTIONS.find((item) => item.id === form.category);
  const categoryLabel = category ? category.label[language] || category.label.en : "";

  const primaryLabel =
    isFirewood ? getText(language, "selectFirewood")
      : isWoodProduct ? getText(language, "selectProduct")
      : getText(language, "selectTreeType");

  const titlePlaceholder =
    isFirewood ? getText(language, "titlePlaceholderFirewood")
      : isPlantation ? getText(language, "titlePlaceholderPlantation")
      : isWoodProduct ? getText(language, "titlePlaceholderWood")
      : getText(language, "titlePlaceholderTree");

  return (
    <div className="sell-tree-overlay">
      <div className="sell-tree-modal">
        <header className="sell-tree-header">
          <div className="sell-tree-brand">
            <div className="sell-tree-brand-icon">
              <TreePine size={23} />
            </div>
            <div>
              <strong>TimberMart</strong>
              <span>{getText(language, "sellTimber")}</span>
            </div>
          </div>

          <div className="sell-header-actions">
            <div className="sell-language">
              <Languages size={17} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label={getText(language, "language")}
              >
                {LANGUAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.native}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="sell-tree-close"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
            >
              <X size={21} />
            </button>
          </div>
        </header>

        {step < 5 && (
          <div className="sell-progress">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`sell-progress-item ${step >= item ? "active" : ""}`}
              >
                <span>{item}</span>
                {item === 1 && getText(language, "category")}
                {item === 2 && getText(language, "details")}
                {item === 3 && getText(language, "photos")}
                {item === 4 && getText(language, "review")}
              </div>
            ))}
          </div>
        )}

        <div className="sell-tree-body">
          {step === 1 && (
            <section className="sell-step">
              <div className="sell-step-heading">
                <span>{getText(language, "step")} 1</span>
                <h2>{getText(language, "whatSelling")}</h2>
                <p>{getText(language, "categoryHelp")}</p>
              </div>

              <div className="sell-category-grid">
                {CATEGORY_OPTIONS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`sell-category-card ${form.category === item.id ? "selected" : ""}`}
                    onClick={() => handleCategoryChange(item.id)}
                  >
                    <div className="sell-category-icon">{item.icon}</div>
                    <div>
                      <strong>{item.label[language] || item.label.en}</strong>
                      <p>{item.description[language] || item.description.en}</p>
                    </div>
                    {form.category === item.id && (
                      <CheckCircle2 size={21} className="sell-selected-icon" />
                    )}
                  </button>
                ))}
              </div>

              {form.category && (
                <div className="sell-dependent-box">
                  <label>
                    {primaryLabel} <span>*</span>
                  </label>
                  <select
                    value={form.tree_type}
                    onChange={(e) => handlePrimaryTypeChange(e.target.value)}
                  >
                    <option value="">{getText(language, "selectType")}</option>
                    {currentTypes.map((type) => (
                      <option key={type} value={type}>
                        {getOptionLabel(type, language)}
                      </option>
                    ))}
                  </select>

                  {isTeak && (
                    <div className="sell-subtype-block">
                      <label>
                        {getText(language, "teakType")} <span>*</span>
                      </label>
                      <select
                        value={form.teak_type}
                        onChange={(e) => updateField("teak_type", e.target.value)}
                      >
                        <option value="">{getText(language, "selectType")}</option>
                        {TEAK_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {getOptionLabel(type, language)}
                          </option>
                        ))}
                      </select>
                      <small>{getText(language, "teakHelp")}</small>
                    </div>
                  )}

                  {isWoodProduct && (
                    <div className="sell-subtype-block">
                      <label>
                        {getText(language, "woodType")} <span>*</span>
                      </label>
                      <select
                        value={form.wood_type_detail}
                        onChange={(e) =>
                          updateField("wood_type_detail", e.target.value)
                        }
                      >
                        <option value="">{getText(language, "selectType")}</option>
                        {WOOD_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {getOptionLabel(type, language)}
                          </option>
                        ))}
                      </select>
                      <small>{getText(language, "woodTypeHelp")}</small>
                    </div>
                  )}

                  {isFirewood && (
                    <div className="sell-subtype-block">
                      <label>
                        {getText(language, "selectFirewood")} <span>*</span>
                      </label>
                      <select
                        value={form.firewood_type}
                        onChange={(e) =>
                          updateField("firewood_type", e.target.value)
                        }
                      >
                        <option value="">{getText(language, "selectType")}</option>
                        {FIREWOOD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {getOptionLabel(type, language)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="sell-step">
              <div className="sell-step-heading">
                <span>{getText(language, "step")} 2</span>
                <h2>{getText(language, "aboutTimber")}</h2>
                <p>{getText(language, "detailsHelp")}</p>
              </div>

              <div className="sell-selected-summary">
                <span>{category?.icon}</span>
                <div>
                  <small>{categoryLabel}</small>
                  <strong>
                    {getOptionLabel(form.tree_type, language)}
                    {form.teak_type && ` · ${getOptionLabel(form.teak_type, language)}`}
                    {form.wood_type_detail &&
                      ` · ${getOptionLabel(form.wood_type_detail, language)}`}
                    {form.firewood_type &&
                      ` · ${getOptionLabel(form.firewood_type, language)}`}
                  </strong>
                </div>
              </div>

              <div className="sell-form-grid">
                <div className="sell-field sell-full">
                  <label>
                    {getText(language, "title")} <span>*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder={titlePlaceholder}
                  />
                </div>

                <div className="sell-field">
                  <label>
                    {getText(language, "location")} <span>*</span>
                  </label>
                  <div className="sell-input-icon">
                    <MapPin size={17} />
                    <input
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      placeholder={getText(language, "locationPlaceholder")}
                    />
                  </div>
                </div>

                <div className="sell-field">
                  <label>
                    {getText(language, "quantity")} <span>*</span>
                  </label>
                  <input
                    value={form.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                    placeholder={getText(language, "quantityPlaceholder")}
                  />
                </div>

                <div className="sell-field">
                  <label>
                    {getText(language, "quantityUnit")} <span>*</span>
                  </label>
                  <select
                    value={form.quantity_unit}
                    onChange={(e) => updateField("quantity_unit", e.target.value)}
                  >
                    <option value="">{getText(language, "selectUnit")}</option>
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                {isPlantation && (
                  <>
                    <div className="sell-field">
                      <label>
                        {getText(language, "plantationArea")} <span>*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.acreage}
                        onChange={(e) => updateField("acreage", e.target.value)}
                        placeholder="Example: 2.5"
                      />
                      <small>{getText(language, "enterArea")}</small>
                    </div>

                    <div className="sell-field">
                      <label>{getText(language, "treeAge")}</label>
                      <input
                        value={form.tree_age}
                        onChange={(e) => updateField("tree_age", e.target.value)}
                        placeholder={getText(language, "treeAgePlaceholder")}
                      />
                    </div>
                  </>
                )}

                {isTree && (
                  <>
                    <div className="sell-field">
                      <label>{getText(language, "treeAge")}</label>
                      <input
                        value={form.tree_age}
                        onChange={(e) => updateField("tree_age", e.target.value)}
                        placeholder={getText(language, "treeAgePlaceholder")}
                      />
                    </div>

                    <div className="sell-field">
                      <label>{getText(language, "diameter")}</label>
                      <input
                        value={form.diameter}
                        onChange={(e) => updateField("diameter", e.target.value)}
                        placeholder={getText(language, "diameterPlaceholder")}
                      />
                    </div>
                  </>
                )}

                {(isWoodProduct || isFirewood) && (
                  <div className="sell-field">
                    <label>{getText(language, "condition")}</label>
                    <select
                      value={form.condition}
                      onChange={(e) => updateField("condition", e.target.value)}
                    >
                      <option value="">{getText(language, "selectCondition")}</option>
                      {CONDITIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sell-field">
                  <label>{getText(language, "volume")}</label>
                  <input
                    value={form.estimated_volume}
                    onChange={(e) => updateField("estimated_volume", e.target.value)}
                    placeholder={getText(language, "volumePlaceholder")}
                  />
                </div>

                <div className="sell-field">
                  <label>{getText(language, "status")}</label>
                  <select
                    value={form.harvest_status}
                    onChange={(e) => updateField("harvest_status", e.target.value)}
                  >
                    <option value="">{getText(language, "selectStatus")}</option>
                    {HARVEST_STATUS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sell-field sell-full">
                  <label>
                    {getText(language, "price")} <span>*</span>
                  </label>
                  <input
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder={getText(language, "pricePlaceholder")}
                  />
                </div>

                <div className="sell-field sell-full">
                  <label>{getText(language, "description")}</label>
                  <textarea
                    rows="5"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder={getText(language, "descriptionPlaceholder")}
                  />
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="sell-step">
              <div className="sell-step-heading">
                <span>{getText(language, "step")} 3</span>
                <h2>{getText(language, "addPhotos")}</h2>
                <p>{getText(language, "photoHelp")}</p>
              </div>

              <label className="sell-photo-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotos}
                />
                <div className="sell-photo-upload-icon">
                  <ImagePlus size={30} />
                </div>
                <strong>{getText(language, "addPhotos")}</strong>
                <span>{getText(language, "photoFormat")}</span>
                <small>{getText(language, "upTo6")}</small>
              </label>

              {photos.length > 0 && (
                <div className="sell-photo-grid">
                  {photos.map((photo, index) => (
                    <div
                      className="sell-photo-preview"
                      key={`${photo.name}-${index}`}
                    >
                      <img src={URL.createObjectURL(photo)} alt="" />
                      <button type="button" onClick={() => removePhoto(index)}>
                        <X size={16} />
                      </button>
                      {index === 0 && (
                        <span>{getText(language, "mainPhoto")}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="sell-photo-tip">
                <Camera size={18} />
                <div>
                  <strong>{getText(language, "photoTips")}</strong>
                  <p>{getText(language, "photoTipsText")}</p>
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="sell-step">
              <div className="sell-step-heading">
                <span>{getText(language, "step")} 4</span>
                <h2>{getText(language, "reviewTitle")}</h2>
                <p>{getText(language, "reviewHelp")}</p>
              </div>

              <div className="sell-review-card">
                <div className="sell-review-title">
                  <span>{category?.icon}</span>
                  <div>
                    <small>{categoryLabel}</small>
                    <h3>{form.title}</h3>
                    <strong>
                      {getOptionLabel(form.tree_type, language)}
                      {form.teak_type && ` · ${getOptionLabel(form.teak_type, language)}`}
                      {form.wood_type_detail &&
                        ` · ${getOptionLabel(form.wood_type_detail, language)}`}
                      {form.firewood_type &&
                        ` · ${getOptionLabel(form.firewood_type, language)}`}
                    </strong>
                  </div>
                </div>

                <div className="sell-review-grid">
                  <ReviewItem label={getText(language, "location")} value={form.location} />
                  <ReviewItem
                    label={getText(language, "quantity")}
                    value={`${form.quantity} ${form.quantity_unit}`}
                  />
                  {form.acreage && (
                    <ReviewItem
                      label={getText(language, "plantationArea")}
                      value={`${form.acreage} Acres`}
                    />
                  )}
                  {form.tree_age && (
                    <ReviewItem label={getText(language, "treeAge")} value={form.tree_age} />
                  )}
                  {form.diameter && (
                    <ReviewItem label={getText(language, "diameter")} value={form.diameter} />
                  )}
                  {form.estimated_volume && (
                    <ReviewItem label={getText(language, "volume")} value={form.estimated_volume} />
                  )}
                  {form.condition && (
                    <ReviewItem label={getText(language, "condition")} value={form.condition} />
                  )}
                  {form.harvest_status && (
                    <ReviewItem label={getText(language, "status")} value={form.harvest_status} />
                  )}
                  <ReviewItem label={getText(language, "expectedPrice")} value={form.price} />
                  <ReviewItem
                    label={getText(language, "listingPhotos")}
                    value={`${photos.length} ${getText(language, "photos").toLowerCase()}`}
                  />
                </div>

                {form.description && (
                  <div className="sell-review-description">
                    <strong>{getText(language, "descriptionLabel")}</strong>
                    <p>{form.description}</p>
                  </div>
                )}
              </div>

              <div className="sell-publish-note">
                <CheckCircle2 size={20} />
                <p>{getText(language, "publishNote")}</p>
              </div>
              <div className="sell-expiry-note">
                <span>⏳</span>
                <div>
                  <strong>15-day listing expiry</strong>
                  <p>Your listing will expire automatically 15 days after it is posted.</p>
                </div>
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="sell-success">
              <div className="sell-success-icon">
                <CheckCircle2 size={52} />
              </div>
              <h2>{getText(language, "successTitle")}</h2>
              <p>{getText(language, "successText")}</p>
              <div className="sell-success-summary">
                <TreePine size={20} />
                <span>{form.title}</span>
              </div>
              <small>{getText(language, "successSmall")}</small>
            </section>
          )}

          {errorMessage && <div className="sell-error">{errorMessage}</div>}
        </div>

        {step < 5 && (
          <footer className="sell-tree-footer">
            <button
              type="button"
              className="sell-back-button"
              onClick={step === 1 ? onClose : previousStep}
              disabled={saving}
            >
              <ArrowLeft size={18} />
              {step === 1 ? getText(language, "cancel") : getText(language, "back")}
            </button>

            {step < 4 ? (
              <button
                type="button"
                className="sell-next-button"
                onClick={nextStep}
                disabled={saving}
              >
                {getText(language, "continue")}
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="sell-publish-button"
                onClick={publishListing}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="sell-button-spinner" />
                    {getText(language, "publishing")}
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    {getText(language, "publish")}
                  </>
                )}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="sell-review-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* ================= SAWMILL DASHBOARD ================= */

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

const SAWMILL_LANGUAGES = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
};

const SAWMILL_TRANSLATIONS = {
  en: {
    Dashboard:"Dashboard","Post a Job":"Post a Job","Job Wall":"Job Wall",
    "Find Workers":"Find Workers","Job Applications":"Job Applications",
    "Timber Listings":"Timber Listings","Patta Teak Suppliers":"Patta Teak Suppliers",
    "Imported Teak Suppliers":"Imported Teak Suppliers",Notifications:"Notifications",
    "Update My Location":"Update My Location","My Profile":"My Profile",Settings:"Settings",
    Logout:"Logout","Active Jobs":"Active Jobs","Worker Profiles":"Worker Profiles",
    Applications:"Applications","Business Location":"Business Location","Sawmill Tools":"Sawmill Tools",
    "Manage jobs and connect with workers.":"Manage jobs and connect with workers.",
    "Nearby Workers":"Nearby Workers","View Profile":"View Profile","View":"View",
    "Post Job":"Post Job","Search jobs, company, location...":"Search jobs, company, location...",
    "Search workers, skills, location...":"Search workers, skills, location...",
    "No jobs posted yet":"No jobs posted yet","No jobs found":"No jobs found",
    "No worker profiles found":"No worker profiles found","Mark all read":"Mark all read",
    "No notifications yet":"No notifications yet","Update GPS":"Update GPS",
    "Verified TimberMart Business":"Verified TimberMart Business",
    "Edit Profile":"Edit Profile","Call":"Call","WhatsApp":"WhatsApp","Chat":"Chat",
    "Delete Job":"Delete Job","Cancel":"Cancel","Next":"Next","Back":"Back",
    "Preview":"Preview","Posting...":"Posting...","Post Your First Job":"Post Your First Job",
    "Applications":"Applications","Review workers":"Review workers",
    "View nearby profiles":"View nearby profiles","View posted jobs":"View posted jobs",
    "Find skilled workers":"Find skilled workers","Jobs posted by your business.":"Jobs posted by your business.",
  },
  te: {
    Dashboard:"డాష్‌బోర్డ్","Post a Job":"ఉద్యోగం పోస్ట్ చేయండి","Job Wall":"ఉద్యోగాల జాబితా",
    "Find Workers":"వర్కర్లను వెతకండి","Job Applications":"ఉద్యోగ దరఖాస్తులు",
    "Timber Listings":"కలప జాబితాలు","Patta Teak Suppliers":"పట్టా టీక్ సరఫరాదారులు",
    "Imported Teak Suppliers":"ఇంపోర్టెడ్ టీక్ సరఫరాదారులు",Notifications:"నోటిఫికేషన్లు",
    "Update My Location":"నా లొకేషన్ అప్‌డేట్ చేయండి","My Profile":"నా ప్రొఫైల్",Settings:"సెట్టింగ్స్",
    Logout:"లాగ్ అవుట్","Active Jobs":"యాక్టివ్ ఉద్యోగాలు","Worker Profiles":"వర్కర్ ప్రొఫైల్స్",
    Applications:"దరఖాస్తులు","Business Location":"వ్యాపార లొకేషన్","Sawmill Tools":"సా మిల్ టూల్స్",
    "Manage jobs and connect with workers.":"ఉద్యోగాలను నిర్వహించి వర్కర్లతో కనెక్ట్ అవ్వండి.",
    "Nearby Workers":"దగ్గరలో ఉన్న వర్కర్లు","View Profile":"ప్రొఫైల్ చూడండి","View":"చూడండి",
    "Post Job":"ఉద్యోగం పోస్ట్ చేయండి","Search jobs, company, location...":"ఉద్యోగం, కంపెనీ, లొకేషన్ వెతకండి...",
    "Search workers, skills, location...":"వర్కర్లు, నైపుణ్యాలు, లొకేషన్ వెతకండి...",
    "No jobs posted yet":"ఇంకా ఉద్యోగాలు పోస్ట్ చేయలేదు","No jobs found":"ఉద్యోగాలు కనిపించలేదు",
    "No worker profiles found":"వర్కర్ ప్రొఫైల్స్ కనిపించలేదు","Mark all read":"అన్నీ చదివినట్లుగా గుర్తించండి",
    "No notifications yet":"ఇంకా నోటిఫికేషన్లు లేవు","Update GPS":"GPS అప్‌డేట్ చేయండి",
    "Verified TimberMart Business":"ధృవీకరించబడిన TimberMart వ్యాపారం",
    "Edit Profile":"ప్రొఫైల్ ఎడిట్ చేయండి","Call":"కాల్","WhatsApp":"వాట్సాప్","Chat":"చాట్",
    "Delete Job":"ఉద్యోగాన్ని తొలగించండి","Cancel":"రద్దు చేయండి","Next":"తదుపరి","Back":"వెనుకకు",
    "Preview":"ప్రివ్యూ","Posting...":"పోస్ట్ చేస్తోంది...","Post Your First Job":"మొదటి ఉద్యోగాన్ని పోస్ట్ చేయండి",
    "Review workers":"వర్కర్లను పరిశీలించండి","View nearby profiles":"దగ్గరలోని ప్రొఫైల్స్ చూడండి",
    "View posted jobs":"పోస్ట్ చేసిన ఉద్యోగాలు చూడండి","Find skilled workers":"నైపుణ్యం ఉన్న వర్కర్లను వెతకండి",
    "Jobs posted by your business.":"మీ వ్యాపారం పోస్ట్ చేసిన ఉద్యోగాలు.",
  },
  hi: {"Dashboard":"डैशबोर्ड","Post a Job":"नौकरी पोस्ट करें","Find Workers":"वर्कर खोजें","Job Wall":"जॉब वॉल","Notifications":"सूचनाएँ","My Profile":"मेरी प्रोफ़ाइल","Settings":"सेटिंग्स","Logout":"लॉगआउट","Timber Listings":"लकड़ी की लिस्टिंग","Job Applications":"नौकरी आवेदन","Update My Location":"मेरा स्थान अपडेट करें","View Profile":"प्रोफ़ाइल देखें","Call":"कॉल","WhatsApp":"व्हाट्सऐप","Chat":"चैट","Cancel":"रद्द करें","Next":"अगला","Back":"पीछे","Preview":"प्रीव्यू","Mark all read":"सभी पढ़ा हुआ करें"},
  ta: {"Dashboard":"டாஷ்போர்டு","Post a Job":"வேலை இடுகையிடவும்","Find Workers":"பணியாளர்களைக் கண்டறியவும்","Job Wall":"வேலை பட்டியல்","Notifications":"அறிவிப்புகள்","My Profile":"என் சுயவிவரம்","Settings":"அமைப்புகள்","Logout":"வெளியேறு","Timber Listings":"மரப் பட்டியல்கள்","Job Applications":"வேலை விண்ணப்பங்கள்","Update My Location":"என் இருப்பிடத்தைப் புதுப்பிக்கவும்","View Profile":"சுயவிவரத்தைப் பார்க்கவும்","Call":"அழைப்பு","WhatsApp":"வாட்ஸ்அப்","Chat":"அரட்டை","Cancel":"ரத்து","Next":"அடுத்து","Back":"பின்செல்","Preview":"முன்னோட்டம்"},
  kn: {"Dashboard":"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್","Post a Job":"ಕೆಲಸ ಪೋಸ್ಟ್ ಮಾಡಿ","Find Workers":"ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ","Job Wall":"ಕೆಲಸದ ಪಟ್ಟಿ","Notifications":"ಅಧಿಸೂಚನೆಗಳು","My Profile":"ನನ್ನ ಪ್ರೊಫೈಲ್","Settings":"ಸೆಟ್ಟಿಂಗ್ಸ್","Logout":"ಲಾಗ್‌ಔಟ್","Timber Listings":"ಮರದ ಪಟ್ಟಿಗಳು","Job Applications":"ಕೆಲಸದ ಅರ್ಜಿಗಳು","Update My Location":"ನನ್ನ ಸ್ಥಳವನ್ನು ನವೀಕರಿಸಿ","View Profile":"ಪ್ರೊಫೈಲ್ ನೋಡಿ","Call":"ಕರೆ","WhatsApp":"ವಾಟ್ಸಾಪ್","Chat":"ಚಾಟ್","Cancel":"ರದ್ದು","Next":"ಮುಂದೆ","Back":"ಹಿಂದೆ","Preview":"ಮುನ್ನೋಟ"},
};


export default function SawmillDashboard() {
  const navigate = useNavigate();

  const [dashboardLanguage, setDashboardLanguage] = useState(
    () => localStorage.getItem("timbermart_sawmill_language") || "en"
  );

  const tx = (text) =>
    SAWMILL_TRANSLATIONS[dashboardLanguage]?.[text] || text;

  function changeDashboardLanguage(value) {
    setDashboardLanguage(value);
    localStorage.setItem("timbermart_sawmill_language", value);
  }

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
  const [showSellTreeForm, setShowSellTreeForm] = useState(false);
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
            tx("Sawmill"),
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
    // Load EVERY timber listing. Do not restrict by the current sawmill's user_id
    // or by seller role; the marketplace is shared across TimberMart.
    let { data: listings, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Timber listings:", error);
      setTimberListings([]);
      return;
    }

    const rows = listings || [];
    const listingIds = rows.map((x) => x.id).filter(Boolean);

    // Load all photos independently so one missing Supabase relationship
    // cannot make the whole gallery empty.
    let imageRows = [];
    if (listingIds.length) {
      const { data: images, error: imageError } = await supabase
        .from("listing_images")
        .select("id,listing_id,image_url,storage_path,sort_order")
        .in("listing_id", listingIds)
        .order("sort_order", { ascending: true });

      if (imageError) {
        console.error("Listing images:", imageError);
      } else {
        imageRows = images || [];
      }
    }

    const imageMap = {};
    imageRows.forEach((image) => {
      if (!imageMap[image.listing_id]) imageMap[image.listing_id] = [];
      if (image.image_url) imageMap[image.listing_id].push(image);
    });

    const sellerIds = [...new Set(rows.map((x) => x.user_id).filter(Boolean))];
    let sellerMap = {};

    if (sellerIds.length) {
      const { data: sellers, error: sellerError } = await supabase
        .from("profiles")
        .select("id,name,phone,role,location,photo_url")
        .in("id", sellerIds);

      if (!sellerError) {
        (sellers || []).forEach((seller) => {
          sellerMap[seller.id] = seller;
        });
      } else {
        console.error("Seller profiles:", sellerError);
      }
    }

    setTimberListings(
      rows.map((item) => ({
        ...item,
        listing_images: imageMap[item.id] || [],
        seller: sellerMap[item.user_id] || null,
      }))
    );
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
    setActiveTab("timber");
    setMobileMenu(false);
    window.setTimeout(() => document.getElementById("sawmill-timber-marketplace")
      ?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function openTimberMarketplace(mode = "") {
    setSupplierMode(mode);
    setActiveTab("timber");
    setMobileMenu(false);
    window.setTimeout(() => document.getElementById("sawmill-timber-marketplace")
      ?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function getListingExpiry(item) {
    if (item?.expires_at) return new Date(item.expires_at);
    if (item?.created_at) {
      const d = new Date(item.created_at);
      d.setDate(d.getDate() + 15);
      return d;
    }
    return null;
  }

  function isListingExpired(item) {
    const d = getListingExpiry(item);
    return !!d && d.getTime() <= Date.now();
  }

  function formatListingDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  function getDaysLeft(item) {
    const d = getListingExpiry(item);
    if (!d) return null;
    return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
  }

  function isPattaTeak(item) {
    const text = [item?.title,item?.wood_type,item?.product_type,item?.description,item?.category]
      .filter(Boolean).join(" ");
    return /(patta\s*teak|patta|indian teak|native teak|farm teak)/i.test(text);
  }

  function isImportedTeak(item) {
    const text = [item?.title,item?.wood_type,item?.product_type,item?.description,item?.category]
      .filter(Boolean).join(" ");
    return /(imported teak|burma teak|burmese teak|myanmar teak|african teak|malaysian teak|indonesian teak|indonesia|imported|foreign teak)/i.test(text);
  }

  const visibleTimberListings = useMemo(() => timberListings.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    const isMine = item.user_id === session?.user?.id;
    if (isListingExpired(item)) return isMine;
    if (!status) return true;
    // Seller can always see their own listing/status.
    // Other users only see admin-approved/live listings.
    return isMine || status === "approved";
  }), [timberListings, session?.user?.id]);

  const filteredSupplierListings = useMemo(() => {
    if (supplierMode === "patta") return visibleTimberListings.filter(isPattaTeak);
    if (supplierMode === "imported") return visibleTimberListings.filter(isImportedTeak);
    return visibleTimberListings;
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
        expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
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
        "✅ Timber listing submitted. It is pending Admin approval. You will receive a notification after Admin review."
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
        (payload) => {
          console.log("Sawmill notification realtime:", payload);
          loadNotifications(session.user.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          loadTimberListings();
          if (String(payload?.new?.status || "").toLowerCase() === "approved") {
            loadNotifications(session.user.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "listings",
          filter: `user_id=eq.${session.user.id}`,
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
    try {
      setMobileMenu(false);
      setNotificationOpen(false);
      setShowChat(false);
      setChatUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login", { replace: true });
      window.setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }, 150);
    }
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
    <div className={`sawmill-app sawmill-lang-${dashboardLanguage}`} lang={dashboardLanguage}>

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
<div className="sawmill-language-wrap">
            <Globe2 size={18} />
            <select
              className="sawmill-language-select"
              value={dashboardLanguage}
              onChange={(e) => changeDashboardLanguage(e.target.value)}
              aria-label="Language"
            >
              {Object.entries(SAWMILL_LANGUAGES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          
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
                tx("Sawmill")}
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
                  tx("Sawmill")}
              </strong>

              <span>
                {profile?.location ||
                  tx("Location not added")}
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
              <Home size={18} />{tx("Dashboard")}</button>


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
              />{tx("Post a Job")}</button>


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
              <Search size={18} />{tx("Job Wall")}</button>


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
              <Users size={18} />{tx("Find Workers")}</button>


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
              <Check size={18} />{tx("Job Applications")}</button>


            <button
              className={activeTab === "timber" && !supplierMode ? "active" : ""}
              onClick={() => openTimberMarketplace("")}
            >
              <Building2 size={18} />{tx("Timber Listings")}<b>{visibleTimberListings.length}</b>
            </button>

            <button
              onClick={() => {
                setShowSellTreeForm(true);
                setMobileMenu(false);
              }}
            >
              <ImagePlus size={18} />Sell Timber
            </button>

            <button
              className={activeTab === "timber" && supplierMode === "patta" ? "active" : ""}
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
              className={activeTab === "timber" && supplierMode === "imported" ? "active" : ""}
              onClick={() => chooseSupplierMode("imported")}
            >
              <Globe2 size={18} />{tx("Imported Teak Suppliers")}<b>
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
              <User size={18} />{tx("My Profile")}</button>


            <button
              onClick={() =>
                navigate(
                  "/settings"
                )
              }
            >
              <Settings
                size={18}
              />{tx("Settings")}</button>

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
            <LogOut size={18} />{tx("Logout")}</button>

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
                  />{tx("Post a Job")}</button>


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
                  <Users size={17} />{tx("Find Workers")}</button>

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
                    tx("Sawmill / Business")}
                </strong>

                <span>{tx("Verified TimberMart Business")}</span>

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

              <small>{tx("Active Jobs")}</small>

            </div>


            <div>

              <span className="sawmill-stat-icon">
                👷
              </span>

              <strong>
                {workers.length}
              </strong>

              <small>{tx("Worker Profiles")}</small>

            </div>


            <div>

              <span className="sawmill-stat-icon">
                📄
              </span>

              <strong>
                {applications.length}
              </strong>

              <small>{tx("Applications")}</small>

            </div>


            <div>

              <span className="sawmill-stat-icon">
                📍
              </span>

              <strong>
                {profile?.location ||
                  "—"}
              </strong>

              <small>{tx("Business Location")}</small>

            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="sawmill-section">

            <div className="sawmill-section-heading">

              <div>

                <h2>{tx("Sawmill Tools")}</h2>

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

                <strong>{tx("Post Job")}</strong>

                <small>{tx("Find skilled workers")}</small>

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

                <strong>{tx("Find Workers")}</strong>

                <small>{tx("View nearby profiles")}</small>

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

                <strong>{tx("Job Wall")}</strong>

                <small>{tx("View posted jobs")}</small>

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

                <strong>{tx("Applications")}</strong>

                <small>{tx("Review workers")}</small>

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

                <p>{tx("Jobs posted by your business.")}</p>

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
                />{tx("Post Job")}</button>

            </div>


            {myJobs.length === 0 ? (

              <div className="sawmill-empty">

                <div>
                  📋
                </div>

                <h3>{tx("No jobs posted yet")}</h3>

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
                >{tx("Post Your First Job")}</button>

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
                          tx("Salary not specified")}
                      </small>

                    </div>


                    <button
                      onClick={() =>
                        openJob(job)
                      }
                    >
                      <Eye size={15} />{tx("View")}</button>

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

                <h2>{tx("Job Wall")}</h2>

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

                <h3>{tx("No jobs found")}</h3>

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
                            tx("Timber Business")}
                        </strong>

                        <span>
                          {job.location ||
                            job.profiles
                              ?.location ||
                            tx("Location not added")}
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
                        tx("No description provided.")}
                    </p>


                    <div className="sawmill-job-info">

                      <span>
                        <Briefcase
                          size={14}
                        />
                        {job.job_type ||
                          tx("Work Type")}
                      </span>

                      <span>
                        <Clock3
                          size={14}
                        />
                        {job.experience ||
                          tx("Experience")}
                      </span>

                      <span>
                        💰
                        {job.salary ||
                          tx("Salary")}
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
                        <Eye size={15} />{tx("View")}</button>

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

                <h2>{tx("Nearby Workers")}</h2>

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

                <h3>{tx("No worker profiles found")}</h3>

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
                              tx("Skilled Worker")}
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
                          tx("Location not added")}

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
                        />{tx("View Profile")}</button>

                    </article>

                  )
                )}

              </div>

            )}

          </section>


          {/* =================================================
              TIMBER MARKETPLACE
          ================================================= */}
          <section className="sawmill-section sawmill-timber-marketplace" id="sawmill-timber-marketplace">
            <div className="sawmill-section-heading sawmill-marketplace-heading">
              <div>
                <span className="sawmill-section-kicker">🪵 TIMBER MARKET</span>
                <h2>{tx("Timber Listings")}</h2>
                <p>All approved timber posts from farmers, merchants, sawmills and other TimberMart sellers.</p>
              </div>
              <div className="sawmill-marketplace-actions">
                <button type="button" className={!supplierMode ? "active" : ""} onClick={() => setSupplierMode("")}>All Timber <b>{visibleTimberListings.length}</b></button>
                <button type="button" className={supplierMode === "patta" ? "active" : ""} onClick={() => setSupplierMode("patta")}>🌿 Patta Teak <b>{visibleTimberListings.filter(isPattaTeak).length}</b></button>
                <button type="button" className={supplierMode === "imported" ? "active" : ""} onClick={() => setSupplierMode("imported")}>🌍 Imported Teak <b>{visibleTimberListings.filter(isImportedTeak).length}</b></button>
                <button type="button" className="primary" onClick={() => setShowSellTreeForm(true)}>
                  <ImagePlus size={16} /> Sell Timber
                </button>
              </div>
            </div>

            <div className="sawmill-marketplace-summary">
              <span>Showing <strong>{filteredSupplierListings.length}</strong> listing{filteredSupplierListings.length === 1 ? "" : "s"}</span>
              <span>⏳ Every listing expires 15 days after posting</span>
            </div>

            {filteredSupplierListings.length === 0 ? (
              <div className="sawmill-empty sawmill-timber-empty">
                <div>🪵</div>
                <h3>{supplierMode === "patta" ? "No Patta Teak listings found" : supplierMode === "imported" ? "No Imported Teak listings found" : "No timber listings found"}</h3>
                <p>Approved timber posts from all sellers will appear here.</p>
                <button type="button" onClick={() => setShowSellTreeForm(true)}>Sell Timber</button>
              </div>
            ) : (
              <div className="sawmill-market-grid sawmill-timber-market-grid">
                {filteredSupplierListings.map((listing) => {
                  const images = getListingImages(listing);
                  const expired = isListingExpired(listing);
                  const daysLeft = getDaysLeft(listing);
                  const expiry = getListingExpiry(listing);
                  const sellerName = listing.seller?.name || listing.seller?.full_name ||
                    (listing.user_id === session?.user?.id ? profile?.name : null) || "TimberMart Seller";
                  const status = String(listing.status || "approved");

                  return (
                    <article className={`sawmill-timber-card ${expired ? "expired" : ""}`} key={listing.id}>
                      <div className="sawmill-timber-card-image">
                        {images[0] ? <img src={images[0]} alt={listing.title || "Timber"} loading="lazy" /> : <div className="sawmill-timber-image-placeholder">🪵</div>}
                        <span className={`sawmill-listing-status ${expired ? "expired" : status}`}>{expired ? "EXPIRED" : status.toUpperCase()}</span>
                        {images.length > 1 && <span className="sawmill-photo-count">📷 {images.length} Photos</span>}
                      </div>
                      <div className="sawmill-timber-card-body">
                        <div className="sawmill-timber-type-row"><span>{listing.wood_type || "Timber"}</span><span>{listing.product_type || "Timber"}</span></div>
                        <h3>{listing.title || "Timber Listing"}</h3>
                        <p className="sawmill-timber-seller">🏢 <strong>{sellerName}</strong>{listing.seller?.role ? ` • ${listing.seller.role}` : ""}</p>
                        <p className="sawmill-timber-location"><MapPin size={14} />{listing.location || listing.seller?.location || "Location not added"}</p>
                        <div className="sawmill-timber-details">
                          <div><small>Quantity</small><strong>{listing.quantity || "On request"}</strong></div>
                          <div><small>Price</small><strong>{listing.price ? `₹ ${listing.price}` : "On contact"}</strong></div>
                        </div>
                        <div className={`sawmill-expiry-box ${expired ? "expired" : ""}`}>
                          <Clock3 size={15} />
                          <div><small>{expired ? "Expired on" : "Expires on"}</small><strong>{formatListingDate(expiry)}</strong></div>
                          {!expired && daysLeft != null && <b>{daysLeft} day{daysLeft === 1 ? "" : "s"} left</b>}
                        </div>
                        <div className="sawmill-timber-card-footer">
                          <small>Posted {formatListingDate(listing.created_at)}</small>
                          <button type="button" onClick={() => openListingGallery(listing)}><Eye size={16} /> {tx("View")}</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
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
                    >{tx("Next")}<ChevronRight
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
                      />{tx("Back")}</button>


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
                    >{tx("Preview")}<ChevronRight
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
                          ? tx("Available")
                          : tx("Not Available")}
                      </strong>
                    </div>


                    <div className="sawmill-preview-row">
                      <span>
                        Food
                      </span>

                      <strong>
                        {jobForm.food
                          ? tx("Available")
                          : tx("Not Available")}
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
                      />{tx("Back")}</button>


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
                      tx("Timber Business")}
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
                        tx("Timber Business")}
                    </strong>

                    <span>
                      {selectedJob.location ||
                        selectedJob
                          .profiles
                          ?.location ||
                        tx("Location not added")}
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
                        ? tx("Available")
                        : tx("Not Available")}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Food
                    </span>

                    <strong>
                      {selectedJob.food
                        ? tx("Available")
                        : tx("Not Available")}
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
                      tx("No description provided.")}
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
                    <Phone size={17} />{tx("Call")}</button>


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
                    />{tx("WhatsApp")}</button>


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
                    />{tx("Chat")}</button>

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
                    />{tx("Delete Job")}</button>

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
                    tx("Skilled Worker")}
                </span>


                <p className="sawmill-profile-location">
                  <MapPin size={15} />
                  {selectedWorker
                    .location ||
                    selectedWorker
                      .profile
                      ?.location ||
                    tx("Location not added")}
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
                    tx("Availability not specified")}

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
                    <Phone size={17} />{tx("Call")}</button>


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
                    />{tx("WhatsApp")}</button>


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
                    />{tx("Chat")}</button>

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
                    tx("Sawmill")}
                </h2>


                <span className="sawmill-profile-role">
                  Sawmill / Business
                </span>


                <p className="sawmill-profile-location">

                  <MapPin size={15} />

                  {profile.location ||
                    tx("Location not added")}

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
                  />{tx("Edit Profile")}</button>

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

                <h2>{tx("Job Applications")}</h2>

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
                              tx("Applied")}
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
                                  tx("Available"),
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
                          />{tx("Call")}</button>


                        <button
                          onClick={() =>
                            openChat(
                              application.worker
                            )
                          }
                        >
                          <MessageCircle
                            size={15}
                          />{tx("Chat")}</button>


                        <select
                          value={
                            application.status ||
                            tx("Applied")
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
          SELL TREE FORM
      ===================================================== */}
      {showSellTreeForm && (
        <SellTreeForm
          user={session?.user}
          profile={profile}
          onClose={() => setShowSellTreeForm(false)}
          onPublished={async () => {
            setShowSellTreeForm(false);
            await loadTimberListings();
            setSupplierMode("");
            setActiveTab("timber");
            window.setTimeout(() => {
              document
                .getElementById("sawmill-timber-marketplace")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          }}
        />
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
                <h2>{tx("Notifications")}</h2>
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
              <button onClick={markAllNotificationsRead}>{tx("Mark all read")}</button>
            </div>

            <div className="sawmill-notification-list">
              {notificationLoading ? (
                <div className="sawmill-notification-empty">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="sawmill-notification-empty">
                  <BellRing size={28} />
                  <strong>{tx("No notifications yet")}</strong>
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
                  {selectedListing.location || tx("Location not added")}
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

            <div className="sawmill-contact-buttons">
              <button
                type="button"
                onClick={() =>
                  callUser(
                    selectedListing.seller?.phone ||
                    (selectedListing.user_id === session?.user?.id
                      ? profile?.phone
                      : null)
                  )
                }
              >
                <Phone size={17} />{tx("Call")}
              </button>

              <button
                type="button"
                onClick={() =>
                  whatsappUser(
                    selectedListing.seller?.phone ||
                    (selectedListing.user_id === session?.user?.id
                      ? profile?.phone
                      : null)
                  )
                }
              >
                <MessageCircle size={17} />{tx("WhatsApp")}
              </button>

              <button
                type="button"
                onClick={() => {
                  const seller =
                    selectedListing.seller ||
                    (selectedListing.user_id === session?.user?.id
                      ? profile
                      : null);
                  openChat(seller);
                }}
              >
                <MessageCircle size={17} />{tx("Chat")}
              </button>
            </div>

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
                <strong>{isListingExpired(selectedListing) ? "Expired" : String(selectedListing.status || "Approved")}</strong>
              </div>
              <div>
                <small>Posted</small>
                <strong>{formatListingDate(selectedListing.created_at)}</strong>
              </div>
              <div>
                <small>Expires</small>
                <strong>{formatListingDate(getListingExpiry(selectedListing))}</strong>
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
                  {selectedRequirement.location || tx("Location not added")}
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
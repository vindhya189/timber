import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ImagePlus,
  MapPin,
  TreePine,
  Upload,
  X,
  Languages,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./SellTreeForm.css";

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
    publishNote: "By publishing, your listing will be visible to TimberMart users. Buyers can contact you through the available contact options.",
    cancel: "Cancel",
    back: "Back",
    continue: "Continue",
    publish: "Publish Listing",
    publishing: "Publishing...",
    successTitle: "Listing Published 🎉",
    successText: "Your timber listing has been successfully published on TimberMart.",
    successSmall: "Buyers can now view your listing and contact you directly.",
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
    publishNote: "ప్రచురించిన తర్వాత మీ లిస్టింగ్ TimberMart వినియోగదారులకు కనిపిస్తుంది.",
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
    publishNote: "प्रकाशित करने के बाद आपकी लिस्टिंग TimberMart उपयोगकर्ताओं को दिखाई देगी।",
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

export default function SellTreeForm({ user, profile, onClose, onPublished }) {
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

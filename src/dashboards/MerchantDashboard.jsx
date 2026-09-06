import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Send,
  ExternalLink,
  RefreshCw,
  Package,
  ShieldCheck,
  Plus,
  Trash2,
  BriefcaseBusiness,
  Users,
  ImagePlus,
  ClipboardList,
  CheckCircle2,
  LocateFixed,
  Image as ImageIcon,
  MapPinned,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./MerchantDashboard.css";
import TreeLoader from "../components/TreeLoader";

const CATEGORIES = [
  "All",
  "Trees",
  "Logs",
  "Timber",
  "Planks",
  "Plywood",
  "Beams",
  "Battens",
  "Veneer",
  "Doors",
  "Frames",
  "Furniture",
  "Interior",
  "Carpenter Services",
];



const DASHBOARD_LANGUAGES = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
};

const DASHBOARD_TRANSLATIONS = {
  en: {
    "Buy / Timber":"Buy / Timber", "Sell Timber":"Sell Timber", "Requirement Wall":"Requirement Wall", "Jobs":"Jobs", "Post Job":"Post Job", "Find Workers":"Find Workers", "Patta Teak Suppliers":"Patta Teak Suppliers", "Imported Teak Suppliers":"Imported Teak Suppliers", "Update My Location":"Update My Location", "Updating Location...":"Updating Location...", "My Profile":"My Profile", "Settings":"Settings", "Logout":"Logout", "Direct Contact":"Direct Contact", "We Connect. You Deal Directly.":"We Connect. You Deal Directly.", "Timber Merchant":"Timber Merchant", "Buy. Sell.":"Buy. Sell.", "Connect Directly.":"Connect Directly.", "Timber Marketplace":"Timber Marketplace", "Find trees and timber, sell your products, post requirements and connect with workers.":"Find trees and timber, sell your products, post requirements and connect with workers.", "Add your location":"Add your location", "Update GPS":"Update GPS", "Updating...":"Updating...", "My Listings":"My Listings", "Requirements":"Requirements", "Workers":"Workers", "QUICK ACTIONS":"QUICK ACTIONS", "What do you want to do?":"What do you want to do?", "Add timber listing & photos":"Add timber listing & photos", "Post Requirement":"Post Requirement", "Find timber you need":"Find timber you need", "Post a Job":"Post a Job", "Connect with workers":"Connect with workers", "Search nearby workers":"Search nearby workers", "BUY":"BUY", "Find Trees & Timber":"Find Trees & Timber", "Wood Type":"Wood Type", "Location":"Location", "Max Price":"Max Price", "Search trees, timber, logs...":"Search trees, timber, logs...", "No photo":"No photo", "photos":"photos", "VERIFIED CATEGORY HUB":"VERIFIED CATEGORY HUB", "Real merchant and seller listings tagged for Patta / Indian Teak.":"Real merchant and seller listings tagged for Patta / Indian Teak.", "No Patta Teak supplier listings yet.":"No Patta Teak supplier listings yet.", "TRADE CATEGORY HUB":"TRADE CATEGORY HUB", "Actual marketplace listings tagged for Imported / Burma / African / Malaysian teak.":"Actual marketplace listings tagged for Imported / Burma / African / Malaysian teak.", "No imported teak supplier listings yet.":"No imported teak supplier listings yet.", "SELL":"SELL", "REQUIREMENT WALL":"REQUIREMENT WALL", "JOBS":"JOBS", "FIND WORKERS":"FIND WORKERS", "Search workers by name or location...":"Search workers by name or location...", "LIVE UPDATES":"LIVE UPDATES", "Notifications":"Notifications", "Mark all read":"Mark all read", "No notifications yet":"No notifications yet", "Admin approvals, nearby activity and marketplace updates will appear here.":"Admin approvals, nearby activity and marketplace updates will appear here.", "ADMIN":"ADMIN", "Teak • Old Wood • Fire Wood • Timber Products":"Teak • Old Wood • Fire Wood • Timber Products", "Add Timber Listing":"Add Timber Listing", "Listing Title":"Listing Title", "Product Type":"Product Type", "Quantity":"Quantity", "Price":"Price", "Price Type":"Price Type", "Description":"Description", "Add Photos":"Add Photos", "Up to 10 photos":"Up to 10 photos", "Submit Listing":"Submit Listing", "Submitting...":"Submitting...", "Close":"Close", "Remove photo":"Remove photo", "Language":"Language", "Dashboard Language":"Dashboard Language", "All listing photos":"All listing photos"
  },
  te: {
    "Buy / Timber":"కొనుగోలు / కలప", "Sell Timber":"కలప అమ్మకం", "Requirement Wall":"అవసరాల గోడ", "Jobs":"ఉద్యోగాలు", "Post Job":"ఉద్యోగం పోస్ట్ చేయండి", "Find Workers":"కార్మికులను కనుగొనండి", "Patta Teak Suppliers":"పట్టా టేకు సరఫరాదారులు", "Imported Teak Suppliers":"దిగుమతి టేకు సరఫరాదారులు", "Update My Location":"నా లొకేషన్ అప్డేట్ చేయండి", "Updating Location...":"లొకేషన్ అప్డేట్ అవుతోంది...", "My Profile":"నా ప్రొఫైల్", "Settings":"సెట్టింగ్స్", "Logout":"లాగ్ అవుట్", "Direct Contact":"నేరుగా సంప్రదించండి", "We Connect. You Deal Directly.":"మేము కలుపుతాం. మీరు నేరుగా డీల్ చేయండి.", "Timber Merchant":"కలప వ్యాపారి", "Buy. Sell.":"కొనండి. అమ్మండి.", "Connect Directly.":"నేరుగా కనెక్ట్ అవ్వండి.", "Timber Marketplace":"కలప మార్కెట్‌ప్లేస్", "Find trees and timber, sell your products, post requirements and connect with workers.":"చెట్లు మరియు కలపను కనుగొని, మీ ఉత్పత్తులను అమ్మి, అవసరాలు పోస్ట్ చేసి కార్మికులతో కనెక్ట్ అవ్వండి.", "Add your location":"మీ లొకేషన్ జోడించండి", "Update GPS":"GPS అప్డేట్", "Updating...":"అప్డేట్ అవుతోంది...", "My Listings":"నా లిస్టింగ్స్", "Requirements":"అవసరాలు", "Workers":"కార్మికులు", "QUICK ACTIONS":"త్వరిత చర్యలు", "What do you want to do?":"మీరు ఏమి చేయాలనుకుంటున్నారు?", "Add timber listing & photos":"కలప లిస్టింగ్ మరియు ఫోటోలు జోడించండి", "Post Requirement":"అవసరం పోస్ట్ చేయండి", "Find timber you need":"మీకు కావాల్సిన కలపను కనుగొనండి", "Post a Job":"ఉద్యోగం పోస్ట్ చేయండి", "Connect with workers":"కార్మికులతో కనెక్ట్ అవ్వండి", "Search nearby workers":"దగ్గరలోని కార్మికులను వెతకండి", "BUY":"కొనుగోలు", "Find Trees & Timber":"చెట్లు & కలపను కనుగొనండి", "Wood Type":"చెక్క రకం", "Location":"ప్రాంతం", "Max Price":"గరిష్ఠ ధర", "Search trees, timber, logs...":"చెట్లు, కలప, దుంగలు వెతకండి...", "No photo":"ఫోటో లేదు", "photos":"ఫోటోలు", "VERIFIED CATEGORY HUB":"ధృవీకరించిన కేటగిరీ హబ్", "Real merchant and seller listings tagged for Patta / Indian Teak.":"పట్టా / ఇండియన్ టేక్‌గా గుర్తించిన నిజమైన వ్యాపారి లిస్టింగ్స్.", "No Patta Teak supplier listings yet.":"ఇంకా పట్టా టేకు సరఫరాదారుల లిస్టింగ్స్ లేవు.", "TRADE CATEGORY HUB":"ట్రేడ్ కేటగిరీ హబ్", "Actual marketplace listings tagged for Imported / Burma / African / Malaysian teak.":"ఇంపోర్టెడ్ / బర్మా / ఆఫ్రికన్ / మలేషియన్ టేక్‌గా గుర్తించిన మార్కెట్ లిస్టింగ్స్.", "No imported teak supplier listings yet.":"ఇంకా దిగుమతి టేకు సరఫరాదారుల లిస్టింగ్స్ లేవు.", "SELL":"అమ్మకం", "REQUIREMENT WALL":"అవసరాల గోడ", "JOBS":"ఉద్యోగాలు", "FIND WORKERS":"కార్మికులను కనుగొనండి", "Search workers by name or location...":"పేరు లేదా ప్రాంతంతో కార్మికులను వెతకండి...", "LIVE UPDATES":"లైవ్ అప్డేట్స్", "Notifications":"నోటిఫికేషన్స్", "Mark all read":"అన్నీ చదివినట్లుగా గుర్తించండి", "No notifications yet":"ఇంకా నోటిఫికేషన్స్ లేవు", "Admin approvals, nearby activity and marketplace updates will appear here.":"అడ్మిన్ ఆమోదాలు, సమీప కార్యకలాపాలు మరియు మార్కెట్ అప్డేట్స్ ఇక్కడ కనిపిస్తాయి.", "ADMIN":"అడ్మిన్", "Teak • Old Wood • Fire Wood • Timber Products":"టేకు • పాత చెక్క • కట్టెలు • కలప ఉత్పత్తులు", "Add Timber Listing":"కలప లిస్టింగ్ జోడించండి", "Listing Title":"లిస్టింగ్ పేరు", "Product Type":"ఉత్పత్తి రకం", "Quantity":"పరిమాణం", "Price":"ధర", "Price Type":"ధర రకం", "Description":"వివరణ", "Add Photos":"ఫోటోలు జోడించండి", "Up to 10 photos":"10 ఫోటోల వరకు", "Submit Listing":"లిస్టింగ్ పంపండి", "Submitting...":"పంపుతోంది...", "Close":"మూసివేయండి", "Remove photo":"ఫోటో తొలగించండి", "Language":"భాష", "Dashboard Language":"డాష్‌బోర్డ్ భాష", "All listing photos":"అన్ని లిస్టింగ్ ఫోటోలు"
  },
  hi: {
    "Buy / Timber":"खरीद / लकड़ी", "Sell Timber":"लकड़ी बेचें", "Requirement Wall":"आवश्यकता वॉल", "Jobs":"नौकरियां", "Post Job":"नौकरी पोस्ट करें", "Find Workers":"कामगार खोजें", "Patta Teak Suppliers":"पट्टा सागौन सप्लायर", "Imported Teak Suppliers":"आयातित सागौन सप्लायर", "Update My Location":"मेरा स्थान अपडेट करें", "Updating Location...":"स्थान अपडेट हो रहा है...", "My Profile":"मेरी प्रोफ़ाइल", "Settings":"सेटिंग्स", "Logout":"लॉगआउट", "Direct Contact":"सीधा संपर्क", "We Connect. You Deal Directly.":"हम जोड़ते हैं। आप सीधे सौदा करें।", "Timber Merchant":"लकड़ी व्यापारी", "Buy. Sell.":"खरीदें। बेचें।", "Connect Directly.":"सीधे जुड़ें।", "Timber Marketplace":"लकड़ी मार्केटप्लेस", "Find trees and timber, sell your products, post requirements and connect with workers.":"पेड़ और लकड़ी खोजें, अपने उत्पाद बेचें, आवश्यकताएं पोस्ट करें और कामगारों से जुड़ें।", "Add your location":"अपना स्थान जोड़ें", "Update GPS":"GPS अपडेट", "Updating...":"अपडेट हो रहा है...", "My Listings":"मेरी लिस्टिंग", "Requirements":"आवश्यकताएं", "Workers":"कामगार", "QUICK ACTIONS":"त्वरित कार्य", "What do you want to do?":"आप क्या करना चाहते हैं?", "Add timber listing & photos":"लकड़ी की लिस्टिंग और फोटो जोड़ें", "Post Requirement":"आवश्यकता पोस्ट करें", "Find timber you need":"अपनी जरूरत की लकड़ी खोजें", "Post a Job":"नौकरी पोस्ट करें", "Connect with workers":"कामगारों से जुड़ें", "Search nearby workers":"पास के कामगार खोजें", "BUY":"खरीदें", "Find Trees & Timber":"पेड़ और लकड़ी खोजें", "Wood Type":"लकड़ी का प्रकार", "Location":"स्थान", "Max Price":"अधिकतम कीमत", "Search trees, timber, logs...":"पेड़, लकड़ी, लट्ठे खोजें...", "No photo":"फोटो नहीं", "photos":"फोटो", "VERIFIED CATEGORY HUB":"सत्यापित श्रेणी हब", "Real merchant and seller listings tagged for Patta / Indian Teak.":"पट्टा / भारतीय सागौन टैग वाली वास्तविक व्यापारी लिस्टिंग।", "No Patta Teak supplier listings yet.":"अभी कोई पट्टा सागौन सप्लायर लिस्टिंग नहीं है।", "TRADE CATEGORY HUB":"ट्रेड श्रेणी हब", "Actual marketplace listings tagged for Imported / Burma / African / Malaysian teak.":"आयातित / बर्मा / अफ्रीकी / मलेशियन सागौन टैग वाली मार्केट लिस्टिंग।", "No imported teak supplier listings yet.":"अभी कोई आयातित सागौन सप्लायर लिस्टिंग नहीं है।", "SELL":"बेचें", "REQUIREMENT WALL":"आवश्यकता वॉल", "JOBS":"नौकरियां", "FIND WORKERS":"कामगार खोजें", "Search workers by name or location...":"नाम या स्थान से कामगार खोजें...", "LIVE UPDATES":"लाइव अपडेट", "Notifications":"सूचनाएं", "Mark all read":"सभी पढ़े हुए करें", "No notifications yet":"अभी कोई सूचना नहीं", "Admin approvals, nearby activity and marketplace updates will appear here.":"एडमिन स्वीकृति, आसपास की गतिविधियां और मार्केट अपडेट यहां दिखाई देंगे।", "ADMIN":"एडमिन", "Teak • Old Wood • Fire Wood • Timber Products":"सागौन • पुरानी लकड़ी • जलाऊ लकड़ी • लकड़ी उत्पाद", "Add Timber Listing":"लकड़ी की लिस्टिंग जोड़ें", "Listing Title":"लिस्टिंग शीर्षक", "Product Type":"उत्पाद प्रकार", "Quantity":"मात्रा", "Price":"कीमत", "Price Type":"कीमत प्रकार", "Description":"विवरण", "Add Photos":"फोटो जोड़ें", "Up to 10 photos":"10 फोटो तक", "Submit Listing":"लिस्टिंग भेजें", "Submitting...":"भेजा जा रहा है...", "Close":"बंद करें", "Remove photo":"फोटो हटाएं", "Language":"भाषा", "Dashboard Language":"डैशबोर्ड भाषा", "All listing photos":"सभी लिस्टिंग फोटो"
  },
  ta: {
    "Buy / Timber":"வாங்க / மரம்", "Sell Timber":"மரம் விற்பனை", "Requirement Wall":"தேவை சுவர்", "Jobs":"வேலைகள்", "Post Job":"வேலை இடுகையிடவும்", "Find Workers":"தொழிலாளர்களைக் கண்டறியவும்", "Patta Teak Suppliers":"பட்டா தேக்கு விற்பனையாளர்கள்", "Imported Teak Suppliers":"இறக்குமதி தேக்கு விற்பனையாளர்கள்", "Update My Location":"என் இருப்பிடத்தை புதுப்பிக்கவும்", "Updating Location...":"இருப்பிடம் புதுப்பிக்கப்படுகிறது...", "My Profile":"என் சுயவிவரம்", "Settings":"அமைப்புகள்", "Logout":"வெளியேறு", "Direct Contact":"நேரடி தொடர்பு", "We Connect. You Deal Directly.":"நாங்கள் இணைக்கிறோம். நீங்கள் நேரடியாக ஒப்பந்தம் செய்யுங்கள்.", "Timber Merchant":"மர வியாபாரி", "Buy. Sell.":"வாங்குங்கள். விற்குங்கள்.", "Connect Directly.":"நேரடியாக இணைக.", "Timber Marketplace":"மர சந்தை", "Find trees and timber, sell your products, post requirements and connect with workers.":"மரங்களையும் மரப்பொருட்களையும் கண்டுபிடித்து, பொருட்களை விற்று, தேவைகளை பதிவு செய்து தொழிலாளர்களுடன் இணையுங்கள்.", "Add your location":"உங்கள் இருப்பிடத்தைச் சேர்க்கவும்", "Update GPS":"GPS புதுப்பிக்கவும்", "Updating...":"புதுப்பிக்கப்படுகிறது...", "My Listings":"என் பட்டியல்கள்", "Requirements":"தேவைகள்", "Workers":"தொழிலாளர்கள்", "QUICK ACTIONS":"விரைவு செயல்கள்", "What do you want to do?":"நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?", "Add timber listing & photos":"மர பட்டியல் மற்றும் புகைப்படங்களைச் சேர்க்கவும்", "Post Requirement":"தேவையை பதிவு செய்யவும்", "Find timber you need":"தேவையான மரத்தை கண்டுபிடிக்கவும்", "Post a Job":"வேலை பதிவு செய்யவும்", "Connect with workers":"தொழிலாளர்களுடன் இணைக்கவும்", "Search nearby workers":"அருகிலுள்ள தொழிலாளர்களைத் தேடவும்", "BUY":"வாங்க", "Find Trees & Timber":"மரங்கள் & மரப்பொருட்களை கண்டுபிடிக்கவும்", "Wood Type":"மர வகை", "Location":"இடம்", "Max Price":"அதிகபட்ச விலை", "Search trees, timber, logs...":"மரங்கள், மரப்பொருட்கள், மரக்கட்டைகள் தேடவும்...", "No photo":"புகைப்படம் இல்லை", "photos":"புகைப்படங்கள்", "VERIFIED CATEGORY HUB":"சரிபார்க்கப்பட்ட வகை மையம்", "Real merchant and seller listings tagged for Patta / Indian Teak.":"பட்டா / இந்திய தேக்கு என குறிக்கப்பட்ட உண்மையான விற்பனையாளர் பட்டியல்கள்.", "No Patta Teak supplier listings yet.":"இன்னும் பட்டா தேக்கு விற்பனையாளர் பட்டியல்கள் இல்லை.", "TRADE CATEGORY HUB":"வர்த்தக வகை மையம்", "Actual marketplace listings tagged for Imported / Burma / African / Malaysian teak.":"இறக்குமதி / பர்மா / ஆப்பிரிக்க / மலேசிய தேக்கு என குறிக்கப்பட்ட சந்தை பட்டியல்கள்.", "No imported teak supplier listings yet.":"இன்னும் இறக்குமதி தேக்கு விற்பனையாளர் பட்டியல்கள் இல்லை.", "SELL":"விற்க", "REQUIREMENT WALL":"தேவை சுவர்", "JOBS":"வேலைகள்", "FIND WORKERS":"தொழிலாளர்களைக் கண்டறியவும்", "Search workers by name or location...":"பெயர் அல்லது இடத்தால் தொழிலாளர்களைத் தேடவும்...", "LIVE UPDATES":"நேரடி புதுப்பிப்புகள்", "Notifications":"அறிவிப்புகள்", "Mark all read":"அனைத்தையும் படித்ததாகக் குறிக்கவும்", "No notifications yet":"அறிவிப்புகள் இல்லை", "Admin approvals, nearby activity and marketplace updates will appear here.":"நிர்வாக அனுமதிகள், அருகிலுள்ள செயல்பாடுகள் மற்றும் சந்தை புதுப்பிப்புகள் இங்கே தோன்றும்.", "ADMIN":"நிர்வாகி", "Teak • Old Wood • Fire Wood • Timber Products":"தேக்கு • பழைய மரம் • விறகு • மரப் பொருட்கள்", "Add Timber Listing":"மர பட்டியலைச் சேர்க்கவும்", "Listing Title":"பட்டியல் தலைப்பு", "Product Type":"பொருள் வகை", "Quantity":"அளவு", "Price":"விலை", "Price Type":"விலை வகை", "Description":"விளக்கம்", "Add Photos":"புகைப்படங்களைச் சேர்க்கவும்", "Up to 10 photos":"10 புகைப்படங்கள் வரை", "Submit Listing":"பட்டியலை அனுப்பவும்", "Submitting...":"அனுப்பப்படுகிறது...", "Close":"மூடு", "Remove photo":"புகைப்படத்தை அகற்றவும்", "Language":"மொழி", "Dashboard Language":"டாஷ்போர்டு மொழி", "All listing photos":"அனைத்து பட்டியல் புகைப்படங்கள்"
  },
  kn: {
    "Buy / Timber":"ಖರೀದಿ / ಮರ", "Sell Timber":"ಮರ ಮಾರಾಟ", "Requirement Wall":"ಅವಶ್ಯಕತೆ ಗೋಡೆ", "Jobs":"ಉದ್ಯೋಗಗಳು", "Post Job":"ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ", "Find Workers":"ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ", "Patta Teak Suppliers":"ಪಟ್ಟಾ ತೇಗು ಪೂರೈಕೆದಾರರು", "Imported Teak Suppliers":"ಆಮದು ತೇಗು ಪೂರೈಕೆದಾರರು", "Update My Location":"ನನ್ನ ಸ್ಥಳವನ್ನು ನವೀಕರಿಸಿ", "Updating Location...":"ಸ್ಥಳ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...", "My Profile":"ನನ್ನ ಪ್ರೊಫೈಲ್", "Settings":"ಸೆಟ್ಟಿಂಗ್ಸ್", "Logout":"ಲಾಗ್ ಔಟ್", "Direct Contact":"ನೇರ ಸಂಪರ್ಕ", "We Connect. You Deal Directly.":"ನಾವು ಸಂಪರ್ಕಿಸುತ್ತೇವೆ. ನೀವು ನೇರವಾಗಿ ವ್ಯವಹರಿಸಿ.", "Timber Merchant":"ಮರ ವ್ಯಾಪಾರಿ", "Buy. Sell.":"ಖರೀದಿಸಿ. ಮಾರಾಟ ಮಾಡಿ.", "Connect Directly.":"ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.", "Timber Marketplace":"ಮರ ಮಾರುಕಟ್ಟೆ", "Find trees and timber, sell your products, post requirements and connect with workers.":"ಮರಗಳು ಮತ್ತು ಮರದ ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ, ಉತ್ಪನ್ನಗಳನ್ನು ಮಾರಾಟ ಮಾಡಿ, ಅವಶ್ಯಕತೆಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ ಮತ್ತು ಕಾರ್ಮಿಕರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ.", "Add your location":"ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಸೇರಿಸಿ", "Update GPS":"GPS ನವೀಕರಿಸಿ", "Updating...":"ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...", "My Listings":"ನನ್ನ ಪಟ್ಟಿಗಳು", "Requirements":"ಅವಶ್ಯಕತೆಗಳು", "Workers":"ಕಾರ್ಮಿಕರು", "QUICK ACTIONS":"ತ್ವರಿತ ಕಾರ್ಯಗಳು", "What do you want to do?":"ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?", "Add timber listing & photos":"ಮರದ ಪಟ್ಟಿ ಮತ್ತು ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ", "Post Requirement":"ಅವಶ್ಯಕತೆ ಪೋಸ್ಟ್ ಮಾಡಿ", "Find timber you need":"ನಿಮಗೆ ಬೇಕಾದ ಮರವನ್ನು ಹುಡುಕಿ", "Post a Job":"ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ", "Connect with workers":"ಕಾರ್ಮಿಕರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ", "Search nearby workers":"ಹತ್ತಿರದ ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ", "BUY":"ಖರೀದಿ", "Find Trees & Timber":"ಮರಗಳು ಮತ್ತು ಮರದ ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ", "Wood Type":"ಮರದ ವಿಧ", "Location":"ಸ್ಥಳ", "Max Price":"ಗರಿಷ್ಠ ಬೆಲೆ", "Search trees, timber, logs...":"ಮರಗಳು, ಮರದ ವಸ್ತುಗಳು, ದಿಮ್ಮಿಗಳನ್ನು ಹುಡುಕಿ...", "No photo":"ಫೋಟೋ ಇಲ್ಲ", "photos":"ಫೋಟೋಗಳು", "VERIFIED CATEGORY HUB":"ಪರಿಶೀಲಿತ ವರ್ಗ ಕೇಂದ್ರ", "Real merchant and seller listings tagged for Patta / Indian Teak.":"ಪಟ್ಟಾ / ಭಾರತೀಯ ತೇಗು ಎಂದು ಗುರುತಿಸಲಾದ ನಿಜವಾದ ವ್ಯಾಪಾರಿ ಪಟ್ಟಿಗಳು.", "No Patta Teak supplier listings yet.":"ಇನ್ನೂ ಪಟ್ಟಾ ತೇಗು ಪೂರೈಕೆದಾರರ ಪಟ್ಟಿಗಳಿಲ್ಲ.", "TRADE CATEGORY HUB":"ವ್ಯಾಪಾರ ವರ್ಗ ಕೇಂದ್ರ", "Actual marketplace listings tagged for Imported / Burma / African / Malaysian teak.":"ಆಮದು / ಬರ್ಮಾ / ಆಫ್ರಿಕನ್ / ಮಲೇಶಿಯನ್ ತೇಗು ಎಂದು ಗುರುತಿಸಲಾದ ಮಾರುಕಟ್ಟೆ ಪಟ್ಟಿಗಳು.", "No imported teak supplier listings yet.":"ಇನ್ನೂ ಆಮದು ತೇಗು ಪೂರೈಕೆದಾರರ ಪಟ್ಟಿಗಳಿಲ್ಲ.", "SELL":"ಮಾರಾಟ", "REQUIREMENT WALL":"ಅವಶ್ಯಕತೆ ಗೋಡೆ", "JOBS":"ಉದ್ಯೋಗಗಳು", "FIND WORKERS":"ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ", "Search workers by name or location...":"ಹೆಸರು ಅಥವಾ ಸ್ಥಳದಿಂದ ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ...", "LIVE UPDATES":"ಲೈವ್ ಅಪ್‌ಡೇಟ್‌ಗಳು", "Notifications":"ಅಧಿಸೂಚನೆಗಳು", "Mark all read":"ಎಲ್ಲವನ್ನೂ ಓದಿದಂತೆ ಗುರುತಿಸಿ", "No notifications yet":"ಇನ್ನೂ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ", "Admin approvals, nearby activity and marketplace updates will appear here.":"ನಿರ್ವಾಹಕ ಅನುಮೋದನೆಗಳು, ಹತ್ತಿರದ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಅಪ್‌ಡೇಟ್‌ಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.", "ADMIN":"ನಿರ್ವಾಹಕ", "Teak • Old Wood • Fire Wood • Timber Products":"ತೇಗು • ಹಳೆಯ ಮರ • ಉರುವಲು • ಮರದ ಉತ್ಪನ್ನಗಳು", "Add Timber Listing":"ಮರದ ಪಟ್ಟಿಯನ್ನು ಸೇರಿಸಿ", "Listing Title":"ಪಟ್ಟಿ ಶೀರ್ಷಿಕೆ", "Product Type":"ಉತ್ಪನ್ನದ ಪ್ರಕಾರ", "Quantity":"ಪ್ರಮಾಣ", "Price":"ಬೆಲೆ", "Price Type":"ಬೆಲೆ ಪ್ರಕಾರ", "Description":"ವಿವರಣೆ", "Add Photos":"ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ", "Up to 10 photos":"10 ಫೋಟೋಗಳವರೆಗೆ", "Submit Listing":"ಪಟ್ಟಿ ಕಳುಹಿಸಿ", "Submitting...":"ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...", "Close":"ಮುಚ್ಚಿ", "Remove photo":"ಫೋಟೋ ತೆಗೆದುಹಾಕಿ", "Language":"ಭಾಷೆ", "Dashboard Language":"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಭಾಷೆ", "All listing photos":"ಎಲ್ಲಾ ಪಟ್ಟಿ ಫೋಟೋಗಳು"
  }
};


const UI_TRANSLATIONS = {
  te: {"Buy • Sell • Connect":"కొనండి • అమ్మండి • కనెక్ట్ అవ్వండి","Filter":"ఫిల్టర్","Clear":"క్లియర్","No listings found":"లిస్టింగ్స్ ఏవీ లభించలేదు","No sellers have posted matching products yet.":"సరిపోలే ఉత్పత్తులను ఇంకా ఎవరూ పోస్ట్ చేయలేదు.","View Details":"వివరాలు చూడండి","My Timber Listings":"నా కలప లిస్టింగ్స్","Add Listing":"లిస్టింగ్ జోడించండి","You have no listings yet.":"మీకు ఇంకా లిస్టింగ్స్ లేవు.","Customer Requirements":"కస్టమర్ అవసరాలు","No requirements yet":"ఇంకా అవసరాలు లేవు","User-posted requirements will appear here.":"యూజర్లు పోస్ట్ చేసిన అవసరాలు ఇక్కడ కనిపిస్తాయి.","View Requirement":"అవసరాన్ని చూడండి","Find / Post Workers":"కార్మికులను కనుగొనండి / పోస్ట్ చేయండి","No jobs posted":"ఇంకా ఉద్యోగాలు పోస్ట్ చేయలేదు","Post a job to connect with workers.":"కార్మికులతో కనెక్ట్ అవ్వడానికి ఉద్యోగం పోస్ట్ చేయండి.","Nearby / Available Workers":"సమీప / అందుబాటులో ఉన్న కార్మికులు","No worker profiles yet":"ఇంకా కార్మికుల ప్రొఫైల్స్ లేవు","Workers who create profiles will appear here.":"ప్రొఫైల్ సృష్టించిన కార్మికులు ఇక్కడ కనిపిస్తారు.","Worker":"కార్మికుడు","View Profile":"ప్రొఫైల్ చూడండి","TimberMart only connects users.":"TimberMart వినియోగదారులను మాత్రమే కనెక్ట్ చేస్తుంది.","No Payments":"చెల్లింపులు లేవు","No Commission":"కమీషన్ లేదు","Nearby Connect":"సమీప కనెక్షన్","Post Your Requirement":"మీ అవసరాన్ని పోస్ట్ చేయండి","Requirement Title *":"అవసరం పేరు *","Category":"కేటగిరీ","Timber":"కలప","Trees":"చెట్లు","Logs":"దుంగలు","Doors":"తలుపులు","Furniture":"ఫర్నిచర్","Other":"ఇతర","Budget":"బడ్జెట్","JOBS":"ఉద్యోగాలు","Job Title *":"ఉద్యోగం పేరు *","Job Category":"ఉద్యోగ కేటగిరీ","Job Type":"ఉద్యోగ రకం","Full Time":"పూర్తి సమయం","Part Time":"పార్ట్ టైమ్","Project Based":"ప్రాజెక్ట్ ఆధారితం","Experience":"అనుభవం","Salary":"జీతం","Number of Positions":"పదవుల సంఖ్య","Accommodation Available":"వసతి అందుబాటులో ఉంది","Food Available":"భోజనం అందుబాటులో ఉంది","Job Description":"ఉద్యోగ వివరణ","Product Information":"ఉత్పత్తి సమాచారం","Product Type":"ఉత్పత్తి రకం","Posted":"పోస్ట్ చేసిన తేదీ","Seller":"విక్రేత","View Seller Profile":"విక్రేత ప్రొఫైల్ చూడండి","Call":"కాల్","Chat":"చాట్","WhatsApp":"వాట్సాప్","Required Quantity":"అవసరమైన పరిమాణం","Delete Requirement":"అవసరాన్ని తొలగించండి","About":"గురించి","Start a conversation":"సంభాషణ ప్రారంభించండి","Ask about timber, requirements, jobs or work details.":"కలప, అవసరాలు, ఉద్యోగాలు లేదా పని వివరాల గురించి అడగండి."},
  hi: {"Buy • Sell • Connect":"खरीदें • बेचें • जुड़ें","Filter":"फ़िल्टर","Clear":"साफ़ करें","No listings found":"कोई लिस्टिंग नहीं मिली","No sellers have posted matching products yet.":"अभी तक किसी विक्रेता ने मेल खाने वाले उत्पाद पोस्ट नहीं किए हैं।","View Details":"विवरण देखें","My Timber Listings":"मेरी लकड़ी की लिस्टिंग","Add Listing":"लिस्टिंग जोड़ें","You have no listings yet.":"आपकी अभी कोई लिस्टिंग नहीं है।","Customer Requirements":"ग्राहक आवश्यकताएं","No requirements yet":"अभी कोई आवश्यकता नहीं","User-posted requirements will appear here.":"उपयोगकर्ताओं द्वारा पोस्ट की गई आवश्यकताएं यहां दिखाई देंगी।","View Requirement":"आवश्यकता देखें","Find / Post Workers":"कामगार खोजें / पोस्ट करें","No jobs posted":"अभी कोई नौकरी पोस्ट नहीं","Post a job to connect with workers.":"कामगारों से जुड़ने के लिए नौकरी पोस्ट करें।","Nearby / Available Workers":"पास के / उपलब्ध कामगार","No worker profiles yet":"अभी कोई कामगार प्रोफ़ाइल नहीं","Workers who create profiles will appear here.":"प्रोफ़ाइल बनाने वाले कामगार यहां दिखाई देंगे।","Worker":"कामगार","View Profile":"प्रोफ़ाइल देखें","TimberMart only connects users.":"TimberMart केवल उपयोगकर्ताओं को जोड़ता है।","No Payments":"कोई भुगतान नहीं","No Commission":"कोई कमीशन नहीं","Nearby Connect":"पास में कनेक्ट करें","Post Your Requirement":"अपनी आवश्यकता पोस्ट करें","Requirement Title *":"आवश्यकता शीर्षक *","Category":"श्रेणी","Timber":"लकड़ी","Trees":"पेड़","Logs":"लट्ठे","Doors":"दरवाज़े","Furniture":"फर्नीचर","Other":"अन्य","Budget":"बजट","JOBS":"नौकरियां","Job Title *":"नौकरी शीर्षक *","Job Category":"नौकरी श्रेणी","Job Type":"नौकरी प्रकार","Full Time":"पूर्णकालिक","Part Time":"अंशकालिक","Project Based":"प्रोजेक्ट आधारित","Experience":"अनुभव","Salary":"वेतन","Number of Positions":"पदों की संख्या","Accommodation Available":"आवास उपलब्ध","Food Available":"भोजन उपलब्ध","Job Description":"नौकरी विवरण","Product Information":"उत्पाद जानकारी","Product Type":"उत्पाद प्रकार","Posted":"पोस्ट किया गया","Seller":"विक्रेता","View Seller Profile":"विक्रेता प्रोफ़ाइल देखें","Call":"कॉल","Chat":"चैट","WhatsApp":"व्हाट्सऐप","Required Quantity":"आवश्यक मात्रा","Delete Requirement":"आवश्यकता हटाएं","About":"के बारे में","Start a conversation":"बातचीत शुरू करें","Ask about timber, requirements, jobs or work details.":"लकड़ी, आवश्यकताओं, नौकरियों या काम के विवरण के बारे में पूछें।"},
  ta: {"Buy • Sell • Connect":"வாங்க • விற்க • இணைக்க","Filter":"வடிகட்டி","Clear":"அழி","No listings found":"பட்டியல்கள் எதுவும் இல்லை","No sellers have posted matching products yet.":"பொருந்தும் பொருட்களை இன்னும் எந்த விற்பனையாளரும் பதிவிடவில்லை.","View Details":"விவரங்களைப் பார்க்கவும்","My Timber Listings":"என் மரப் பட்டியல்கள்","Add Listing":"பட்டியலைச் சேர்க்கவும்","You have no listings yet.":"உங்களிடம் இன்னும் பட்டியல்கள் இல்லை.","Customer Requirements":"வாடிக்கையாளர் தேவைகள்","No requirements yet":"தேவைகள் இல்லை","User-posted requirements will appear here.":"பயனர்கள் பதிவிட்ட தேவைகள் இங்கே தோன்றும்.","View Requirement":"தேவையைப் பார்க்கவும்","Find / Post Workers":"தொழிலாளர்களைக் கண்டறிய / பதிவு செய்ய","No jobs posted":"வேலைகள் எதுவும் இல்லை","Post a job to connect with workers.":"தொழிலாளர்களுடன் இணைய வேலை பதிவு செய்யவும்.","Nearby / Available Workers":"அருகிலுள்ள / கிடைக்கும் தொழிலாளர்கள்","No worker profiles yet":"தொழிலாளர் சுயவிவரங்கள் இல்லை","Workers who create profiles will appear here.":"சுயவிவரம் உருவாக்கும் தொழிலாளர்கள் இங்கே தோன்றுவார்கள்.","Worker":"தொழிலாளர்","View Profile":"சுயவிவரத்தைப் பார்க்கவும்","TimberMart only connects users.":"TimberMart பயனர்களை மட்டும் இணைக்கிறது.","No Payments":"கட்டணம் இல்லை","No Commission":"கமிஷன் இல்லை","Nearby Connect":"அருகில் இணைப்பு","Post Your Requirement":"உங்கள் தேவையைப் பதிவு செய்யவும்","Requirement Title *":"தேவை தலைப்பு *","Category":"வகை","Timber":"மரம்","Trees":"மரங்கள்","Logs":"மரக்கட்டைகள்","Doors":"கதவுகள்","Furniture":"தளபாடங்கள்","Other":"மற்றவை","Budget":"பட்ஜெட்","JOBS":"வேலைகள்","Job Title *":"வேலை தலைப்பு *","Job Category":"வேலை வகை","Job Type":"வேலை வகை","Full Time":"முழுநேரம்","Part Time":"பகுதி நேரம்","Project Based":"திட்ட அடிப்படை","Experience":"அனுபவம்","Salary":"சம்பளம்","Number of Positions":"பதவிகளின் எண்ணிக்கை","Accommodation Available":"தங்குமிடம் உள்ளது","Food Available":"உணவு உள்ளது","Job Description":"வேலை விளக்கம்","Product Information":"பொருள் தகவல்","Product Type":"பொருள் வகை","Posted":"பதிவிட்டது","Seller":"விற்பனையாளர்","View Seller Profile":"விற்பனையாளர் சுயவிவரம்","Call":"அழைப்பு","Chat":"அரட்டை","WhatsApp":"வாட்ஸ்அப்","Required Quantity":"தேவையான அளவு","Delete Requirement":"தேவையை நீக்கு","About":"பற்றி","Start a conversation":"உரையாடலைத் தொடங்கவும்","Ask about timber, requirements, jobs or work details.":"மரம், தேவைகள், வேலைகள் அல்லது பணி விவரங்களைப் பற்றி கேளுங்கள்."},
  kn: {"Buy • Sell • Connect":"ಖರೀದಿ • ಮಾರಾಟ • ಸಂಪರ್ಕ","Filter":"ಫಿಲ್ಟರ್","Clear":"ತೆರವುಗೊಳಿಸಿ","No listings found":"ಯಾವುದೇ ಪಟ್ಟಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ","No sellers have posted matching products yet.":"ಹೊಂದುವ ಉತ್ಪನ್ನಗಳನ್ನು ಇನ್ನೂ ಯಾವುದೇ ಮಾರಾಟಗಾರರು ಪೋಸ್ಟ್ ಮಾಡಿಲ್ಲ.","View Details":"ವಿವರಗಳನ್ನು ನೋಡಿ","My Timber Listings":"ನನ್ನ ಮರದ ಪಟ್ಟಿಗಳು","Add Listing":"ಪಟ್ಟಿ ಸೇರಿಸಿ","You have no listings yet.":"ನಿಮ್ಮಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಪಟ್ಟಿಗಳಿಲ್ಲ.","Customer Requirements":"ಗ್ರಾಹಕರ ಅವಶ್ಯಕತೆಗಳು","No requirements yet":"ಇನ್ನೂ ಅವಶ್ಯಕತೆಗಳಿಲ್ಲ","User-posted requirements will appear here.":"ಬಳಕೆದಾರರು ಪೋಸ್ಟ್ ಮಾಡಿದ ಅವಶ್ಯಕತೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.","View Requirement":"ಅವಶ್ಯಕತೆ ನೋಡಿ","Find / Post Workers":"ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ / ಪೋಸ್ಟ್ ಮಾಡಿ","No jobs posted":"ಯಾವುದೇ ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಆಗಿಲ್ಲ","Post a job to connect with workers.":"ಕಾರ್ಮಿಕರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಲು ಉದ್ಯೋಗ ಪೋಸ್ಟ್ ಮಾಡಿ.","Nearby / Available Workers":"ಹತ್ತಿರದ / ಲಭ್ಯವಿರುವ ಕಾರ್ಮಿಕರು","No worker profiles yet":"ಇನ್ನೂ ಕಾರ್ಮಿಕರ ಪ್ರೊಫೈಲ್‌ಗಳಿಲ್ಲ","Workers who create profiles will appear here.":"ಪ್ರೊಫೈಲ್ ರಚಿಸುವ ಕಾರ್ಮಿಕರು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತಾರೆ.","Worker":"ಕಾರ್ಮಿಕ","View Profile":"ಪ್ರೊಫೈಲ್ ನೋಡಿ","TimberMart only connects users.":"TimberMart ಬಳಕೆದಾರರನ್ನು ಮಾತ್ರ ಸಂಪರ್ಕಿಸುತ್ತದೆ.","No Payments":"ಪಾವತಿಗಳಿಲ್ಲ","No Commission":"ಕಮಿಷನ್ ಇಲ್ಲ","Nearby Connect":"ಹತ್ತಿರದ ಸಂಪರ್ಕ","Post Your Requirement":"ನಿಮ್ಮ ಅವಶ್ಯಕತೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ","Requirement Title *":"ಅವಶ್ಯಕತೆ ಶೀರ್ಷಿಕೆ *","Category":"ವರ್ಗ","Timber":"ಮರ","Trees":"ಮರಗಳು","Logs":"ದಿಮ್ಮಿಗಳು","Doors":"ಬಾಗಿಲುಗಳು","Furniture":"ಪೀಠೋಪಕರಣಗಳು","Other":"ಇತರೆ","Budget":"ಬಜೆಟ್","JOBS":"ಉದ್ಯೋಗಗಳು","Job Title *":"ಉದ್ಯೋಗ ಶೀರ್ಷಿಕೆ *","Job Category":"ಉದ್ಯೋಗ ವರ್ಗ","Job Type":"ಉದ್ಯೋಗ ಪ್ರಕಾರ","Full Time":"ಪೂರ್ಣ ಸಮಯ","Part Time":"ಅರೆಕಾಲಿಕ","Project Based":"ಪ್ರಾಜೆಕ್ಟ್ ಆಧಾರಿತ","Experience":"ಅನುಭವ","Salary":"ಸಂಬಳ","Number of Positions":"ಹುದ್ದೆಗಳ ಸಂಖ್ಯೆ","Accommodation Available":"ವಸತಿ ಲಭ್ಯವಿದೆ","Food Available":"ಆಹಾರ ಲಭ್ಯವಿದೆ","Job Description":"ಉದ್ಯೋಗ ವಿವರಣೆ","Product Information":"ಉತ್ಪನ್ನ ಮಾಹಿತಿ","Product Type":"ಉತ್ಪನ್ನದ ಪ್ರಕಾರ","Posted":"ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿದೆ","Seller":"ಮಾರಾಟಗಾರ","View Seller Profile":"ಮಾರಾಟಗಾರರ ಪ್ರೊಫೈಲ್ ನೋಡಿ","Call":"ಕರೆ","Chat":"ಚಾಟ್","WhatsApp":"ವಾಟ್ಸ್ಅಪ್","Required Quantity":"ಅಗತ್ಯ ಪ್ರಮಾಣ","Delete Requirement":"ಅವಶ್ಯಕತೆ ಅಳಿಸಿ","About":"ಕುರಿತು","Start a conversation":"ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ","Ask about timber, requirements, jobs or work details.":"ಮರ, ಅವಶ್ಯಕತೆಗಳು, ಉದ್ಯೋಗಗಳು ಅಥವಾ ಕೆಲಸದ ವಿವರಗಳ ಬಗ್ಗೆ ಕೇಳಿ."}
};

const getDashboardLanguage = () => {
  try { return localStorage.getItem("timbermart_dashboard_language") || "en"; } catch { return "en"; }
};

const WOOD_TYPES = [
  "All Types",
  "Teak",
  "Neem",
  "Pine",
  "Eucalyptus",
  "Rosewood",
  "Old Wood",
  "Old Teak",
  "Old Wood Furniture",
  "Fire Wood",
];

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
  "Burma Teak",
  "Thailand Teak",
  "African Teak",
  "Malaysian Teak",
  "Andaman Teak",
  "Nagpur Teak",
  "Kerala Local Teak",
  "Andhra Local Teak",
  "Other Teak",
];

const OLD_WOOD_TYPES = [
  "Old Wood",
  "Old Teak",
  "Old Wood Furniture",
];

const FIREWOOD_TYPES = [
  "Jeedi (Cashew)",
  "Mamidi (Mango)",
  "Thati (Palm)",
  "Kobari (Coconut)",
  "Teak",
  "Neem",
  "Eucalyptus",
  "Acacia",
  "Subabul",
  "Tamarind",
  "Casuarina",
  "Babul",
  "Prosopis",
  "Other Fire Wood",
];

const SELL_FORM_LANGUAGES = {
  en: {
    name: "English",
    sell: "SELL TIMBER",
    title: "Add Timber Listing",
    listingTitle: "Listing Title",
    titlePlaceholder: "Example: Balarsa Teak Wood Logs",
    woodType: "Wood Category",
    selectWood: "Select Wood Category",
    teakType: "Teak Type",
    selectTeak: "Select Teak Type",
    oldWoodType: "Old Wood Type",
    selectOldWood: "Select Old Wood Type",
    firewoodType: "Fire Wood Type",
    selectFirewood: "Select Fire Wood Type",
    productType: "Product Type",
    quantity: "Quantity",
    quantityPlaceholder: "15 CMT",
    location: "Location",
    locationPlaceholder: "Rajahmundry, AP",
    price: "Price",
    pricePlaceholder: "85000 / CMT",
    priceType: "Price Type",
    fixed: "Fixed Price",
    negotiable: "Negotiable",
    description: "Description",
    descriptionPlaceholder: "Describe wood quality, size, availability...",
    photos: "Add Photos",
    photosHint: "Up to 10 photos",
    addPhotos: "Add timber photos",
    formats: "JPG / PNG / WEBP",
    submit: "Submit Listing",
    submitting: "Submitting...",
    required: "Required",
  },
  te: {
    name: "తెలుగు",
    sell: "చెక్క అమ్మకం",
    title: "చెక్క వివరాలను జోడించండి",
    listingTitle: "లిస్టింగ్ పేరు",
    titlePlaceholder: "ఉదా: బాలర్సా టేకు దుంగలు",
    woodType: "చెక్క వర్గం",
    selectWood: "చెక్క వర్గాన్ని ఎంచుకోండి",
    teakType: "టేకు రకం",
    selectTeak: "టేకు రకాన్ని ఎంచుకోండి",
    oldWoodType: "పాత చెక్క రకం",
    selectOldWood: "పాత చెక్క రకాన్ని ఎంచుకోండి",
    firewoodType: "కట్టెల రకం",
    selectFirewood: "కట్టెల రకాన్ని ఎంచుకోండి",
    productType: "ఉత్పత్తి రకం",
    quantity: "పరిమాణం",
    quantityPlaceholder: "15 CMT",
    location: "ప్రాంతం",
    locationPlaceholder: "రాజమండ్రి, AP",
    price: "ధర",
    pricePlaceholder: "85000 / CMT",
    priceType: "ధర రకం",
    fixed: "స్థిర ధర",
    negotiable: "చర్చించవచ్చు",
    description: "వివరణ",
    descriptionPlaceholder: "చెక్క నాణ్యత, పరిమాణం, లభ్యత వివరించండి...",
    photos: "ఫోటోలు జోడించండి",
    photosHint: "10 ఫోటోల వరకు",
    addPhotos: "చెక్క ఫోటోలు జోడించండి",
    formats: "JPG / PNG / WEBP",
    submit: "లిస్టింగ్ పంపండి",
    submitting: "పంపుతోంది...",
    required: "అవసరం",
  },
  hi: {
    name: "हिन्दी",
    sell: "लकड़ी बेचें",
    title: "लकड़ी की लिस्टिंग जोड़ें",
    listingTitle: "लिस्टिंग शीर्षक",
    titlePlaceholder: "उदाहरण: बलारसा सागौन लकड़ी",
    woodType: "लकड़ी श्रेणी",
    selectWood: "लकड़ी श्रेणी चुनें",
    teakType: "सागौन प्रकार",
    selectTeak: "सागौन प्रकार चुनें",
    oldWoodType: "पुरानी लकड़ी प्रकार",
    selectOldWood: "पुरानी लकड़ी प्रकार चुनें",
    firewoodType: "जलाऊ लकड़ी प्रकार",
    selectFirewood: "जलाऊ लकड़ी प्रकार चुनें",
    productType: "उत्पाद प्रकार",
    quantity: "मात्रा",
    quantityPlaceholder: "15 CMT",
    location: "स्थान",
    locationPlaceholder: "राजमुंदरी, AP",
    price: "कीमत",
    pricePlaceholder: "85000 / CMT",
    priceType: "कीमत प्रकार",
    fixed: "निश्चित कीमत",
    negotiable: "बातचीत योग्य",
    description: "विवरण",
    descriptionPlaceholder: "लकड़ी की गुणवत्ता, आकार और उपलब्धता लिखें...",
    photos: "फोटो जोड़ें",
    photosHint: "10 फोटो तक",
    addPhotos: "लकड़ी की फोटो जोड़ें",
    formats: "JPG / PNG / WEBP",
    submit: "लिस्टिंग भेजें",
    submitting: "भेजा जा रहा है...",
    required: "आवश्यक",
  },
  ta: {
    name: "தமிழ்",
    sell: "மரக்கட்டை விற்பனை",
    title: "மர விற்பனை பட்டியலைச் சேர்க்கவும்",
    listingTitle: "பட்டியல் தலைப்பு",
    titlePlaceholder: "உதா: பாலர்சா தேக்கு மரக்கட்டைகள்",
    woodType: "மர வகை",
    selectWood: "மர வகையைத் தேர்வு செய்யவும்",
    teakType: "தேக்கு வகை",
    selectTeak: "தேக்கு வகையைத் தேர்வு செய்யவும்",
    oldWoodType: "பழைய மர வகை",
    selectOldWood: "பழைய மர வகையைத் தேர்வு செய்யவும்",
    firewoodType: "விறகு வகை",
    selectFirewood: "விறகு வகையைத் தேர்வு செய்யவும்",
    productType: "பொருள் வகை",
    quantity: "அளவு",
    quantityPlaceholder: "15 CMT",
    location: "இடம்",
    locationPlaceholder: "ராஜமுந்திரி, AP",
    price: "விலை",
    pricePlaceholder: "85000 / CMT",
    priceType: "விலை வகை",
    fixed: "நிலையான விலை",
    negotiable: "பேச்சுவார்த்தை",
    description: "விளக்கம்",
    descriptionPlaceholder: "மரத்தின் தரம், அளவு, கிடைக்கும் தன்மை...",
    photos: "புகைப்படங்களைச் சேர்க்கவும்",
    photosHint: "10 புகைப்படங்கள் வரை",
    addPhotos: "மர புகைப்படங்களைச் சேர்க்கவும்",
    formats: "JPG / PNG / WEBP",
    submit: "பட்டியலை அனுப்பவும்",
    submitting: "அனுப்பப்படுகிறது...",
    required: "தேவை",
  },
  kn: {
    name: "ಕನ್ನಡ",
    sell: "ಮರ ಮಾರಾಟ",
    title: "ಮರದ ಪಟ್ಟಿಯನ್ನು ಸೇರಿಸಿ",
    listingTitle: "ಪಟ್ಟಿ ಶೀರ್ಷಿಕೆ",
    titlePlaceholder: "ಉದಾ: ಬಾಲಾರ್ಸಾ ತೇಗು ಮರದ ದಿಮ್ಮಿಗಳು",
    woodType: "ಮರದ ವರ್ಗ",
    selectWood: "ಮರದ ವರ್ಗ ಆಯ್ಕೆಮಾಡಿ",
    teakType: "ತೇಗು ಪ್ರಕಾರ",
    selectTeak: "ತೇಗು ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ",
    oldWoodType: "ಹಳೆಯ ಮರದ ಪ್ರಕಾರ",
    selectOldWood: "ಹಳೆಯ ಮರದ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ",
    firewoodType: "ಉರುವಲು ಮರದ ಪ್ರಕಾರ",
    selectFirewood: "ಉರುವಲು ಮರದ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ",
    productType: "ಉತ್ಪನ್ನದ ಪ್ರಕಾರ",
    quantity: "ಪ್ರಮಾಣ",
    quantityPlaceholder: "15 CMT",
    location: "ಸ್ಥಳ",
    locationPlaceholder: "ರಾಜಮಂದ್ರಿ, AP",
    price: "ಬೆಲೆ",
    pricePlaceholder: "85000 / CMT",
    priceType: "ಬೆಲೆ ಪ್ರಕಾರ",
    fixed: "ನಿಗದಿತ ಬೆಲೆ",
    negotiable: "ಚರ್ಚಿಸಬಹುದಾದ",
    description: "ವಿವರಣೆ",
    descriptionPlaceholder: "ಮರದ ಗುಣಮಟ್ಟ, ಗಾತ್ರ ಮತ್ತು ಲಭ್ಯತೆ...",
    photos: "ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ",
    photosHint: "10 ಫೋಟೋಗಳವರೆಗೆ",
    addPhotos: "ಮರದ ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ",
    formats: "JPG / PNG / WEBP",
    submit: "ಪಟ್ಟಿ ಕಳುಹಿಸಿ",
    submitting: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
    required: "ಅಗತ್ಯ",
  },
};

function getSellFormText(language) {
  return SELL_FORM_LANGUAGES[language] || SELL_FORM_LANGUAGES.en;
}

const localizeOption = (value, language) => {
  const map = {
    te: {
      Teak: "టేకు", Neem: "వేప", Pine: "పైన్", Eucalyptus: "యూకలిప్టస్",
      Rosewood: "రోజ్‌వుడ్", "Old Wood": "పాత చెక్క", "Old Teak": "పాత టేకు",
      "Old Wood Furniture": "పాత చెక్క ఫర్నిచర్", "Fire Wood": "కట్టెలు",
      "Fixed Price": "స్థిర ధర", Negotiable: "చర్చించవచ్చు"
    },
    hi: {
      Teak: "सागौन", Neem: "नीम", Pine: "चीड़", Eucalyptus: "नीलगिरी",
      Rosewood: "शीशम", "Old Wood": "पुरानी लकड़ी", "Old Teak": "पुराना सागौन",
      "Old Wood Furniture": "पुराना लकड़ी फर्नीचर", "Fire Wood": "जलाऊ लकड़ी",
      "Fixed Price": "निश्चित कीमत", Negotiable: "बातचीत योग्य"
    },
    ta: {
      Teak: "தேக்கு", Neem: "வேம்பு", Pine: "பைன்", Eucalyptus: "யூகலிப்டஸ்",
      Rosewood: "ரோஸ்வுட்", "Old Wood": "பழைய மரம்", "Old Teak": "பழைய தேக்கு",
      "Old Wood Furniture": "பழைய மர தளபாடங்கள்", "Fire Wood": "விறகு",
      "Fixed Price": "நிலையான விலை", Negotiable: "பேச்சுவார்த்தை"
    },
    kn: {
      Teak: "ತೇಗು", Neem: "ಬೇವು", Pine: "ಪೈನ್", Eucalyptus: "ನೀಲಗಿರಿ",
      Rosewood: "ರೋಸ್‌ವುಡ್", "Old Wood": "ಹಳೆಯ ಮರ", "Old Teak": "ಹಳೆಯ ತೇಗು",
      "Old Wood Furniture": "ಹಳೆಯ ಮರದ ಫರ್ನಿಚರ್", "Fire Wood": "ಉರುವಲು",
      "Fixed Price": "ನಿಗದಿತ ಬೆಲೆ", Negotiable: "ಚರ್ಚಿಸಬಹುದಾದ"
    }
  };
  return map[language]?.[value] || value;
};


const JOB_CATEGORIES = [
  "Machine Operator",
  "Timber Cutter",
  "Log Loading Worker",
  "Carpenter Helper",
  "Saw Mill Worker",
  "Wood Worker",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "No Experience",
  "0 - 2 Years",
  "2 - 5 Years",
  "5 - 8 Years",
  "8+ Years",
];

function normalizePhone(phone = "") {
  return String(phone).replace(/\D/g, "");
}

function getWhatsAppUrl(phone, message = "") {
  let number = normalizePhone(phone);

  if (!number) return "";

  if (number.length === 10) {
    number = `91${number}`;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getImages(listing) {
  const relationImages = Array.isArray(listing?.listing_images)
    ? [...listing.listing_images]
        .filter((item) => item?.image_url)
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
        .map((item) => item.image_url)
    : [];

  if (relationImages.length) return [...new Set(relationImages)];

  const candidates = [listing?.images, listing?.image_urls, listing?.photos];
  for (const value of candidates) {
    if (Array.isArray(value)) {
      const urls = value.filter(Boolean);
      if (urls.length) return [...new Set(urls)];
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length) return [...new Set(parsed.filter(Boolean))];
      } catch {}
    }
  }

  return listing?.image_url || listing?.photo_url ? [listing.image_url || listing.photo_url] : [];
}

function getImage(listing) {
  return getImages(listing)[0] || "";
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const a = Number(lat1);
  const b = Number(lon1);
  const c = Number(lat2);
  const d = Number(lon2);
  if (![a, b, c, d].every(Number.isFinite)) return null;
  const R = 6371;
  const rad = (value) => (value * Math.PI) / 180;
  const dLat = rad(c - a);
  const dLon = rad(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function roleName(role) {
  const roles = {
    farmer: "Farmer",
    merchant: "Timber Merchant",
    sawmill: "Sawmill / Business",
    carpenter: "Carpenter",
    worker: "Worker",
    buyer: "Buyer / Homeowner",
  };

  return roles[role] || "TimberMart User";
}

export default function MerchantDashboard() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [listings, setListings] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [woodType, setWoodType] = useState("All Types");
  const [locationFilter, setLocationFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const [showSellModal, setShowSellModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] =
    useState(false);
  const [showJobModal, setShowJobModal] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [favourites, setFavourites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("timbermart_merchant_favourites") || "[]"
      );
    } catch {
      return [];
    }
  });

  /* =====================================================
     SELL LISTING FORM
  ===================================================== */

  const [sellForm, setSellForm] = useState({
    title: "",
    wood_type: "",
    wood_subtype: "",
    wood_subtype_group: "",
    product_type: "Timber",
    quantity: "",
    location: "",
    price: "",
    price_type: "Fixed Price",
    description: "",
  });

  const [sellPhotos, setSellPhotos] = useState([]);
  const [selling, setSelling] = useState(false);
  const [sellLanguage, setSellLanguage] = useState(() => localStorage.getItem("timbermart_sell_language") || "en");
  const [dashboardLanguage, setDashboardLanguage] = useState(getDashboardLanguage);
  const t = (key) => DASHBOARD_TRANSLATIONS[dashboardLanguage]?.[key] || UI_TRANSLATIONS[dashboardLanguage]?.[key] || DASHBOARD_TRANSLATIONS.en[key] || key;
  const tx = (key) => t(key);

  /* =====================================================
     REQUIREMENT FORM
  ===================================================== */

  const [requirementForm, setRequirementForm] = useState({
    title: "",
    category: "Timber",
    location: "",
    quantity: "",
    budget: "",
    description: "",
  });

  const [postingRequirement, setPostingRequirement] =
    useState(false);

  /* =====================================================
     JOB FORM
  ===================================================== */

  const [jobForm, setJobForm] = useState({
    title: "",
    category: "Machine Operator",
    job_type: "Full Time",
    experience: "2 - 5 Years",
    salary: "",
    location: "",
    positions: "1",
    accommodation: false,
    food: false,
    description: "",
  });

  const [postingJob, setPostingJob] = useState(false);

  /* =====================================================
     LOCATION / NOTIFICATIONS / SUPPLIER HUB
  ===================================================== */
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [listingViewer, setListingViewer] = useState({ open: false, index: 0 });


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.user) {
        navigate("/roles", { replace: true });
        return;
      }

      if (!mounted) return;

      setSession(currentSession);

      let { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (!userProfile) {
        const name =
          currentSession.user.user_metadata?.full_name ||
          currentSession.user.user_metadata?.name ||
          currentSession.user.email?.split("@")[0] ||
          "Merchant";

        const { data: createdProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: currentSession.user.id,
              name,
              role: "merchant",
            },
            {
              onConflict: "id",
            }
          )
          .select()
          .single();

        userProfile = createdProfile;
      }

      if (!userProfile) {
        navigate("/roles", { replace: true });
        return;
      }

      if (userProfile.role !== "merchant") {
        navigate(`/dashboard/${userProfile.role}`, {
          replace: true,
        });
        return;
      }

      setProfile(userProfile);

      setSellForm((old) => ({
        ...old,
        location: userProfile.location || "",
      }));

      setRequirementForm((old) => ({
        ...old,
        location: userProfile.location || "",
      }));

      setJobForm((old) => ({
        ...old,
        location: userProfile.location || "",
      }));

      await Promise.all([
        loadListings(),
        loadRequirements(),
        loadJobs(),
        loadWorkers(),
        loadOrders(currentSession.user.id),
        loadNotifications(),
      ]);

      if (mounted) {
        setLoading(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     LOAD LISTINGS
  ===================================================== */

  async function loadListings() {
    const { data, error } = await supabase
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
        "timber_merchant",
        "sawmill",
        "sawmill_business",
        "carpenter",
      ])
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Listings error:", error);
      return;
    }

    setListings(data || []);
  }

  /* =====================================================
     REQUIREMENTS
  ===================================================== */

  async function loadRequirements() {
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Requirements error:", error);
      return;
    }

    setRequirements(data || []);
  }

  /* =====================================================
     JOBS
  ===================================================== */

  async function loadJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
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
     WORKERS
  ===================================================== */

  async function loadWorkers() {
    const { data: workerProfiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "worker")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Workers error:", error);
      return;
    }

    setWorkers(workerProfiles || []);
  }

  /* =====================================================
     ORDERS
  ===================================================== */

  async function loadOrders(userId) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        listing:listings (
          id,
          title,
          wood_type,
          price,
          quantity,
          location
        )
      `)
      .eq("buyer_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setOrders(data || []);
    }
  }

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  async function loadNotifications() {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      console.error("Notifications error:", error);
      return;
    }
    setNotifications(data || []);
  }

  const unreadNotificationCount = notifications.filter((item) => !item.is_read).length;

  async function markNotificationRead(id) {
    if (!id) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (!error) {
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    }
  }

  async function markAllNotificationsRead() {
    if (!session?.user?.id || !unreadNotificationCount) return;
    setNotificationBusy(true);
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);
    if (!error) setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    setNotificationBusy(false);
  }

  function notificationDistance(item) {
    if (Number.isFinite(Number(item?.distance_km))) return Number(item.distance_km);
    return haversineKm(profile?.latitude, profile?.longitude, item?.latitude, item?.longitude);
  }

  /* =====================================================
     LOCATION UPDATE
  ===================================================== */

  async function updateMerchantLocation() {
    if (!session?.user?.id) return;
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser.");
      return;
    }

    setLocationBusy(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);
        let readableLocation = profile?.location || "Current location";

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          if (response.ok) {
            const json = await response.json();
            readableLocation =
              json?.display_name ||
              [json?.address?.city, json?.address?.town, json?.address?.state].filter(Boolean).join(", ") ||
              readableLocation;
          }
        } catch (error) {
          console.warn("Reverse geocoding failed", error);
        }

        const { data, error } = await supabase
          .from("profiles")
          .update({ latitude, longitude, location: readableLocation })
          .eq("id", session.user.id)
          .select("*")
          .single();

        if (error) {
          console.error("Location update error:", error);
          setLocationMessage(error.message || "Could not update location.");
        } else {
          setProfile(data);
          setSellForm((old) => ({ ...old, location: readableLocation }));
          setRequirementForm((old) => ({ ...old, location: readableLocation }));
          setJobForm((old) => ({ ...old, location: readableLocation }));
          setLocationMessage("Location updated successfully.");
          await loadNotifications();
        }

        setLocationBusy(false);
      },
      (error) => {
        setLocationBusy(false);
        setLocationMessage(error?.message || "Please allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  /* =====================================================
     SPECIALTY SUPPLIER HUBS
  ===================================================== */
  const pattaTeakListings = useMemo(() => {
    return listings.filter((item) => {
      const text = [item.title, item.wood_type, item.wood_subtype, item.product_type, item.description, item.category]
        .filter(Boolean).join(" ").toLowerCase();
      return /patta teak|patta|indian teak/.test(text) &&
        (item.status == null || item.status === "approved" || item.user_id === session?.user?.id);
    });
  }, [listings, session?.user?.id]);

  const importedTeakListings = useMemo(() => {
    return listings.filter((item) => {
      const text = [item.title, item.wood_type, item.wood_subtype, item.product_type, item.description, item.category]
        .filter(Boolean).join(" ").toLowerCase();
      return /imported teak|imported|burma teak|african teak|malaysian teak/.test(text) &&
        (item.status == null || item.status === "approved" || item.user_id === session?.user?.id);
    });
  }, [listings, session?.user?.id]);

  /* =====================================================
     REALTIME
  ===================================================== */

  useEffect(() => {
    const channel = supabase
      .channel("merchant-dashboard-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listings",
        },
        () => loadListings()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requirements",
        },
        () => loadRequirements()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        () => loadJobs()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => loadWorkers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =====================================================
     FILTER PRODUCTS
  ===================================================== */

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const loc = locationFilter.trim().toLowerCase();

    return listings.filter((item) => {
      const visible = item.user_id === session?.user?.id || item.status == null || item.status === "approved";
      if (!visible) return false;

      const title = String(item.title || "").toLowerCase();
      const wood = String(item.wood_type || "").toLowerCase();
      const subtype = String(item.wood_subtype || "").toLowerCase();
      const product = String(
        item.product_type || ""
      ).toLowerCase();
      const itemLocation = String(
        item.location || ""
      ).toLowerCase();

      const searchMatch =
        !q ||
        title.includes(q) ||
        wood.includes(q) ||
        subtype.includes(q) ||
        product.includes(q) ||
        itemLocation.includes(q);

      const categoryMatch =
        category === "All" ||
        title.includes(category.toLowerCase()) ||
        product.includes(category.toLowerCase()) ||
        (category === "Timber" &&
          [
            "teak",
            "neem",
            "pine",
            "eucalyptus",
            "rosewood",
          ].some((woodName) =>
            wood.includes(woodName)
          ));

      const woodMatch =
        woodType === "All Types" ||
        wood === woodType.toLowerCase();

      const locationMatch =
        !loc || itemLocation.includes(loc);

      const priceNumber = parseFloat(
        String(item.price || "").replace(
          /[^0-9.]/g,
          ""
        )
      );

      const priceMatch =
        !maxPrice ||
        !priceNumber ||
        priceNumber <= Number(maxPrice);

      return (
        searchMatch &&
        categoryMatch &&
        woodMatch &&
        locationMatch &&
        priceMatch
      );
    });
  }, [
    listings,
    search,
    category,
    woodType,
    locationFilter,
    maxPrice,
    session?.user?.id,
  ]);

  /* =====================================================
     REFRESH
  ===================================================== */

  async function refreshAll() {
    setRefreshing(true);

    await Promise.all([
      loadListings(),
      loadRequirements(),
      loadJobs(),
      loadWorkers(),
      session?.user?.id
        ? loadOrders(session.user.id)
        : Promise.resolve(),
      loadNotifications(),
    ]);

    setRefreshing(false);
  }

  /* =====================================================
     PHOTO SELECT
  ===================================================== */

  function handlePhotoSelect(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5 MB.`);
        return false;
      }
      return true;
    });

    const remaining = Math.max(0, 10 - sellPhotos.length);
    setSellPhotos((current) => [...current, ...validFiles.slice(0, remaining)]);
    event.target.value = "";
  }

  function removeSellPhoto(index) {
    setSellPhotos((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  /* =====================================================
     SELL TIMBER
  ===================================================== */

  async function handleSellTimber(event) {
    event.preventDefault();

    if (!session?.user?.id) return;

    if (!sellForm.title.trim()) {
      alert("Please enter listing title.");
      return;
    }

    if (!sellForm.wood_type.trim()) {
      alert("Please select wood type.");
      return;
    }

    if (["Teak", "Old Wood", "Fire Wood"].includes(sellForm.wood_type) && !sellForm.wood_subtype.trim()) {
      alert("Please select the specific wood type.");
      return;
    }

    setSelling(true);

    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        user_id: session.user.id,
        role: "merchant",
        status: "pending",
        latitude: profile?.latitude ?? null,
        longitude: profile?.longitude ?? null,
        title: sellForm.title.trim(),
        wood_type: sellForm.wood_type.trim(),
        wood_subtype: sellForm.wood_subtype.trim() || null,
        wood_subtype_group: sellForm.wood_subtype_group || null,
        product_type: sellForm.product_type,
        quantity: sellForm.quantity.trim(),
        location:
          sellForm.location.trim() ||
          profile?.location ||
          "",
        price: sellForm.price.trim(),
        price_type: sellForm.price_type,
        description: sellForm.description.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setSelling(false);
      return;
    }

    /* Upload photos */

    for (let i = 0; i < sellPhotos.length; i++) {
      const file = sellPhotos[i];

      const safeName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, "-")
        .toLowerCase();

      const path = `${session.user.id}/${listing.id}/${Date.now()}-${i}-${safeName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("listing-photos")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        console.error("Photo upload:", uploadError);
        continue;
      }

      const { data: publicData } =
        supabase.storage
          .from("listing-photos")
          .getPublicUrl(path);

      await supabase
        .from("listing_images")
        .insert({
          listing_id: listing.id,
          user_id: session.user.id,
          image_url: publicData.publicUrl,
          storage_path: path,
          sort_order: i,
        });
    }

    setSelling(false);

    setSellForm({
      title: "",
      wood_type: "",
      wood_subtype: "",
      wood_subtype_group: "",
      product_type: "Timber",
      quantity: "",
      location: profile?.location || "",
      price: "",
      price_type: "Fixed Price",
      description: "",
    });

    setSellPhotos([]);
    setShowSellModal(false);

    await loadListings();
    await loadNotifications();

    alert("Timber listing submitted for admin approval. You will be notified after review.");
  }

  /* =====================================================
     DELETE OWN LISTING
  ===================================================== */

  async function deleteListing(listing) {
    if (!listing?.id) return;

    if (
      listing.user_id !== session?.user?.id
    ) {
      return;
    }

    const ok = window.confirm(
      "Delete this timber listing?"
    );

    if (!ok) return;

    await supabase
      .from("listing_images")
      .delete()
      .eq("listing_id", listing.id);

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedListing(null);
    await loadListings();
  }

  /* =====================================================
     REQUIREMENT POST
  ===================================================== */

  async function handleRequirementPost(event) {
    event.preventDefault();

    if (!session?.user?.id) return;

    if (!requirementForm.title.trim()) {
      alert("Enter requirement title.");
      return;
    }

    setPostingRequirement(true);

    const { error } = await supabase
      .from("requirements")
      .insert({
        user_id: session.user.id,
        title: requirementForm.title.trim(),
        category: requirementForm.category,
        category_label: requirementForm.category,
        location:
          requirementForm.location.trim() ||
          profile?.location ||
          "",
        quantity: requirementForm.quantity.trim(),
        budget: requirementForm.budget.trim(),
        description:
          requirementForm.description.trim(),
      });

    setPostingRequirement(false);

    if (error) {
      alert(error.message);
      return;
    }

    setRequirementForm({
      title: "",
      category: "Timber",
      location: profile?.location || "",
      quantity: "",
      budget: "",
      description: "",
    });

    setShowRequirementModal(false);

    await loadRequirements();

    alert("Requirement posted successfully.");
  }

  /* =====================================================
     DELETE REQUIREMENT
  ===================================================== */

  async function deleteRequirement(requirement) {
    if (
      requirement.user_id !==
      session?.user?.id
    ) {
      return;
    }

    const ok = window.confirm(
      "Delete this requirement?"
    );

    if (!ok) return;

    const { error } = await supabase
      .from("requirements")
      .delete()
      .eq("id", requirement.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedRequirement(null);
    await loadRequirements();
  }

  /* =====================================================
     JOB POST
  ===================================================== */

  async function handleJobPost(event) {
    event.preventDefault();

    if (!session?.user?.id) return;

    if (!jobForm.title.trim()) {
      alert("Enter job title.");
      return;
    }

    setPostingJob(true);

    const { error } = await supabase
      .from("jobs")
      .insert({
        user_id: session.user.id,
        title: jobForm.title.trim(),
        category: jobForm.category,
        job_type: jobForm.job_type,
        experience: jobForm.experience,
        salary: jobForm.salary.trim(),
        location:
          jobForm.location.trim() ||
          profile?.location ||
          "",
        positions: jobForm.positions.trim(),
        accommodation:
          jobForm.accommodation,
        food: jobForm.food,
        description:
          jobForm.description.trim(),
      });

    setPostingJob(false);

    if (error) {
      alert(error.message);
      return;
    }

    setJobForm({
      title: "",
      category: "Machine Operator",
      job_type: "Full Time",
      experience: "2 - 5 Years",
      salary: "",
      location: profile?.location || "",
      positions: "1",
      accommodation: false,
      food: false,
      description: "",
    });

    setShowJobModal(false);

    await loadJobs();

    alert("Job posted successfully.");
  }

  /* =====================================================
     DELETE OWN JOB
  ===================================================== */

  async function deleteJob(job) {
    if (job.user_id !== session?.user?.id) {
      return;
    }

    const ok = window.confirm(
      "Delete this job?"
    );

    if (!ok) return;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadJobs();
  }

  /* =====================================================
     FAVOURITES
  ===================================================== */

  function toggleFavourite(id) {
    const next = favourites.includes(id)
      ? favourites.filter((x) => x !== id)
      : [...favourites, id];

    setFavourites(next);

    localStorage.setItem(
      "timbermart_merchant_favourites",
      JSON.stringify(next)
    );
  }

  /* =====================================================
     PROFILE
  ===================================================== */

  async function openProfile(userId) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setSelectedSeller(data);
    }
  }

  /* =====================================================
     CALL
  ===================================================== */

  async function callUser(userId, fallbackPhone = "") {
    let phone = fallbackPhone;

    if (!phone && userId) {
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .maybeSingle();

      phone = data?.phone || "";
    }

    if (!phone) {
      alert(
        "This user has not added a phone number."
      );
      return;
    }

    window.location.href = `tel:${phone}`;
  }

  /* =====================================================
     WHATSAPP
  ===================================================== */

  async function whatsappUser(
    userId,
    fallbackPhone = "",
    name = ""
  ) {
    let phone = fallbackPhone;

    if (!phone && userId) {
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .maybeSingle();

      phone = data?.phone || "";
    }

    if (!phone) {
      alert(
        "This user has not added a phone number."
      );
      return;
    }

    const url = getWhatsAppUrl(
      phone,
      `Hi ${name || "there"}, I found your profile/listing on TimberMart. I would like to connect with you.`
    );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =====================================================
     CHAT
  ===================================================== */

  async function openChat(user) {
    if (!user?.id || !session?.user?.id) {
      return;
    }

    if (user.id === session.user.id) {
      alert("You cannot chat with yourself.");
      return;
    }

    setChatUser(user);
    setChatOpen(true);
    setMessages([]);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${session.user.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${session.user.id})`
      )
      .order("created_at", {
        ascending: true,
      });

    if (!error) {
      setMessages(data || []);
    }
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel(`merchant-notifications-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${session.user.id}` },
        () => loadNotifications()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session?.user?.id]);

  useEffect(() => {
    if (
      !chatOpen ||
      !chatUser?.id ||
      !session?.user?.id
    ) {
      return;
    }

    const channel = supabase
      .channel(
        `merchant-chat-${session.user.id}-${chatUser.id}`
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

          const valid =
            (message.sender_id ===
              session.user.id &&
              message.receiver_id ===
                chatUser.id) ||
            (message.sender_id ===
              chatUser.id &&
              message.receiver_id ===
                session.user.id);

          if (!valid) return;

          setMessages((current) => {
            if (
              current.some(
                (item) =>
                  item.id === message.id
              )
            ) {
              return current;
            }

            return [...current, message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    chatOpen,
    chatUser?.id,
    session?.user?.id,
  ]);

  async function sendMessage() {
    const body = messageText.trim();

    if (
      !body ||
      !chatUser?.id ||
      !session?.user?.id
    ) {
      return;
    }

    setSendingMessage(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: session.user.id,
        receiver_id: chatUser.id,
        body,
      })
      .select()
      .single();

    setSendingMessage(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMessages((current) => {
      if (
        current.some(
          (item) => item.id === data.id
        )
      ) {
        return current;
      }

      return [...current, data];
    });

    setMessageText("");
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function logout() {
    await supabase.auth.signOut();

    navigate("/roles", {
      replace: true,
    });
  }

  /* =====================================================
     NAV
  ===================================================== */

  function navTo(tab) {
    setActiveTab(tab);
    setSidebarOpen(false);

    if (tab === "profile") {
      navigate("/profile");
    }

    if (tab === "settings") {
      navigate("/settings");
    }

    if (tab === "requirements") {
      document
        .querySelector(
          ".merchant-requirements-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }

    if (tab === "jobs") {
      document
        .querySelector(
          ".merchant-jobs-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
        });
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
     DASHBOARD
  ===================================================== */

  return (
    <div className={`merchant-app merchant-lang-${dashboardLanguage}`} lang={dashboardLanguage}>

      {/* =================================================
          TOP BAR
      ================================================= */}

      <header className="merchant-topbar">

        <button
          className="merchant-menu-btn"
          onClick={() =>
            setSidebarOpen(true)
          }
        >
          <Menu size={22} />
        </button>

        <button
          className="merchant-logo"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          🌳 TimberMart
        </button>

        <div className="merchant-top-right">

          <button
            className="merchant-icon-btn"
            onClick={refreshAll}
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "merchant-spin"
                  : ""
              }
            />
          </button>

          <button
            className={`merchant-icon-btn merchant-notification-trigger ${unreadNotificationCount ? "has-unread" : ""}`}
            onClick={() => setNotificationOpen((value) => !value)}
            aria-label={t("Notifications")}
          >
            <Bell size={19} />
            {unreadNotificationCount > 0 && (
              <span className="merchant-notification-count">{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</span>
            )}
          </button>

          <div className="merchant-dashboard-language">
            <span>🌐</span>
            <select
              value={dashboardLanguage}
              onChange={(e) => {
                const next = e.target.value;
                setDashboardLanguage(next);
                try { localStorage.setItem("timbermart_dashboard_language", next); } catch {}
              }}
              aria-label={t("Dashboard Language")}
            >
              {Object.entries(DASHBOARD_LANGUAGES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <button
            className="merchant-mini-profile"
            onClick={() =>
              navTo("profile")
            }
          >
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt=""
              />
            ) : (
              <span>
                {(profile?.name || "M")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}

            <strong>
              {profile?.name || "Merchant"}
            </strong>
          </button>

        </div>
      </header>

      {/* =================================================
          SIDEBAR OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <div
          className="merchant-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`merchant-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >

        <div className="merchant-sidebar-head">

          <div className="merchant-side-brand">
            <span>🌳</span>

            <div>
              <strong>TimberMart</strong>
              <small>{tx("Buy • Sell • Connect")}</small>
            </div>
          </div>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        <div className="merchant-account">

          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt=""
            />
          ) : (
            <div className="merchant-account-avatar">
              {(profile?.name || "M")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div>
            <strong>
              {profile?.name || "Merchant"}
            </strong>

            <span>
              Timber Merchant
            </span>

            <small>
              <MapPin size={11} />
              {profile?.location ||
                "Location not added"}
            </small>
          </div>

        </div>

        <nav className="merchant-nav">

          <button
            className={
              activeTab === "home"
                ? "active"
                : ""
            }
            onClick={() => {
              setActiveTab("home");
              setSidebarOpen(false);
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            <ShoppingBag size={18} />
            Buy / Timber
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              setShowSellModal(true);
            }}
          >
            <Plus size={18} />
            Sell Timber
          </button>

          <button
            onClick={() =>
              navTo("requirements")
            }
          >
            <ClipboardList size={18} />
            Requirement Wall
            <b>{requirements.length}</b>
          </button>

          <button
            onClick={() =>
              navTo("jobs")
            }
          >
            <BriefcaseBusiness size={18} />
            Jobs
            <b>{jobs.length}</b>
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              setShowJobModal(true);
            }}
          >
            <Plus size={18} />
            Post Job
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              document.querySelector(".merchant-workers-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Users size={18} />
            Find Workers
          </button>

          <button
            className="merchant-special-nav"
            onClick={() => {
              setSidebarOpen(false);
              document.querySelector(".merchant-patta-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            🌿
            Patta Teak Suppliers
            <b>{pattaTeakListings.length}</b>
          </button>

          <button
            className="merchant-special-nav imported"
            onClick={() => {
              setSidebarOpen(false);
              document.querySelector(".merchant-imported-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            🌎
            Imported Teak Suppliers
            <b>{importedTeakListings.length}</b>
          </button>

          <button
            className="merchant-location-nav"
            onClick={() => { setSidebarOpen(false); updateMerchantLocation(); }}
          >
            <LocateFixed size={18} />
            {locationBusy ? "Updating Location..." : "Update My Location"}
          </button>

          <div className="merchant-nav-divider" />

          <button
            onClick={() =>
              navTo("profile")
            }
          >
            <User size={18} />
            My Profile
          </button>

          <button
            onClick={() =>
              navTo("settings")
            }
          >
            <Settings size={18} />
            Settings
          </button>

        </nav>

        <div className="merchant-side-bottom">

          <div className="merchant-side-trust">
            <ShieldCheck size={18} />

            <div>
              <strong>
                Direct Contact
              </strong>

              <small>
                We Connect. You Deal Directly.
              </small>
            </div>
          </div>

          <button
            className="merchant-logout"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="merchant-main">

        {/* HERO */}

        <section className="merchant-hero">

          <div>

            <span className="merchant-role-badge">
              🪵 Timber Merchant
            </span>

            <h1>
              Buy. Sell.
              <br />
              <span>{t("Connect Directly.")}</span>
            </h1>

            <p>
              Find trees and timber, sell your
              products, post requirements and
              connect with workers.
            </p>

            <div className="merchant-location-row">
              <div className="merchant-location">
                <MapPin size={16} />
                {profile?.location || "Add your location"}
              </div>
              <button className="merchant-location-update" onClick={updateMerchantLocation} disabled={locationBusy}>
                <LocateFixed size={15} />
                {locationBusy ? "Updating..." : "Update GPS"}
              </button>
            </div>
            {locationMessage && <small className="merchant-location-message">{locationMessage}</small>}

          </div>

          <div className="merchant-hero-wood">
            <div>🪵</div>
            <span>{t("Timber Marketplace")}</span>
          </div>

        </section>

        {/* STATS */}

        <section className="merchant-stats">

          <div>
            <span>🪵</span>
            <strong>
              {
                listings.filter(
                  (x) =>
                    x.user_id ===
                    session?.user?.id
                ).length
              }
            </strong>
            <small>{t("My Listings")}</small>
          </div>

          <div>
            <span>📋</span>
            <strong>
              {requirements.length}
            </strong>
            <small>{t("Requirements")}</small>
          </div>

          <div>
            <span>👷</span>
            <strong>
              {workers.length}
            </strong>
            <small>{t("Workers")}</small>
          </div>

          <div>
            <span>💼</span>
            <strong>
              {jobs.length}
            </strong>
            <small>{t("Jobs")}</small>
          </div>

        </section>

        {/* QUICK ACTIONS */}

        <section className="merchant-quick-actions">

          <div className="merchant-section-title">
            <div>
              <span>{t("QUICK ACTIONS")}</span>
              <h2>
                What do you want to do?
              </h2>
            </div>
          </div>

          <div className="merchant-action-grid">

            <button
              onClick={() =>
                setShowSellModal(true)
              }
            >
              <div>🪵</div>
              <strong>{t("Sell Timber")}</strong>
              <small>
                Add timber listing & photos
              </small>
            </button>

            <button
              onClick={() =>
                setShowRequirementModal(true)
              }
            >
              <div>📋</div>
              <strong>
                Post Requirement
              </strong>
              <small>
                Find timber you need
              </small>
            </button>

            <button
              onClick={() =>
                setShowJobModal(true)
              }
            >
              <div>💼</div>
              <strong>{t("Post a Job")}</strong>
              <small>
                Connect with workers
              </small>
            </button>

            <button
              onClick={() =>
                document
                  .querySelector(
                    ".merchant-workers-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              <div>👷</div>
              <strong>
                Find Workers
              </strong>
              <small>
                Search nearby workers
              </small>
            </button>

          </div>

        </section>

        {/* BUY SEARCH */}

        <section className="merchant-buy-section">

          <div className="merchant-section-title">

            <div>
              <span>{t("BUY")}</span>
              <h2>
                Find Trees & Timber
              </h2>
            </div>

            <span className="merchant-count">
              {filteredListings.length} listings
            </span>

          </div>

          <div className="merchant-search-bar">

            <Search size={19} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={t("Search trees, timber, logs...")}
            />

            <button
              onClick={() =>
                setShowFilters(
                  (value) => !value
                )
              }
            >
              <SlidersHorizontal size={17} />{tx("Filter")}</button>

          </div>

          <div className="merchant-category-scroll">

            {CATEGORIES.map((item) => (
              <button
                key={item}
                className={
                  category === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory(item)
                }
              >
                {tx(item)}
              </button>
            ))}

          </div>

          {showFilters && (
            <div className="merchant-filter-panel">

              <div>
                <label>{t("Wood Type")}</label>

                <select
                  value={woodType}
                  onChange={(e) =>
                    setWoodType(e.target.value)
                  }
                >
                  {WOOD_TYPES.map((wood) => (
                    <option
                      key={wood}
                      value={wood}
                    >
                      {wood}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>{t("Location")}</label>

                <input
                  value={locationFilter}
                  onChange={(e) =>
                    setLocationFilter(
                      e.target.value
                    )
                  }
                  placeholder={dashboardLanguage === "te" ? "రాజమండ్రి..." : dashboardLanguage === "hi" ? "राजमुंदरी..." : dashboardLanguage === "ta" ? "ராஜமுந்திரி..." : dashboardLanguage === "kn" ? "ರಾಜಮಂದ್ರಿ..." : "Rajahmundry..."}
                />
              </div>

              <div>
                <label>{t("Max Price")}</label>

                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value)
                  }
                  placeholder="₹"
                />
              </div>

              <button
                onClick={() => {
                  setWoodType("All Types");
                  setLocationFilter("");
                  setMaxPrice("");
                }}
              >{tx("Clear")}</button>

            </div>
          )}

          {filteredListings.length === 0 ? (
            <div className="merchant-empty">
              <div>🪵</div>
              <h3>{tx("No listings found")}</h3>
              <p>
                No sellers have posted
                matching products yet.
              </p>
            </div>
          ) : (

            <div className="merchant-product-grid">

              {filteredListings.map(
                (listing) => {

                  const images = getImages(listing);
                  const image = images[0] || "";

                  const saved =
                    favourites.includes(
                      listing.id
                    );

                  return (
                    <article
                      className="merchant-product-card"
                      key={listing.id}
                    >

                      <div
                        className="merchant-product-photo merchant-photo-gallery-preview"
                        onClick={() => setSelectedListing(listing)}
                      >

                        {image ? (
                          <img src={image} alt={listing.title} />
                        ) : (
                          <div className="merchant-no-photo">🪵<small>{t("No photo")}</small></div>
                        )}

                        {images.length > 0 && (
                          <div className="merchant-photo-count-pill"><ImageIcon size={13} /> {images.length} photo{images.length > 1 ? "s" : ""}</div>
                        )}

                        <button
                          className={
                            saved
                              ? "saved"
                              : ""
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavourite(
                              listing.id
                            );
                          }}
                        >
                          <Heart
                            size={18}
                            fill={
                              saved
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>

                      </div>

                      {images.length > 0 && (
                        <div className="merchant-photo-strip" aria-label={t("All listing photos")}>
                          {images.map((url, photoIndex) => (
                            <button key={`${url}-${photoIndex}`} type="button" onClick={() => setSelectedListing(listing)} title={`Photo ${photoIndex + 1}`}>
                              <img src={url} alt="" />
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="merchant-product-body">

                        <span className="merchant-product-tag">
                          {listing.wood_type ||
                            "Timber"}
                        </span>

                        <h3>
                          {listing.title}
                        </h3>

                        <p>
                          <MapPin size={12} />
                          {listing.location ||
                            "Location not added"}
                        </p>

                        <strong>
                          {listing.price
                            ? `₹ ${listing.price}`
                            : "Price on contact"}
                        </strong>

                        {listing.quantity && (
                          <small>
                            Available:{" "}
                            {listing.quantity}
                          </small>
                        )}

                        <button
                          className="merchant-view-btn"
                          onClick={() =>
                            setSelectedListing(
                              listing
                            )
                          }
                        >{tx("View Details")}<ChevronRight
                            size={15}
                          />
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
            SPECIALTY SUPPLIER HUBS
        ================================================= */}
        <section className="merchant-special-section merchant-patta-section">
          <div className="merchant-special-header">
            <div>
              <span>{t("VERIFIED CATEGORY HUB")}</span>
              <h2>🌿 Patta Teak Suppliers</h2>
              <p>{t("Real merchant and seller listings tagged for Patta / Indian Teak.")}</p>
            </div>
            <span className="merchant-special-count">{pattaTeakListings.length}</span>
          </div>
          <div className="merchant-special-grid">
            {pattaTeakListings.length === 0 ? (
              <div className="merchant-empty-small merchant-special-empty">{t("No Patta Teak supplier listings yet.")}</div>
            ) : pattaTeakListings.map((listing) => {
              const images = getImages(listing);
              return (
                <article className="merchant-special-card" key={`patta-${listing.id}`} onClick={() => setSelectedListing(listing)}>
                  <div className="merchant-special-photo">
                    {images[0] ? <img src={images[0]} alt={listing.title} /> : <ImageIcon size={30} />}
                    {images.length > 1 && <span>{images.length} photos</span>}
                  </div>
                  <div><strong>{listing.title}</strong><small>{listing.location || "Location not added"}</small><b>{listing.wood_type || "Patta Teak"}</b></div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="merchant-special-section merchant-imported-section">
          <div className="merchant-special-header">
            <div>
              <span>{t("TRADE CATEGORY HUB")}</span>
              <h2>🌎 Imported Teak Suppliers</h2>
              <p>{t("Actual marketplace listings tagged for Imported / Burma / African / Malaysian teak.")}</p>
            </div>
            <span className="merchant-special-count">{importedTeakListings.length}</span>
          </div>
          <div className="merchant-special-grid">
            {importedTeakListings.length === 0 ? (
              <div className="merchant-empty-small merchant-special-empty">{t("No imported teak supplier listings yet.")}</div>
            ) : importedTeakListings.map((listing) => {
              const images = getImages(listing);
              return (
                <article className="merchant-special-card" key={`imported-${listing.id}`} onClick={() => setSelectedListing(listing)}>
                  <div className="merchant-special-photo">
                    {images[0] ? <img src={images[0]} alt={listing.title} /> : <ImageIcon size={30} />}
                    {images.length > 1 && <span>{images.length} photos</span>}
                  </div>
                  <div><strong>{listing.title}</strong><small>{listing.location || "Location not added"}</small><b>{listing.wood_type || "Imported Teak"}</b></div>
                </article>
              );
            })}
          </div>
        </section>

        {/* MY LISTINGS */}

        <section className="merchant-my-listings">

          <div className="merchant-section-title">

            <div>
              <span>{t("SELL")}</span>
              <h2>{tx("My Timber Listings")}</h2>
            </div>

            <button
              onClick={() =>
                setShowSellModal(true)
              }
            >
              <Plus size={16} />{tx("Add Listing")}</button>

          </div>

          <div className="merchant-my-list-grid">

            {listings.filter(
              (item) =>
                item.user_id ===
                session?.user?.id
            ).length === 0 ? (

              <div className="merchant-empty-small">
                <span>🪵</span>
                <strong>{tx("You have no listings yet.")}</strong>
                <button
                  onClick={() =>
                    setShowSellModal(true)
                  }
                >
                  Sell Timber
                </button>
              </div>

            ) : (

              listings
                .filter(
                  (item) =>
                    item.user_id ===
                    session?.user?.id
                )
                .map((listing) => (
                  <div
                    className="merchant-my-card"
                    key={listing.id}
                  >

                    <div className="merchant-my-photo-stack">
                      {getImages(listing).length ? getImages(listing).map((url, index) => (
                        <img key={`${url}-${index}`} src={url} alt="" onClick={() => setSelectedListing(listing)} />
                      )) : <div>🪵</div>}
                    </div>

                    <section>
                      <strong>
                        {listing.title}
                      </strong>

                      <span>
                        {listing.wood_type}
                      </span>

                      <small>
                        {listing.location}
                      </small>
                      <span className={`merchant-status-badge status-${String(listing.status || "approved").toLowerCase()}`}>
                        {String(listing.status || "approved").toLowerCase() === "pending" ? "Pending Admin Approval" : String(listing.status || "approved").toLowerCase() === "rejected" ? "Rejected" : "Approved & Live"}
                      </span>
                    </section>

                    <button
                      onClick={() =>
                        deleteListing(
                          listing
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                ))

            )}

          </div>

        </section>

        {/* REQUIREMENTS */}

        <section className="merchant-requirements-section">

          <div className="merchant-section-title">

            <div>
              <span>{t("REQUIREMENT WALL")}</span>
              <h2>{tx("Customer Requirements")}</h2>
            </div>

            <button
              onClick={() =>
                setShowRequirementModal(
                  true
                )
              }
            >
              <Plus size={16} />
              Post Requirement
            </button>

          </div>

          <div className="merchant-requirement-list">

            {requirements.length === 0 ? (

              <div className="merchant-empty">
                <div>📋</div>
                <h3>{tx("No requirements yet")}</h3>
                <p>
                  User-posted requirements
                  will appear here.
                </p>
              </div>

            ) : (

              requirements.map(
                (requirement) => (
                  <article
                    className="merchant-requirement-card"
                    key={requirement.id}
                  >

                    <div className="merchant-requirement-icon">
                      📋
                    </div>

                    <div>

                      <div className="merchant-card-top">
                        <span>
                          {requirement.category_label ||
                            requirement.category ||
                            "Requirement"}
                        </span>

                        <small>
                          {formatDate(
                            requirement.created_at
                          )}
                        </small>
                      </div>

                      <h3>
                        {requirement.title}
                      </h3>

                      <p>
                        <MapPin size={12} />
                        {requirement.location ||
                          "Location not added"}
                      </p>

                      <div className="merchant-requirement-meta">

                        {requirement.quantity && (
                          <span>
                            Quantity:{" "}
                            {requirement.quantity}
                          </span>
                        )}

                        {requirement.budget && (
                          <span>
                            Budget: ₹{" "}
                            {requirement.budget}
                          </span>
                        )}

                      </div>

                      <button
                        onClick={() =>
                          setSelectedRequirement(
                            requirement
                          )
                        }
                      >{tx("View Requirement")}<ChevronRight
                          size={15}
                        />
                      </button>

                    </div>

                  </article>
                )
              )

            )}

          </div>

        </section>

        {/* JOBS */}

        <section className="merchant-jobs-section">

          <div className="merchant-section-title">

            <div>
              <span>{t("JOBS")}</span>
              <h2>{tx("Find / Post Workers")}</h2>
            </div>

            <button
              onClick={() =>
                setShowJobModal(true)
              }
            >
              <Plus size={16} />
              Post Job
            </button>

          </div>

          <div className="merchant-job-grid">

            {jobs.length === 0 ? (

              <div className="merchant-empty">
                <div>💼</div>
                <h3>{tx("No jobs posted")}</h3>
                <p>
                  Post a job to connect
                  with workers.
                </p>
              </div>

            ) : (

              jobs.map((job) => (
                <article
                  className="merchant-job-card"
                  key={job.id}
                >

                  <div className="merchant-job-icon">
                    💼
                  </div>

                  <div>

                    <div className="merchant-job-header">
                      <span>
                        {job.category ||
                          "Job"}
                      </span>

                      {job.user_id ===
                        session?.user?.id && (
                        <button
                          onClick={() =>
                            deleteJob(job)
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <h3>
                      {job.title}
                    </h3>

                    <p>
                      <MapPin size={12} />
                      {job.location ||
                        "Location not added"}
                    </p>

                    <div className="merchant-job-info">

                      <span>
                        {job.job_type ||
                          "Work"}
                      </span>

                      <span>
                        {job.experience ||
                          "Experience not specified"}
                      </span>

                      {job.salary && (
                        <span>
                          ₹ {job.salary}
                        </span>
                      )}

                    </div>

                    {job.description && (
                      <p className="merchant-job-description">
                        {job.description}
                      </p>
                    )}

                  </div>

                </article>
              ))

            )}

          </div>

        </section>

        {/* WORKERS */}

        <section className="merchant-workers-section">

          <div className="merchant-section-title">

            <div>
              <span>{t("FIND WORKERS")}</span>
              <h2>{tx("Nearby / Available Workers")}</h2>
            </div>

            <span className="merchant-count">
              {workers.length} workers
            </span>

          </div>

          <div className="merchant-worker-search">

            <Search size={17} />

            <input
              placeholder={t("Search workers by name or location...")}
              onChange={(e) => {
                const value =
                  e.target.value.toLowerCase();

                const filtered =
                  workers.filter(
                    (worker) =>
                      String(
                        worker.name || ""
                      )
                        .toLowerCase()
                        .includes(value) ||
                      String(
                        worker.location || ""
                      )
                        .toLowerCase()
                        .includes(value) ||
                      String(
                        worker.bio || ""
                      )
                        .toLowerCase()
                        .includes(value)
                  );

                setWorkers(
                  value
                    ? filtered
                    : workers
                );
              }}
            />

          </div>

          {workers.length === 0 ? (

            <div className="merchant-empty">
              <div>👷</div>
              <h3>{tx("No worker profiles yet")}</h3>
              <p>
                Workers who create profiles
                will appear here.
              </p>
            </div>

          ) : (

            <div className="merchant-worker-grid">

              {workers.map((worker) => (
                <article
                  className="merchant-worker-card"
                  key={worker.id}
                >

                  <div className="merchant-worker-avatar">

                    {worker.photo_url ? (
                      <img
                        src={
                          worker.photo_url
                        }
                        alt=""
                      />
                    ) : (
                      <span>
                        {(worker.name ||
                          "W")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}

                  </div>

                  <h3>
                    {worker.name ||
                      "Worker"}
                  </h3>

                  <span className="merchant-worker-role">{tx("Worker")}</span>

                  {worker.location && (
                    <p>
                      <MapPin size={12} />
                      {worker.location}
                    </p>
                  )}

                  {worker.bio && (
                    <p className="merchant-worker-bio">
                      {worker.bio}
                    </p>
                  )}

                  <div className="merchant-worker-actions">

                    <button
                      onClick={() =>
                        openProfile(
                          worker.id
                        )
                      }
                    >{tx("View Profile")}</button>

                    <button
                      onClick={() =>
                        callUser(
                          worker.id,
                          worker.phone
                        )
                      }
                    >
                      <Phone size={15} />
                    </button>

                    <button
                      onClick={() =>
                        openChat(worker)
                      }
                    >
                      <MessageCircle
                        size={15}
                      />
                    </button>

                  </div>

                </article>
              ))}

            </div>

          )}

        </section>

        {/* TRUST */}

        <footer className="merchant-footer">

          <div className="merchant-disclaimer">

            <ShieldCheck size={30} />

            <div>
              <strong>{tx("TimberMart only connects users.")}</strong>

              <p>
                TimberMart does not provide
                payments, transactions,
                employment, delivery or
                other arrangements.
                All terms are directly
                between the parties.
              </p>
            </div>

          </div>

          <div className="merchant-footer-items">

            <span>
              <ShieldCheck size={16} />{tx("No Payments")}</span>

            <span>
              <span>💼</span>{tx("No Commission")}</span>

            <span>
              <Phone size={16} />
              Direct Contact
            </span>

            <span>
              <MapPin size={16} />{tx("Nearby Connect")}</span>

            <strong>
              🤝 We Connect. You Deal Directly.
            </strong>

          </div>

        </footer>

      </main>

      {/* =================================================
          NOTIFICATION PANEL
      ================================================= */}
      {notificationOpen && (
        <div className="merchant-notification-popover" onClick={() => setNotificationOpen(false)}>
          <section className="merchant-notification-panel" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <span>{t("LIVE UPDATES")}</span>
                <h3>Notifications {unreadNotificationCount > 0 && <b>{unreadNotificationCount} new</b>}</h3>
              </div>
              <div className="merchant-notification-actions">
                <button onClick={markAllNotificationsRead} disabled={notificationBusy || !unreadNotificationCount}>{t("Mark all read")}</button>
                <button onClick={() => setNotificationOpen(false)}><X size={18} /></button>
              </div>
            </header>

            <div className="merchant-notification-list">
              {notifications.length === 0 ? (
                <div className="merchant-notification-empty">
                  <Bell size={28} />
                  <strong>{t("No notifications yet")}</strong>
                  <p>{t("Admin approvals, nearby activity and marketplace updates will appear here.")}</p>
                </div>
              ) : notifications.map((item) => {
                const distance = notificationDistance(item);
                const admin = item.source === "admin" || item.source === "admin_post" || item.sender_name === "TimberMart Admin";
                const near = Number.isFinite(distance) && distance <= 40;
                return (
                  <button
                    className={`merchant-notification-item ${item.is_read ? "read" : "unread"}`}
                    key={item.id}
                    onClick={async () => {
                      await markNotificationRead(item.id);
                      setNotificationOpen(false);
                      if (item.listing_id) {
                        const { data } = await supabase.from("listings").select(`*, listing_images(id,image_url,storage_path,sort_order)`).eq("id", item.listing_id).maybeSingle();
                        if (data) setSelectedListing(data);
                      }
                    }}
                  >
                    {item.image_url ? <img src={item.image_url} alt="" className="merchant-notification-image" /> : <span className="merchant-notification-icon">{admin ? "🛡️" : near ? "📍" : "🔔"}</span>}
                    <span className="merchant-notification-copy">
                      <span className="merchant-notification-title">{item.title || "TimberMart Update"}</span>
                      <span className="merchant-notification-message">{item.message}</span>
                      <span className="merchant-notification-meta">
                        {admin && <b>{t("ADMIN")}</b>}
                        {near && <b className="near">NEARBY • {distance.toFixed(1)} KM</b>}
                        <time>{formatDate(item.created_at)}</time>
                      </span>
                    </span>
                    {!item.is_read && <i />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* =================================================
          SELL MODAL
      ================================================= */}

      {showSellModal && (
        <div className="merchant-modal-backdrop" onClick={() => setShowSellModal(false)}>
          <div className="merchant-form-modal merchant-sell-tree-modal" onClick={(e) => e.stopPropagation()}>
            <div className="merchant-modal-head merchant-sell-head">
              <div>
                <span>{getSellFormText(sellLanguage).sell}</span>
                <h2>{getSellFormText(sellLanguage).title}</h2>
                <p className="merchant-sell-subtitle">{t("Teak • Old Wood • Fire Wood • Timber Products")}</p>
              </div>
              <div className="merchant-sell-head-actions">
                <select
                  className="merchant-language-select"
                  value={sellLanguage}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSellLanguage(next);
                    localStorage.setItem("timbermart_sell_language", next);
                  }}
                  aria-label="Sell form language"
                >
                  {Object.entries(SELL_FORM_LANGUAGES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowSellModal(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSellTimber} className="merchant-form merchant-sell-form">
              {(() => {
                const T = getSellFormText(sellLanguage);
                const subtypeOptions =
                  sellForm.wood_type === "Teak"
                    ? TEAK_TYPES
                    : sellForm.wood_type === "Old Wood"
                    ? OLD_WOOD_TYPES
                    : sellForm.wood_type === "Fire Wood"
                    ? FIREWOOD_TYPES
                    : [];

                return (
                  <>
                    <label>
                      {T.listingTitle} *
                      <input
                        value={sellForm.title}
                        onChange={(e) => setSellForm({ ...sellForm, title: e.target.value })}
                        placeholder={T.titlePlaceholder}
                        required
                      />
                    </label>

                    <div className="merchant-form-two">
                      <label>
                        {T.woodType} *
                        <select
                          value={sellForm.wood_type}
                          onChange={(e) => {
                            const wood_type = e.target.value;
                            const group =
                              wood_type === "Teak" ? "teak_type" :
                              wood_type === "Old Wood" ? "old_wood_type" :
                              wood_type === "Fire Wood" ? "firewood_type" : "";
                            setSellForm({
                              ...sellForm,
                              wood_type,
                              wood_subtype: "",
                              wood_subtype_group: group,
                            });
                          }}
                          required
                        >
                          <option value="">{T.selectWood}</option>
                          {WOOD_TYPES.slice(1).map((wood) => (
                            <option key={wood} value={wood}>{localizeOption(wood, sellLanguage)}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {T.productType}
                        <select
                          value={sellForm.product_type}
                          onChange={(e) => setSellForm({ ...sellForm, product_type: e.target.value })}
                        >
                          {["Timber", "Wood Logs", "Timber Planks", "Beams", "Battens", "Plywood", "Doors", "Frames", "Furniture", "Interior", "Other"].map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {sellForm.wood_type === "Teak" && (
                      <label className="merchant-dependent-field">
                        {T.teakType} *
                        <select
                          value={sellForm.wood_subtype}
                          onChange={(e) => setSellForm({ ...sellForm, wood_subtype: e.target.value, wood_subtype_group: "teak_type" })}
                          required
                        >
                          <option value="">{T.selectTeak}</option>
                          {TEAK_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <small>Balarsa, Indian Patta, Bastar, MP, Gujarat, Maharashtra, Dandeli, Nilambur and more.</small>
                      </label>
                    )}

                    {sellForm.wood_type === "Old Wood" && (
                      <label className="merchant-dependent-field">
                        {T.oldWoodType} *
                        <select
                          value={sellForm.wood_subtype}
                          onChange={(e) => setSellForm({ ...sellForm, wood_subtype: e.target.value, wood_subtype_group: "old_wood_type" })}
                          required
                        >
                          <option value="">{T.selectOldWood}</option>
                          {OLD_WOOD_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                    )}

                    {sellForm.wood_type === "Fire Wood" && (
                      <label className="merchant-dependent-field">
                        {T.firewoodType} *
                        <select
                          value={sellForm.wood_subtype}
                          onChange={(e) => setSellForm({ ...sellForm, wood_subtype: e.target.value, wood_subtype_group: "firewood_type" })}
                          required
                        >
                          <option value="">{T.selectFirewood}</option>
                          {FIREWOOD_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <small>Cashew, Mango, Palm, Coconut, Teak and other common firewood options.</small>
                      </label>
                    )}

                    <div className="merchant-form-two">
                      <label>
                        {T.quantity}
                        <input value={sellForm.quantity} onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })} placeholder={T.quantityPlaceholder} />
                      </label>
                      <label>
                        {T.location}
                        <input value={sellForm.location} onChange={(e) => setSellForm({ ...sellForm, location: e.target.value })} placeholder={T.locationPlaceholder} />
                      </label>
                    </div>

                    <div className="merchant-form-two">
                      <label>
                        {T.price}
                        <input value={sellForm.price} onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })} placeholder={T.pricePlaceholder} />
                      </label>
                      <label>
                        {T.priceType}
                        <select
                          value={sellForm.price_type}
                          onChange={(e) => setSellForm({ ...sellForm, price_type: e.target.value })}
                        >
                          <option value="Fixed Price">{T.fixed}</option>
                          <option value="Negotiable">{T.negotiable}</option>
                        </select>
                      </label>
                    </div>

                    <label>
                      {T.description}
                      <textarea
                        value={sellForm.description}
                        onChange={(e) => setSellForm({ ...sellForm, description: e.target.value })}
                        placeholder={T.descriptionPlaceholder}
                        rows="4"
                      />
                    </label>

                    <div className="merchant-photo-upload">
                      <div className="merchant-upload-title">
                        <ImagePlus size={18} />
                        <strong>{T.photos}</strong>
                        <small>{T.photosHint}</small>
                      </div>
                      <label className="merchant-upload-box">
                        <ImagePlus size={27} />
                        <span>{T.addPhotos}</span>
                        <small>{T.formats}</small>
                        <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} />
                      </label>

                      {sellPhotos.length > 0 && (
                        <div className="merchant-photo-grid">
                          {sellPhotos.map((file, index) => (
                            <div key={`${file.name}-${index}`}>
                              <img src={URL.createObjectURL(file)} alt="" />
                              <button type="button" onClick={() => removeSellPhoto(index)} aria-label="Remove photo">
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button className="merchant-submit-btn merchant-sell-submit" disabled={selling}>
                      {selling ? T.submitting : T.submit}
                    </button>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          REQUIREMENT MODAL
      ================================================= */}

      {showRequirementModal && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setShowRequirementModal(
              false
            )
          }
        >

          <div
            className="merchant-form-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="merchant-modal-head">

              <div>
                <span>
                  REQUIREMENT WALL
                </span>

                <h2>{tx("Post Your Requirement")}</h2>
              </div>

              <button
                onClick={() =>
                  setShowRequirementModal(
                    false
                  )
                }
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="merchant-form"
              onSubmit={
                handleRequirementPost
              }
            >

              <label>{tx("Requirement Title *")}<input
                  value={
                    requirementForm.title
                  }
                  onChange={(e) =>
                    setRequirementForm({
                      ...requirementForm,
                      title:
                        e.target.value,
                    })
                  }
                  placeholder={tx("Need 25 CMT Teak Timber")}
                  required
                />
              </label>

              <div className="merchant-form-two">

                <label>{tx("Category")}<select
                    value={
                      requirementForm.category
                    }
                    onChange={(e) =>
                      setRequirementForm({
                        ...requirementForm,
                        category:
                          e.target.value,
                      })
                    }
                  >
                    <option>{tx("Timber")}</option>
                    <option>{tx("Trees")}</option>
                    <option>{tx("Logs")}</option>
                    <option>{tx("Doors")}</option>
                    <option>{tx("Furniture")}</option>
                    <option>{tx("Other")}</option>
                  </select>
                </label>

                <label>
                  Quantity
                  <input
                    value={
                      requirementForm.quantity
                    }
                    onChange={(e) =>
                      setRequirementForm({
                        ...requirementForm,
                        quantity:
                          e.target.value,
                      })
                    }
                    placeholder={tx("25 CMT")}
                  />
                </label>

              </div>

              <label>
                Location
                <input
                  value={
                    requirementForm.location
                  }
                  onChange={(e) =>
                    setRequirementForm({
                      ...requirementForm,
                      location:
                        e.target.value,
                    })
                  }
                  placeholder={tx("Rajahmundry, AP")}
                />
              </label>

              <label>{tx("Budget")}<input
                  value={
                    requirementForm.budget
                  }
                  onChange={(e) =>
                    setRequirementForm({
                      ...requirementForm,
                      budget:
                        e.target.value,
                    })
                  }
                  placeholder={tx("₹ 4,00,000 approx.")}
                />
              </label>

              <label>
                Description
                <textarea
                  value={
                    requirementForm.description
                  }
                  onChange={(e) =>
                    setRequirementForm({
                      ...requirementForm,
                      description:
                        e.target.value,
                    })
                  }
                  rows="4"
                  placeholder={tx("Explain what timber/product you need...")}
                />
              </label>

              <button
                className="merchant-submit-btn"
                disabled={
                  postingRequirement
                }
              >
                {postingRequirement
                  ? "Posting..."
                  : "Post Requirement"}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          JOB MODAL
      ================================================= */}

      {showJobModal && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setShowJobModal(false)
          }
        >

          <div
            className="merchant-form-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="merchant-modal-head">

              <div>
                <span>{tx("JOBS")}</span>

                <h2>
                  Post a Job
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowJobModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="merchant-form"
              onSubmit={handleJobPost}
            >

              <label>{tx("Job Title *")}<input
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      title:
                        e.target.value,
                    })
                  }
                  placeholder={tx("Saw Mill Machine Operator")}
                  required
                />
              </label>

              <div className="merchant-form-two">

                <label>{tx("Job Category")}<select
                    value={
                      jobForm.category
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        category:
                          e.target.value,
                      })
                    }
                  >
                    {JOB_CATEGORIES.map(
                      (item) => (
                        <option
                          key={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>{tx("Job Type")}<select
                    value={
                      jobForm.job_type
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        job_type:
                          e.target.value,
                      })
                    }
                  >
                    <option>{tx("Full Time")}</option>
                    <option>{tx("Part Time")}</option>
                    <option>{tx("Project Based")}</option>
                  </select>
                </label>

              </div>

              <div className="merchant-form-two">

                <label>{tx("Experience")}<select
                    value={
                      jobForm.experience
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        experience:
                          e.target.value,
                      })
                    }
                  >
                    {EXPERIENCE_OPTIONS.map(
                      (item) => (
                        <option
                          key={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>{tx("Salary")}<input
                    value={jobForm.salary}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        salary:
                          e.target.value,
                      })
                    }
                    placeholder={tx("₹ 18,000 - ₹ 25,000 / Month")}
                  />
                </label>

              </div>

              <div className="merchant-form-two">

                <label>
                  Location
                  <input
                    value={jobForm.location}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        location:
                          e.target.value,
                      })
                    }
                    placeholder={tx("Rajahmundry, AP")}
                  />
                </label>

                <label>{tx("Number of Positions")}<input
                    type="number"
                    min="1"
                    value={
                      jobForm.positions
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        positions:
                          e.target.value,
                      })
                    }
                  />
                </label>

              </div>

              <div className="merchant-checkbox-row">

                <label>
                  <input
                    type="checkbox"
                    checked={
                      jobForm.accommodation
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        accommodation:
                          e.target.checked,
                      })
                    }
                  />{tx("Accommodation Available")}</label>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      jobForm.food
                    }
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        food:
                          e.target.checked,
                      })
                    }
                  />{tx("Food Available")}</label>

              </div>

              <label>{tx("Job Description")}<textarea
                  rows="5"
                  value={
                    jobForm.description
                  }
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      description:
                        e.target.value,
                    })
                  }
                  placeholder={tx("Describe the work, responsibilities and requirements...")}
                />
              </label>

              <button
                className="merchant-submit-btn"
                disabled={postingJob}
              >
                {postingJob
                  ? "Posting..."
                  : "Post Job"}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          PRODUCT DETAILS
      ================================================= */}

      {selectedListing && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setSelectedListing(null)
          }
        >

          <div
            className="merchant-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="merchant-detail-close"
              onClick={() =>
                setSelectedListing(null)
              }
            >
              <X size={20} />
            </button>

            {(() => {
              const detailImages = getImages(selectedListing);
              const activeIndex = Math.min(listingViewer.index, Math.max(detailImages.length - 1, 0));
              return (
                <div className="merchant-detail-gallery">
                  <div className="merchant-detail-image merchant-detail-image-large">
                    {detailImages.length ? (
                      <img src={detailImages[activeIndex] || detailImages[0]} alt={selectedListing.title} />
                    ) : <div>🪵</div>}
                    {detailImages.length > 1 && (
                      <>
                        <button className="merchant-gallery-nav prev" onClick={() => setListingViewer((v) => ({ open: true, index: (activeIndex - 1 + detailImages.length) % detailImages.length }))}><ChevronLeft size={20} /></button>
                        <button className="merchant-gallery-nav next" onClick={() => setListingViewer((v) => ({ open: true, index: (activeIndex + 1) % detailImages.length }))}><ChevronRight size={20} /></button>
                      </>
                    )}
                    {detailImages.length > 0 && <span className="merchant-gallery-counter">{activeIndex + 1} / {detailImages.length}</span>}
                  </div>
                  {detailImages.length > 0 && (
                    <div className="merchant-detail-thumbs">
                      {detailImages.map((url, index) => (
                        <button key={`${url}-${index}`} className={index === activeIndex ? "active" : ""} onClick={() => setListingViewer({ open: true, index })}>
                          <img src={url} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="merchant-detail-body">

              <span className="merchant-detail-tag">
                {selectedListing.wood_type ||
                  "Timber"}
              </span>

              <h2>
                {selectedListing.title}
              </h2>

              <strong className="merchant-detail-price">
                {selectedListing.price
                  ? `₹ ${selectedListing.price}`
                  : "Price on contact"}
              </strong>

              <div className="merchant-detail-pills">

                <span>
                  <Package size={15} />
                  {selectedListing.quantity ||
                    "Quantity not specified"}
                </span>

                <span>
                  <MapPin size={15} />
                  {selectedListing.location ||
                    "Location not specified"}
                </span>

              </div>

              <div className="merchant-detail-info">

                <h3>{tx("Product Information")}</h3>

                <div>
                  <span>
                    Wood Type
                  </span>

                  <strong>
                    {selectedListing.wood_type ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>{tx("Product Type")}</span>

                  <strong>
                    {selectedListing.product_type ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Quantity
                  </span>

                  <strong>
                    {selectedListing.quantity ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Location
                  </span>

                  <strong>
                    {selectedListing.location ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>{tx("Posted")}</span>

                  <strong>
                    {formatDate(
                      selectedListing.created_at
                    )}
                  </strong>
                </div>

              </div>

              {selectedListing.description && (
                <div className="merchant-detail-description">

                  <h3>
                    Description
                  </h3>

                  <p>
                    {
                      selectedListing.description
                    }
                  </p>

                </div>
              )}

              <div className="merchant-detail-seller">

                <div>
                  <User size={19} />
                </div>

                <section>
                  <small>{tx("Seller")}</small>

                  <strong>{tx("View Seller Profile")}</strong>
                </section>

                <button
                  onClick={() =>
                    openProfile(
                      selectedListing.user_id
                    )
                  }
                >
                  <ExternalLink
                    size={16}
                  />
                </button>

              </div>

              <div className="merchant-contact-grid">

                <button
                  onClick={() =>
                    callUser(
                      selectedListing.user_id
                    )
                  }
                >
                  <Phone size={17} />{tx("Call")}</button>

                <button
                  onClick={async () => {
                    const { data } =
                      await supabase
                        .from("profiles")
                        .select("*")
                        .eq(
                          "id",
                          selectedListing.user_id
                        )
                        .maybeSingle();

                    if (data) {
                      openChat(data);
                    }
                  }}
                >
                  <MessageCircle
                    size={17}
                  />{tx("Chat")}</button>

                <button
                  onClick={() =>
                    whatsappUser(
                      selectedListing.user_id
                    )
                  }
                >{tx("WhatsApp")}</button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          REQUIREMENT DETAILS
      ================================================= */}

      {selectedRequirement && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setSelectedRequirement(null)
          }
        >

          <div
            className="merchant-simple-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="merchant-detail-close"
              onClick={() =>
                setSelectedRequirement(
                  null
                )
              }
            >
              <X size={20} />
            </button>

            <span className="merchant-detail-tag">
              {selectedRequirement.category_label ||
                selectedRequirement.category ||
                "Requirement"}
            </span>

            <h2>
              {selectedRequirement.title}
            </h2>

            <div className="merchant-requirement-detail-grid">

              <div>
                <MapPin size={16} />
                <span>
                  Location
                </span>
                <strong>
                  {selectedRequirement.location ||
                    "-"}
                </strong>
              </div>

              <div>
                <Package size={16} />
                <span>{tx("Required Quantity")}</span>
                <strong>
                  {selectedRequirement.quantity ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>₹</span>
                <span>{tx("Budget")}</span>
                <strong>
                  {selectedRequirement.budget ||
                    "-"}
                </strong>
              </div>

            </div>

            {selectedRequirement.description && (
              <div className="merchant-detail-description">
                <h3>
                  Description
                </h3>

                <p>
                  {
                    selectedRequirement.description
                  }
                </p>
              </div>
            )}

            <div className="merchant-requirement-actions">

              <button
                onClick={() =>
                  openProfile(
                    selectedRequirement.user_id
                  )
                }
              >
                <User size={17} />{tx("View Profile")}</button>

              <button
                onClick={() =>
                  callUser(
                    selectedRequirement.user_id
                  )
                }
              >
                <Phone size={17} />{tx("Call")}</button>

              <button
                onClick={async () => {
                  const { data } =
                    await supabase
                      .from("profiles")
                      .select("*")
                      .eq(
                        "id",
                        selectedRequirement.user_id
                      )
                      .maybeSingle();

                  if (data) {
                    openChat(data);
                  }
                }}
              >
                <MessageCircle
                  size={17}
                />{tx("Chat")}</button>

            </div>

            {selectedRequirement.user_id ===
              session?.user?.id && (
              <button
                className="merchant-delete-full"
                onClick={() =>
                  deleteRequirement(
                    selectedRequirement
                  )
                }
              >
                <Trash2 size={16} />{tx("Delete Requirement")}</button>
            )}

          </div>

        </div>
      )}

      {/* =================================================
          WORKER / SELLER PROFILE
      ================================================= */}

      {selectedSeller && (
        <div
          className="merchant-modal-backdrop"
          onClick={() =>
            setSelectedSeller(null)
          }
        >

          <div
            className="merchant-profile-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="merchant-detail-close"
              onClick={() =>
                setSelectedSeller(null)
              }
            >
              <X size={20} />
            </button>

            <div className="merchant-profile-cover" />

            <div className="merchant-profile-avatar">

              {selectedSeller.photo_url ? (
                <img
                  src={
                    selectedSeller.photo_url
                  }
                  alt=""
                />
              ) : (
                <span>
                  {(selectedSeller.name ||
                    "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

            </div>

            <div className="merchant-profile-body">

              <h2>
                {selectedSeller.name ||
                  "TimberMart User"}
              </h2>

              <span className="merchant-profile-role">
                {roleName(
                  selectedSeller.role
                )}
              </span>

              {selectedSeller.location && (
                <p>
                  <MapPin size={14} />
                  {selectedSeller.location}
                </p>
              )}

              {selectedSeller.bio && (
                <div className="merchant-about">
                  <h3>{tx("About")}</h3>

                  <p>
                    {selectedSeller.bio}
                  </p>
                </div>
              )}

              <div className="merchant-profile-actions">

                <button
                  onClick={() =>
                    callUser(
                      selectedSeller.id,
                      selectedSeller.phone
                    )
                  }
                >
                  <Phone size={17} />{tx("Call")}</button>

                <button
                  onClick={() =>
                    openChat(
                      selectedSeller
                    )
                  }
                >
                  <MessageCircle
                    size={17}
                  />{tx("Chat")}</button>

                <button
                  onClick={() =>
                    whatsappUser(
                      selectedSeller.id,
                      selectedSeller.phone,
                      selectedSeller.name
                    )
                  }
                >{tx("WhatsApp")}</button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          CHAT
      ================================================= */}

      {chatOpen && chatUser && (
        <div
          className="merchant-chat-backdrop"
          onClick={() =>
            setChatOpen(false)
          }
        >

          <div
            className="merchant-chat"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <header>

              <button
                onClick={() =>
                  setChatOpen(false)
                }
              >
                <ChevronLeft size={20} />
              </button>

              <div>

                {chatUser.photo_url ? (
                  <img
                    src={
                      chatUser.photo_url
                    }
                    alt=""
                  />
                ) : (
                  <span>
                    {(chatUser.name ||
                      "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <section>
                  <strong>
                    {chatUser.name ||
                      "TimberMart User"}
                  </strong>

                  <small>
                    Direct Contact
                  </small>
                </section>

              </div>

              <button
                onClick={() =>
                  callUser(
                    chatUser.id,
                    chatUser.phone
                  )
                }
              >
                <Phone size={18} />
              </button>

            </header>

            <div className="merchant-chat-body">

              {messages.length === 0 ? (

                <div className="merchant-chat-empty">
                  <MessageCircle
                    size={35}
                  />

                  <strong>{tx("Start a conversation")}</strong>

                  <p>
                    Ask about timber,
                    requirements, jobs or
                    work details.
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
                        className={
                          mine
                            ? "merchant-message mine"
                            : "merchant-message"
                        }
                        key={message.id}
                      >

                        <div>
                          {message.body}
                        </div>

                        <small>
                          {new Date(
                            message.created_at
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute:
                                "2-digit",
                            }
                          )}
                        </small>

                      </div>
                    );
                  }
                )

              )}

            </div>

            <div className="merchant-chat-input">

              <input
                value={messageText}
                onChange={(e) =>
                  setMessageText(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={tx("Type a message...")}
              />

              <button
                onClick={sendMessage}
                disabled={
                  sendingMessage ||
                  !messageText.trim()
                }
              >
                <Send size={18} />
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
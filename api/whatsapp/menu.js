
const REQUIREMENT_FLOW_URL =
  "https://whatsapp.phone91.com/whatsapp-hook-flow/?flow_page=true&flow_id=239";

// Listing Flow create chesaka ikkada URL add cheyyali.
const LISTING_FLOW_URL = "";

const LANGUAGE_NAMES = {
  te: "Telugu",
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
};

const MESSAGES = {
  en: {
    welcome: (name) =>
      `🌳 *Welcome to TimberMart, ${name}!*\n\nThank you for choosing our platform.`,
    menu:
      `Please select an option:\n\n` +
      `1️⃣ Post Timber Requirement\n` +
      `2️⃣ Post Timber Listing / Sell\n` +
      `3️⃣ My Requirements\n` +
      `4️⃣ My Listings\n` +
      `5️⃣ Help\n` +
      `6️⃣ Change Language\n\n` +
      `Reply with a number from 1 to 6.`,
    requirement:
      `🌳 *Post Timber Requirement*\n\n` +
      `Click below to fill your requirement form:\n\n` +
      `${REQUIREMENT_FLOW_URL}\n\n` +
      `After submission, your requirement will be sent for admin approval.`,
    listing:
      `🌳 *Post Timber Listing*\n\n` +
      `The listing form is being prepared. Please try again later.`,
    requirements:
      `🌳 *My Requirements*\n\n` +
      `Your submitted requirements will be available here soon.`,
    listings:
      `🌳 *My Listings*\n\n` +
      `Your submitted listings will be available here soon.`,
    help:
      `🌳 *TimberMart Help*\n\n` +
      `1 - Post Timber Requirement\n` +
      `2 - Post Timber Listing\n` +
      `3 - My Requirements\n` +
      `4 - My Listings\n` +
      `5 - Help\n` +
      `6 - Change Language\n\n` +
      `Website: https://www.timbermart.co.in`,
    changeLanguage:
      `🌐 *Choose Your Language*\n\n` +
      `1️⃣ Telugu\n` +
      `2️⃣ English\n` +
      `3️⃣ Hindi\n` +
      `4️⃣ Tamil`,
    invalid:
      `Invalid option. Please reply with a number from 1 to 6.`,
  },

  te: {
    welcome: (name) =>
      `🌳 *TimberMart ki Swagatham, ${name}!*\n\nMaa platform ni choose chesinandhuku thank you.`,
    menu:
      `Mee option select cheyyandi:\n\n` +
      `1️⃣ Timber Requirement Post cheyyandi\n` +
      `2️⃣ Timber Listing / Sell cheyyandi\n` +
      `3️⃣ My Requirements\n` +
      `4️⃣ My Listings\n` +
      `5️⃣ Help\n` +
      `6️⃣ Change Language\n\n` +
      `1 nunchi 6 varaku number pampinchandi.`,
    requirement:
      `🌳 *Timber Requirement Post cheyyandi*\n\n` +
      `Mee requirement form fill cheyyadaniki ee link click cheyyandi:\n\n` +
      `${REQUIREMENT_FLOW_URL}\n\n` +
      `Submit chesina tarvatha admin approval ki velthundhi.`,
    listing:
      `🌳 *Timber Listing / Sell*\n\nListing form ready avuthundhi. Konchem tarvatha try cheyyandi.`,
    requirements:
      `🌳 *My Requirements*\n\nMee submitted requirements ikkada chupistham.`,
    listings:
      `🌳 *My Listings*\n\nMee submitted listings ikkada chupistham.`,
    help:
      `🌳 *TimberMart Help*\n\n` +
      `1 - Timber Requirement\n` +
      `2 - Timber Listing\n` +
      `3 - My Requirements\n` +
      `4 - My Listings\n` +
      `5 - Help\n` +
      `6 - Change Language\n\n` +
      `Website: https://www.timbermart.co.in`,
    changeLanguage:
      `🌐 *Mee Language Select Cheyyandi*\n\n` +
      `1️⃣ Telugu\n2️⃣ English\n3️⃣ Hindi\n4️⃣ Tamil`,
    invalid:
      `Invalid option. Dayachesi 1 nunchi 6 varaku number pampinchandi.`,
  },

  hi: {
    welcome: (name) =>
      `🌳 *TimberMart mein aapka swagat hai, ${name}!*\n\nHamare platform ko chunne ke liye dhanyavaad.`,
    menu:
      `Kripya ek option chunein:\n\n` +
      `1️⃣ Timber Requirement Post\n` +
      `2️⃣ Timber Listing / Sell\n` +
      `3️⃣ My Requirements\n` +
      `4️⃣ My Listings\n` +
      `5️⃣ Help\n` +
      `6️⃣ Change Language\n\n` +
      `1 se 6 tak number bhejein.`,
    requirement:
      `🌳 *Timber Requirement*\n\nForm bharne ke liye link par click karein:\n\n${REQUIREMENT_FLOW_URL}`,
    listing:
      `🌳 *Timber Listing*\n\nListing form jald hi available hoga.`,
    requirements:
      `🌳 *My Requirements*\n\nAapki requirements yahan dikhayi jayengi.`,
    listings:
      `🌳 *My Listings*\n\nAapki listings yahan dikhayi jayengi.`,
    help:
      `🌳 *TimberMart Help*\n\n1 - Requirement\n2 - Listing\n3 - My Requirements\n4 - My Listings\n5 - Help\n6 - Change Language\n\nWebsite: https://www.timbermart.co.in`,
    changeLanguage:
      `🌐 *Apni language chunein*\n\n1️⃣ Telugu\n2️⃣ English\n3️⃣ Hindi\n4️⃣ Tamil`,
    invalid:
      `Galat option. Kripya 1 se 6 tak number bhejein.`,
  },

  ta: {
    welcome: (name) =>
      `🌳 *TimberMart-ku varaverkirOm, ${name}!*\n\nEngal platform-ai therndheduthadharku nandri.`,
    menu:
      `Oru option-ai therndhedungal:\n\n` +
      `1️⃣ Timber Requirement\n` +
      `2️⃣ Timber Listing / Sell\n` +
      `3️⃣ My Requirements\n` +
      `4️⃣ My Listings\n` +
      `5️⃣ Help\n` +
      `6️⃣ Change Language\n\n` +
      `1 mudhal 6 varai number anuppavum.`,
    requirement:
      `🌳 *Timber Requirement*\n\nForm nirappa indha link-ai click seyyavum:\n\n${REQUIREMENT_FLOW_URL}`,
    listing:
      `🌳 *Timber Listing*\n\nListing form viraivil kidaikkum.`,
    requirements:
      `🌳 *My Requirements*\n\nUngal requirements inge kaattappadum.`,
    listings:
      `🌳 *My Listings*\n\nUngal listings inge kaattappadum.`,
    help:
      `🌳 *TimberMart Help*\n\n1 - Requirement\n2 - Listing\n3 - My Requirements\n4 - My Listings\n5 - Help\n6 - Change Language\n\nWebsite: https://www.timbermart.co.in`,
    changeLanguage:
      `🌐 *Mozhiyai therndhedungal*\n\n1️⃣ Telugu\n2️⃣ English\n3️⃣ Hindi\n4️⃣ Tamil`,
    invalid:
      `Thavaraana option. 1 mudhal 6 varai number anuppavum.`,
  },
};

// Get the correct language messages.
export function getWhatsAppMessages(language = "en") {
  return MESSAGES[language] || MESSAGES.en;
}

// Main WhatsApp welcome message.
export function getWhatsAppMenu(user, language = "en") {
  const name = user?.name || "User";
  const messages = getWhatsAppMessages(language);

  return `${messages.welcome(name)}\n\n${messages.menu}\n\n_TimberMart – Connecting the Timber Community_`;
}

// Help message.
export function getWhatsAppHelp(language = "en") {
  return getWhatsAppMessages(language).help;
}

// Return message for a selected menu option.
export function getWhatsAppMenuResponse(option, user, language = "en") {
  const messages = getWhatsAppMessages(language);

  switch (String(option).trim()) {
    case "1":
      return messages.requirement;

    case "2":
      return messages.listing;

    case "3":
      return messages.requirements;

    case "4":
      return messages.listings;

    case "5":
      return messages.help;

    case "6":
      return messages.changeLanguage;

    default:
      return messages.invalid;
  }
}

// Language selection prompt.
export function getWhatsAppLanguageMenu() {
  return MESSAGES.en.changeLanguage;
}

// Save language choice mapping.
export function getSelectedLanguage(option) {
  const languages = {
    "1": "te",
    "2": "en",
    "3": "hi",
    "4": "ta",
  };

  return languages[String(option).trim()] || null;
}

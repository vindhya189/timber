export const LANGUAGES = {
  1: "te",
  2: "en",
  3: "hi",
  4: "ta",
};

export const LANGUAGE_NAMES = {
  te: "Telugu",
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
};

export const TEXT = {
  en: {
    chooseLanguage:
      "Welcome to TimberMart!\n\nChoose your language:\n1. Telugu\n2. English\n3. Hindi\n4. Tamil",

    unregistered:
      "Your mobile number is not registered with TimberMart.\n\nPlease register/login here:\nhttps://www.timbermart.co.in/login\n\nAfter login, send HI again.",

    welcome:
      "Welcome Back to TimberMart! Thank you for registering with TimberMart! We appreciate you choosing our platform.",

    menu:
      "🌳 TimberMart Main Menu\n\n1. Post Timber Requirement\n2. Post Timber Listing / Sell\n3. My Requirements\n4. My Listings\n5. Help\n6. Change Language",

    invalid:
      "Invalid option. Please select a valid option.",

    requirement:
      "Open the Post Timber Requirement form using the button below.",

    listing:
      "Open the Post Timber Listing form using the button below.",

    help:
      "For TimberMart support, visit https://www.timbermart.co.in",
  },

  te: {
    chooseLanguage:
      "TimberMart ki Swagatham!\n\nMee language select cheyyandi:\n1. Telugu\n2. English\n3. Hindi\n4. Tamil",

    unregistered:
      "Mee mobile number TimberMart lo register avvaledhu.\n\nMundhu register/login avvandi:\nhttps://www.timbermart.co.in/login\n\nLogin ayyaka malli HI ani message pampandi.",

    welcome:
      "TimberMart ki malli Swagatham! Maa platform ni choose chesinandhuku thank you.",

    menu:
      "🌳 TimberMart Main Menu\n\n1. Timber Requirement Post cheyyandi\n2. Timber Listing / Sell cheyyandi\n3. My Requirements\n4. My Listings\n5. Help\n6. Change Language",

    invalid:
      "Invalid option. Dayachesi correct option select cheyyandi.",

    requirement:
      "Post Timber Requirement form open cheyyandi.",

    listing:
      "Post Timber Listing form open cheyyandi.",

    help:
      "TimberMart support kosam https://www.timbermart.co.in visit cheyyandi.",
  },

  hi: {
    chooseLanguage:
      "TimberMart mein aapka swagat hai!\n\n1. Telugu\n2. English\n3. Hindi\n4. Tamil",

    unregistered:
      "Aapka number registered nahi hai. Kripya register/login karein:\nhttps://www.timbermart.co.in/login",

    welcome:
      "TimberMart mein aapka phir se swagat hai!",

    menu:
      "TimberMart Menu\n\n1. Requirement Post\n2. Listing Sell\n3. My Requirements\n4. My Listings\n5. Help\n6. Change Language",

    invalid:
      "Invalid option. Kripya sahi option chunein.",

    requirement:
      "Requirement form open karein.",

    listing:
      "Listing form open karein.",

    help:
      "Support: https://www.timbermart.co.in",
  },

  ta: {
    chooseLanguage:
      "TimberMart-ku varaverkirOm!\n\n1. Telugu\n2. English\n3. Hindi\n4. Tamil",

    unregistered:
      "Ungal number register seyyappadavillai.\nhttps://www.timbermart.co.in/login",

    welcome:
      "TimberMart-ku meendum varaverkirOm!",

    menu:
      "TimberMart Menu\n\n1. Requirement Post\n2. Listing Sell\n3. My Requirements\n4. My Listings\n5. Help\n6. Change Language",

    invalid:
      "Thavaraana option. Sariyaana option-ai select seyyavum.",

    requirement:
      "Requirement form-ai open seyyavum.",

    listing:
      "Listing form-ai open seyyavum.",

    help:
      "Support: https://www.timbermart.co.in",
  },
};

export function getText(language, key) {
  return TEXT[language]?.[key] || TEXT.en[key];
}
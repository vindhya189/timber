
export function getWhatsAppMenu(user) {
  const name = user?.name || "User";

  return `
🌳 *Welcome to TimberMart, ${name}!*

Mee TimberMart WhatsApp Assistant ki welcome.

Please select an option:

1️⃣ Post Timber Requirement
2️⃣ Post Timber Listing
3️⃣ My Requirements
4️⃣ My Listings
5️⃣ Help

Reply with the option number (1-5).

_TimberMart – Connecting the Timber Community_
`;
}

export function getWhatsAppHelp() {
  return `
🌳 *TimberMart Help*

Available options:

1 - Post Timber Requirement
2 - Post Timber Listing
3 - My Requirements
4 - My Listings
5 - Help

Please send a number from 1 to 5.
`;
}

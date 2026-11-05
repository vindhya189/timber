
const MSG91_URL =
  "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_INTEGRATED_NUMBER =
  process.env.MSG91_INTEGRATED_NUMBER || "918985364488";

const MSG91_NAMESPACE =
  process.env.MSG91_NAMESPACE ||
  "440e6c87_8e4e_422f_ad98_c8541985b785";

/**
 * Send a WhatsApp template message through MSG91.
 */
export async function sendWhatsAppTemplate({
  to,
  templateName = "timber_user_flow",
  buttonUrlValue,
}) {
  if (!MSG91_AUTH_KEY) {
    throw new Error("MSG91_AUTH_KEY is missing");
  }

  if (!to) {
    throw new Error("Recipient WhatsApp number is required");
  }

  if (!buttonUrlValue) {
    throw new Error("Template button URL value is required");
  }

  const phoneNumber = String(to).replace(/\D/g, "");

  const payload = {
    integrated_number: MSG91_INTEGRATED_NUMBER,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_US",
          policy: "deterministic",
        },
        namespace: MSG91_NAMESPACE,
        to_and_components: [
          {
            to: [phoneNumber],
            components: {
              button_1: {
                subtype: "url",
                type: "text",
                value: String(buttonUrlValue),
              },
            },
          },
        ],
      },
    },
  };

  const response = await fetch(MSG91_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: MSG91_AUTH_KEY,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `MSG91 Error ${response.status}: ${responseText}`
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { success: true, response: responseText };
  }
}



/**
 * Send a normal WhatsApp text message through MSG91.
 * Use after the customer starts a WhatsApp conversation.
 */
export async function sendWhatsAppText({ to, text }) {
  if (!MSG91_AUTH_KEY) {
    throw new Error("MSG91_AUTH_KEY is missing");
  }

  if (!to || !text) {
    throw new Error("Recipient number and message are required");
  }

  const params = new URLSearchParams({
    integrated_number: MSG91_INTEGRATED_NUMBER,
    recipient_number: String(to).replace(/\D/g, ""),
    content_type: "text",
    text: String(text),
  });

  const response = await fetch(
    `https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message?${params.toString()}`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        authkey: MSG91_AUTH_KEY,
        "content-type": "application/json",
      },
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `MSG91 Text Error ${response.status}: ${responseText}`
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { success: true, response: responseText };
  }
}
/**
 * Send post approval WhatsApp template.
 */
export async function sendPostApproved({ to, postType }) {
  if (!MSG91_AUTH_KEY) {
    throw new Error("MSG91_AUTH_KEY is missing");
  }

  if (!to || !postType) {
    throw new Error("Recipient number and post type are required");
  }

  const phoneNumber = String(to).replace(/\D/g, "");

  const payload = {
    integrated_number: MSG91_INTEGRATED_NUMBER,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: "timbermart_post_approved",
        language: {
          code: "en_US",
          policy: "deterministic",
        },
        namespace: MSG91_NAMESPACE,
        to_and_components: [
          {
            to: [phoneNumber],
            components: {
              body_1: {
                type: "text",
                value: String(postType),
              },
            },
          },
        ],
      },
    },
  };

  const response = await fetch(MSG91_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: MSG91_AUTH_KEY,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.text();

  if (!response.ok) {
    throw new Error(`MSG91 Approval Error ${response.status}: ${result}`);
  }

  try {
    return JSON.parse(result);
  } catch {
    return { success: true, response: result };
  }
}

/**
 * Send post rejection WhatsApp template.
 */
export async function sendPostRejected({ to, postType, reason }) {
  if (!MSG91_AUTH_KEY) {
    throw new Error("MSG91_AUTH_KEY is missing");
  }

  if (!to || !postType || !reason) {
    throw new Error("Recipient, post type and rejection reason are required");
  }

  const phoneNumber = String(to).replace(/\D/g, "");

  const payload = {
    integrated_number: MSG91_INTEGRATED_NUMBER,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: "timbermart_post_rejected",
        language: {
          code: "en_US",
          policy: "deterministic",
        },
        namespace: MSG91_NAMESPACE,
        to_and_components: [
          {
            to: [phoneNumber],
            components: {
              body_1: {
                type: "text",
                value: String(postType),
              },
              body_2: {
                type: "text",
                value: String(reason),
              },
            },
          },
        ],
      },
    },
  };

  const response = await fetch(MSG91_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: MSG91_AUTH_KEY,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.text();

  if (!response.ok) {
    throw new Error(`MSG91 Rejection Error ${response.status}: ${result}`);
  }

  try {
    return JSON.parse(result);
  } catch {
    return { success: true, response: result };
  }
}

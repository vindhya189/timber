
export default async function handler(req, res) {
  // MSG91 sends incoming webhook requests using POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const payload = req.body || {};

    // Extract MSG91 incoming WhatsApp message details
    const customerNumber = payload.customerNumber || "";
    const customerName = payload.customerName || "Customer";
    const messageText = payload.text || "";
    const contentType = payload.contentType || payload.messageType || "";
    const messageId = payload.uuid || "";

    // Log incoming message for debugging
    console.log("MSG91 WhatsApp Webhook Received:", {
      customerNumber,
      customerName,
      messageText,
      contentType,
      messageId,
    });

    // Validate incoming payload
    if (!customerNumber) {
      return res.status(200).json({
        success: true,
        message: "Webhook received, but customer number is missing",
      });
    }

    // Handle incoming text message
    if (contentType === "text" && messageText) {
      console.log("Incoming WhatsApp Text:", messageText);
    }

    // Handle location messages
    if (
      payload.latitude &&
      payload.longitude
    ) {
      console.log("Customer Location:", {
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
    }

    // Handle image messages
    if (
      contentType === "image" ||
      payload.filename ||
      payload.caption
    ) {
      console.log("Customer Image:", {
        filename: payload.filename,
        caption: payload.caption,
        url: payload.url,
      });
    }

    // Handle interactive replies and buttons
    if (payload.button || payload.interactive) {
      console.log("Interactive Reply:", {
        button: payload.button,
        interactive: payload.interactive,
      });
    }

    // Return success to MSG91
    return res.status(200).json({
      success: true,
      message: "TimberMart webhook received successfully",
    });

  } catch (error) {
    console.error("TimberMart WhatsApp Webhook Error:", error);

    return res.status(200).json({
      success: false,
      message: "Webhook processing error",
    });
  }
}

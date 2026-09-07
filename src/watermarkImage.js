/**
 * TimberMart Universal Watermark Helper
 * -------------------------------------
 * Use this same file in all TimberMart dashboards.
 *
 * Works with:
 * Farmer
 * Timber Merchant
 * Sawmill / Wood Business
 * Carpenter
 * Worker
 * Any future upload dashboard
 *
 * IMPORTANT:
 * This helper applies the watermark BEFORE the image is uploaded
 * to Supabase Storage.
 */

/* ============================================================
   IMAGE LOADER
============================================================ */

function loadImageFromBlob(blob) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(blob);
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Unable to read the selected image. Please choose a valid image."
        )
      );
    };

    image.src = objectUrl;
  });
}

/* ============================================================
   CLOSE IMAGE BITMAP SAFELY
============================================================ */

function safeCloseImage(image) {
  try {
    if (image && typeof image.close === "function") {
      image.close();
    }
  } catch (error) {
    console.warn("Unable to close ImageBitmap:", error);
  }
}

/* ============================================================
   CREATE WEBP FILE
============================================================ */

function makeWebpFile(blob, originalFile, suffix = "timbermart") {
  const originalName =
    typeof originalFile?.name === "string" &&
    originalFile.name.trim() !== ""
      ? originalFile.name.trim()
      : "timbermart-image";

  const cleanBaseName =
    originalName.replace(/\.[^/.]+$/, "").trim() || "timbermart-image";

  const safeSuffix =
    String(suffix || "timbermart")
      .replace(/[^a-z0-9-_]/gi, "-")
      .toLowerCase() || "timbermart";

  return new File(
    [blob],
    `${cleanBaseName}-${safeSuffix}-${Date.now()}.webp`,
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  );
}

/* ============================================================
   VALIDATE IMAGE
============================================================ */

function validateImageFile(file) {
  if (!(file instanceof Blob)) {
    throw new Error("Please select a valid image file.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
  ];

  /*
   * Some browsers can leave file.type empty.
   * In that case we still let the browser attempt to read it.
   */
  if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error(
      "Unsupported image format. Please select JPG, PNG or WEBP image."
    );
  }

  /*
   * Keep a reasonable maximum source file size.
   * Watermarking can still compress it afterwards.
   */
  const maxInputSize = 15 * 1024 * 1024;

  if (file.size > maxInputSize) {
    throw new Error(
      "Image is too large. Please select an image smaller than 15 MB."
    );
  }
}

/* ============================================================
   MAIN WATERMARK FUNCTION
============================================================ */

export async function watermarkImage(file, options = {}) {
  validateImageFile(file);

  if (typeof document === "undefined") {
    throw new Error(
      "Watermarking requires a browser environment."
    );
  }

  /* ----------------------------------------------------------
     OPTIONS
  ---------------------------------------------------------- */

  const {
    maxWidth = 1800,
    maxHeight = 1800,

    /*
     * WebP compression quality
     * 0.4 = smaller file
     * 0.95 = higher quality
     */
    quality = 0.82,

    /*
     * Center repeated watermark text
     */
    centerText = "TimberMart",

    /*
     * Bottom branding
     */
    bottomTitle = "🌳 TimberMart",
    bottomSubtitle = "Timber Marketplace",

    /*
     * Repeated watermark opacity
     */
    watermarkOpacity = 0.13,

    /*
     * Bottom branding opacity
     */
    bottomOverlayOpacity = 0.68,

    /*
     * Angle in degrees
     */
    watermarkAngle = -28,

    /*
     * Add timestamp-style branding if needed
     * Keep false by default so image remains clean.
     */
    showDate = false,
  } = options;

  /* ----------------------------------------------------------
     READ IMAGE
  ---------------------------------------------------------- */

  const source = await loadImageFromBlob(file);

  try {
    const sourceWidth = Number(source.width) || 0;
    const sourceHeight = Number(source.height) || 0;

    if (!sourceWidth || !sourceHeight) {
      throw new Error(
        "The selected image could not be read correctly."
      );
    }

    /* --------------------------------------------------------
       CALCULATE SCALE
    -------------------------------------------------------- */

    const widthScale = maxWidth / sourceWidth;
    const heightScale = maxHeight / sourceHeight;

    const scale = Math.min(
      1,
      widthScale,
      heightScale
    );

    const width = Math.max(
      1,
      Math.round(sourceWidth * scale)
    );

    const height = Math.max(
      1,
      Math.round(sourceHeight * scale)
    );

    /* --------------------------------------------------------
       CANVAS
    -------------------------------------------------------- */

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", {
      alpha: false,
    });

    if (!ctx) {
      throw new Error(
        "Your browser does not support image processing."
      );
    }

    /* --------------------------------------------------------
       HIGH QUALITY IMAGE DRAWING
    -------------------------------------------------------- */

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    /*
     * White background prevents transparent PNG artifacts
     * when exporting to WebP.
     */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    /*
     * Draw original image.
     */
    ctx.drawImage(
      source,
      0,
      0,
      width,
      height
    );

    /* ========================================================
       REPEATED DIAGONAL WATERMARK
    ======================================================== */

    const shortSide = Math.min(
      width,
      height
    );

    const watermarkFontSize = Math.max(
      18,
      Math.min(
        68,
        Math.round(shortSide * 0.052)
      )
    );

    const horizontalGap = Math.max(
      180,
      Math.round(width * 0.30)
    );

    const verticalGap = Math.max(
      120,
      Math.round(height * 0.23)
    );

    const safeOpacity = Math.max(
      0.04,
      Math.min(
        0.28,
        Number(watermarkOpacity) || 0.13
      )
    );

    ctx.save();

    /*
     * Move origin to center.
     */
    ctx.translate(
      width / 2,
      height / 2
    );

    /*
     * Diagonal watermark.
     */
    ctx.rotate(
      (Number(watermarkAngle) || -28) *
        (Math.PI / 180)
    );

    ctx.font = `800 ${watermarkFontSize}px Inter, Arial, sans-serif`;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /*
     * White transparent watermark
     */
    ctx.fillStyle = `rgba(255,255,255,${safeOpacity})`;

    /*
     * Extremely subtle outline.
     */
    ctx.strokeStyle =
      "rgba(0,0,0,0.035)";

    ctx.lineWidth = 1;

    for (
      let y = -height;
      y <= height;
      y += verticalGap
    ) {
      for (
        let x = -width;
        x <= width;
        x += horizontalGap
      ) {
        ctx.strokeText(
          centerText,
          x,
          y
        );

        ctx.fillText(
          centerText,
          x,
          y
        );
      }
    }

    ctx.restore();

    /* ========================================================
       BOTTOM BRANDING STRIP
    ======================================================== */

    const stripHeight = Math.max(
      64,
      Math.round(height * 0.09)
    );

    const gradient = ctx.createLinearGradient(
      0,
      height - stripHeight,
      width,
      height
    );

    const bottomOpacity = Math.max(
      0.35,
      Math.min(
        0.88,
        Number(bottomOverlayOpacity) || 0.68
      )
    );

    gradient.addColorStop(
      0,
      `rgba(8,28,18,${
        bottomOpacity * 0.45
      })`
    );

    gradient.addColorStop(
      0.55,
      `rgba(8,28,18,${
        bottomOpacity * 0.72
      })`
    );

    gradient.addColorStop(
      1,
      `rgba(8,28,18,${
        bottomOpacity
      })`
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      0,
      height - stripHeight,
      width,
      stripHeight
    );

    /* --------------------------------------------------------
       BRANDING TEXT SIZES
    -------------------------------------------------------- */

    const sidePadding = Math.max(
      18,
      Math.round(width * 0.028)
    );

    const titleSize = Math.max(
      19,
      Math.round(stripHeight * 0.38)
    );

    const subtitleSize = Math.max(
      11,
      Math.round(stripHeight * 0.18)
    );

    /* --------------------------------------------------------
       TITLE
    -------------------------------------------------------- */

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle =
      "rgba(255,255,255,0.97)";

    ctx.font = `800 ${titleSize}px Inter, Arial, sans-serif`;

    ctx.fillText(
      bottomTitle,
      sidePadding,
      height -
        Math.round(
          stripHeight * 0.46
        )
    );

    /* --------------------------------------------------------
       SUBTITLE
    -------------------------------------------------------- */

    ctx.fillStyle =
      "rgba(255,255,255,0.82)";

    ctx.font = `600 ${subtitleSize}px Inter, Arial, sans-serif`;

    ctx.fillText(
      bottomSubtitle,
      sidePadding,
      height -
        Math.round(
          stripHeight * 0.15
        )
    );

    /* ========================================================
       OPTIONAL DATE / BRANDING
    ======================================================== */

    if (showDate) {
      const now = new Date();

      const dateText =
        now.toLocaleDateString(
          "en-IN"
        );

      ctx.textAlign = "right";

      ctx.fillStyle =
        "rgba(255,255,255,0.70)";

      ctx.font = `600 ${Math.max(
        9,
        Math.round(
          stripHeight * 0.16
        )
      )}px Inter, Arial, sans-serif`;

      ctx.fillText(
        dateText,
        width - sidePadding,
        height -
          Math.round(
            stripHeight * 0.15
          )
      );
    }

    /* ========================================================
       EXPORT WEBP
    ======================================================== */

    const safeQuality = Math.max(
      0.4,
      Math.min(
        0.95,
        Number(quality) || 0.82
      )
    );

    const outputBlob =
      await new Promise(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(
                  new Error(
                    "Unable to create the watermarked image."
                  )
                );
              }
            },
            "image/webp",
            safeQuality
          );
        }
      );

    /* ========================================================
       FINAL FILE
    ======================================================== */

    return makeWebpFile(
      outputBlob,
      file,
      "timbermart"
    );
  } finally {
    /*
     * Close ImageBitmap where supported.
     */
    safeCloseImage(source);
  }
}

/* ============================================================
   CREATE WATERMARKED PREVIEW
============================================================ */

export async function createWatermarkedPreview(
  file,
  options = {}
) {
  const watermarkedFile =
    await watermarkImage(
      file,
      options
    );

  const url =
    URL.createObjectURL(
      watermarkedFile
    );

  return {
    file: watermarkedFile,
    url,
  };
}

/* ============================================================
   REVOKE PREVIEW URL
============================================================ */

export function revokeWatermarkedPreview(
  url
) {
  if (
    typeof url === "string" &&
    url.trim() !== ""
  ) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn(
        "Unable to revoke preview URL:",
        error
      );
    }
  }
}

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default watermarkImage;
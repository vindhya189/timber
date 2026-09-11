// ============================================================
// TimberMart Permanent Image Watermark
// Full-page light repeated watermark
// + dark bottom TimberMart branding bar
// ============================================================

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error("Unable to read selected image.")
      );
    };

    img.src = url;
  });
}

function canvasToBlob(
  canvas,
  type = "image/jpeg",
  quality = 0.92
) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Unable to create watermarked image."
            )
          );
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function watermarkImage(
  file,
  options = {}
) {
  if (!(file instanceof File)) {
    throw new Error(
      "Invalid image file."
    );
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error(
      "Selected file is not an image."
    );
  }

  const {
    centerText = "TimberMart",

    bottomTitle = "TIMBERMART",

    bottomSubtitle =
      "Official Timber Marketplace",

    watermarkOpacity = 0.12,

    quality = 0.92,

    maxWidth = 2400,

    maxHeight = 2400,
  } = options;

  // ----------------------------------------------------------
  // LOAD IMAGE
  // ----------------------------------------------------------

  const img = await loadImage(file);

  // ----------------------------------------------------------
  // RESIZE
  // ----------------------------------------------------------

  const ratio = Math.min(
    1,
    maxWidth / img.naturalWidth,
    maxHeight / img.naturalHeight
  );

  const width = Math.max(
    1,
    Math.round(
      img.naturalWidth * ratio
    )
  );

  const height = Math.max(
    1,
    Math.round(
      img.naturalHeight * ratio
    )
  );

  // ----------------------------------------------------------
  // CANVAS
  // ----------------------------------------------------------

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Canvas is not supported."
    );
  }

  // Draw original photo
  ctx.drawImage(
    img,
    0,
    0,
    width,
    height
  );

  // ==========================================================
  // FULL PAGE LIGHT WATERMARK
  // ==========================================================

  const diagonalText =
    String(centerText || "TimberMart")
      .toUpperCase();

  const shortSide = Math.min(
    width,
    height
  );

  // Font size based on image
  const fontSize = Math.max(
    28,
    Math.round(
      shortSide * 0.055
    )
  );

  const opacity = Math.min(
    0.28,
    Math.max(
      0.06,
      Number(watermarkOpacity) || 0.12
    )
  );

  const horizontalGap =
    Math.max(
      230,
      Math.round(
        width * 0.28
      )
    );

  const verticalGap =
    Math.max(
      150,
      Math.round(
        height * 0.20
      )
    );

  ctx.save();

  // Move to center
  ctx.translate(
    width / 2,
    height / 2
  );

  // Diagonal watermark
  ctx.rotate(
    (-28 * Math.PI) / 180
  );

  ctx.font =
    `800 ${fontSize}px Arial, Helvetica, sans-serif`;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (
    let y = -height * 2;
    y <= height * 2;
    y += verticalGap
  ) {
    for (
      let x = -width * 2;
      x <= width * 2;
      x += horizontalGap
    ) {

      // White soft watermark
      ctx.fillStyle =
        `rgba(255,255,255,${opacity})`;

      ctx.fillText(
        diagonalText,
        x,
        y
      );

      // Very subtle dark edge
      ctx.strokeStyle =
        `rgba(0,0,0,${opacity * 0.15})`;

      ctx.lineWidth = 1.5;

      ctx.strokeText(
        diagonalText,
        x,
        y
      );
    }
  }

  ctx.restore();

  // ==========================================================
  // DARK BOTTOM BRANDING BAR
  // ==========================================================

  const bottomBarHeight =
    Math.max(
      105,
      Math.round(
        height * 0.12
      )
    );

  // Dark gradient
  const gradient =
    ctx.createLinearGradient(
      0,
      height - bottomBarHeight,
      0,
      height
    );

  gradient.addColorStop(
    0,
    "rgba(7,25,16,0.84)"
  );

  gradient.addColorStop(
    1,
    "rgba(4,18,11,0.96)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    height - bottomBarHeight,
    width,
    bottomBarHeight
  );

  // ----------------------------------------------------------
  // TIMBERMART TITLE
  // ----------------------------------------------------------

  const titleSize =
    Math.max(
      28,
      Math.round(
        bottomBarHeight * 0.38
      )
    );

  ctx.font =
    `900 ${titleSize}px Arial, Helvetica, sans-serif`;

  ctx.fillStyle =
    "#ffffff";

  ctx.textAlign = "left";

  ctx.textBaseline =
    "alphabetic";

  const padding =
    Math.max(
      22,
      Math.round(
        width * 0.035
      )
    );

  ctx.fillText(
    bottomTitle || "TIMBERMART",
    padding,
    height -
      bottomBarHeight * 0.48
  );

  // ----------------------------------------------------------
  // SUBTITLE
  // ----------------------------------------------------------

  const subtitleSize =
    Math.max(
      14,
      Math.round(
        bottomBarHeight * 0.18
      )
    );

  ctx.font =
    `600 ${subtitleSize}px Arial, Helvetica, sans-serif`;

  ctx.fillStyle =
    "rgba(255,255,255,0.78)";

  ctx.fillText(
    bottomSubtitle ||
      "Official Timber Marketplace",
    padding,
    height -
      bottomBarHeight * 0.18
  );

  // ----------------------------------------------------------
  // SMALL CORNER BRAND
  // ----------------------------------------------------------

  const cornerSize =
    Math.max(
      12,
      Math.round(
        shortSide * 0.022
      )
    );

  ctx.font =
    `800 ${cornerSize}px Arial, Helvetica, sans-serif`;

  ctx.fillStyle =
    "rgba(255,255,255,0.62)";

  ctx.textAlign = "right";

  ctx.fillText(
    "TIMBERMART",
    width - padding,
    28
  );

  // ==========================================================
  // OUTPUT
  // ==========================================================

  const blob =
    await canvasToBlob(
      canvas,
      "image/jpeg",
      quality
    );

  const originalName =
    file.name
      ?.replace(/\.[^/.]+$/, "")
      ?.trim() ||
    "timbermart";

  return new File(
    [blob],
    `${originalName}-timbermart.jpg`,
    {
      type: "image/jpeg",
      lastModified:
        Date.now(),
    }
  );
}

// ============================================================
// PREVIEW
// ============================================================

export async function createWatermarkedPreview(
  file,
  options = {}
) {
  const watermarked =
    await watermarkImage(
      file,
      options
    );

  return URL.createObjectURL(
    watermarked
  );
}

// ============================================================
// REVOKE PREVIEW
// ============================================================

export function revokeWatermarkedPreview(
  url
) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default watermarkImage;
```javascript
// =========================================================
// TimberMart Location Service
// GPS + Reverse Geocoding
// IP address is NOT used
// =========================================================

export async function getCurrentLocation() {
  if (!navigator.geolocation) {
    throw new Error(
      "Your browser does not support GPS location."
    );
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const messages = {
          1: "Location permission denied. Allow location access in your browser.",
          2: "Current location is unavailable. Please try again.",
          3: "Location request timed out. Please try again.",
        };

        reject(
          new Error(
            messages[error.code] ||
              "Unable to get your current location."
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  });

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Invalid GPS coordinates.");
  }

  let locationText = "Current Location";

  try {
    const url = new URL(
      "https://nominatim.openstreetmap.org/reverse"
    );

    url.search = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
      zoom: "18",
      addressdetails: "1",
    }).toString();

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const address = data.address || {};

      const parts = [
        address.village,
        address.town,
        address.city,
        address.municipality,
        address.district,
        address.state,
        address.country,
      ].filter(Boolean);

      locationText = [
        ...new Set(parts),
      ].join(", ") || data.display_name || locationText;
    }
  } catch (error) {
    console.warn("Reverse geocoding failed:", error);
  }

  return {
    latitude,
    longitude,
    locationText,
  };
}
```
// =========================================================
// TimberMart Location Service
// GPS based location
// IP address is NOT used
// =========================================================


export async function getCurrentLocation() {

  // -------------------------------------------------------
  // Browser GPS support check
  // -------------------------------------------------------

  if (!navigator.geolocation) {

    throw new Error(
      "Your browser does not support GPS location."
    );

  }


  // -------------------------------------------------------
  // Get GPS coordinates
  // -------------------------------------------------------

  const position = await new Promise(
    (resolve, reject) => {

      navigator.geolocation.getCurrentPosition(

        resolve,

        reject,

        {
          enableHighAccuracy: true,

          timeout: 15000,

          maximumAge: 0
        }

      );

    }
  );


  const latitude =
    position.coords.latitude;

  const longitude =
    position.coords.longitude;


  // -------------------------------------------------------
  // Convert GPS → Human readable address
  // -------------------------------------------------------

  let locationText =
    "Current Location";


  try {

    const response = await fetch(

      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,

      {
        headers: {
          "Accept":
            "application/json"
        }
      }

    );


    if (response.ok) {

      const data =
        await response.json();


      const address =
        data.address || {};


      const parts = [

        address.village,

        address.town,

        address.city,

        address.municipality,

        address.district,

        address.state,

        address.country

      ].filter(Boolean);


      // Remove duplicate values

      const uniqueParts =
        [...new Set(parts)];


      if (uniqueParts.length > 0) {

        locationText =
          uniqueParts.join(", ");

      }

      else if (data.display_name) {

        locationText =
          data.display_name;

      }

    }

  }

  catch (error) {

    console.warn(
      "Address conversion failed:",
      error
    );

  }


  return {

    latitude,

    longitude,

    locationText

  };

}
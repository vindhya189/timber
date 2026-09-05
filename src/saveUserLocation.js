import { supabase } from "./supabaseClient";
import { getCurrentLocation } from "./locationService";


// =========================================================
// SAVE USER CURRENT LOCATION
// =========================================================

export async function saveUserCurrentLocation(
  userId
) {

  if (!userId) {

    throw new Error(
      "User is not logged in."
    );

  }


  // -------------------------------------------------------
  // Get GPS
  // -------------------------------------------------------

  const location =
    await getCurrentLocation();


  // -------------------------------------------------------
  // Save BOTH
  //
  // location = human readable text
  // latitude/longitude = hidden distance calculation
  //
  // No IP address
  // -------------------------------------------------------

  const {
    error
  } = await supabase

    .from("profiles")

    .update({

      location:
        location.locationText,

      latitude:
        location.latitude,

      longitude:
        location.longitude

    })

    .eq(
      "id",
      userId
    );


  if (error) {

    throw error;

  }


  return location;

}
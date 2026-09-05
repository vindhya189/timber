import { supabase } from "./supabaseClient";


// =========================================================
// CLEAN KEYWORDS
// =========================================================

export function cleanKeywords(
  values = []
) {

  const result = [];


  values.forEach(value => {

    if (!value) return;


    // Convert array to text

    if (Array.isArray(value)) {

      value.forEach(item => {

        if (item) {

          result.push(
            String(item)
              .trim()
              .toLowerCase()
          );

        }

      });

      return;

    }


    // Convert normal value to text

    const text =
      String(value)
        .trim()
        .toLowerCase();


    if (!text) return;


    // Split comma values

    text
      .split(",")
      .forEach(item => {

        const cleaned =
          item.trim();


        if (cleaned) {

          result.push(
            cleaned
          );

        }

      });

  });


  // Remove duplicates

  return [
    ...new Set(result)
  ];

}


// =========================================================
// CREATE 40 KM MATCHING NOTIFICATIONS
// =========================================================

export async function notifyMatchingUsers({

  senderId,

  latitude,

  longitude,

  postType,

  postId,

  title,

  message,

  keywords = [],

  matchingRoles = [],

  listingId = null,

  requirementId = null,

  jobId = null

}) {


  // -------------------------------------------------------
  // Location unavailable
  // -------------------------------------------------------

  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {

    console.warn(
      "No GPS location. Nearby notification skipped."
    );

    return 0;

  }


  // -------------------------------------------------------
  // Clean keywords
  // -------------------------------------------------------

  const cleanedKeywords =
    cleanKeywords(
      keywords
    );


  // -------------------------------------------------------
  // Supabase RPC
  // -------------------------------------------------------

  const {
    data,
    error
  } = await supabase.rpc(

    "notify_matching_users_40km",

    {

      p_sender_id:
        senderId,

      p_latitude:
        latitude,

      p_longitude:
        longitude,

      p_post_type:
        postType,

      p_post_id:
        postId,

      p_title:
        title,

      p_message:
        message,

      p_keywords:
        cleanedKeywords,

      p_matching_roles:
        matchingRoles,

      p_listing_id:
        listingId,

      p_requirement_id:
        requirementId,

      p_job_id:
        jobId

    }

  );


  if (error) {

    console.error(
      "Nearby notification error:",
      error
    );

    return 0;

  }


  console.log(
    `${data || 0} matching users notified within 40 KM`
  );


  return data || 0;

}
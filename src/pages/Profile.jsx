import React, { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Factory,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  TreePine,
  User,
  Users,
  Wrench,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Profile.css";
import TreeLoader from "../components/TreeLoader";


const ROLE_LABELS = {
  farmer: "Farmer",
  merchant: "Timber Merchant",
  sawmill: "Sawmill / Wood Business",
  carpenter: "Carpenter",
  worker: "Worker / Labor",
  buyer: "Buyer",
};


const ROLE_ICONS = {
  farmer: <TreePine size={19} />,
  merchant: <TreePine size={19} />,
  sawmill: <Factory size={19} />,
  carpenter: <Wrench size={19} />,
  worker: <Users size={19} />,
  buyer: <Home size={19} />,
};


const defaultForm = {
  name: "",
  phone: "",
  whatsapp_number: "",
  alternate_phone: "",
  location: "",
  village: "",
  district: "",
  state: "",
  pincode: "",
  bio: "",
  photo_url: "",

  experience: "",
  skills: "",
  work_type: "",
  company_name: "",
  business_description: "",
  availability: "",
  working_area: "",
  preferred_location: "",

  tree_types: "",
  plantation_types: "",
  plantation_area: "",
  timber_experience: "",

  buying_areas: "",
  selling_areas: "",

  processing_types: "",
  daily_capacity: "",
  services_offered: "",

  specializations: "",

  preferred_work: "",
  salary_expectation: "",
  accommodation_required: false,

  buyer_type: "",
  preferred_wood_types: "",
  purchase_purpose: "",
  approximate_budget: "",
};


export default function Profile() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState(
    defaultForm
  );

  const [role, setRole] = useState(
    "farmer"
  );


  // =====================================================
  // LOAD PROFILE
  // =====================================================

  useEffect(() => {
    loadProfile();
  }, []);


  async function loadProfile() {

    try {

      setLoading(true);


      const {
        data: {
          session,
        },
      } = await supabase.auth.getSession();


      if (!session?.user) {

        navigate("/login", {
          replace: true,
        });

        return;
      }


      setUser(session.user);


      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          session.user.id
        )
        .maybeSingle();


      if (error) {

        console.error(error);

        alert(error.message);

        return;
      }


      if (data) {

        const currentRole =
          data.role ||
          localStorage.getItem(
            "timbermart_selected_role"
          ) ||
          "farmer";


        setRole(currentRole);


        setForm({
          ...defaultForm,

          ...Object.keys(
            defaultForm
          ).reduce(
            (result, key) => {

              result[key] =
                data[key] ??
                defaultForm[key];

              return result;

            },
            {}
          ),
        });
      }

    } catch (error) {

      console.error(
        "Profile loading error:",
        error
      );

    } finally {

      setLoading(false);

    }
  }


  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  function handleChange(event) {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    setForm((prev) => ({
      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }


  // =====================================================
  // PHOTO UPLOAD
  // =====================================================

  async function handlePhotoUpload(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (!file || !user) return;


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      alert(
        "Please select an image."
      );

      return;
    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      alert(
        "Image size should be below 5MB."
      );

      return;
    }


    try {

      setUploading(true);


      const extension =
        file.name
          .split(".")
          .pop() ||
        "jpg";


      const filePath =
        `${user.id}/profile-${Date.now()}.${extension}`;


      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("listing-photos")
          .upload(
            filePath,
            file,
            {
              upsert: true,
              contentType:
                file.type,
            }
          );


      if (uploadError) {

        console.error(
          uploadError
        );

        alert(
          uploadError.message
        );

        return;
      }


      const {
        data,
      } =
        supabase.storage
          .from("listing-photos")
          .getPublicUrl(
            filePath
          );


      setForm((prev) => ({
        ...prev,
        photo_url:
          data.publicUrl,
      }));

    } catch (error) {

      console.error(error);

      alert(
        "Photo upload failed."
      );

    } finally {

      setUploading(false);
    }
  }


  // =====================================================
  // SAVE PROFILE
  // =====================================================

  async function handleSave(
    event
  ) {

    event.preventDefault();


    if (!user) return;


    if (!form.name.trim()) {

      alert(
        "Please enter your full name."
      );

      return;
    }


    try {

      setSaving(true);
      setSaved(false);


      const profileData = {

        id: user.id,

        name:
          form.name.trim(),

        phone:
          form.phone.trim(),

        whatsapp_number:
          form.whatsapp_number.trim(),

        alternate_phone:
          form.alternate_phone.trim(),

        location:
          form.location.trim(),

        village:
          form.village.trim(),

        district:
          form.district.trim(),

        state:
          form.state.trim(),

        pincode:
          form.pincode.trim(),

        bio:
          form.bio.trim(),

        photo_url:
          form.photo_url ||
          null,

        role,

        experience:
          form.experience.trim(),

        skills:
          form.skills.trim(),

        work_type:
          form.work_type.trim(),

        company_name:
          form.company_name.trim(),

        business_description:
          form.business_description.trim(),

        availability:
          form.availability.trim(),

        working_area:
          form.working_area.trim(),

        preferred_location:
          form.preferred_location.trim(),

        tree_types:
          form.tree_types.trim(),

        plantation_types:
          form.plantation_types.trim(),

        plantation_area:
          form.plantation_area.trim(),

        timber_experience:
          form.timber_experience.trim(),

        buying_areas:
          form.buying_areas.trim(),

        selling_areas:
          form.selling_areas.trim(),

        processing_types:
          form.processing_types.trim(),

        daily_capacity:
          form.daily_capacity.trim(),

        services_offered:
          form.services_offered.trim(),

        specializations:
          form.specializations.trim(),

        preferred_work:
          form.preferred_work.trim(),

        salary_expectation:
          form.salary_expectation.trim(),

        accommodation_required:
          Boolean(
            form.accommodation_required
          ),

        buyer_type:
          form.buyer_type.trim(),

        preferred_wood_types:
          form.preferred_wood_types.trim(),

        purchase_purpose:
          form.purchase_purpose.trim(),

        approximate_budget:
          form.approximate_budget.trim(),

        updated_at:
          new Date().toISOString(),
      };


      const {
        error,
      } =
        await supabase
          .from("profiles")
          .upsert(
            profileData,
            {
              onConflict:
                "id",
            }
          );


      if (error) {

        console.error(error);

        alert(
          error.message
        );

        return;
      }


      localStorage.setItem(
        "timbermart_selected_role",
        role
      );


      setSaved(true);


      setTimeout(() => {
        setSaved(false);
      }, 2500);

    } catch (error) {

      console.error(error);

      alert(
        "Unable to save profile."
      );

    } finally {

      setSaving(false);

    }
  }


  // =====================================================
  // ROLE-SPECIFIC TITLE
  // =====================================================

  const roleTitle =
    ROLE_LABELS[role] ||
    "TimberMart User";


  // =====================================================
  // BACK TO DASHBOARD
  // =====================================================

  function goBack() {

    navigate(
      `/dashboard/${role}`
    );
  }


  // =====================================================
  // COMMON PROFESSIONAL FIELDS
  // =====================================================

  const showCommonProfessional =
    role !== "buyer";


  // =====================================================
  // LOADER
  // =====================================================

  if (loading) {

    return (
      <TreeLoader
        text="Growing your profile..."
      />
    );
  }


  return (
    <div className="profile-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="profile-header">

        <button
          className="profile-back"
          onClick={goBack}
        >
          <ArrowLeft size={19} />
          <span>
            Back to Dashboard
          </span>
        </button>


        <div className="profile-header-title">

          <div className="profile-title-icon">
            {ROLE_ICONS[role] || (
              <User size={20} />
            )}
          </div>


          <div>

            <h1>
              My Profile
            </h1>

            <p>
              Build your professional
              TimberMart profile
            </p>

          </div>

        </div>


        <div className="profile-role-pill">

          {ROLE_ICONS[role]}

          {roleTitle}

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="profile-container">

        <form
          className="profile-card"
          onSubmit={handleSave}
        >


          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <section className="profile-photo-section">

            <div className="profile-avatar-wrapper">

              {form.photo_url ? (

                <img
                  src={form.photo_url}
                  alt="Profile"
                  className="profile-avatar-image"
                />

              ) : (

                <div className="profile-avatar-empty">
                  <User size={42} />
                </div>

              )}


              <label className="profile-camera-button">

                {uploading ? (

                  <Loader2
                    size={16}
                    className="profile-spin"
                  />

                ) : (

                  <Camera size={16} />

                )}


                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handlePhotoUpload
                  }
                  hidden
                />

              </label>

            </div>


            <div className="profile-photo-text">

              <h2>
                {form.name ||
                  "Your Name"}
              </h2>

              <p>
                {roleTitle}
              </p>

              <span>
                JPG, PNG or WEBP ·
                Max 5MB
              </span>

            </div>

          </section>


          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section className="profile-section">

            <div className="profile-section-heading">

              <div className="profile-section-icon">
                <User size={18} />
              </div>

              <div>

                <h2>
                  Personal Information
                </h2>

                <p>
                  Your basic identity and
                  contact details
                </p>

              </div>

            </div>


            <div className="profile-form-grid">


              <div className="profile-field">

                <label>
                  Full Name *
                </label>

                <div className="profile-input">

                  <User size={17} />

                  <input
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your full name"
                    required
                  />

                </div>

              </div>


              <div className="profile-field">

                <label>
                  Account Email
                </label>

                <div className="profile-input profile-readonly">

                  <Mail size={17} />

                  <input
                    type="email"
                    value={
                      user?.email ||
                      ""
                    }
                    readOnly
                  />

                  <span className="verified-mini">
                    <ShieldCheck
                      size={14}
                    />
                  </span>

                </div>

                <small>
                  Login email cannot be
                  changed from this profile.
                </small>

              </div>


              <div className="profile-field">

                <label>
                  Phone Number
                </label>

                <div className="profile-input">

                  <Phone size={17} />

                  <input
                    type="tel"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="10-digit phone number"
                  />

                </div>

              </div>


              <div className="profile-field">

                <label>
                  WhatsApp Number
                </label>

                <div className="profile-input">

                  <Phone size={17} />

                  <input
                    type="tel"
                    name="whatsapp_number"
                    value={
                      form.whatsapp_number
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="WhatsApp number"
                  />

                </div>

              </div>


              <div className="profile-field">

                <label>
                  Alternate Phone
                </label>

                <div className="profile-input">

                  <Phone size={17} />

                  <input
                    type="tel"
                    name="alternate_phone"
                    value={
                      form.alternate_phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional alternate number"
                  />

                </div>

              </div>


              <div className="profile-field">

                <label>
                  PIN Code
                </label>

                <input
                  type="text"
                  name="pincode"
                  value={
                    form.pincode
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="PIN code"
                />

              </div>


              <div className="profile-field">

                <label>
                  Village / Town
                </label>

                <input
                  type="text"
                  name="village"
                  value={
                    form.village
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Village / Town"
                />

              </div>


              <div className="profile-field">

                <label>
                  District
                </label>

                <input
                  type="text"
                  name="district"
                  value={
                    form.district
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="District"
                />

              </div>


              <div className="profile-field">

                <label>
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={
                    form.state
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="State"
                />

              </div>


              <div className="profile-field">

                <label>
                  Location
                </label>

                <div className="profile-input">

                  <MapPin size={17} />

                  <input
                    type="text"
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Full location"
                  />

                </div>

              </div>


              <div className="profile-field profile-full">

                <label>
                  About You
                </label>

                <textarea
                  name="bio"
                  value={
                    form.bio
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Introduce yourself, your business, experience or what you are looking for..."
                  rows="5"
                />

              </div>

            </div>

          </section>


          {/* =================================================
              PROFESSIONAL INFORMATION
          ================================================= */}

          {showCommonProfessional && (

            <section className="profile-section">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  <BriefcaseBusiness
                    size={18}
                  />
                </div>

                <div>

                  <h2>
                    Professional Information
                  </h2>

                  <p>
                    Help other TimberMart
                    users understand your
                    professional background
                  </p>

                </div>

              </div>


              <div className="profile-form-grid">


                <div className="profile-field">

                  <label>
                    Experience
                  </label>

                  <div className="profile-input">

                    <Clock3 size={17} />

                    <input
                      type="text"
                      name="experience"
                      value={
                        form.experience
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Example: 8 years"
                    />

                  </div>

                </div>


                <div className="profile-field">

                  <label>
                    Work Type
                  </label>

                  <input
                    type="text"
                    name="work_type"
                    value={
                      form.work_type
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Full time / Business / Contract"
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Company / Business Name
                  </label>

                  <div className="profile-input">

                    <Building2
                      size={17}
                    />

                    <input
                      type="text"
                      name="company_name"
                      value={
                        form.company_name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Business or company name"
                    />

                  </div>

                </div>


                <div className="profile-field">

                  <label>
                    Availability
                  </label>

                  <input
                    type="text"
                    name="availability"
                    value={
                      form.availability
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Available now / Weekdays / Seasonal"
                  />

                </div>


                <div className="profile-field profile-full">

                  <label>
                    Skills
                  </label>

                  <input
                    type="text"
                    name="skills"
                    value={
                      form.skills
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: Teak sourcing, wood cutting, furniture work..."
                  />

                  <small>
                    Separate multiple skills
                    with commas.
                  </small>

                </div>


                <div className="profile-field">

                  <label>
                    Working Area
                  </label>

                  <input
                    type="text"
                    name="working_area"
                    value={
                      form.working_area
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Areas where you work"
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Preferred Location
                  </label>

                  <input
                    type="text"
                    name="preferred_location"
                    value={
                      form.preferred_location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Preferred working / business area"
                  />

                </div>


                <div className="profile-field profile-full">

                  <label>
                    Professional / Business Description
                  </label>

                  <textarea
                    name="business_description"
                    value={
                      form.business_description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Describe your professional work, business, services and capabilities..."
                    rows="4"
                  />

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              FARMER
          ================================================= */}

          {role === "farmer" && (

            <section className="profile-section">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  <TreePine size={18} />
                </div>

                <div>

                  <h2>
                    Farmer & Timber Details
                  </h2>

                  <p>
                    Add information about
                    your trees and plantation
                  </p>

                </div>

              </div>


              <div className="profile-form-grid">


                <div className="profile-field profile-full">

                  <label>
                    Tree Types
                  </label>

                  <input
                    type="text"
                    name="tree_types"
                    value={
                      form.tree_types
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Teak, Neem, Eucalyptus, Melia Dubia..."
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Plantation Types
                  </label>

                  <input
                    type="text"
                    name="plantation_types"
                    value={
                      form.plantation_types
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Casuarina, Eucalyptus, Teak..."
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Plantation Area
                  </label>

                  <input
                    type="text"
                    name="plantation_area"
                    value={
                      form.plantation_area
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: 12 acres"
                  />

                </div>


                <div className="profile-field profile-full">

                  <label>
                    Timber Growing Experience
                  </label>

                  <textarea
                    name="timber_experience"
                    value={
                      form.timber_experience
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Describe your timber growing / plantation experience..."
                    rows="4"
                  />

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              MERCHANT
          ================================================= */}

          {role === "merchant" && (

            <section className="profile-section">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  <TreePine size={18} />
                </div>

                <div>

                  <h2>
                    Timber Merchant Details
                  </h2>

                  <p>
                    Add your buying and
                    selling information
                  </p>

                </div>

              </div>


              <div className="profile-form-grid">


                <div className="profile-field profile-full">

                  <label>
                    Timber Types
                  </label>

                  <input
                    type="text"
                    name="tree_types"
                    value={
                      form.tree_types
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Teak, Rosewood, Eucalyptus, Logs..."
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Buying Areas
                  </label>

                  <input
                    type="text"
                    name="buying_areas"
                    value={
                      form.buying_areas
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Districts / States where you buy"
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Selling Areas
                  </label>

                  <input
                    type="text"
                    name="selling_areas"
                    value={
                      form.selling_areas
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Districts / States where you sell"
                  />

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              SAWMILL
          ================================================= */}

          {role === "sawmill" && (

            <section className="profile-section">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  <Factory size={18} />
                </div>

                <div>

                  <h2>
                    Sawmill & Processing Details
                  </h2>

                  <p>
                    Tell users about your
                    processing capabilities
                  </p>

                </div>

              </div>


              <div className="profile-form-grid">


                <div className="profile-field profile-full">

                  <label>
                    Processing Types
                  </label>

                  <input
                    type="text"
                    name="processing_types"
                    value={
                      form.processing_types
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Sawing, cutting, planks, beams, custom sizes..."
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Daily Capacity
                  </label>

                  <input
                    type="text"
                    name="daily_capacity"
                    value={
                      form.daily_capacity
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: 20 cubic metres/day"
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Services Offered
                  </label>

                  <input
                    type="text"
                    name="services_offered"
                    value={
                      form.services_offered
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Custom sawing, seasoning, cutting..."
                  />

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              CARPENTER
          ================================================= */}

          {role === "carpenter" && (

            <section className="profile-section">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  <Wrench size={18} />
                </div>

                <div>

                  <h2>
                    Carpenter & Service Details
                  </h2>

                  <p>
                    Showcase your skills and
                    service capabilities
                  </p>

                </div>

              </div>


              <div className="profile-form-grid">


                <div className="profile-field profile-full">

                  <label>
                    Specializations
                  </label>

                  <input
                    type="text"
                    name="specializations"
                    value={
                      form.specializations
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Furniture, doors, interiors, modular work..."
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Services Offered
                  </label>

                  <input
                    type="text"
                    name="services_offered"
                    value={
                      form.services_offered
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Furniture making, repair, installation..."
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Service Area
                  </label>

                  <input
                    type="text"
                    name="working_area"
                    value={
                      form.working_area
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Area where you provide service"
                  />

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              WORKER
          ================================================= */}

          {role === "worker" && (

            <section className="profile-section">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  <Users size={18} />
                </div>

                <div>

                  <h2>
                    Worker / Job Details
                  </h2>

                  <p>
                    Help employers understand
                    your work preferences
                  </p>

                </div>

              </div>


              <div className="profile-form-grid">


                <div className="profile-field profile-full">

                  <label>
                    Preferred Work
                  </label>

                  <input
                    type="text"
                    name="preferred_work"
                    value={
                      form.preferred_work
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Timber cutting, loading, sawmill work, carpentry..."
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Salary Expectation
                  </label>

                  <input
                    type="text"
                    name="salary_expectation"
                    value={
                      form.salary_expectation
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Daily / monthly expectation"
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Accommodation
                  </label>

                  <label className="profile-toggle">

                    <input
                      type="checkbox"
                      name="accommodation_required"
                      checked={
                        form.accommodation_required
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span />

                    <strong>
                      Required
                    </strong>

                  </label>

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              BUYER
          ================================================= */}

          {role === "buyer" && (

            <section className="profile-section">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  <Home size={18} />
                </div>

                <div>

                  <h2>
                    Buyer Information
                  </h2>

                  <p>
                    Tell sellers what you
                    usually purchase
                  </p>

                </div>

              </div>


              <div className="profile-form-grid">


                <div className="profile-field">

                  <label>
                    Buyer Type
                  </label>

                  <select
                    name="buyer_type"
                    value={
                      form.buyer_type
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select buyer type
                    </option>

                    <option>
                      Homeowner
                    </option>

                    <option>
                      Contractor
                    </option>

                    <option>
                      Furniture Business
                    </option>

                    <option>
                      Construction Business
                    </option>

                    <option>
                      Sawmill
                    </option>

                    <option>
                      Timber Merchant
                    </option>

                    <option>
                      Other
                    </option>

                  </select>

                </div>


                <div className="profile-field">

                  <label>
                    Approximate Budget
                  </label>

                  <input
                    type="text"
                    name="approximate_budget"
                    value={
                      form.approximate_budget
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: ₹2,00,000"
                  />

                </div>


                <div className="profile-field profile-full">

                  <label>
                    Preferred Wood Types
                  </label>

                  <input
                    type="text"
                    name="preferred_wood_types"
                    value={
                      form.preferred_wood_types
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Teak, Mango, Eucalyptus, Rosewood..."
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Purchase Location
                  </label>

                  <input
                    type="text"
                    name="preferred_location"
                    value={
                      form.preferred_location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Preferred purchase area"
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Purchase Purpose
                  </label>

                  <input
                    type="text"
                    name="purchase_purpose"
                    value={
                      form.purchase_purpose
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Home / Furniture / Construction..."
                  />

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              ACCOUNT
          ================================================= */}

          <section className="profile-account-section">

            <div className="profile-account-info">

              <div className="profile-account-icon">
                <Mail size={18} />
              </div>

              <div>

                <span>
                  ACCOUNT EMAIL
                </span>

                <strong>
                  {user?.email ||
                    "Not available"}
                </strong>

              </div>

            </div>


            <div className="profile-account-verified">

              <ShieldCheck size={16} />

              Verified Account

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="profile-footer">

            {saved && (

              <div className="profile-success">

                <Check size={17} />

                Profile saved
                successfully

              </div>

            )}


            <button
              type="submit"
              className="profile-save-button"
              disabled={
                saving ||
                uploading
              }
            >

              {saving ? (

                <>
                  <Loader2
                    size={18}
                    className="profile-spin"
                  />

                  Saving...

                </>

              ) : (

                <>
                  <Save size={18} />

                  Save Profile

                </>

              )}

            </button>

          </div>


        </form>

      </main>

    </div>
  );
}
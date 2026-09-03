import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ImagePlus,
  MapPin,
  TreePine,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./SellTreeForm.css";

/* =========================================================
   TIMBERMART SELL TREE / WOOD CATEGORIES
========================================================= */

const CATEGORY_OPTIONS = [
  {
    id: "indian_trees",
    label: "Indian Trees",
    icon: "🌳",
    description: "Standing trees and individual trees",
  },
  {
    id: "plantations",
    label: "Plantations",
    icon: "🌱",
    description: "Farm and plantation-grown timber",
  },
  {
    id: "wood_products",
    label: "Wood Products",
    icon: "🪵",
    description: "Logs, timber and processed wood",
  },
];

const TREE_TYPES = {
  indian_trees: [
    "Teak",
    "Neem",
    "Rosewood",
    "Mango",
    "Tamarind",
    "Eucalyptus",
    "Melia Dubia",
    "Casuarina",
    "Subabul",
    "Babul",
    "Jackfruit",
    "Other Indian Tree",
  ],

  plantations: [
    "Casuarina Plantation",
    "Eucalyptus Plantation",
    "Melia Dubia Plantation",
    "Subabul Plantation",
    "Teak Plantation",
    "Bamboo Plantation",
    "Other Plantation",
  ],

  wood_products: [
    "Timber Logs",
    "Sawn Timber",
    "Wooden Planks",
    "Wooden Beams",
    "Wooden Poles",
    "Firewood",
    "Sawdust",
    "Wood Chips",
    "Plywood / Boards",
    "Other Wood Product",
  ],
};

const UNITS = [
  "Trees",
  "Logs",
  "Tonnes",
  "Cubic Feet",
  "Cubic Metres",
  "Pieces",
  "Load",
];

const CONDITIONS = [
  "Fresh",
  "Good",
  "Seasoned",
  "Dry",
  "Mixed",
];

const HARVEST_STATUS = [
  "Ready for sale",
  "Ready for harvest",
  "Harvesting soon",
  "Future harvest",
];

export default function SellTreeForm({ user, profile, onClose, onPublished }) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    category: "",
    tree_type: "",
    title: "",
    location: profile?.location || "",
    quantity: "",
    quantity_unit: "",
    acreage: "",
    tree_age: "",
    diameter: "",
    estimated_volume: "",
    condition: "",
    harvest_status: "",
    price: "",
    description: "",
    contact_preference: "Call / WhatsApp / Chat",
  });

  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isPlantation = form.category === "plantations";
  const isWoodProduct = form.category === "wood_products";
  const isTree = form.category === "indian_trees";

  const currentTypes = useMemo(() => {
    if (!form.category) return [];
    return TREE_TYPES[form.category] || [];
  }, [form.category]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "category") {
      setForm((prev) => ({
        ...prev,
        category: value,
        tree_type: "",
        acreage: "",
        quantity: "",
        quantity_unit: "",
        tree_age: "",
        diameter: "",
        estimated_volume: "",
        condition: "",
        harvest_status: "",
      }));
    }
  }

  function handlePhotos(event) {
    const selected = Array.from(event.target.files || []);

    const valid = selected.filter((file) => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > 5 * 1024 * 1024) return false;
      return true;
    });

    setPhotos((prev) => [...prev, ...valid].slice(0, 6));
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function validateStepOne() {
    if (!form.category) {
      setErrorMessage("Please select a category.");
      return false;
    }

    if (!form.tree_type) {
      setErrorMessage("Please select a tree or product type.");
      return false;
    }

    setErrorMessage("");
    return true;
  }

  function validateStepTwo() {
    if (!form.title.trim()) {
      setErrorMessage("Please enter a listing title.");
      return false;
    }

    if (!form.location.trim()) {
      setErrorMessage("Please enter the location.");
      return false;
    }

    if (!form.quantity.trim()) {
      setErrorMessage("Please enter the quantity.");
      return false;
    }

    if (!form.quantity_unit) {
      setErrorMessage("Please select the quantity unit.");
      return false;
    }

    if (isPlantation && !form.acreage) {
      setErrorMessage("Please enter plantation area in acres.");
      return false;
    }

    setErrorMessage("");
    return true;
  }

  function validateStepThree() {
    if (!form.price.trim()) {
      setErrorMessage("Please enter your expected price.");
      return false;
    }

    setErrorMessage("");
    return true;
  }

  function nextStep() {
    if (step === 1 && !validateStepOne()) return;
    if (step === 2 && !validateStepTwo()) return;
    if (step < 4) setStep((prev) => prev + 1);
  }

  function previousStep() {
    setErrorMessage("");

    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  }

  async function publishListing() {
    if (!validateStepThree()) return;

    try {
      setSaving(true);
      setErrorMessage("");

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          role: "farmer",

          category: form.category,
          tree_type: form.tree_type,

          title: form.title.trim(),
          wood_type: form.tree_type,

          product_type: isWoodProduct ? form.tree_type : null,

          location: form.location.trim(),

          quantity: form.quantity.trim(),
          quantity_unit: form.quantity_unit,

          acreage: isPlantation
            ? Number(form.acreage)
            : null,

          tree_age: form.tree_age.trim() || null,
          diameter: form.diameter.trim() || null,
          estimated_volume:
            form.estimated_volume.trim() || null,

          condition: form.condition || null,
          harvest_status: form.harvest_status || null,

          price: form.price.trim(),

          description:
            form.description.trim() || null,

          contact_preference:
            form.contact_preference,
        })
        .select()
        .single();

      if (listingError) {
        throw listingError;
      }

      /* =====================================================
         UPLOAD LISTING PHOTOS
      ===================================================== */

      for (let index = 0; index < photos.length; index++) {
        const file = photos[index];

        const extension =
          file.name.split(".").pop() || "jpg";

        const storagePath =
          `${user.id}/${listing.id}/${Date.now()}-${index}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("listing-photos")
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });

        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          continue;
        }

        const { data: publicUrlData } =
          supabase.storage
            .from("listing-photos")
            .getPublicUrl(storagePath);

        const publicUrl =
          publicUrlData?.publicUrl;

        if (!publicUrl) continue;

        const { error: imageError } =
          await supabase
            .from("listing_images")
            .insert({
              listing_id: listing.id,
              user_id: user.id,
              image_url: publicUrl,
              storage_path: storagePath,
              sort_order: index,
            });

        if (imageError) {
          console.error(
            "Listing image database error:",
            imageError
          );
        }
      }

      setStep(5);

      if (onPublished) {
        setTimeout(() => {
          onPublished();
        }, 1200);
      }
    } catch (error) {
      console.error("Publish listing error:", error);

      setErrorMessage(
        error?.message ||
          "Unable to publish your listing. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const categoryLabel =
    CATEGORY_OPTIONS.find(
      (item) => item.id === form.category
    )?.label || "";

  return (
    <div className="sell-tree-overlay">
      <div className="sell-tree-modal">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="sell-tree-header">

          <div className="sell-tree-brand">
            <div className="sell-tree-brand-icon">
              <TreePine size={23} />
            </div>

            <div>
              <strong>TimberMart</strong>
              <span>Sell Timber</span>
            </div>
          </div>

          <button
            className="sell-tree-close"
            onClick={onClose}
            disabled={saving}
          >
            <X size={21} />
          </button>
        </header>

        {/* =====================================================
            PROGRESS
        ===================================================== */}

        {step < 5 && (
          <div className="sell-progress">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`sell-progress-item ${
                  step >= item ? "active" : ""
                }`}
              >
                <span>{item}</span>

                {item === 1 && "Category"}
                {item === 2 && "Details"}
                {item === 3 && "Photos"}
                {item === 4 && "Review"}
              </div>
            ))}

          </div>
        )}

        {/* =====================================================
            FORM BODY
        ===================================================== */}

        <div className="sell-tree-body">

          {/* ===================================================
              STEP 1 — CATEGORY
          =================================================== */}

          {step === 1 && (
            <section className="sell-step">

              <div className="sell-step-heading">
                <span>STEP 1</span>

                <h2>What are you selling?</h2>

                <p>
                  Select a category first. We will show the
                  relevant tree or wood types.
                </p>
              </div>

              <div className="sell-category-grid">

                {CATEGORY_OPTIONS.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    className={`sell-category-card ${
                      form.category === category.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      updateField(
                        "category",
                        category.id
                      )
                    }
                  >
                    <div className="sell-category-icon">
                      {category.icon}
                    </div>

                    <div>
                      <strong>
                        {category.label}
                      </strong>

                      <p>
                        {category.description}
                      </p>
                    </div>

                    {form.category === category.id && (
                      <CheckCircle2
                        size={21}
                        className="sell-selected-icon"
                      />
                    )}
                  </button>
                ))}

              </div>

              {form.category && (
                <div className="sell-dependent-box">

                  <label>
                    {isWoodProduct
                      ? "Select wood product"
                      : "Select tree type"}
                    <span>*</span>
                  </label>

                  <select
                    value={form.tree_type}
                    onChange={(e) =>
                      updateField(
                        "tree_type",
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select {isWoodProduct
                        ? "product"
                        : "tree type"}
                    </option>

                    {currentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  {form.tree_type === "Casuarina Plantation" && (
                    <div className="sell-info-note">
                      🌱 Casuarina plantation details include
                      plantation area in acres, tree age and
                      estimated quantity.
                    </div>
                  )}

                </div>
              )}

            </section>
          )}

          {/* ===================================================
              STEP 2 — DETAILS
          =================================================== */}

          {step === 2 && (
            <section className="sell-step">

              <div className="sell-step-heading">
                <span>STEP 2</span>

                <h2>Tell buyers about your timber</h2>

                <p>
                  Add clear details so nearby buyers can
                  understand your listing.
                </p>
              </div>

              <div className="sell-selected-summary">
                <span>
                  {CATEGORY_OPTIONS.find(
                    (item) =>
                      item.id === form.category
                  )?.icon}
                </span>

                <div>
                  <small>{categoryLabel}</small>
                  <strong>{form.tree_type}</strong>
                </div>
              </div>

              <div className="sell-form-grid">

                <div className="sell-field sell-full">
                  <label>
                    Listing title <span>*</span>
                  </label>

                  <input
                    value={form.title}
                    onChange={(e) =>
                      updateField(
                        "title",
                        e.target.value
                      )
                    }
                    placeholder={
                      isPlantation
                        ? "Example: Casuarina plantation for sale"
                        : "Example: Mature teak trees for sale"
                    }
                  />
                </div>

                <div className="sell-field">
                  <label>
                    Location <span>*</span>
                  </label>

                  <div className="sell-input-icon">
                    <MapPin size={17} />

                    <input
                      value={form.location}
                      onChange={(e) =>
                        updateField(
                          "location",
                          e.target.value
                        )
                      }
                      placeholder="Village / Town / District"
                    />
                  </div>
                </div>

                <div className="sell-field">
                  <label>
                    Quantity <span>*</span>
                  </label>

                  <input
                    value={form.quantity}
                    onChange={(e) =>
                      updateField(
                        "quantity",
                        e.target.value
                      )
                    }
                    placeholder={
                      isPlantation
                        ? "Estimated quantity"
                        : "Example: 25"
                    }
                  />
                </div>

                <div className="sell-field">
                  <label>
                    Quantity unit <span>*</span>
                  </label>

                  <select
                    value={form.quantity_unit}
                    onChange={(e) =>
                      updateField(
                        "quantity_unit",
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select unit
                    </option>

                    {UNITS.map((unit) => (
                      <option
                        key={unit}
                        value={unit}
                      >
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                {isPlantation && (
                  <>
                    <div className="sell-field">
                      <label>
                        Plantation area (Acres){" "}
                        <span>*</span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.acreage}
                        onChange={(e) =>
                          updateField(
                            "acreage",
                            e.target.value
                          )
                        }
                        placeholder="Example: 2.5"
                      />
                      <small>
                        Enter total plantation area
                      </small>
                    </div>

                    <div className="sell-field">
                      <label>
                        Tree age
                      </label>

                      <input
                        value={form.tree_age}
                        onChange={(e) =>
                          updateField(
                            "tree_age",
                            e.target.value
                          )
                        }
                        placeholder="Example: 4 years"
                      />
                    </div>
                  </>
                )}

                {isTree && (
                  <>
                    <div className="sell-field">
                      <label>
                        Tree age
                      </label>

                      <input
                        value={form.tree_age}
                        onChange={(e) =>
                          updateField(
                            "tree_age",
                            e.target.value
                          )
                        }
                        placeholder="Example: 12 years"
                      />
                    </div>

                    <div className="sell-field">
                      <label>
                        Average diameter
                      </label>

                      <input
                        value={form.diameter}
                        onChange={(e) =>
                          updateField(
                            "diameter",
                            e.target.value
                          )
                        }
                        placeholder="Example: 18 inches"
                      />
                    </div>
                  </>
                )}

                {isWoodProduct && (
                  <div className="sell-field">
                    <label>
                      Condition
                    </label>

                    <select
                      value={form.condition}
                      onChange={(e) =>
                        updateField(
                          "condition",
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Select condition
                      </option>

                      {CONDITIONS.map((item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sell-field">
                  <label>
                    Estimated volume
                  </label>

                  <input
                    value={form.estimated_volume}
                    onChange={(e) =>
                      updateField(
                        "estimated_volume",
                        e.target.value
                      )
                    }
                    placeholder="Example: 500 CFT"
                  />
                </div>

                <div className="sell-field">
                  <label>
                    Sale / Harvest status
                  </label>

                  <select
                    value={form.harvest_status}
                    onChange={(e) =>
                      updateField(
                        "harvest_status",
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select status
                    </option>

                    {HARVEST_STATUS.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sell-field sell-full">
                  <label>
                    Expected price <span>*</span>
                  </label>

                  <input
                    value={form.price}
                    onChange={(e) =>
                      updateField(
                        "price",
                        e.target.value
                      )
                    }
                    placeholder="Example: ₹2,50,000 or ₹1,200 / CFT"
                  />
                </div>

                <div className="sell-field sell-full">
                  <label>
                    Description
                  </label>

                  <textarea
                    rows="5"
                    value={form.description}
                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Add useful information about the trees, access road, location, harvesting, timber quality, etc."
                  />
                </div>

              </div>

            </section>
          )}

          {/* ===================================================
              STEP 3 — PHOTOS
          =================================================== */}

          {step === 3 && (
            <section className="sell-step">

              <div className="sell-step-heading">
                <span>STEP 3</span>

                <h2>Add photos</h2>

                <p>
                  Real photos help buyers understand your
                  timber before contacting you.
                </p>
              </div>

              <label className="sell-photo-upload">

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotos}
                />

                <div className="sell-photo-upload-icon">
                  <ImagePlus size={30} />
                </div>

                <strong>
                  Add timber photos
                </strong>

                <span>
                  JPG, PNG or WEBP · Maximum 5 MB each
                </span>

                <small>
                  Up to 6 photos
                </small>

              </label>

              {photos.length > 0 && (
                <div className="sell-photo-grid">

                  {photos.map((photo, index) => (
                    <div
                      className="sell-photo-preview"
                      key={`${photo.name}-${index}`}
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt=""
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removePhoto(index)
                        }
                      >
                        <X size={16} />
                      </button>

                      {index === 0 && (
                        <span>
                          Main photo
                        </span>
                      )}
                    </div>
                  ))}

                </div>
              )}

              <div className="sell-photo-tip">
                <Camera size={18} />

                <div>
                  <strong>
                    Photo tips
                  </strong>

                  <p>
                    Upload clear photos of the tree,
                    timber, plantation area or wood
                    product. Avoid blurry or unrelated
                    images.
                  </p>
                </div>
              </div>

            </section>
          )}

          {/* ===================================================
              STEP 4 — REVIEW
          =================================================== */}

          {step === 4 && (
            <section className="sell-step">

              <div className="sell-step-heading">
                <span>STEP 4</span>

                <h2>Review your listing</h2>

                <p>
                  Check the information before publishing
                  it to TimberMart.
                </p>
              </div>

              <div className="sell-review-card">

                <div className="sell-review-title">
                  <span>
                    {CATEGORY_OPTIONS.find(
                      (item) =>
                        item.id === form.category
                    )?.icon}
                  </span>

                  <div>
                    <small>{categoryLabel}</small>
                    <h3>{form.title}</h3>
                    <strong>
                      {form.tree_type}
                    </strong>
                  </div>
                </div>

                <div className="sell-review-grid">

                  <ReviewItem
                    label="Location"
                    value={form.location}
                  />

                  <ReviewItem
                    label="Quantity"
                    value={`${form.quantity} ${form.quantity_unit}`}
                  />

                  {isPlantation && (
                    <ReviewItem
                      label="Plantation Area"
                      value={`${form.acreage} Acres`}
                    />
                  )}

                  {form.tree_age && (
                    <ReviewItem
                      label="Tree Age"
                      value={form.tree_age}
                    />
                  )}

                  {form.diameter && (
                    <ReviewItem
                      label="Diameter"
                      value={form.diameter}
                    />
                  )}

                  {form.estimated_volume && (
                    <ReviewItem
                      label="Estimated Volume"
                      value={form.estimated_volume}
                    />
                  )}

                  {form.condition && (
                    <ReviewItem
                      label="Condition"
                      value={form.condition}
                    />
                  )}

                  {form.harvest_status && (
                    <ReviewItem
                      label="Status"
                      value={form.harvest_status}
                    />
                  )}

                  <ReviewItem
                    label="Expected Price"
                    value={form.price}
                  />

                  <ReviewItem
                    label="Photos"
                    value={`${photos.length} photo${
                      photos.length === 1
                        ? ""
                        : "s"
                    }`}
                  />

                </div>

                {form.description && (
                  <div className="sell-review-description">
                    <strong>Description</strong>
                    <p>
                      {form.description}
                    </p>
                  </div>
                )}

              </div>

              <div className="sell-publish-note">
                <CheckCircle2 size={20} />

                <p>
                  By publishing, your listing will be
                  visible to TimberMart users. Buyers can
                  contact you directly through the available
                  contact options.
                </p>
              </div>

            </section>
          )}

          {/* ===================================================
              STEP 5 — SUCCESS
          =================================================== */}

          {step === 5 && (
            <section className="sell-success">

              <div className="sell-success-icon">
                <CheckCircle2 size={52} />
              </div>

              <h2>
                Listing Published 🎉
              </h2>

              <p>
                Your timber listing has been successfully
                published on TimberMart.
              </p>

              <div className="sell-success-summary">
                <TreePine size={20} />

                <span>
                  {form.title}
                </span>
              </div>

              <small>
                Buyers can now view your listing and contact
                you directly.
              </small>

            </section>
          )}

          {/* ===================================================
              ERROR
          =================================================== */}

          {errorMessage && (
            <div className="sell-error">
              {errorMessage}
            </div>
          )}

        </div>

        {/* =====================================================
            FOOTER ACTIONS
        ===================================================== */}

        {step < 5 && (
          <footer className="sell-tree-footer">

            <button
              type="button"
              className="sell-back-button"
              onClick={
                step === 1
                  ? onClose
                  : previousStep
              }
              disabled={saving}
            >
              <ArrowLeft size={18} />

              {step === 1
                ? "Cancel"
                : "Back"}
            </button>

            {step < 4 ? (
              <button
                type="button"
                className="sell-next-button"
                onClick={nextStep}
                disabled={saving}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="sell-publish-button"
                onClick={publishListing}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="sell-button-spinner" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Publish Listing
                  </>
                )}
              </button>
            )}

          </footer>
        )}

      </div>
    </div>
  );
}

function ReviewItem({ label, value }) {
  if (!value) return null;

  return (
    <div className="sell-review-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
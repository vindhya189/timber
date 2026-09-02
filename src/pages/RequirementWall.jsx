import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase } from "../supabaseClient";

export default function RequirementWall() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [requirements, setRequirements] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [form, setForm] =
    useState({
      title: "",
      category: "",
      location: "",
      quantity: "",
      budget: "",
      description: "",
    });

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/roles", {
          replace: true,
        });
        return;
      }

      setUser(session.user);

      const { data: profileData } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "id",
            session.user.id
          )
          .maybeSingle();

      setProfile(profileData);

      await loadRequirements();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load requirements."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRequirements() {
    const { data, error } =
      await supabase
        .from("requirements")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    setRequirements(data || []);
  }

  function change(e) {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });

    setMessage("");
    setError("");
  }

  async function createRequirement(e) {
    e.preventDefault();

    if (!user?.id) {
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Please enter requirement title."
      );
      return;
    }

    if (!form.category.trim()) {
      setError(
        "Please enter category."
      );
      return;
    }

    if (!form.location.trim()) {
      setError(
        "Please enter location."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { data, error } =
        await supabase
          .from("requirements")
          .insert({
            user_id: user.id,

            title:
              form.title.trim(),

            category:
              form.category.trim(),

            category_label:
              form.category.trim(),

            location:
              form.location.trim(),

            quantity:
              form.quantity.trim(),

            budget:
              form.budget.trim(),

            description:
              form.description.trim(),
          })
          .select()
          .single();

      if (error) {
        throw error;
      }

      setRequirements((old) => [
        data,
        ...old,
      ]);

      setForm({
        title: "",
        category: "",
        location: "",
        quantity: "",
        budget: "",
        description: "",
      });

      setShowForm(false);

      setMessage(
        "Requirement posted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to post requirement."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRequirement(id) {
    const ok = window.confirm(
      "Delete this requirement?"
    );

    if (!ok) return;

    try {
      const { error } =
        await supabase
          .from("requirements")
          .delete()
          .eq("id", id)
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        throw error;
      }

      setRequirements((old) =>
        old.filter(
          (item) =>
            item.id !== id
        )
      );

      setMessage(
        "Requirement deleted."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to delete requirement."
      );
    }
  }

  const filtered =
    requirements.filter(
      (item) => {
        const text = `
          ${item.title || ""}
          ${item.category || ""}
          ${item.location || ""}
          ${item.description || ""}
        `.toLowerCase();

        return text.includes(
          search.toLowerCase()
        );
      }
    );

  if (loading) {
    return (
      <div className="tm-loading-page">
        <div className="tm-loader" />
        <p>
          Loading Requirement Wall...
        </p>
      </div>
    );
  }

  return (
    <div className="tm-simple-page">

      <header className="tm-simple-header">

        <button
          className="tm-back-page"
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="tm-simple-logo">
          🌲 TimberMart
        </div>

      </header>

      <main className="tm-simple-content">

        <div className="tm-page-title requirement-heading">

          <div>
            <span>
              📋 TimberMart
            </span>

            <h1>
              Requirement Wall
            </h1>

            <p>
              Find requirements posted by
              TimberMart users or post your
              own requirement.
            </p>
          </div>

          <button
            className="tm-btn tm-btn-primary"
            onClick={() =>
              setShowForm(true)
            }
          >
            <Plus size={17} />
            Post Requirement
          </button>

        </div>

        {error && (
          <div className="tm-profile-alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="tm-profile-alert success">
            {message}
          </div>
        )}

        {/* SEARCH */}

        <div className="tm-requirement-search">

          <Search size={18} />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search requirements..."
          />

        </div>

        {/* FORM */}

        {showForm && (
          <div className="tm-requirement-form">

            <div className="tm-form-top">

              <div>
                <h2>
                  Post Requirement
                </h2>

                <p>
                  Add what you need.
                </p>
              </div>

              <button
                className="tm-icon-btn"
                onClick={() =>
                  setShowForm(false)
                }
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                createRequirement
              }
            >

              <div className="tm-requirement-grid">

                <div className="tm-field">
                  <label>
                    Requirement Title *
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={change}
                    placeholder="Example: Need Teak Trees"
                  />
                </div>

                <div className="tm-field">
                  <label>
                    Category *
                  </label>

                  <input
                    name="category"
                    value={form.category}
                    onChange={change}
                    placeholder="Timber / Wood / Service"
                  />
                </div>

                <div className="tm-field">
                  <label>
                    Location *
                  </label>

                  <input
                    name="location"
                    value={form.location}
                    onChange={change}
                    placeholder="Enter location"
                  />
                </div>

                <div className="tm-field">
                  <label>
                    Quantity
                  </label>

                  <input
                    name="quantity"
                    value={form.quantity}
                    onChange={change}
                    placeholder="Example: 25 trees"
                  />
                </div>

                <div className="tm-field">
                  <label>
                    Budget
                  </label>

                  <input
                    name="budget"
                    value={form.budget}
                    onChange={change}
                    placeholder="Enter budget"
                  />
                </div>

              </div>

              <div className="tm-field">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={change}
                  rows="4"
                  placeholder="Describe your requirement..."
                />
              </div>

              <div className="tm-form-actions">

                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tm-btn tm-btn-primary"
                  disabled={saving}
                >
                  <Plus size={17} />

                  {saving
                    ? "Posting..."
                    : "Post Requirement"}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* LIST */}

        <div className="tm-wall-count">
          {filtered.length} requirement
          {filtered.length === 1
            ? ""
            : "s"}
        </div>

        {filtered.length === 0 ? (

          <div className="tm-empty">

            <div className="tm-empty-icon">
              <ClipboardList size={28} />
            </div>

            <h3>
              No requirements found
            </h3>

            <p>
              There are no requirements
              matching your search yet.
            </p>

            <button
              className="tm-btn tm-btn-primary"
              onClick={() =>
                setShowForm(true)
              }
            >
              <Plus size={16} />
              Post Requirement
            </button>

          </div>

        ) : (

          <div className="tm-wall-grid">

            {filtered.map(
              (item) => {

                const isMine =
                  item.user_id ===
                  user?.id;

                return (
                  <article
                    className="tm-wall-card"
                    key={item.id}
                  >

                    <div className="tm-wall-card-top">

                      <div className="tm-wall-icon">
                        📌
                      </div>

                      <span>
                        {item.category_label ||
                          item.category ||
                          "Requirement"}
                      </span>

                    </div>

                    <h3>
                      {item.title}
                    </h3>

                    <div className="tm-wall-info">

                      {item.location && (
                        <div>
                          <MapPin size={14} />
                          {item.location}
                        </div>
                      )}

                      {item.quantity && (
                        <div>
                          📦{" "}
                          {item.quantity}
                        </div>
                      )}

                      {item.budget && (
                        <div>
                          💰{" "}
                          {item.budget}
                        </div>
                      )}

                    </div>

                    {item.description && (
                      <p>
                        {item.description}
                      </p>
                    )}

                    <div className="tm-wall-footer">

                      <span>
                        {isMine
                          ? "Posted by you"
                          : "TimberMart user"}
                      </span>

                      {isMine && (
                        <button
                          className="delete-btn"
                          onClick={() =>
                            deleteRequirement(
                              item.id
                            )
                          }
                        >
                          <Trash2
                            size={14}
                          />
                          Delete
                        </button>
                      )}

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </main>
    </div>
  );
}
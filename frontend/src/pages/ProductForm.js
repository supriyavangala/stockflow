import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api/client";

const emptyForm = {
  name: "",
  sku: "",
  description: "",
  quantity_on_hand: "0",
  cost_price: "",
  selling_price: "",
  low_stock_threshold: "",
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const p = await api.getProduct(id);
      setForm({
        name: p.name,
        sku: p.sku,
        description: p.description || "",
        quantity_on_hand: String(p.quantity_on_hand),
        cost_price: p.cost_price != null ? String(p.cost_price) : "",
        selling_price: p.selling_price != null ? String(p.selling_price) : "",
        low_stock_threshold: p.low_stock_threshold != null ? String(p.low_stock_threshold) : "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      quantity_on_hand: parseInt(form.quantity_on_hand || "0", 10),
      cost_price: form.cost_price === "" ? null : parseFloat(form.cost_price),
      selling_price: form.selling_price === "" ? null : parseFloat(form.selling_price),
      low_stock_threshold: form.low_stock_threshold === "" ? null : parseInt(form.low_stock_threshold, 10),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await api.updateProduct(id, payload);
      } else {
        await api.createProduct(payload);
      }
      navigate("/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.deleteProduct(id);
      navigate("/products");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="page-loading">Loading product…</div>;

  return (
    <div className="page page-narrow">
      <header className="page-header">
        <h1>{isEdit ? "Edit Product" : "Add Product"}</h1>
        <Link to="/products" className="btn btn-ghost">
          Back to products
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form panel">
        <div className="form-row">
          <label className="field">
            <span>Name *</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Blue Cotton T-Shirt"
            />
          </label>

          <label className="field">
            <span>SKU *</span>
            <input
              type="text"
              required
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              placeholder="TSHIRT-BLU-M"
            />
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Optional description"
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Quantity on Hand</span>
            <input
              type="number"
              min="0"
              value={form.quantity_on_hand}
              onChange={(e) => update("quantity_on_hand", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Low Stock Threshold</span>
            <input
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => update("low_stock_threshold", e.target.value)}
              placeholder="Uses org default if empty"
            />
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Cost Price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost_price}
              onChange={(e) => update("cost_price", e.target.value)}
              placeholder="0.00"
            />
          </label>

          <label className="field">
            <span>Selling Price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.selling_price}
              onChange={(e) => update("selling_price", e.target.value)}
              placeholder="0.00"
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
          {isEdit && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete Product
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

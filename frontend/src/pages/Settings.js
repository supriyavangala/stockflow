import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../AuthContext";

export default function Settings() {
  const { updateOrganization } = useAuth();
  const [threshold, setThreshold] = useState("5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const org = await api.getSettings();
      setThreshold(String(org.default_low_stock_threshold));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const org = await api.updateSettings({ default_low_stock_threshold: parseInt(threshold, 10) });
      updateOrganization(org);
      setSuccess("Settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading">Loading settings…</div>;

  return (
    <div className="page page-narrow">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form panel">
        <label className="field">
          <span>Default Low Stock Threshold</span>
          <input
            type="number"
            min="0"
            required
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <small className="field-hint">
            Used for any product that doesn't have its own low stock threshold set.
          </small>
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

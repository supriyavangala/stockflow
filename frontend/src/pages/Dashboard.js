import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page-loading">Loading dashboard…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <Link to="/products" className="btn btn-primary">
          + Add Product
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total Products</div>
              <div className="stat-value">{data.total_products}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Units on Hand</div>
              <div className="stat-value">{data.total_quantity_on_hand}</div>
            </div>
            <div className="stat-card stat-card-warning">
              <div className="stat-label">Low Stock Items</div>
              <div className="stat-value">{data.low_stock_count}</div>
            </div>
          </div>

          <section className="panel">
            <h2>Low Stock Items</h2>
            {data.low_stock_items.length === 0 ? (
              <p className="empty-state">Nothing is low on stock right now. 🎉</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Quantity on Hand</th>
                    <th>Low Stock Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {data.low_stock_items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="mono">{item.sku}</td>
                      <td>
                        <span className="badge badge-warning">{item.quantity_on_hand}</span>
                      </td>
                      <td>{item.low_stock_threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}

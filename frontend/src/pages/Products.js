import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(null); // product id being adjusted

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.listProducts(search);
      setProducts(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}" (${product.sku})? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdjust(product, delta) {
    setAdjusting(product.id);
    setError("");
    try {
      const updated = await api.adjustStock(product.id, { delta, note: delta > 0 ? "Restock" : "Adjustment" });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    } catch (err) {
      setError(err.message);
    } finally {
      setAdjusting(null);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Products</h1>
        <Link to="/products/new" className="btn btn-primary">
          + Add Product
        </Link>
      </header>

      <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="empty-state-panel">
          <p>No products yet.</p>
          <Link to="/products/new" className="btn btn-primary">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Low Stock</th>
                <th>Selling Price</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/products/${p.id}`} className="table-link">
                      {p.name}
                    </Link>
                  </td>
                  <td className="mono">{p.sku}</td>
                  <td>
                    <div className="qty-controls">
                      <button
                        className="btn-icon"
                        disabled={adjusting === p.id || p.quantity_on_hand <= 0}
                        onClick={() => handleAdjust(p, -1)}
                        title="Decrease by 1"
                      >
                        −
                      </button>
                      <span className={p.is_low_stock ? "badge badge-warning" : "qty-value"}>
                        {p.quantity_on_hand}
                      </span>
                      <button
                        className="btn-icon"
                        disabled={adjusting === p.id}
                        onClick={() => handleAdjust(p, 1)}
                        title="Increase by 1"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{p.is_low_stock ? <span className="badge badge-warning">Low</span> : <span className="badge badge-ok">OK</span>}</td>
                  <td>{p.selling_price != null ? `$${p.selling_price.toFixed(2)}` : "—"}</td>
                  <td className="actions-col">
                    <Link to={`/products/${p.id}`} className="btn btn-ghost btn-small">
                      Edit
                    </Link>
                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

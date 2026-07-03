import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Layout({ children }) {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span className="brand-name">StockFlow</span>
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Dashboard
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Products
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="org-name">{organization?.name}</div>
          <div className="user-email">{user?.email}</div>
          <button className="btn btn-ghost btn-small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

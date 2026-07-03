import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import Settings from "./pages/Settings";

function RootRedirect() {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return null;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

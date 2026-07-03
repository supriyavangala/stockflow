import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Layout from "./Layout";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();

  if (!ready) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
}

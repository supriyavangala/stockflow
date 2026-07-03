import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("stockflow_user");
    const storedOrg = localStorage.getItem("stockflow_org");
    const token = localStorage.getItem("stockflow_token");
    if (token && storedUser && storedOrg) {
      setUser(JSON.parse(storedUser));
      setOrganization(JSON.parse(storedOrg));
    }
    setReady(true);
  }, []);

  function persist(data) {
    localStorage.setItem("stockflow_token", data.token);
    localStorage.setItem("stockflow_user", JSON.stringify(data.user));
    localStorage.setItem("stockflow_org", JSON.stringify(data.organization));
    setUser(data.user);
    setOrganization(data.organization);
  }

  async function signup({ email, password, organizationName }) {
    const data = await api.signup({
      email,
      password,
      organization_name: organizationName,
    });
    persist(data);
    return data;
  }

  async function login({ email, password }) {
    const data = await api.login({ email, password });
    persist(data);
    return data;
  }

  function logout() {
    localStorage.removeItem("stockflow_token");
    localStorage.removeItem("stockflow_user");
    localStorage.removeItem("stockflow_org");
    setUser(null);
    setOrganization(null);
  }

  function updateOrganization(org) {
    localStorage.setItem("stockflow_org", JSON.stringify(org));
    setOrganization(org);
  }

  const value = {
    user,
    organization,
    isAuthenticated: !!user,
    ready,
    signup,
    login,
    logout,
    updateOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

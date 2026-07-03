const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("stockflow_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no JSON body
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),

  getDashboard: () => request("/dashboard"),

  listProducts: (search = "") =>
    request(`/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (payload) => request("/products", { method: "POST", body: payload }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: "PUT", body: payload }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),
  adjustStock: (id, payload) => request(`/products/${id}/adjust`, { method: "POST", body: payload }),

  getSettings: () => request("/settings"),
  updateSettings: (payload) => request("/settings", { method: "PUT", body: payload }),
};

export { getToken };

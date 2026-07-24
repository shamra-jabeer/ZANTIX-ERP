// Centralized frontend database utility using Express/MongoDB backend APIs
const API_URL = "http://localhost:5000/api";

// Trigger a custom event to notify other components in the same window of state changes
function dispatchDbUpdate() {
  window.dispatchEvent(new Event("zantix-db-update"));
}

export function initDb() {
  // Database initialization is now handled by the backend server seeding process
  console.log("Database initialized via backend.");
}

// PRODUCTS API
export async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
  } catch (error) {
    console.error("Error in getProducts:", error);
    return [];
  }
}

export async function saveProduct(product) {
  try {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error("Failed to save product");
    const data = await res.json();
    dispatchDbUpdate();
    return data;
  } catch (error) {
    console.error("Error in saveProduct:", error);
    return product;
  }
}

export async function deleteProduct(id) {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete product");
    dispatchDbUpdate();
  } catch (error) {
    console.error("Error in deleteProduct:", error);
  }
}

// SUPPLIERS API
export async function getSuppliers() {
  try {
    const res = await fetch(`${API_URL}/suppliers`);
    if (!res.ok) throw new Error("Failed to fetch suppliers");
    return await res.json();
  } catch (error) {
    console.error("Error in getSuppliers:", error);
    return [];
  }
}

export async function saveSupplier(supplier) {
  try {
    const res = await fetch(`${API_URL}/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplier),
    });
    if (!res.ok) throw new Error("Failed to save supplier");
    const data = await res.json();
    dispatchDbUpdate();
    return data;
  } catch (error) {
    console.error("Error in saveSupplier:", error);
    return supplier;
  }
}

export async function deleteSupplier(id) {
  try {
    const res = await fetch(`${API_URL}/suppliers/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete supplier");
    dispatchDbUpdate();
  } catch (error) {
    console.error("Error in deleteSupplier:", error);
  }
}

// INVOICES API
export async function getInvoices() {
  try {
    const res = await fetch(`${API_URL}/invoices`);
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return await res.json();
  } catch (error) {
    console.error("Error in getInvoices:", error);
    return [];
  }
}

export async function saveInvoice(invoice) {
  try {
    const res = await fetch(`${API_URL}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });
    if (!res.ok) throw new Error("Failed to save invoice");
    const data = await res.json();
    dispatchDbUpdate();
    return data;
  } catch (error) {
    console.error("Error in saveInvoice:", error);
    return invoice;
  }
}

export async function updateInvoiceStatus(id, status) {
  try {
    const res = await fetch(`${API_URL}/invoices/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update invoice status");
    dispatchDbUpdate();
  } catch (error) {
    console.error("Error in updateInvoiceStatus:", error);
  }
}

// NOTIFICATIONS API
export async function getNotifications() {
  try {
    const res = await fetch(`${API_URL}/notifications`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return await res.json();
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return [];
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const res = await fetch(`${API_URL}/notifications/mark-read`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to mark notifications as read");
    dispatchDbUpdate();
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
  }
}

export async function clearNotifications() {
  try {
    const res = await fetch(`${API_URL}/notifications`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to clear notifications");
    dispatchDbUpdate();
  } catch (error) {
    console.error("Error in clearNotifications:", error);
  }
}

// AUTH API (session stored in localStorage, verified against backend)
const AUTH_KEY = "zantix_auth_session";

export async function loginUser(email, pin) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin }),
    });
    const data = await res.json();
    if (data.success) {
      const session = { email, role: data.role, name: data.name, loggedIn: true, time: Date.now() };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return { success: true, session };
    }
    return { success: false, error: data.error || "Invalid credentials." };
  } catch (error) {
    console.error("Error in loginUser:", error);
    return { success: false, error: "Cannot connect to server. Please ensure the backend is running." };
  }
}

export function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  dispatchDbUpdate();
}

export function getSession() {
  return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
}

// SETTINGS API
export async function getSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`);
    if (!res.ok) throw new Error("Failed to fetch settings");
    return await res.json();
  } catch (error) {
    console.error("Error in getSettings:", error);
    return { categories: ["Accessories", "Toys", "Cosmetics"], staffUsers: [] };
  }
}

export async function updateCategories(categories) {
  try {
    const res = await fetch(`${API_URL}/settings/categories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories }),
    });
    if (!res.ok) throw new Error("Failed to update categories");
    const data = await res.json();
    dispatchDbUpdate();
    return data;
  } catch (error) {
    console.error("Error in updateCategories:", error);
  }
}

export async function addStaffUser(staff) {
  try {
    const res = await fetch(`${API_URL}/settings/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staff),
    });
    if (!res.ok) throw new Error("Failed to add staff user");
    const data = await res.json();
    dispatchDbUpdate();
    return data;
  } catch (error) {
    console.error("Error in addStaffUser:", error);
  }
}

export async function deleteStaffUser(email) {
  try {
    const res = await fetch(`${API_URL}/settings/staff/${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete staff user");
    dispatchDbUpdate();
  } catch (error) {
    console.error("Error in deleteStaffUser:", error);
  }
}

export async function deleteVariant(productId, variantId) {
  try {
    const res = await fetch(`${API_URL}/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete variant");
    dispatchDbUpdate();
  } catch (error) {
    console.error("Error in deleteVariant:", error);
  }
}

export async function getSMSLogs() {
  try {
    const res = await fetch(`${API_URL}/sms-logs`);
    if (!res.ok) throw new Error("Failed to fetch SMS logs");
    return await res.json();
  } catch (error) {
    console.error("Error in getSMSLogs:", error);
    return [];
  }
}

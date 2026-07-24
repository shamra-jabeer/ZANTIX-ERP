import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getSettings, updateCategories, addStaffUser, deleteStaffUser } from "../utils/db";
import {
  LuSettings, LuPlus, LuTrash2, LuUsers, LuTag, LuShield,
  LuCheck, LuPen, LuX
} from "react-icons/lu";

function Settings() {
  const [categories, setCategories] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category form state
  const [newCategory, setNewCategory] = useState("");
  const [catError, setCatError] = useState("");
  const [catSuccess, setCatSuccess] = useState("");

  // Staff form state
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", pin: "" });
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    const data = await getSettings();
    setCategories(data.categories || []);
    setStaffUsers(data.staffUsers || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener("zantix-db-update", loadSettings);
    return () => window.removeEventListener("zantix-db-update", loadSettings);
  }, []);

  // --- Category Handlers ---
  const handleAddCategory = async () => {
    setCatError(""); setCatSuccess("");
    const trimmed = newCategory.trim();
    if (!trimmed) { setCatError("Category name cannot be empty."); return; }
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCatError("This category already exists."); return;
    }
    const updated = [...categories, trimmed];
    await updateCategories(updated);
    setNewCategory("");
    setCatSuccess(`"${trimmed}" added successfully.`);
    setTimeout(() => setCatSuccess(""), 2500);
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat}"? This won't affect existing products.`)) return;
    const updated = categories.filter(c => c !== cat);
    await updateCategories(updated);
  };

  // --- Staff Handlers ---
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffError(""); setStaffSuccess("");
    const { name, email, pin } = staffForm;
    if (!name.trim() || !email.trim() || !pin.trim()) { setStaffError("All fields are required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStaffError("Please enter a valid email address."); return; }
    if (!/^\d{4,8}$/.test(pin)) { setStaffError("PIN must be 4 to 8 digits only."); return; }
    if (staffUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setStaffError("A staff member with this email already exists."); return;
    }
    await addStaffUser({ name: name.trim(), email: email.trim(), pin: pin.trim() });
    setStaffForm({ name: "", email: "", pin: "" });
    setShowStaffForm(false);
    setStaffSuccess(`Staff member "${name.trim()}" added successfully.`);
    setTimeout(() => setStaffSuccess(""), 2500);
  };

  const handleDeleteStaff = async (email) => {
    if (!window.confirm(`Remove staff member with email "${email}"? They will lose system access immediately.`)) return;
    await deleteStaffUser(email);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">Loading settings...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <LuSettings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Settings</h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1 ml-13">
            Manage staff accounts, product categories, and system preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Category Management ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <LuTag className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Product Categories</h2>
                  <p className="text-xs text-slate-500">Manage the categories available in the product catalog.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Add Category */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="e.g. Stationery, Electronics..."
                  className="flex-1 border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LuPlus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {catError && <p className="text-xs text-red-500">{catError}</p>}
              {catSuccess && <p className="text-xs text-emerald-600 flex items-center gap-1"><LuCheck className="w-3 h-3" />{catSuccess}</p>}

              {/* Category Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700"
                  >
                    <span>{cat}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title={`Remove ${cat}`}
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No categories defined.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Staff Management ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                  <LuUsers className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Staff Members</h2>
                  <p className="text-xs text-slate-500">Add or remove staff logins. They can access Inventory, Invoices, and Sales.</p>
                </div>
              </div>
              <button
                onClick={() => { setShowStaffForm(true); setStaffError(""); }}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow hover:shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <LuPlus className="w-4 h-4" />
                <span>Add Staff</span>
              </button>
            </div>

            <div className="p-6">
              {staffSuccess && (
                <div className="mb-4 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center gap-1.5">
                  <LuCheck className="w-3.5 h-3.5" />{staffSuccess}
                </div>
              )}

              {/* Admin Account (fixed) */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-blue-50/60 border border-blue-100 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">A</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Administrator</p>
                    <p className="text-xs text-slate-500">admin@zantix.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <LuShield className="w-3 h-3" /> ADMIN
                  </span>
                  <span className="text-xs text-slate-400 italic">PIN: 1234 (fixed)</span>
                </div>
              </div>

              {/* Staff list */}
              {staffUsers.length > 0 ? (
                <div className="space-y-2">
                  {staffUsers.map((user) => (
                    <div key={user.email} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">STAFF</span>
                        <button
                          onClick={() => handleDeleteStaff(user.email)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove staff member"
                        >
                          <LuTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                  No staff members added yet. Click "Add Staff" to get started.
                </div>
              )}
            </div>
          </div>

          {/* ── Admin Credentials Info ── */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
            <LuShield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Fixed Administrator Account</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                The administrator account (<span className="font-mono font-bold">admin@zantix.com</span> / PIN: <span className="font-mono font-bold">1234</span>) is
                built into the system and cannot be deleted or modified here. To change the admin PIN, it must be updated
                directly in the backend <span className="font-mono">server.js</span> file.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add New Staff Member</h3>
              <button
                onClick={() => { setShowStaffForm(false); setStaffError(""); setStaffForm({ name: "", email: "", pin: "" }); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {staffError && (
              <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{staffError}</div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Kamal Perera"
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="staff@example.com"
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Security PIN (4–8 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={staffForm.pin}
                  onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value.replace(/\D/g, "") })}
                  placeholder="e.g. 5678"
                  maxLength={8}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm tracking-widest"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowStaffForm(false); setStaffError(""); setStaffForm({ name: "", email: "", pin: "" }); }}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Settings;

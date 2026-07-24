import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getSuppliers, saveSupplier, deleteSupplier } from "../utils/db";
import { LuPlus, LuSearch, LuPen, LuTrash2, LuTruck, LuUser, LuMail, LuPhone } from "react-icons/lu";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadSuppliers = async () => {
    const data = await getSuppliers();
    setSuppliers(data);
  };

  useEffect(() => {
    loadSuppliers();
    window.addEventListener("zantix-db-update", loadSuppliers);
    window.addEventListener("storage", loadSuppliers);

    return () => {
      window.removeEventListener("zantix-db-update", loadSuppliers);
      window.removeEventListener("storage", loadSuppliers);
    };
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      await deleteSupplier(id);
    }
  };

  const handleEdit = (supplier) => {
    setEditing(supplier);
    setShowForm(true);
  };

  const handleSave = async (form) => {
    await saveSupplier(form);
    setShowForm(false);
    setEditing(null);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    [supplier.name, supplier.contact, supplier.category, supplier.email, supplier.countryOfImport].some((field) =>
      field && field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Layout>
      <div className="w-full">
        {/* Header section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Suppliers Directory</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage product vendors, trace supply categories, and maintain communication records.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor/category..."
                className="border border-slate-200 bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64 shadow-sm"
              />
              <LuSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
            </div>

            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <LuPlus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Suppliers Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <LuTruck className="w-5 h-5" />
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {supplier.category}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-lg mb-1">{supplier.name}</h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mb-3 border border-slate-200">
                  Import: {supplier.countryOfImport || "N/A"}
                </span>
                
                <div className="space-y-2 mt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <LuUser className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact: <strong className="text-slate-700">{supplier.contact}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LuMail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LuPhone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{supplier.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="p-2 text-blue-650 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                >
                  <LuPen className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  className="p-2 text-rose-650 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                >
                  <LuTrash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
          {filteredSuppliers.length === 0 && (
            <div className="col-span-full bg-white p-8 text-center text-slate-400 text-sm border border-slate-200 rounded-2xl">
              No suppliers found matching your query.
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <SupplierForm
            initial={editing}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSave={handleSave}
          />
        )}
      </div>
    </Layout>
  );
}

function SupplierForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      contact: "",
      email: "",
      phone: "",
      category: "",
      countryOfImport: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.email.trim() || !form.phone.trim() || !form.category.trim() || !form.countryOfImport.trim()) {
      alert("Please fill in all the required fields.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800">
            {initial ? "Modify Supplier Specifications" : "Register New Vendor"}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Company Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Contact Person
              </label>
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Supply Category
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Toys, Cosmetics"
                className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Country of Import
              </label>
              <select
                value={form.countryOfImport}
                onChange={(e) => setForm({ ...form, countryOfImport: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                required
              >
                <option value="">Select Country</option>
                <option value="China">China</option>
                <option value="Dubai">Dubai</option>
                <option value="India">India</option>
                <option value="Local">Local</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Suppliers;
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { getProducts, saveProduct, deleteProduct, getSettings } from "../utils/db";
import { LuPlus, LuSearch, LuPen, LuTrash2, LuImage, LuPlusCircle, LuMinusCircle } from "react-icons/lu";

function Products() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availableCategories, setAvailableCategories] = useState(["Accessories", "Toys", "Cosmetics"]);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
    getSettings().then(s => { if (s.categories?.length) setAvailableCategories(s.categories); });

    if (location.state?.openForm) {
      setShowForm(true);
      window.history.replaceState({}, document.title);
    }

    window.addEventListener("zantix-db-update", loadProducts);
    window.addEventListener("storage", loadProducts);

    return () => {
      window.removeEventListener("zantix-db-update", loadProducts);
      window.removeEventListener("storage", loadProducts);
    };
  }, [location]);

  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
    }
  }

  function handleEdit(product) {
    setEditing(product);
    setShowForm(true);
  }

  async function handleSave(form) {
    await saveProduct(form);
    setShowForm(false);
    setEditing(null);
  }

  const allCategories = ["All", ...Array.from(new Set(products.map(p => p.category))).sort()];

  const categoryStats = {};
  products.forEach(p => {
    if (!categoryStats[p.category]) {
      categoryStats[p.category] = { count: 0, totalStock: 0 };
    }
    categoryStats[p.category].count++;
    const prodStock = p.variants ? p.variants.reduce((sum, v) => sum + Number(v.stock), 0) : 0;
    categoryStats[p.category].totalStock += prodStock;
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch = [product.name, product.category, product.brand].some((field) =>
      field && field.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="w-full">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Product Catalog</h1>
            <p className="text-sm text-slate-500 mt-1">
              Add new catalog listings, change wholesale prices, and update current warehouse stock.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name/category/brand..."
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
              <span>Add Product</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.keys(categoryStats).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? "All" : cat)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md ${
                selectedCategory === cat
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-white border-slate-200 text-slate-700 shadow-sm"
              }`}
            >
              <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${
                selectedCategory === cat ? "text-blue-100" : "text-slate-400"
              }`}>{cat}</span>
              <span className="text-xl font-extrabold block">{categoryStats[cat].count} items</span>
              <span className={`text-xs mt-1 block ${selectedCategory === cat ? "text-blue-200" : "text-slate-400"}`}>
                {categoryStats[cat].totalStock} units total
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? "bg-slate-800 text-white border-slate-800 shadow"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"
              }`}
            >
              {cat}
              {cat !== "All" && (
                <span className={`ml-1.5 ${
                  selectedCategory === cat ? "text-slate-300" : "text-slate-400"
                }`}>
                  ({products.filter(p => p.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 w-24 text-center">Image</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price Range (Selling)</th>
                  <th className="p-4">Total Stock</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((product) => {
                  const totalStock = product.variants ? product.variants.reduce((sum, v) => sum + Number(v.stock), 0) : 0;
                  const hasLowStockVariant = product.variants ? product.variants.some(v => Number(v.stock) < 5) : false;
                  
                  let priceDisplay = "N/A";
                  if (product.variants && product.variants.length > 0) {
                    const prices = product.variants.map(v => Number(v.sellingPrice));
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    priceDisplay = minPrice === maxPrice ? `Rs. ${minPrice.toLocaleString()}` : `Rs. ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`;
                  }
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 flex justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-xl border border-slate-100"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                            <LuImage className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {product.name}
                        {product.variants && (
                          <div className="text-xs text-slate-500 font-normal mt-0.5">{product.variants.length} variant(s)</div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-700">{product.brand}</td>
                      <td className="p-4 text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {priceDisplay}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{totalStock}</span>
                          {hasLowStockVariant ? (
                            <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-100 animate-pulse">
                              Low Stock Var.
                            </span>
                          ) : totalStock <= 15 ? (
                            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                              Reorder Soon
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                              Healthy
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit product info"
                          >
                            <LuPen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 text-sm">
                      No products matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <ProductForm
            initial={editing}
            availableCategories={availableCategories}
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

function ProductForm({ initial, onCancel, onSave, availableCategories = ["Accessories", "Toys", "Cosmetics"] }) {
  // Figure out sizeType from existing variant data
  function detectSizeType(sizeStr) {
    if (!sizeStr || sizeStr === "Standard") return "none";
    if (/^\d+\s*ml$/i.test(sizeStr)) return "ml";
    if (/^\d+\s*g$/i.test(sizeStr)) return "g";
    if (/^\d+(\.\d+)?\s*L$/i.test(sizeStr)) return "L";
    if (["S", "M", "L", "XL", "XXL", "Small", "Medium", "Large", "Extra Large"].includes(sizeStr)) return "named";
    return "custom";
  }

  function extractSizeValue(sizeStr, type) {
    if (type === "ml" || type === "g" || type === "L") {
      const num = sizeStr.replace(/[^\d.]/g, "");
      return num || "";
    }
    return sizeStr || "";
  }

  const initialVariants = (initial?.variants || [{ size: "", stock: 0, sellingPrice: "", purchasePrice: "" }]).map(v => {
    const st = detectSizeType(v.size);
    return {
      ...v,
      sizeType: st,
      sizeValue: extractSizeValue(v.size, st),
    };
  });

  const [form, setForm] = useState({
    id: initial?.id || null,
    name: initial?.name || "",
    brand: initial?.brand || "",
    category: initial?.category || "",
    image: initial?.image || null,
    variants: initialVariants,
  });

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("Image is too large (limit: 1MB). Please select a compressed image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((current) => ({ ...current, image: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  }

  function handleVariantChange(index, field, value) {
    const newVariants = [...form.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setForm({ ...form, variants: newVariants });
  }

  function handleSizeTypeChange(index, newType) {
    const newVariants = [...form.variants];
    newVariants[index] = { ...newVariants[index], sizeType: newType, sizeValue: "" };
    setForm({ ...form, variants: newVariants });
  }

  function buildSizeString(variant) {
    const { sizeType, sizeValue } = variant;
    if (sizeType === "none") return "Standard";
    if (sizeType === "ml") return sizeValue ? `${sizeValue}ml` : "Standard";
    if (sizeType === "g") return sizeValue ? `${sizeValue}g` : "Standard";
    if (sizeType === "L") return sizeValue ? `${sizeValue}L` : "Standard";
    if (sizeType === "named") return sizeValue || "Standard";
    if (sizeType === "custom") return sizeValue || "Standard";
    return "Standard";
  }

  function addVariant() {
    setForm({
      ...form,
      variants: [...form.variants, { size: "", stock: 0, sellingPrice: "", purchasePrice: "", sizeType: "none", sizeValue: "" }]
    });
  }

  function removeVariant(index) {
    if (form.variants.length > 1) {
      const newVariants = form.variants.filter((_, i) => i !== index);
      setForm({ ...form, variants: newVariants });
    } else {
      alert("You must have at least one variant.");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.brand.trim() || !form.category.trim() || form.variants.length === 0) return;

    for (let i = 0; i < form.variants.length; i++) {
      const v = form.variants[i];
      if (v.sellingPrice === "" || v.purchasePrice === "") {
        alert("Please fill in selling price and purchase price for all variants.");
        return;
      }
      if ((v.sizeType === "ml" || v.sizeType === "g" || v.sizeType === "L") && !v.sizeValue) {
        alert("Please enter the size value for all variants with a measurement unit.");
        return;
      }
    }

    onSave({
      id: form.id,
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      variants: form.variants.map(v => ({
        size: buildSizeString(v),
        stock: Number(v.stock),
        sellingPrice: Number(v.sellingPrice),
        purchasePrice: Number(v.purchasePrice),
      })),
      image: form.image,
    });
  }

  const NAMED_SIZES = ["Small", "Medium", "Large", "XL", "XXL"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto pt-20">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {initial ? "Modify Product Details" : "Register Catalog Product"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill in the parameters. Stocks less than 5 trigger topbar alerts.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid gap-6 md:grid-cols-[1fr_250px]">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Product Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
                  placeholder="e.g. Shampoo"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Brand
                </label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
                  placeholder="e.g. Dove"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
                  required
                >
                  <option value="">Select Category</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Product Variants</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Products without sizes: keep "No Size". Products like shampoo: pick "ml". Bags: pick "Named Size (S/M/L)".</p>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer"
                >
                  <LuPlusCircle className="w-4 h-4" /> Add Variant
                </button>
              </div>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {form.variants.map((v, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 relative">
                    <div className="absolute top-4 right-4">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <LuMinusCircle className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Row 1: Size Type + Size Value */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mr-8 mb-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Size Type</label>
                        <select
                          value={v.sizeType}
                          onChange={(e) => handleSizeTypeChange(index, e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                        >
                          <option value="none">No Size (Standard)</option>
                          <option value="ml">Millilitres (ml)</option>
                          <option value="g">Grams (g)</option>
                          <option value="L">Litres (L)</option>
                          <option value="named">Named Size (S/M/L)</option>
                          <option value="custom">Custom Text</option>
                        </select>
                      </div>

                      {v.sizeType !== "none" && (
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                            {v.sizeType === "ml" ? "Volume (ml)" :
                             v.sizeType === "g" ? "Weight (g)" :
                             v.sizeType === "L" ? "Volume (L)" :
                             v.sizeType === "named" ? "Pick Size" :
                             "Size Label"}
                          </label>
                          {(v.sizeType === "ml" || v.sizeType === "g" || v.sizeType === "L") ? (
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                value={v.sizeValue}
                                onChange={(e) => handleVariantChange(index, "sizeValue", e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                placeholder={v.sizeType === "ml" ? "e.g. 200" : v.sizeType === "g" ? "e.g. 100" : "e.g. 1"}
                                required
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">{v.sizeType}</span>
                            </div>
                          ) : v.sizeType === "named" ? (
                            <select
                              value={v.sizeValue}
                              onChange={(e) => handleVariantChange(index, "sizeValue", e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                              required
                            >
                              <option value="">Pick...</option>
                              {NAMED_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <input
                              value={v.sizeValue}
                              onChange={(e) => handleVariantChange(index, "sizeValue", e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                              placeholder="e.g. Pack of 6"
                              required
                            />
                          )}
                        </div>
                      )}

                      {/* Preview */}
                      <div className="flex items-end pb-1">
                        <span className="text-xs text-slate-400">
                          Will save as: <strong className="text-slate-700">{buildSizeString(v)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Stock + Prices */}
                    <div className="grid grid-cols-3 gap-3 mr-8">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => handleVariantChange(index, "stock", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Selling Price (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          value={v.sellingPrice}
                          onChange={(e) => handleVariantChange(index, "sellingPrice", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Cost Price (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          value={v.purchasePrice}
                          onChange={(e) => handleVariantChange(index, "purchasePrice", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="w-full text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">Supported formats: JPG, PNG. Max size: 1MB.</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-4 flex flex-col items-center justify-between gap-4 h-full">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Photo Preview
            </span>
            {form.image ? (
              <img
                src={form.image}
                alt="Preview"
                className="h-44 w-full rounded-xl object-cover border border-slate-200 bg-white"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-44 w-full rounded-xl border border-dashed border-slate-300 bg-white text-slate-400 p-4 text-center">
                <LuImage className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs">No image selected</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer active:scale-[0.98] transition-all text-sm mt-auto"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Products;


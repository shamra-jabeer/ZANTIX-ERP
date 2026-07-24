import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getProducts, saveProduct, deleteVariant } from "../utils/db";
import { LuArchive, LuSearch, LuPlus, LuMinus, LuCheckCircle2, LuAlertTriangle, LuTrash2 } from "react-icons/lu";

function Inventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustingVariantIndex, setAdjustingVariantIndex] = useState(null);
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [adjustType, setAdjustType] = useState("add"); // "add" or "set" or "deduct"
  const [successMsg, setSuccessMsg] = useState("");

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
    window.addEventListener("zantix-db-update", loadProducts);
    window.addEventListener("storage", loadProducts);

    return () => {
      window.removeEventListener("zantix-db-update", loadProducts);
      window.removeEventListener("storage", loadProducts);
    };
  }, []);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustingProduct || adjustingVariantIndex === null || !adjustmentValue) return;

    const val = Number(adjustmentValue);
    if (isNaN(val) || val < 0) {
      alert("Please enter a valid non-negative number.");
      return;
    }

    const updatedProduct = { ...adjustingProduct };
    const variant = updatedProduct.variants[adjustingVariantIndex];
    let currentStock = Number(variant.stock);

    let finalStock = currentStock;
    if (adjustType === "add") {
      finalStock = currentStock + val;
    } else if (adjustType === "deduct") {
      finalStock = Math.max(0, currentStock - val);
    } else {
      finalStock = val;
    }

    updatedProduct.variants[adjustingVariantIndex].stock = finalStock;

    await saveProduct(updatedProduct);
    setSuccessMsg(`Successfully updated stock for "${updatedProduct.name} (${variant.size})" to ${finalStock} units.`);
    setAdjustingProduct(null);
    setAdjustingVariantIndex(null);
    setAdjustmentValue("");
    
    setTimeout(() => {
      setSuccessMsg("");
    }, 3000);
  };

  const handleDeleteVariant = async (product, variantId, variantSize) => {
    if (!window.confirm(`Are you sure you want to delete the variant "${product.name} (${variantSize})" from inventory? This cannot be undone.`)) return;
    await deleteVariant(product.id, variantId);
    setSuccessMsg(`Variant "${product.name} (${variantSize})" deleted successfully.`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const allVariants = [];
  products.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v, index) => {
        allVariants.push({ product: p, variant: v, variantIndex: index });
      });
    }
  });

  const filteredVariants = allVariants.filter(({ product, variant }) =>
    [product.name, product.category, product.brand, variant.size].some((field) =>
      field && field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Layout>
      <div className="w-full">
        {/* Success alert banner */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-700 text-sm shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
            <LuCheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Header section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Warehouse Inventory</h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor real-time warehouse stock, locate items, and perform quick quantity audits.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search warehouse code/name..."
                className="border border-slate-200 bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64 shadow-sm"
              />
              <LuSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white border border-slate-250/60 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <LuArchive className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Items Listed</span>
              <span className="text-2xl font-bold text-slate-800">{products.length}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-250/60 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <LuCheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Units In Stock</span>
              <span className="text-2xl font-bold text-slate-800">
                {products.reduce((acc, p) => acc + (p.variants ? p.variants.reduce((sum, v) => sum + Number(v.stock), 0) : 0), 0)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-250/60 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <LuAlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Low Stock SKU Alerts</span>
              <span className="text-2xl font-bold text-slate-800">
                {allVariants.filter(({ variant }) => Number(variant.stock) < 5).length}
              </span>
            </div>
          </div>
        </div>

        {/* Table layout */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Item Name (Size)</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Available Qty</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredVariants.map(({ product, variant, variantIndex }) => (
                  <tr key={`${product.id}-${variantIndex}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">
                      {product.name} <span className="text-slate-500 font-normal">({variant.size})</span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{product.brand}</td>
                    <td className="p-4 text-slate-500">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{variant.stock} units</td>
                    <td className="p-4">
                      {Number(variant.stock) < 5 ? (
                        <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs font-bold border border-rose-100 inline-block animate-pulse">
                          Low Stock
                        </span>
                      ) : Number(variant.stock) <= 15 ? (
                        <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold border border-amber-100 inline-block">
                          Reorder Alert
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold border border-emerald-100 inline-block">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setAdjustingProduct(product);
                            setAdjustingVariantIndex(variantIndex);
                            setAdjustmentValue("");
                            setAdjustType("add");
                          }}
                          className="bg-slate-800 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(product, variant._id, variant.size)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete this variant"
                        >
                          <LuTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVariants.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 text-sm">
                      No stock listings matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adjust Stock Modal */}
        {adjustingProduct && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">
                  Stock Audit: {adjustingProduct.name} ({adjustingProduct.variants[adjustingVariantIndex]?.size})
                </h3>
                <button
                  onClick={() => { setAdjustingProduct(null); setAdjustingVariantIndex(null); }}
                  className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAdjustStock} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Current stock level
                  </label>
                  <div className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {adjustingProduct.variants[adjustingVariantIndex]?.stock} units
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Adjustment Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType("add")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                        adjustType === "add"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Add Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType("deduct")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                        adjustType === "deduct"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Deduct Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType("set")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                        adjustType === "set"
                          ? "bg-slate-800 text-white border-slate-800"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Set Exact
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Adjustment Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setAdjustingProduct(null); setAdjustingVariantIndex(null); }}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow hover:shadow-lg cursor-pointer"
                  >
                    Update Inventory
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Inventory;
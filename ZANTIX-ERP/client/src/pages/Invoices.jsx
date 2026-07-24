import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getProducts, saveInvoice } from "../utils/db";
import { LuPlus, LuTrash2, LuReceipt, LuAlertCircle, LuUser, LuPlusCircle, LuShoppingBag } from "react-icons/lu";

function Invoices() {
  const navigate = useNavigate();

  // Database states
  const [productsList, setProductsList] = useState([]);

  // Form states
  const [customer, setCustomer] = useState("");
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceStatus, setInvoiceStatus] = useState("Paid");

  // Active row item builder states - Cascading selection
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [rowError, setRowError] = useState("");

  // Invoice items listing
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [discount, setDiscount] = useState(0);

  // Success states
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  const [savedId, setSavedId] = useState("");

  const loadProducts = async () => {
    const productsData = await getProducts();
    setProductsList(productsData);
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

  // Cascading Dropdowns Logic
  const categories = useMemo(() => Array.from(new Set(productsList.map(p => p.category))).sort(), [productsList]);
  
  const brands = useMemo(() => {
    if (!selectedCategory) return [];
    return Array.from(new Set(productsList.filter(p => p.category === selectedCategory).map(p => p.brand))).sort();
  }, [productsList, selectedCategory]);

  const products = useMemo(() => {
    if (!selectedCategory || !selectedBrand) return [];
    return productsList.filter(p => p.category === selectedCategory && p.brand === selectedBrand);
  }, [productsList, selectedCategory, selectedBrand]);

  const variants = useMemo(() => {
    if (!selectedProductId) return [];
    const p = productsList.find(p => p.id === Number(selectedProductId));
    return p ? p.variants || [] : [];
  }, [productsList, selectedProductId]);

  const selectedProduct = productsList.find(p => p.id === Number(selectedProductId));
  const selectedVariantDetails = selectedVariantIndex !== "" && variants.length > 0 ? variants[Number(selectedVariantIndex)] : null;

  const handleAddItem = () => {
    setRowError("");
    if (!selectedProductId || selectedVariantIndex === "") {
      setRowError("Please select a complete product variant.");
      return;
    }
    if (selectedQty <= 0) {
      setRowError("Quantity must be greater than zero.");
      return;
    }

    const prod = productsList.find(p => p.id === Number(selectedProductId));
    const variant = prod.variants[Number(selectedVariantIndex)];
    
    if (!prod || !variant) return;

    // Check if item is already in invoice table
    const existingRow = invoiceItems.find(item => item.productId === prod.id && item.size === variant.size);
    const currentInvoiceQty = existingRow ? existingRow.qty : 0;
    const requestedQty = Number(selectedQty);

    // Validate stock constraints
    if (Number(variant.stock) < currentInvoiceQty + requestedQty) {
      const errMsg = `Insufficient warehouse stock. Available: ${variant.stock} units. Already in list: ${currentInvoiceQty} units.`;
      setRowError(errMsg);
      alert(`⚠️ STOCK ALERT:\n\n${errMsg}\n\nYou cannot bill more than the available stock!`);
      return;
    }

    if (existingRow) {
      setInvoiceItems(invoiceItems.map(item =>
        item.productId === prod.id && item.size === variant.size ? { ...item, qty: item.qty + requestedQty } : item
      ));
    } else {
      setInvoiceItems([...invoiceItems, {
        productId: prod.id,
        name: prod.name,
        category: prod.category,
        brand: prod.brand,
        size: variant.size,
        qty: requestedQty,
        price: Number(variant.sellingPrice)
      }]);
    }

    // Reset selection fields but keep category and brand
    setSelectedProductId("");
    setSelectedVariantIndex("");
    setSelectedQty(1);
  };

  const handleRemoveItem = (prodId, size) => {
    setInvoiceItems(invoiceItems.filter(item => !(item.productId === prodId && item.size === size)));
  };

  // Calculations
  const subtotal = invoiceItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  useEffect(() => {
    if (subtotal >= 5000) {
      setDiscount(Math.floor(subtotal * 0.05));
    } else {
      setDiscount(0);
    }
  }, [subtotal]);

  const finalDiscount = Math.min(
    subtotal,
    Number(discount) || 0
  );

  const grandTotal = Math.max(
    0,
    subtotal - finalDiscount
  );

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!customer.trim()) {
      alert("Please enter customer name.");
      return;
    }
    if (invoiceItems.length === 0) {
      alert("Please add at least one product item to create an invoice.");
      return;
    }

    const invoiceObj = {
      customer: { shopName: customer.trim(), ownerName: "Unknown", contactNumber: "", address: "", email: "" },
      date: billingDate,
      items: invoiceItems.map(item => ({ 
        productId: item.productId,
        category: item.category, 
        brand: item.brand, 
        name: item.name, 
        size: item.size, 
        price: item.price, 
        qty: item.qty 
      })),
      total: grandTotal,
      status: invoiceStatus
    };

    // Save invoice (calls db manager which deducts stock & fires event triggers)
    const saved = await saveInvoice(invoiceObj);
    setSavedId(saved.id);
    setInvoiceSaved(true);

    // Redirect to orders table after 1.5 seconds success screen
    setTimeout(() => {
      setInvoiceSaved(false);
      navigate("/orders");
    }, 1500);
  };

  return (
    <Layout>
      <div className="w-full">
        {/* Success overlay */}
        {invoiceSaved && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl mx-auto mb-4 animate-bounce">
                ✓
              </div>
              <h2 className="text-xl font-bold text-slate-800">Invoice Generated!</h2>
              <p className="text-xs text-slate-500 mt-1">Successfully registered ledger ID: <span className="font-mono font-bold text-slate-700">{savedId}</span></p>
              <p className="text-xs text-slate-400 mt-4">
                Invoice saved successfully. Redirecting...
              </p>
            </div>
          </div>
        )}

        {/* Header section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Billing & Invoicing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate retail receipts, perform dynamic stock checking, and record immediate wholesale payments.
          </p>
        </div>

        <form onSubmit={handleSubmitInvoice} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left panel: Form fields & Item builder */}
          <div className="lg:col-span-2 space-y-6">

            {/* Customer Details Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                <LuUser className="w-4 h-4 text-blue-500" />
                <span>Customer Specifications</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="e.g. City Retail Mart"
                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row Builder Console */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <LuPlusCircle className="w-4 h-4 text-indigo-500" />
                <span>Invoice Item Builder</span>
              </h3>

              {rowError && (
                <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-600 text-xs">
                  <LuAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{rowError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
                {/* Category Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    1. Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedBrand("");
                      setSelectedProductId("");
                      setSelectedVariantIndex("");
                    }}
                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 cursor-pointer"
                  >
                    <option value="">- Select -</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Brand Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    2. Brand
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      setSelectedProductId("");
                      setSelectedVariantIndex("");
                    }}
                    disabled={!selectedCategory}
                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">- Select -</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    3. Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSelectedVariantIndex("");
                    }}
                    disabled={!selectedBrand}
                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">- Select -</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Variant Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    4. Size/Variant
                  </label>
                  <select
                    value={selectedVariantIndex}
                    onChange={(e) => setSelectedVariantIndex(e.target.value)}
                    disabled={!selectedProductId}
                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">- Select -</option>
                    {variants.map((v, idx) => (
                      <option key={idx} value={idx}>
                        {v.size} (Stock: {v.stock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Selected Info display */}
                <div className="md:col-span-8">
                   {selectedVariantDetails && (
                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600 border border-slate-100">
                      <div>
                        <span>Selected Unit Price: <strong>Rs. {Number(selectedVariantDetails.sellingPrice).toLocaleString()}</strong></span>
                        <span className="mx-2">|</span>
                        <span>Remaining Inventory Stock: <strong>{selectedVariantDetails.stock} units</strong></span>
                      </div>
                      {Number(selectedVariantDetails.stock) < 5 && (
                        <span className="text-rose-600 font-bold flex items-center gap-1 animate-pulse">
                          <LuAlertCircle className="w-3.5 h-3.5" />
                          Critical Low Stock
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Qty & Add Button */}
                <div className="md:col-span-4 flex gap-3">
                  <div className="w-24">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value)))}
                      className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex-1 bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-900 cursor-pointer active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 h-[46px] self-end"
                  >
                    <LuPlus className="w-4 h-4" />
                    <span>Insert</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                <LuShoppingBag className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-slate-700">Invoice Content Summary</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-700 text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/30">
                      <th className="p-4">Product Details</th>
                      <th className="p-4">Unit Price</th>
                      <th className="p-4">Qty</th>
                      <th className="p-4">Total Price</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceItems.map((item) => (
                      <tr key={`${item.productId}-${item.size}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="text-slate-500 ml-1">({item.size})</span>
                          <div className="text-xs text-slate-400 mt-0.5">{item.brand} | {item.category}</div>
                        </td>
                        <td className="p-4 text-slate-600">Rs. {item.price.toLocaleString()}</td>
                        <td className="p-4 text-slate-800 font-semibold">{item.qty} units</td>
                        <td className="p-4 text-slate-900 font-bold">Rs. {(item.price * item.qty).toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId, item.size)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {invoiceItems.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                          Your billing items list is currently empty. Add products above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right panel: Totals & Summary Card */}
          <div className="space-y-6">

            {/* Calculation details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                <LuReceipt className="w-4 h-4 text-purple-500" />
                <span>Invoice Summary</span>
              </h3>

              <div className="space-y-3.5 border-b border-slate-100 pb-4 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal Value:</span>
                  <span className="font-semibold text-slate-800">Rs. {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Total Items:</span>
                  <span className="font-semibold text-slate-800">
                    {invoiceItems.reduce((sum, item) => sum + item.qty, 0)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Discount Amount (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 500"
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-base font-bold text-slate-800">Grand Total:</span>
                <span className="text-2xl font-extrabold text-blue-600">Rs. {grandTotal.toLocaleString()}</span>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Payment Settlement
                </label>
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 cursor-pointer"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Submit Invoice button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
              >
                <LuReceipt className="w-5 h-5" />
                <span>Generate Billing Invoice</span>
              </button>
            </div>

            {/* Quick Helper guidelines */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-xs text-slate-500 space-y-2">
              <span className="font-bold text-slate-700 block mb-1">Billing Guidelines:</span>
              <p>1. Ensure category, brand, and size are correctly selected.</p>
              <p>2. Adding an item validates real-time quantity against warehouse stock.</p>
              <p>3. Finalizing billing automatically deducts inventory and triggers low stock SMS alerts if quantity reaches &lt; 5 units.</p>
            </div>

          </div>

        </form>
      </div>
    </Layout>
  );
}

export default Invoices;

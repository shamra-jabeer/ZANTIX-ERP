import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getInvoices, getProducts } from "../utils/db";
import { LuBarChart2, LuTrendingUp, LuDollarSign, LuPieChart, LuBox, LuFileText } from "react-icons/lu";

function Reports() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const loadData = async () => {
    const productsData = await getProducts();
    const invoicesData = await getInvoices();
    setProducts(productsData);
    setInvoices(invoicesData);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("zantix-db-update", loadData);
    window.addEventListener("storage", loadData);

    return () => {
      window.removeEventListener("zantix-db-update", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  // Key financial metrics
  const totalRevenue = invoices
    .filter(inv => inv.status === "Paid")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === "Pending")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const totalInvoiceValue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const avgBasketValue = invoices.length > 0 ? Math.round(totalInvoiceValue / invoices.length) : 0;

  // Category stats from variants
  const categoryStats = {};
  products.forEach(p => {
    if (!categoryStats[p.category]) {
      categoryStats[p.category] = { count: 0, stock: 0, purchaseValue: 0 };
    }
    categoryStats[p.category].count += 1;
    const variantStock = p.variants ? p.variants.reduce((sum, v) => sum + Number(v.stock), 0) : 0;
    const variantValue = p.variants ? p.variants.reduce((sum, v) => sum + (Number(v.stock) * Number(v.purchasePrice)), 0) : 0;
    categoryStats[p.category].stock += variantStock;
    categoryStats[p.category].purchaseValue += variantValue;
  });

  // Per-category sales from invoices
  const categorySales = {};
  invoices.forEach(inv => {
    inv.items?.forEach(item => {
      const key = item.category || "Unknown";
      if (!categorySales[key]) categorySales[key] = { qty: 0, revenue: 0 };
      categorySales[key].qty += Number(item.qty || 0);
      categorySales[key].revenue += Number(item.price || 0) * Number(item.qty || 0);
    });
  });

  // Top selling products
  const productSales = {};
  invoices.forEach(inv => {
    inv.items?.forEach(item => {
      const key = `${item.name} (${item.size || "Standard"})`;
      if (!productSales[key]) productSales[key] = { qty: 0, revenue: 0 };
      productSales[key].qty += Number(item.qty || 0);
      productSales[key].revenue += Number(item.price || 0) * Number(item.qty || 0);
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 8);

  // Catalog valuation
  const totalPurchaseValue = products.reduce((sum, p) => {
    return sum + (p.variants ? p.variants.reduce((vs, v) => vs + (Number(v.stock) * Number(v.purchasePrice)), 0) : 0);
  }, 0);

  return (
    <Layout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Business Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze revenue, track inventory valuation, and review category performance.
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Total Revenue (Paid)</span>
              <LuDollarSign className="w-5 h-5 text-blue-200" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-extrabold block">Rs. {totalRevenue.toLocaleString()}</span>
              <span className="text-xs text-blue-100 mt-1 block">From settled invoices</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Collections</span>
              <LuTrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-800 block">Rs. {pendingRevenue.toLocaleString()}</span>
              <span className="text-xs text-slate-500 mt-1 block">Awaiting customer payment</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inventory Cost Value</span>
              <LuBox className="w-5 h-5 text-purple-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-800 block">Rs. {totalPurchaseValue.toLocaleString()}</span>
              <span className="text-xs text-slate-500 mt-1 block">Total purchase price on hand</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg. Invoice Value</span>
              <LuFileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-800 block">Rs. {avgBasketValue.toLocaleString()}</span>
              <span className="text-xs text-slate-500 mt-1 block">Across {invoices.length} invoices</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <LuPieChart className="w-4 h-4 text-indigo-500" />
              <span>Inventory by Category</span>
            </h3>
            <div className="space-y-4">
              {Object.keys(categoryStats).map((cat) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-800">{cat}</span>
                    <span className="text-xs text-slate-500">{categoryStats[cat].count} products · {categoryStats[cat].stock} units</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (categoryStats[cat].stock / Math.max(...Object.values(categoryStats).map(c => c.stock), 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Purchase value: Rs. {categoryStats[cat].purchaseValue.toLocaleString()}</p>
                </div>
              ))}
              {Object.keys(categoryStats).length === 0 && (
                <div className="text-center p-8 text-slate-400 text-xs">No products in catalog.</div>
              )}
            </div>
          </div>

          {/* Category Sales Performance */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <LuBarChart2 className="w-4 h-4 text-blue-500" />
              <span>Sales by Category</span>
            </h3>
            <div className="space-y-4">
              {Object.keys(categorySales).map((cat) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-800">{cat}</span>
                    <span className="text-xs text-slate-500">{categorySales[cat].qty} units sold</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (categorySales[cat].revenue / Math.max(...Object.values(categorySales).map(c => c.revenue), 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Revenue: Rs. {categorySales[cat].revenue.toLocaleString()}</p>
                </div>
              ))}
              {Object.keys(categorySales).length === 0 && (
                <div className="text-center p-8 text-slate-400 text-xs">No sales data available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
            <LuTrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Top Selling Products</span>
          </h3>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Product (Size)</th>
                    <th className="pb-3 pr-4 text-center">Units Sold</th>
                    <th className="pb-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topProducts.map(([name, stats], idx) => (
                    <tr key={name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pr-4 text-slate-400 font-mono text-xs font-bold">#{idx + 1}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-800">{name}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{stats.qty} units</span>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">Rs. {stats.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
              No sales data yet. Create invoices to see product rankings here.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Reports;
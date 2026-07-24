import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import QuickActionCard from "../components/QuickActionCard";
import RecentInvoicesTable from "../components/tables/RecentInvoicesTable";
import LowStockTable from "../components/tables/LowStockTable";
import TopSellingTable from "../components/tables/TopSellingTable";
import {
  LuBox,
  LuArchive,
  LuDollarSign,
  LuFileText,
  LuTruck,
  LuTrendingUp,
} from "react-icons/lu";
import { getProducts, getInvoices, getSuppliers, getSession } from "../utils/db";

function Dashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [role, setRole] = useState("Admin");

  const loadData = async () => {
    const productsData = await getProducts();
    const invoicesData = await getInvoices();
    const suppliersData = await getSuppliers();
    setProducts(productsData);
    setInvoices(invoicesData);
    setSuppliers(suppliersData);
  };

  useEffect(() => {
    loadData();

    const session = getSession();
    if (session) {
      setRole(session.role);
    }

    // Listen to changes in the mock db from other components
    window.addEventListener("zantix-db-update", loadData);
    window.addEventListener("storage", loadData);

    return () => {
      window.removeEventListener("zantix-db-update", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  // Compute stats
  const totalProducts = products.length;
  
  const totalInventory = products.reduce(
    (sum, product) => sum + (product.variants ? product.variants.reduce((vSum, v) => vSum + Number(v.stock || 0), 0) : 0),
    0
  );

  const totalCategories = new Set(
    products.map((product) => product.category)
  ).size;

  // Calculate today's sales from invoices
  const todayStr = new Date().toISOString().split("T")[0];
  const todaysSalesVal = invoices
    .filter((inv) => inv.date === todayStr)
    .reduce((sum, inv) => sum + Number(inv.total), 0);
  
  // If there are no sales today, show sum of all sales as demo indicator or just today's sales
  // Let's do today's sales, but if Rs. 0, let's sum total paid sales as all-time sales fallback so it looks nice
  const allTimeSalesVal = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const displaySales = role === "Staff"
    ? "Masked (Staff)"
    : (todaysSalesVal > 0 
      ? `Rs. ${todaysSalesVal.toLocaleString()}` 
      : `Rs. ${allTimeSalesVal.toLocaleString()}`);

  const displaySalesTitle = todaysSalesVal > 0 
    ? "Today's Sales" 
    : "Total Revenue";

  // Low stock products filter
  const lowStockItems = [];
  products.forEach((product) => {
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        if (Number(v.stock) < 5) {
          lowStockItems.push({
            product: `${product.name} (${v.size})`,
            sku: v.sku || `SKU-${product.id}`,
            category: product.category,
            stock: v.stock,
          });
        }
      });
    }
  });

  // Dynamic top selling calculation
  const salesMap = {};
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!salesMap[item.name]) {
        salesMap[item.name] = { name: item.name, sold: 0, revenue: 0 };
      }
      salesMap[item.name].sold += Number(item.qty);
      salesMap[item.name].revenue += Number(item.qty) * Number(item.price);
    });
  });

  // Sort and take top 5
  const topSelling = Object.values(salesMap)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      sold: p.sold,
      revenue: `Rs. ${p.revenue.toLocaleString()}`,
    }));

  // Handlers for Quick Action Cards
  const handleAddProductClick = () => {
    navigate("/products", { state: { openForm: true } });
  };

  const handleCreateInvoiceClick = () => {
    navigate("/invoices");
  };

  const handleAddSupplierClick = () => {
    navigate("/suppliers", { state: { openForm: true } });
  };

  const handleViewReportsClick = () => {
    navigate("/reports");
  };

  return (
    <Layout>
      <main>
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live updates and essential controls for Zantix wholesale catalog.
            </p>
          </div>
          
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span>Database Status: Active</span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
          <StatCard
            title="Total Products"
            value={totalProducts}
            icon={LuBox}
            color="bg-blue-600 shadow-md shadow-blue-500/10"
          />

          <StatCard
            title="Total Inventory"
            value={totalInventory}
            icon={LuArchive}
            color="bg-emerald-600 shadow-md shadow-emerald-500/10"
          />

          <StatCard
            title="Categories"
            value={totalCategories}
            icon={LuTrendingUp}
            color="bg-pink-600 shadow-md shadow-pink-500/10"
          />

          <StatCard
            title={displaySalesTitle}
            value={displaySales}
            icon={LuDollarSign}
            color="bg-indigo-600 shadow-md shadow-indigo-500/10"
          />

          <StatCard
            title="Low Stock Alert"
            value={lowStockItems.length}
            icon={LuFileText}
            color="bg-amber-500 shadow-md shadow-amber-500/10"
          />

          <StatCard
            title="Active Suppliers"
            value={suppliers.length}
            icon={LuTruck}
            color="bg-violet-600 shadow-md shadow-violet-500/10"
          />
        </div>

        {/* Quick Actions Console Grid */}
        <div className="mb-8 bg-slate-50 border border-slate-200/85 rounded-3xl p-6">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-base">Quick Console</h3>
            <p className="text-xs text-slate-400">Direct commands and catalog forms</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {role !== "Staff" && (
              <QuickActionCard
                title="Add Product"
                description="Upload item photo, category & prices."
                icon={LuBox}
                onClick={handleAddProductClick}
              />
            )}

            <QuickActionCard
              title="Create Invoice"
              description="Billed client ledger & inventory check."
              icon={LuFileText}
              onClick={handleCreateInvoiceClick}
            />

            {role !== "Staff" && (
              <QuickActionCard
                title="Register Supplier"
                description="Partner records & contact numbers."
                icon={LuTruck}
                onClick={handleAddSupplierClick}
              />
            )}

            <QuickActionCard
              title="View Analytics"
              description="Financial summaries & reports."
              icon={LuArchive}
              onClick={handleViewReportsClick}
            />
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2">
            {/* Format invoices for table (map to amount: `Rs. ${total}`) */}
            <RecentInvoicesTable 
              invoices={invoices.slice(0, 5).map(inv => ({
                id: inv.id,
                customer: typeof inv.customer === 'object' ? inv.customer.shopName : inv.customer,
                date: inv.date,
                amount: `Rs. ${inv.total.toLocaleString()}`,
                status: inv.status
              }))} 
            />
          </div>

          <div>
            <LowStockTable items={lowStockItems} />
          </div>
        </div>

        <div>
          <TopSellingTable products={topSelling} />
        </div>
      </main>
    </Layout>
  );
}

export default Dashboard;
import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getInvoices } from "../../utils/db";

const DEFAULT_MONTHS = [
  { month: "Jan", sales: 42000 },
  { month: "Feb", sales: 35000 },
  { month: "Mar", sales: 51000 },
  { month: "Apr", sales: 62000 },
  { month: "May", sales: 75000 },
  { month: "Jun", sales: 88000 },
  { month: "Jul", sales: 79000 },
  { month: "Aug", sales: 83000 },
  { month: "Sep", sales: 91000 },
  { month: "Oct", sales: 94000 },
  { month: "Nov", sales: 99000 },
  { month: "Dec", sales: 125000 },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SalesChart() {
  const [data, setData] = useState(DEFAULT_MONTHS);

  const calculateSales = async () => {
    try {
      const invoices = await getInvoices();
      // Deep copy baseline monthly values
      const updatedData = DEFAULT_MONTHS.map(item => ({ ...item }));
      
      invoices.forEach(inv => {
        // We only add Paid invoices to sales
        if (inv.status === "Paid") {
          const date = new Date(inv.date);
          if (!isNaN(date.getTime())) {
            const monthName = MONTH_NAMES[date.getMonth()];
            const monthObj = updatedData.find(d => d.month === monthName);
            if (monthObj) {
              monthObj.sales += Number(inv.total);
            }
          }
        }
      });
      
      setData(updatedData);
    } catch (err) {
      console.error("Error loading sales chart data:", err);
    }
  };

  useEffect(() => {
    calculateSales();
    
    // Auto sync when data updates
    window.addEventListener("zantix-db-update", calculateSales);
    window.addEventListener("storage", calculateSales);

    return () => {
      window.removeEventListener("zantix-db-update", calculateSales);
      window.removeEventListener("storage", calculateSales);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-5 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Sales Overview</h3>
          <p className="text-xs text-slate-400">Baseline trend combined with live invoice billing</p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
          Monthly (LKR)
        </div>
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v) => `Rs. ${(v / 1000)}k`}
            />
            <Tooltip 
              contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Sales"]}
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="url(#salesGrad)" 
              strokeWidth={3} 
              dot={{ r: 4, stroke: '#7c3aed', strokeWidth: 1, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            
            {/* Gradient definition for line stroke */}
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SalesChart;

import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuHome,
  LuBox,
  LuArchive,
  LuFileText,
  LuTruck,
  LuShoppingCart,
  LuBarChart2,
  LuSettings,
  LuUsers,
  LuLogOut,
} from "react-icons/lu";
import { logoutUser, getSession } from "../utils/db";

function Sidebar({ closeSidebar }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("Admin");

  useEffect(() => {
    const session = getSession();
    if (session) {
      setRole(session.role);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  const menu = [
    { to: "/dashboard", label: "Dashboard", icon: LuHome },
    { to: "/products", label: "Products Catalog", icon: LuBox, roleRestricted: true },
    { to: "/inventory", label: "Stock Inventory", icon: LuArchive },
    { to: "/invoices", label: "Billing Console", icon: LuFileText },
    { to: "/orders", label: "Sales Records", icon: LuShoppingCart },
    { to: "/suppliers", label: "Suppliers Directory", icon: LuTruck, roleRestricted: true },
    { to: "/reports", label: "Reports", icon: LuBarChart2, roleRestricted: true },
    { to: "/settings", label: "Settings", icon: LuSettings, roleRestricted: true },
  ];

  const visibleMenu = menu.filter(item => !item.roleRestricted || role !== "Staff");

  return (
    <aside className="w-72 h-screen bg-[#0f1724] text-white p-6 flex flex-col shrink-0">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold">
            Z
          </div>
          <div>
            <h2 className="font-bold text-xl">ZANTIX</h2>
            <p className="text-xs text-slate-400">
              {role === "Staff" ? "Staff Workspace" : "Administrator Hub"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        {visibleMenu.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-950/40 hover:text-red-400 text-slate-300 transition mt-auto w-full text-left cursor-pointer"
      >
        <LuLogOut size={20} />
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
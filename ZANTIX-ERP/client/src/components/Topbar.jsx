import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LuMenu, LuSearch, LuBell, LuUser, LuLogOut, LuTrash2, LuCheck, LuAlertTriangle, LuCheckCircle2, LuInfo } from "react-icons/lu";
import {
  getNotifications,
  markAllNotificationsAsRead,
  clearNotifications,
  logoutUser,
  getSession
} from "../utils/db";

function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "Zantix Admin",
    role: "Administrator",
  });

  const [notifications, setNotifications] = useState([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const ddRef = useRef();
  const notifRef = useRef();

  // Load profile and notifications
  const reloadData = async () => {
    const savedProfile = localStorage.getItem("zantix_profile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      const session = getSession();
      if (session) {
        setProfile({
          name: session.role === "Admin" ? "Zantix Admin" : "Staff Member",
          role: session.role,
        });
      }
    }
    const notifs = await getNotifications();
    setNotifications(notifs);
  };

  useEffect(() => {
    reloadData();

    // Event listener to sync across components immediately
    window.addEventListener("zantix-db-update", reloadData);
    window.addEventListener("storage", reloadData);

    function handleClickOutside(e) {
      if (ddRef.current && !ddRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("zantix-db-update", reloadData);
      window.removeEventListener("storage", reloadData);
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  function handleSaveProfile(updated) {
    setProfile(updated);
    localStorage.setItem("zantix_profile", JSON.stringify(updated));
    setOpenEdit(false);
    window.dispatchEvent(new Event("zantix-db-update"));
  }

  async function handleMarkRead(e) {
    e.stopPropagation();
    await markAllNotificationsAsRead();
  }

  async function handleClearNotif(e) {
    e.stopPropagation();
    await clearNotifications();
  }

  function handleSignOut() {
    logoutUser();
    navigate("/");
  }

  // Helper for notification icons
  const getNotifIcon = (type) => {
    switch (type) {
      case "warning":
        return <LuAlertTriangle className="w-5 h-5 text-amber-500" />;
      case "success":
        return <LuCheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <LuInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-6">
          
          {/* Mobile Sidebar Toggle */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 md:hidden cursor-pointer"
            >
              <LuMenu className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex-1 flex justify-center max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products, invoices, customers..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <LuSearch className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            
            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              >
                <LuBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkRead}
                          className="p-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-0.5 cursor-pointer"
                          title="Mark all as read"
                        >
                          <LuCheck className="w-3.5 h-3.5" />
                          <span>Read</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearNotif}
                          className="p-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg flex items-center gap-0.5 cursor-pointer"
                          title="Clear all notifications"
                        >
                          <LuTrash2 className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors ${
                            notif.unread ? "bg-blue-50/20" : ""
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                            <div className={`text-xs font-semibold text-slate-800 ${notif.unread ? "font-bold" : ""}`}>
                              {notif.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {notif.description}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                              <span>{notif.time}</span>
                              {notif.unread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        No notifications at this time.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={ddRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
                  {profile.name.charAt(0)}
                </div>

                <div className="hidden lg:block">
                  <div className="text-sm font-semibold text-slate-800 line-clamp-1">
                    {profile.name}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {profile.role}
                  </div>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                  <div className="p-3">
                    <button
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-700 text-sm hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                      onClick={() => {
                        setOpenEdit(true);
                        setDropdownOpen(false);
                      }}
                    >
                      <LuUser className="w-4 h-4 text-slate-500" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <div className="p-3">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-rose-600 text-sm hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LuLogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {openEdit && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setOpenEdit(false)}
          onSave={handleSaveProfile}
        />
      )}
    </>
  );
}

function ProfileEditModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({ ...profile });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800">
            Edit User Profile
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Display Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              User Designation / Role
            </label>
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Topbar;
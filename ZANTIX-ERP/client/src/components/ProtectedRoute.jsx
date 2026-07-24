import React from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../utils/db";

// This component wraps any private page.
// If there is no active login session, the user is redirected to the login page.
function ProtectedRoute({ children, adminOnly = false }) {
  const session = getSession();

  // Not logged in at all → redirect to login
  if (!session || !session.loggedIn) {
    return <Navigate to="/" replace />;
  }

  // If the page is admin-only but the user is Staff → show access denied
  if (adminOnly && session.role === "Staff") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-sm w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-500">
            This module is restricted to Administrator accounts only. Please contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;

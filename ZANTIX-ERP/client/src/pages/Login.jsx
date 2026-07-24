import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuMail, LuLock, LuEye, LuEyeOff, LuShieldAlert, LuShield } from "react-icons/lu";
import { loginUser } from "../utils/db";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!pin.trim()) {
      setError("Please enter your Security PIN.");
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setError("Security PIN must contain numbers only.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Verifying credentials...");

    try {
      const result = await loginUser(email.trim(), pin.trim());
      if (result.success) {
        setLoadingMessage("Access granted. Setting up workspace...");
        setTimeout(() => {
          setLoading(false);
          navigate("/dashboard");
        }, 700);
      } else {
        setLoading(false);
        setError(result.error || "Authentication failed. Please try again.");
      }
    } catch {
      setLoading(false);
      setError("Server connection failed. Please start the backend server.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#090d16] text-white overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />

      {/* Tech Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      <div className="relative w-full max-w-md p-4">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20 mb-4">
            Z
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            ZANTIX <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">ERP</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Wholesale Stock &amp; Order Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-8 shadow-2xl shadow-black/50">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <LuShield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Secure Sign In</h2>
              <p className="text-xs text-slate-500">Enter your email &amp; numeric PIN</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-red-200 text-sm">
              <LuShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@zantix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  disabled={loading}
                />
                <LuMail className="absolute left-4 top-4 text-slate-500 w-5 h-5" />
              </div>
            </div>

            {/* PIN Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Security PIN (Numbers Only)
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Forgot PIN?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  placeholder="Enter numeric PIN"
                  value={pin}
                  onChange={(e) => {
                    // Only allow digits
                    const val = e.target.value.replace(/\D/g, "");
                    setPin(val);
                  }}
                  autoComplete="current-password"
                  maxLength={8}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-12 text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm tracking-widest"
                  disabled={loading}
                />
                <LuLock className="absolute left-4 top-4 text-slate-500 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  disabled={loading}
                >
                  {showPin ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-600">
                Admin default PIN: <span className="text-slate-500 font-mono">1234</span>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="relative w-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 rounded-2xl shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-80 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">{loadingMessage}</span>
                </div>
              ) : (
                <span>Sign In Securely</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[10px] text-slate-600 tracking-wider">
          <p>SYSTEM WARNING: AUTHORIZED USE ONLY. SESSIONS ARE LOGGED.</p>
        </div>
      </div>

      {/* Forgot PIN Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-[28px] p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <LuShieldAlert className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Forgot Your PIN?</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Security PINs are managed by the <strong className="text-slate-300">System Administrator</strong>.<br />
              Please contact your admin to reset your PIN or recover access.
            </p>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-slate-500 text-left mb-6">
              <p className="font-semibold text-slate-400 mb-1">Admin Default Credentials:</p>
              <p>Email: <span className="font-mono text-slate-300">admin@zantix.com</span></p>
              <p>PIN: <span className="font-mono text-slate-300">1234</span></p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-2xl hover:opacity-90 transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import xfLogo from "@assets/ChatGPT_Image_3._Mai_2026,_19_49_35_1777830790029.png";

type Screen = "request" | "sent" | "update" | "done";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [screen, setScreen] = useState<Screen>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Supabase redirects here with a session in the URL hash after clicking the reset link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setScreen("update");
    }

    // Also listen for auth state — Supabase auto-signs in from the recovery token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setScreen("update");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}reset-password`.replace(/([^:])\/\//g, "$1/");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setScreen("sent");
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setScreen("done");
    setTimeout(() => navigate("/account"), 2500);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">

        {/* Step 1 — Enter email */}
        {screen === "request" && (
          <motion.div key="request"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <div className="flex justify-center mb-10">
              <img src={xfLogo} alt="XF" className="h-10 w-auto" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-2 text-center">Password Reset</p>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground mb-8 text-center">Forgot Password</h2>
            <p className="text-sm text-foreground/40 leading-relaxed mb-8 text-center">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3.5 text-sm outline-none focus:border-foreground/30 transition-colors"
                />
              </div>
              {error && <p className="text-red-400/80 text-xs tracking-wide">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <div className="mt-8 text-center">
              <button onClick={() => navigate("/login")}
                className="text-foreground/25 hover:text-foreground/60 text-xs uppercase tracking-widest transition-colors">
                ← Back to Sign In
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Email sent */}
        {screen === "sent" && (
          <motion.div key="sent"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm text-center"
          >
            <div className="flex justify-center mb-10">
              <img src={xfLogo} alt="XF" className="h-10 w-auto" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-3">Check Your Inbox</p>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground mb-6">Link Sent</h2>
            <p className="text-sm text-foreground/40 leading-relaxed">
              We sent a password reset link to<br />
              <span className="text-foreground/70">{email}</span>
            </p>
            <div className="mt-10 border border-foreground/8 p-6">
              <p className="text-[10px] uppercase tracking-widest text-foreground/25">
                Click the link in the email to set a new password
              </p>
            </div>
            <div className="mt-8">
              <button onClick={() => navigate("/login")}
                className="text-foreground/25 hover:text-foreground/60 text-xs uppercase tracking-widest transition-colors">
                ← Back to Sign In
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3 — Set new password */}
        {screen === "update" && (
          <motion.div key="update"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <div className="flex justify-center mb-10">
              <img src={xfLogo} alt="XF" className="h-10 w-auto" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-2 text-center">Password Reset</p>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground mb-8 text-center">New Password</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3.5 pr-12 text-sm outline-none focus:border-foreground/30 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3.5 pr-12 text-sm outline-none focus:border-foreground/30 transition-colors"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-400/80 text-xs tracking-wide">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? "Updating..." : "Set New Password"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 4 — Done */}
        {screen === "done" && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm text-center"
          >
            <div className="flex justify-center mb-10">
              <img src={xfLogo} alt="XF" className="h-10 w-auto" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-3">All Done</p>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground mb-4">Password Updated</h2>
            <p className="text-sm text-foreground/40">Redirecting you to your account...</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

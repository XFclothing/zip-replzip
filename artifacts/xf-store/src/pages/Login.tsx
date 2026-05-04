import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/context/LanguageContext";
import xfLogo from "@assets/ChatGPT_Image_3._Mai_2026,_19_49_35_1777830790029.png";

type Screen = "auth" | "verify" | "mfa" | "email-mfa";

export default function Login() {
  const initialMode = new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [screen, setScreen] = useState<Screen>("auth");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [emailMfaCode, setEmailMfaCode] = useState("");
  const [emailMfaSending, setEmailMfaSending] = useState(false);
  const [emailMfaResent, setEmailMfaResent] = useState(false);

  const { signIn, signUp } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLang();

  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/account";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setLoading(false); return; }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const emailMfaMethod = authUser?.user_metadata?.mfa_method === "email";

      if (emailMfaMethod) {
        // Sign out the AAL1 session so the user is NOT authenticated until they complete email MFA
        await supabase.auth.signOut();
        setEmailMfaSending(true);
        await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        setEmailMfaSending(false);
        setEmailMfaCode("");
        setScreen("email-mfa");
        setLoading(false);
        return;
      }

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === "aal2" && aalData.nextLevel !== aalData.currentLevel) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.[0];
        if (totp) {
          setMfaFactorId(totp.id);
          setMfaCode("");
          setScreen("mfa");
          setLoading(false);
          return;
        }
      }
      navigate(redirect);
    } else {
      if (!name.trim()) { setError(t.login.nameRequired); setLoading(false); return; }
      const { error } = await signUp(name.trim(), email, password);
      if (error) { setError(error); setLoading(false); return; }
      setLoading(false);
      setScreen("verify");
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 7) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (pasted.length === 8) {
      setOtp(pasted.split(""));
      otpRefs.current[7]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 8) { setError(t.login.fullCode); return; }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) {
      setError(error.message.includes("expired")
        ? t.login.codeExpired
        : t.login.invalidCode);
      setLoading(false);
      return;
    }
    navigate(redirect);
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId || mfaCode.length !== 6) return;
    setError(null);
    setLoading(true);
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (challengeError || !challengeData) { setError(challengeError?.message || "Challenge failed"); setLoading(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challengeData.id, code: mfaCode });
    setLoading(false);
    if (verifyError) { setError(t.login.wrongCode); return; }
    navigate(redirect);
  }

  async function handleEmailMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (emailMfaCode.length !== 8) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: emailMfaCode, type: "email" });
    setLoading(false);
    if (error) { setError(t.login.wrongCode); return; }
    navigate(redirect);
  }

  async function handleEmailMfaResend() {
    setEmailMfaResent(false);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) {
      if (error.message.toLowerCase().includes("rate") || error.message.toLowerCase().includes("limit") || error.message.toLowerCase().includes("wait")) {
        setError(t.login.waitBefore);
      } else {
        setError(error.message);
      }
      return;
    }
    setEmailMfaResent(true);
    setTimeout(() => setEmailMfaResent(false), 4000);
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate") || error.message.toLowerCase().includes("limit") || error.message.toLowerCase().includes("wait")) {
        setError(t.login.waitBefore);
      } else {
        setError(error.message);
      }
      return;
    }
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">

        {screen === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <div className="flex justify-center mb-10">
              <img src={xfLogo} alt="XF" className="h-10 w-auto" />
            </div>

            <div className="flex border-b border-foreground/10 mb-8">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); }}
                  className={`flex-1 pb-3 text-xs uppercase tracking-[0.4em] transition-colors ${
                    mode === m ? "text-foreground border-b border-white -mb-px" : "text-foreground/30 hover:text-foreground/60"
                  }`}
                >
                  {m === "login" ? t.login.signIn : t.login.signUp}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-2">{t.login.name}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.login.yourName}
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3.5 text-sm outline-none focus:border-foreground/30 transition-colors"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-2">{t.login.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3.5 text-sm outline-none focus:border-foreground/30 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-2">{t.login.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3.5 pr-12 text-sm outline-none focus:border-foreground/30 transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400/80 text-xs tracking-wide py-1">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? t.login.sending : mode === "login" ? t.login.signIn : t.login.createAccount}
              </button>

              {mode === "login" && (
                <div className="text-center mt-3">
                  <a href="/reset-password" className="text-foreground/25 hover:text-foreground/60 text-xs uppercase tracking-widest transition-colors">
                    {t.login.forgotPassword}
                  </a>
                </div>
              )}
            </form>

            <p className="text-center text-foreground/25 text-xs tracking-widest mt-8">
              {mode === "login" ? t.login.newHere : t.login.alreadyHave}{" "}
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
                className="text-foreground/60 hover:text-foreground transition-colors underline"
              >
                {mode === "login" ? t.login.signUpLink : t.login.signInLink}
              </button>
            </p>
          </motion.div>
        )}

        {screen === "mfa" && (
          <motion.div
            key="mfa"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <div className="flex justify-center mb-10">
              <img src={xfLogo} alt="XF" className="h-10 w-auto" />
            </div>
            <div className="mb-8 text-center">
              <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-3">{t.login.security}</p>
              <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground mb-3">{t.login.twoFactor}</h2>
              <p className="text-sm text-foreground/40 leading-relaxed">{t.login.twoFactorDesc}</p>
            </div>
            <form onSubmit={handleMfaVerify} className="space-y-5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-4 text-center text-2xl tracking-[0.6em] outline-none focus:border-foreground/30 transition-colors"
              />
              {error && <p className="text-red-400/80 text-xs tracking-wide text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40"
              >
                {loading ? t.login.verifying : t.login.confirm}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => { setScreen("auth"); setError(null); setMfaCode(""); }}
                className="text-foreground/25 hover:text-foreground/50 text-xs uppercase tracking-widest transition-colors"
              >
                {t.login.back}
              </button>
            </div>
          </motion.div>
        )}

        {screen === "email-mfa" && (
          <motion.div
            key="email-mfa"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <div className="flex justify-center mb-10">
              <img src={xfLogo} alt="XF" className="h-10 w-auto" />
            </div>
            <div className="mb-8 text-center">
              <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-3">{t.login.security}</p>
              <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground mb-3">{t.login.twoFactor}</h2>
              <p className="text-sm text-foreground/40 leading-relaxed">
                {t.login.codeSentTo}<br />
                <span className="text-foreground/70">{email}</span>
              </p>
            </div>
            {emailMfaSending ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleEmailMfaVerify} className="space-y-5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={emailMfaCode}
                  onChange={(e) => setEmailMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="00000000"
                  autoFocus
                  className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-4 text-center text-2xl tracking-[0.6em] outline-none focus:border-foreground/30 transition-colors"
                />
                {error && <p className="text-red-400/80 text-xs tracking-wide text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || emailMfaCode.length !== 8}
                  className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40"
                >
                  {loading ? t.login.verifying : t.login.confirm}
                </button>
              </form>
            )}
            <div className="mt-6 text-center space-y-3">
              <p className="text-foreground/25 text-xs tracking-widest">{t.login.didntReceive}</p>
              <button
                onClick={handleEmailMfaResend}
                disabled={emailMfaResent}
                className="text-foreground/50 hover:text-foreground text-xs uppercase tracking-widest transition-colors border-b border-foreground/15 hover:border-foreground/40 pb-0.5 disabled:opacity-40"
              >
                {emailMfaResent ? t.login.codeSent : t.login.resendCode}
              </button>
              <div>
                <button
                  onClick={() => { setScreen("auth"); setError(null); setEmailMfaCode(""); }}
                  className="text-foreground/25 hover:text-foreground/50 text-xs uppercase tracking-widest transition-colors mt-2 inline-block"
                >
                  {t.login.back}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <div className="flex justify-center mb-10">
              <img src={xfLogo} alt="XF" className="h-10 w-auto" />
            </div>

            <div className="mb-8 text-center">
              <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-3">{t.login.verifyEmail}</p>
              <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground mb-3">{t.login.checkInbox}</h2>
              <p className="text-sm text-foreground/40 leading-relaxed">
                {t.login.codeSentTo}<br />
                <span className="text-foreground/70">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-4 text-center">
                  {t.login.verificationCode}
                </label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold text-foreground bg-foreground/5 border border-foreground/15 outline-none focus:border-foreground/60 transition-colors caret-transparent"
                    />
                  ))}
                </div>
              </div>

              {error && <p className="text-red-400/80 text-xs tracking-wide text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.join("").length < 8}
                className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40"
              >
                {loading ? t.login.verifying : t.login.verifyAndContinue}
              </button>
            </form>

            <div className="mt-8 text-center space-y-3">
              <p className="text-foreground/25 text-xs tracking-widest">{t.login.didntReceive}</p>
              <button
                onClick={handleResend}
                disabled={resending || resent}
                className="text-foreground/50 hover:text-foreground text-xs uppercase tracking-widest transition-colors border-b border-foreground/15 hover:border-foreground/40 pb-0.5 disabled:opacity-40"
              >
                {resent ? t.login.codeSent : resending ? t.login.resending : t.login.resendCode}
              </button>
              <div>
                <button
                  onClick={() => { setScreen("auth"); setOtp(["","","","","","","",""]); setError(null); }}
                  className="text-foreground/25 hover:text-foreground/50 text-xs uppercase tracking-widest transition-colors mt-2 inline-block"
                >
                  {t.login.back}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

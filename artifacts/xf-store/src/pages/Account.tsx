import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Plus, Trash2, Star, X, ShieldCheck, ShieldOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase, Order } from "@/lib/supabase";
import { useLang } from "@/context/LanguageContext";

type ShippingAddress = {
  id: string;
  user_id: string;
  label: string | null;
  address: string;
  is_default: boolean;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400/80",
  processing: "text-blue-400/80",
  shipped: "text-purple-400/80",
  completed: "text-green-400/80",
  cancelled: "text-red-400/70",
};

export default function Account() {
  const { user, profile, signOut, loading } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLang();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "email" | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [show2FAMethodSelect, setShow2FAMethodSelect] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [emailDisableCodeSent, setEmailDisableCodeSent] = useState(false);
  const [emailDisableSending, setEmailDisableSending] = useState(false);

  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && user) {
      supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
        if (data && data.nextLevel === "aal2" && data.nextLevel !== data.currentLevel) {
          navigate("/login");
        }
      });
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    fetchAddresses();
    checkMfa();
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const allOrders = (data as Order[]) || [];
        // Auto-delete cancelled orders older than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const toDelete = allOrders.filter(
          (o) => o.status === "cancelled" && o.created_at < oneHourAgo
        );
        if (toDelete.length > 0) {
          await supabase
            .from("orders")
            .delete()
            .in("id", toDelete.map((o) => o.id));
        }
        setOrders(allOrders.filter((o) => !toDelete.find((d) => d.id === o.id)));
        setOrdersLoading(false);
      });
  }, [user]);

  async function checkMfa() {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const emailMfa = authUser?.user_metadata?.mfa_method === "email";
    if (verified) {
      setMfaEnabled(true);
      setMfaMethod("totp");
      setMfaFactorId(verified.id);
    } else if (emailMfa) {
      setMfaEnabled(true);
      setMfaMethod("email");
      setMfaFactorId(null);
    } else {
      setMfaEnabled(false);
      setMfaMethod(null);
      setMfaFactorId(null);
    }
  }

  function openEnable2FA() {
    setMfaError(null);
    setShow2FAMethodSelect(true);
  }

  async function startEnable2FATotp() {
    setShow2FAMethodSelect(false);
    setMfaError(null);
    setMfaLoading(true);
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const unverified = existing?.totp?.filter((f) => f.status === "unverified") || [];
    for (const f of unverified) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    await supabase.auth.updateUser({ data: { mfa_method: null } });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "XF Store" });
    setMfaLoading(false);
    if (error || !data) { setMfaError(error?.message || "Failed to start 2FA setup"); return; }
    setQrCode(data.totp.qr_code);
    setTotpSecret(data.totp.secret);
    setEnrollFactorId(data.id);
    setVerifyCode("");
    setShow2FASetup(true);
  }

  async function enableEmailMfa() {
    setShow2FAMethodSelect(false);
    setMfaLoading(true);
    setMfaError(null);
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const all = [...(existing?.totp || [])];
    for (const f of all) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { error } = await supabase.auth.updateUser({ data: { mfa_method: "email" } });
    setMfaLoading(false);
    if (error) { setMfaError(error.message); return; }
    setMfaEnabled(true);
    setMfaMethod("email");
    setMfaFactorId(null);
  }

  async function confirmEnable2FA() {
    if (!enrollFactorId || verifyCode.length !== 6) return;
    setMfaLoading(true);
    setMfaError(null);
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollFactorId });
    if (challengeError || !challengeData) { setMfaError(challengeError?.message || "Challenge failed"); setMfaLoading(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: enrollFactorId, challengeId: challengeData.id, code: verifyCode });
    setMfaLoading(false);
    if (verifyError) { setMfaError(t.login.wrongCode); return; }
    await supabase.auth.updateUser({ data: { mfa_method: "totp" } });
    setMfaEnabled(true);
    setMfaMethod("totp");
    setMfaFactorId(enrollFactorId);
    setShow2FASetup(false);
    setQrCode(null);
    setTotpSecret(null);
    setEnrollFactorId(null);
    setVerifyCode("");
  }

  async function sendEmailDisableCode() {
    if (!user?.email) return;
    setEmailDisableSending(true);
    setMfaError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: user.email, options: { shouldCreateUser: false } });
    setEmailDisableSending(false);
    if (error) { setMfaError(error.message); return; }
    setEmailDisableCodeSent(true);
  }

  async function confirmDisable2FA() {
    const requiredLen = mfaMethod === "email" ? 8 : 6;
    if (disableCode.length !== requiredLen) return;
    setMfaLoading(true);
    setMfaError(null);
    if (mfaMethod === "email") {
      if (!user?.email) { setMfaLoading(false); return; }
      const { error } = await supabase.auth.verifyOtp({ email: user.email, token: disableCode, type: "email" });
      if (error) { setMfaError(t.login.wrongCode); setMfaLoading(false); return; }
      await supabase.auth.updateUser({ data: { mfa_method: null } });
    } else {
      if (!mfaFactorId) { setMfaLoading(false); return; }
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError || !challengeData) { setMfaError(challengeError?.message || "Challenge failed"); setMfaLoading(false); return; }
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challengeData.id, code: disableCode });
      if (verifyError) { setMfaError(t.login.wrongCode); setMfaLoading(false); return; }
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (unenrollError) { setMfaError(unenrollError.message); setMfaLoading(false); return; }
      await supabase.auth.updateUser({ data: { mfa_method: null } });
    }
    setMfaLoading(false);
    setMfaEnabled(false);
    setMfaMethod(null);
    setMfaFactorId(null);
    setShowDisable(false);
    setDisableCode("");
    setEmailDisableCodeSent(false);
  }

  async function cancelOrder() {
    if (!cancelOrderId || !cancelReason.trim()) return;
    setCancelling(true);
    setCancelError(null);
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", cancellation_reason: cancelReason.trim() })
      .eq("id", cancelOrderId);
    setCancelling(false);
    if (error) { setCancelError(error.message); return; }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancelOrderId
          ? { ...o, status: "cancelled", cancellation_reason: cancelReason.trim() }
          : o
      )
    );
    setCancelOrderId(null);
    setCancelReason("");
  }

  async function deleteOrder(id: string) {
    setDeletingOrderId(id);
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
    setDeletingOrderId(null);
  }

  async function fetchAddresses() {
    if (!user) return;
    const { data } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    setAddresses((data as ShippingAddress[]) || []);
    setAddressesLoading(false);
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!newAddress.trim() || !user) return;
    setAddingAddress(true);
    setAddError(null);
    const isFirst = addresses.length === 0;
    if (isFirst) {
      await supabase.from("shipping_addresses").update({ is_default: false }).eq("user_id", user.id);
    }
    const { error } = await supabase.from("shipping_addresses").insert({
      user_id: user.id,
      label: newLabel.trim() || null,
      address: newAddress.trim(),
      is_default: isFirst,
    });
    if (error) { setAddError(error.message); setAddingAddress(false); return; }
    await fetchAddresses();
    setNewLabel("");
    setNewAddress("");
    setShowAddForm(false);
    setAddingAddress(false);
  }

  async function setDefault(id: string) {
    if (!user) return;
    await supabase.from("shipping_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("shipping_addresses").update({ is_default: true }).eq("id", id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  }

  async function deleteAddress(id: string) {
    await supabase.from("shipping_addresses").delete().eq("id", id);
    const remaining = addresses.filter((a) => a.id !== id);
    if (remaining.length > 0 && addresses.find((a) => a.id === id)?.is_default) {
      await supabase.from("shipping_addresses").update({ is_default: true }).eq("id", remaining[0].id);
      remaining[0].is_default = true;
    }
    setAddresses(remaining);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-28 pb-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 mb-2">Account</p>
          <h1 className="text-4xl font-bold uppercase tracking-widest text-white mb-12">
            {profile?.name || t.account.title}
          </h1>

          <div className="grid gap-12">

            {/* Profile */}
            <section className="border border-white/8 p-8">
              <h2 className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">{t.account.profile}</h2>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <span className="text-white/30 text-sm w-20">{t.account.name}</span>
                  <span className="text-white text-sm">{profile?.name}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-white/30 text-sm w-20">{t.account.email}</span>
                  <span className="text-white text-sm">{profile?.email}</span>
                </div>
              </div>
            </section>

            {/* Security / 2FA */}
            <section className="border border-white/8 p-8">
              <h2 className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">{t.account.security}</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {mfaEnabled
                    ? <ShieldCheck className="w-4 h-4 text-green-400/70" />
                    : <ShieldOff className="w-4 h-4 text-white/20" />}
                  <div>
                    <p className="text-sm text-white">{t.account.twoFA}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {mfaEnabled
                        ? mfaMethod === "email" ? t.account.twoFAEnabledEmail : t.account.twoFAEnabledApp
                        : t.account.twoFADisabled}
                    </p>
                  </div>
                </div>
                {mfaEnabled ? (
                  <button
                    onClick={() => { setShowDisable(true); setMfaError(null); setDisableCode(""); setEmailDisableCodeSent(false); }}
                    className="text-[10px] uppercase tracking-[0.35em] text-red-400/60 hover:text-red-400 transition-colors border border-red-400/20 hover:border-red-400/50 px-3 py-2"
                  >
                    {t.account.disable2FA}
                  </button>
                ) : (
                  <button
                    onClick={openEnable2FA}
                    disabled={mfaLoading}
                    className="text-[10px] uppercase tracking-[0.35em] text-white/40 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-3 py-2 disabled:opacity-40"
                  >
                    {mfaLoading ? t.account.checking : t.account.enable2FA}
                  </button>
                )}
              </div>
              {mfaError && !show2FASetup && !showDisable && !show2FAMethodSelect && (
                <p className="text-red-400/80 text-xs mt-4">{mfaError}</p>
              )}
            </section>

            {/* Shipping Addresses */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs uppercase tracking-[0.4em] text-white/40">{t.account.shippingAddresses}</h2>
                <button
                  onClick={() => { setShowAddForm(true); setAddError(null); }}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/40 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-3 py-2"
                >
                  <Plus className="w-3 h-3" />
                  {t.account.addAddress}
                </button>
              </div>

              {addressesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="border border-white/6 p-8 text-center">
                  <p className="text-white/25 text-xs uppercase tracking-[0.4em]">{t.account.noAddresses}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`border p-5 transition-colors ${addr.is_default ? "border-white/25 bg-white/3" : "border-white/8"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {addr.label && (
                              <span className="text-[10px] uppercase tracking-[0.4em] text-white/50 font-medium">
                                {addr.label}
                              </span>
                            )}
                            {addr.is_default && (
                              <span className="text-[9px] uppercase tracking-widest text-white/30 border border-white/15 px-1.5 py-0.5">
                                {t.account.default}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/75 leading-relaxed">{addr.address}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!addr.is_default && (
                            <button
                              onClick={() => setDefault(addr.id)}
                              title={t.account.setDefault}
                              className="text-white/20 hover:text-white/60 transition-colors"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteAddress(addr.id)}
                            className="text-white/20 hover:text-red-400/70 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Order History */}
            <section>
              <h2 className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">{t.account.orderHistory}</h2>
              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-white/25 text-xs uppercase tracking-widest py-8">{t.account.noOrders}</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-white/8 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">
                            {new Date(order.created_at).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                          <p className="text-white font-semibold mt-1">€{order.total_price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs uppercase tracking-widest font-medium ${STATUS_COLORS[order.status] || "text-white/50"}`}>
                            {order.status}
                          </span>
                          {(order.status === "pending" || order.status === "processing") && (
                            <button
                              onClick={() => { setCancelOrderId(order.id); setCancelReason(""); setCancelError(null); }}
                              className="text-[9px] uppercase tracking-[0.3em] text-red-400/50 hover:text-red-400 border border-red-400/15 hover:border-red-400/40 px-2 py-1 transition-colors"
                            >
                              {t.account.cancel}
                            </button>
                          )}
                          {order.status === "cancelled" && (
                            <button
                              onClick={() => deleteOrder(order.id)}
                              disabled={deletingOrderId === order.id}
                              className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.3em] text-white/25 hover:text-red-400/70 border border-white/10 hover:border-red-400/30 px-2 py-1 transition-colors disabled:opacity-40"
                            >
                              <Trash2 className="w-3 h-3" />
                              {deletingOrderId === order.id ? t.account.deletingOrder : t.account.deleteOrder}
                            </button>
                          )}
                        </div>
                      </div>
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-white/60">{item.name} <span className="text-white/30">({item.size})</span> ×{item.quantity}</span>
                              <span className="text-white/50">€{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-white/25 mt-4 tracking-wide">{order.shipping_address}</p>
                      {order.status === "cancelled" && order.cancellation_reason && (
                        <p className="text-xs text-red-400/40 mt-2 italic">{t.account.cancelledReason}: {order.cancellation_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-12 text-xs uppercase tracking-[0.4em] text-white/25 hover:text-white/60 transition-colors border-b border-white/10 pb-0.5"
          >
            {t.account.signOut}
          </button>
        </motion.div>
      </div>

      {/* 2FA Method Select Modal */}
      <AnimatePresence>
        {show2FAMethodSelect && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShow2FAMethodSelect(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/10"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{t.account.choose2FAMethod}</h3>
                    <button onClick={() => setShow2FAMethodSelect(false)} className="text-white/30 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mb-6 leading-relaxed">{t.account.choose2FAMethodDesc}</p>
                  <div className="space-y-3">
                    <button
                      onClick={startEnable2FATotp}
                      className="w-full text-left border border-white/10 hover:border-white/30 p-5 transition-colors group"
                    >
                      <p className="text-sm text-white font-medium mb-1 group-hover:text-white">{t.account.twoFAMethodApp}</p>
                      <p className="text-xs text-white/35">{t.account.twoFAMethodAppDesc}</p>
                    </button>
                    <button
                      onClick={enableEmailMfa}
                      className="w-full text-left border border-white/10 hover:border-white/30 p-5 transition-colors group"
                    >
                      <p className="text-sm text-white font-medium mb-1 group-hover:text-white">{t.account.twoFAMethodEmail}</p>
                      <p className="text-xs text-white/35">{t.account.twoFAMethodEmailDesc}</p>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {show2FASetup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShow2FASetup(false); setQrCode(null); setTotpSecret(null); setEnrollFactorId(null); setMfaError(null); }}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/10 overflow-y-auto max-h-[90vh]"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{t.account.setup2FA}</h3>
                    <button onClick={() => { setShow2FASetup(false); setQrCode(null); setTotpSecret(null); setEnrollFactorId(null); setMfaError(null); }} className="text-white/30 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mb-5 leading-relaxed">{t.account.setup2FADesc}</p>
                  {qrCode && (
                    <div className="flex justify-center mb-5">
                      <div className="bg-white p-3 inline-block">
                        <img src={qrCode} alt="2FA QR Code" className="w-40 h-40 block" />
                      </div>
                    </div>
                  )}
                  {totpSecret && (
                    <div className="mb-5 bg-white/5 border border-white/10 px-4 py-3 text-center">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-white/30 mb-1">{t.account.manualKey}</p>
                      <p className="text-xs text-white/60 font-mono break-all">{totpSecret}</p>
                    </div>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-white/30 transition-colors mb-4"
                  />
                  {mfaError && <p className="text-red-400/80 text-xs mb-3">{mfaError}</p>}
                  <button
                    onClick={confirmEnable2FA}
                    disabled={mfaLoading || verifyCode.length !== 6}
                    className="w-full bg-white text-black py-3.5 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-40"
                  >
                    {mfaLoading ? t.account.checking : t.account.confirmEnable}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Disable 2FA Modal */}
      <AnimatePresence>
        {showDisable && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowDisable(false); setEmailDisableCodeSent(false); }}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/10"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{t.account.disable2FATitle}</h3>
                    <button onClick={() => { setShowDisable(false); setEmailDisableCodeSent(false); }} className="text-white/30 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mb-5 leading-relaxed">
                    {mfaMethod === "email" ? t.account.disable2FAEmailDesc : t.account.disable2FADesc}
                  </p>
                  {mfaMethod === "email" && !emailDisableCodeSent ? (
                    <>
                      {mfaError && <p className="text-red-400/80 text-xs mb-3">{mfaError}</p>}
                      <button
                        onClick={sendEmailDisableCode}
                        disabled={emailDisableSending}
                        className="w-full bg-white text-black py-3.5 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-40"
                      >
                        {emailDisableSending ? t.account.sendingCode : t.account.sendCode}
                      </button>
                    </>
                  ) : (
                    <>
                      {mfaMethod === "email" && emailDisableCodeSent && (
                        <p className="text-green-400/70 text-xs mb-4">{t.account.codeSentCheckEmail}</p>
                      )}
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={mfaMethod === "email" ? 8 : 6}
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                        placeholder={mfaMethod === "email" ? "00000000" : "000000"}
                        autoFocus
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-white/30 transition-colors mb-4"
                      />
                      {mfaError && <p className="text-red-400/80 text-xs mb-3">{mfaError}</p>}
                      <button
                        onClick={confirmDisable2FA}
                        disabled={mfaLoading || disableCode.length !== (mfaMethod === "email" ? 8 : 6)}
                        className="w-full bg-red-500/80 text-white py-3.5 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-red-500 transition-colors disabled:opacity-40"
                      >
                        {mfaLoading ? t.account.disabling : t.account.disable2FATitle}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {cancelOrderId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setCancelOrderId(null); setCancelReason(""); setCancelError(null); }}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/10"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{t.account.cancelOrder}</h3>
                    <button onClick={() => { setCancelOrderId(null); setCancelReason(""); setCancelError(null); }} className="text-white/30 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mb-5 leading-relaxed">{t.account.cancelOrderDesc}</p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={t.account.cancelReason}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors resize-none mb-4"
                  />
                  {cancelError && <p className="text-red-400/80 text-xs mb-3">{cancelError}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setCancelOrderId(null); setCancelReason(""); setCancelError(null); }}
                      className="flex-1 border border-white/15 text-white/40 hover:text-white hover:border-white/40 py-3 text-xs uppercase tracking-[0.4em] transition-colors"
                    >
                      {t.account.back}
                    </button>
                    <button
                      onClick={cancelOrder}
                      disabled={cancelling || !cancelReason.trim()}
                      className="flex-1 bg-red-500/80 text-white py-3 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-red-500 transition-colors disabled:opacity-40"
                    >
                      {cancelling ? t.account.cancelling : t.account.cancelBtn}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/10"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{t.account.addAddress}</h3>
                    <button onClick={() => setShowAddForm(false)} className="text-white/30 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={addAddress} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-2">
                        {t.account.label} <span className="text-white/20">({t.account.optional})</span>
                      </label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder={`"Home", "Work"`}
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-2">{t.account.address}</label>
                      <textarea
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="Street, City, ZIP Code, Country"
                        rows={3}
                        required
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors resize-none"
                      />
                    </div>
                    {addError && <p className="text-red-400/80 text-xs">{addError}</p>}
                    <button
                      type="submit"
                      disabled={addingAddress || !newAddress.trim()}
                      className="w-full bg-white text-black py-3.5 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-40"
                    >
                      {addingAddress ? t.account.saving : t.account.saveAddress}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Check, Tag, Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

type ShippingAddress = {
  id: string;
  label: string | null;
  address: string;
  is_default: boolean;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function Checkout() {
  const { user, profile } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [, navigate] = useLocation();

  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrNo, setAddrNo] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrCountry, setAddrCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const addrs = (data as ShippingAddress[]) || [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.is_default);
        if (def) setSelectedAddressId(def.id);
      });
  }, [user]);

  if (!user) {
    navigate("/login?redirect=/checkout");
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/40 text-xs uppercase tracking-[0.4em] mb-4">Your cart is empty</p>
          <button onClick={() => navigate("/shop")} className="text-foreground text-xs uppercase tracking-widest underline">
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  const customAddress = [
    `${addrStreet.trim()}${addrNo.trim() ? " " + addrNo.trim() : ""}`,
    addrZip.trim(),
    addrCity.trim(),
    addrCountry.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const finalAddress =
    selectedAddressId === "new"
      ? customAddress
      : savedAddresses.find((a) => a.id === selectedAddressId)?.address || "";

  const discount = appliedCoupon ? totalPrice * (appliedCoupon.discountPercent / 100) : 0;
  const finalTotal = totalPrice - discount;

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);

    const data = await apiPost("/coupons/validate", { code: couponInput.trim() });

    if (data.valid) {
      setAppliedCoupon({ code: data.code, discountPercent: data.discountPercent });
      setCouponInput("");
    } else {
      setCouponError(data.error || "Invalid coupon code");
    }
    setCouponLoading(false);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalAddress) { setError("Please enter or select a shipping address."); return; }

    setSubmitting(true);
    setError(null);

    if (selectedAddressId === "new" && customAddress) {
      await supabase.from("shipping_addresses").insert({
        user_id: user!.id,
        label: null,
        address: customAddress,
        is_default: savedAddresses.length === 0,
      });
    }

    const data = await apiPost("/orders/place", {
      items: items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
      })),
      shippingAddress: finalAddress,
      email: profile?.email || user!.email || "",
      customerName: profile?.name || "",
      userId: user!.id,
      couponCode: appliedCoupon?.code || null,
      totalPrice: finalTotal,
    });

    if (data.order) {
      const customerEmail = profile?.email || user!.email || "";
      const customerName = profile?.name || "";
      const { data: workers } = await supabase.from("admins").select("email");
      const workerEmails = (workers || []).map((w: any) => w.email).filter(Boolean);
      apiPost("/email/order", {
        customerEmail,
        customerName,
        orderId: data.order.id,
        total: finalTotal,
        shippingAddress: finalAddress,
        workerEmails,
        items: items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
        })),
      });
      clearCart();
      navigate("/checkout/success?method=pending");
    } else {
      setError(data.error || "Failed to place order. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-2">Checkout</p>
          <h1 className="text-4xl font-bold uppercase tracking-widest text-foreground mb-12">Complete Order</h1>

          <form onSubmit={handleSubmit} className="grid gap-10">

            {/* Order Summary */}
            <div className="border border-foreground/8 p-6">
              <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/40 mb-5">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center gap-4">
                    <div className="w-14 h-16 bg-foreground/5 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-foreground/40 uppercase tracking-widest">Size: {item.size} · Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm text-foreground">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <div className="border-t border-foreground/8 mt-6 pt-6">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-foreground/5 border border-foreground/15 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-foreground/50" />
                      <span className="text-xs text-foreground/70 uppercase tracking-wider font-medium">{appliedCoupon.code}</span>
                      <span className="text-xs text-green-400/80 uppercase tracking-wider">−{appliedCoupon.discountPercent}%</span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-foreground/30 hover:text-foreground/60 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                      placeholder="Coupon code"
                      className="flex-1 bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-2.5 text-xs outline-none focus:border-foreground/30 transition-colors uppercase tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="bg-foreground/10 border border-foreground/10 text-foreground px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-foreground/15 transition-colors disabled:opacity-40"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-red-400/70 text-[10px] tracking-wider mt-2">{couponError}</p>}
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.35em] text-foreground/40">Subtotal</span>
                  <span className="text-sm text-foreground/60">€{totalPrice.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-[0.35em] text-green-400/70">Discount ({appliedCoupon.discountPercent}%)</span>
                    <span className="text-sm text-green-400/80">−€{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-foreground/8 pt-3 mt-3">
                  <span className="text-xs uppercase tracking-[0.35em] text-foreground/50">Total</span>
                  <span className="text-xl font-bold text-foreground">€{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border border-foreground/8 p-6">
              <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/40 mb-5">Customer Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">Name</label>
                  <div className="bg-foreground/5 border border-foreground/8 px-4 py-3 text-sm text-foreground/60">{profile?.name}</div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">Email</label>
                  <div className="bg-foreground/5 border border-foreground/8 px-4 py-3 text-sm text-foreground/60 truncate">{profile?.email}</div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border border-foreground/8 p-6">
              <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/40 mb-5">Shipping Address</h2>

              {savedAddresses.length > 0 && (
                <div className="space-y-2 mb-5">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`w-full text-left p-4 border transition-colors flex items-start gap-3 ${
                        selectedAddressId === addr.id
                          ? "border-foreground/40 bg-foreground/5"
                          : "border-foreground/10 hover:border-foreground/25"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        selectedAddressId === addr.id ? "border-white bg-foreground" : "border-foreground/30"
                      }`}>
                        {selectedAddressId === addr.id && <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />}
                      </div>
                      <div>
                        {addr.label && (
                          <p className="text-[10px] uppercase tracking-[0.4em] text-foreground/50 mb-1">{addr.label}</p>
                        )}
                        <p className="text-sm text-foreground/75 leading-relaxed">{addr.address}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedAddressId("new")}
                    className={`w-full text-left p-4 border transition-colors flex items-center gap-3 ${
                      selectedAddressId === "new"
                        ? "border-foreground/40 bg-foreground/5"
                        : "border-foreground/10 hover:border-foreground/25"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                      selectedAddressId === "new" ? "border-white bg-foreground" : "border-foreground/30"
                    }`}>
                      {selectedAddressId === "new" && <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />}
                    </div>
                    <span className="text-xs uppercase tracking-[0.35em] text-foreground/50">Use a different address</span>
                  </button>
                </div>
              )}

              {selectedAddressId === "new" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">Street</label>
                      <input
                        type="text"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        placeholder="123 Main St"
                        className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">No.</label>
                      <input
                        type="text"
                        value={addrNo}
                        onChange={(e) => setAddrNo(e.target.value)}
                        placeholder="12"
                        className="w-20 bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">ZIP</label>
                      <input
                        type="text"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                        placeholder="10115"
                        className="w-28 bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">City</label>
                      <input
                        type="text"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        placeholder="Berlin"
                        className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">Country</label>
                    <input
                      type="text"
                      value={addrCountry}
                      onChange={(e) => setAddrCountry(e.target.value)}
                      placeholder="Germany"
                      className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notice */}
            <div className="border border-foreground/8 p-5 bg-foreground/3">
              <p className="text-[10px] text-foreground/35 uppercase tracking-[0.35em] leading-relaxed text-center">
                Payment is currently unavailable. Your order will be reserved and we'll contact you to confirm.
              </p>
            </div>

            {error && <p className="text-red-400/80 text-xs tracking-wide">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                `Reserve Order · €${finalTotal.toFixed(2)}`
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { sendOrderConfirmation, sendOrderNotificationToStaff } from "@/lib/email";

type ShippingAddress = {
  id: string;
  label: string | null;
  address: string;
  is_default: boolean;
};

export default function Checkout() {
  const { user, profile } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [, navigate] = useLocation();

  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [customAddress, setCustomAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    navigate("/login?redirect=/checkout");
    return null;
  }

  useEffect(() => {
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-xs uppercase tracking-[0.4em] mb-4">Your cart is empty</p>
          <button onClick={() => navigate("/shop")} className="text-white text-xs uppercase tracking-widest underline">
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  const finalAddress =
    selectedAddressId === "new"
      ? customAddress.trim()
      : savedAddresses.find((a) => a.id === selectedAddressId)?.address || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalAddress) { setError("Please enter or select a shipping address."); return; }
    setSubmitting(true);
    setError(null);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user!.id,
        total_price: totalPrice,
        status: "pending",
        shipping_address: finalAddress,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      setError(`Failed to place order: ${orderError?.message || "unknown error"}`);
      setSubmitting(false);
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: null, // local product IDs are not UUIDs
        name: item.name,
        price: Number(item.price) || 0,
        size: item.size,
        quantity: item.quantity,
      }))
    );

    if (itemsError) {
      console.error("Order items error:", itemsError);
      setError(`Failed to save order items: ${itemsError.message}`);
      setSubmitting(false);
      return;
    }

    // Save new address to account if typed manually
    if (selectedAddressId === "new" && customAddress.trim()) {
      await supabase.from("shipping_addresses").insert({
        user_id: user!.id,
        label: null,
        address: customAddress.trim(),
        is_default: savedAddresses.length === 0,
      });
    }

    // Fetch worker emails for staff notification
    const { data: workers } = await supabase.from("admins").select("email");
    const workerEmails = (workers || []).map((w: any) => w.email).filter(Boolean);

    const emailParams = {
      customerEmail: user!.email || "",
      customerName: profile?.name || user!.email?.split("@")[0] || "",
      orderId: order.id,
      total: totalPrice,
      shippingAddress: finalAddress,
      items: items.map((i) => ({ name: i.name, size: i.size, quantity: i.quantity, price: i.price })),
      workerEmails,
    };

    // Send emails (fire and forget — don't block checkout on email failure)
    sendOrderConfirmation(emailParams);
    sendOrderNotificationToStaff(emailParams);

    clearCart();
    navigate("/account");
  }

  return (
    <div className="min-h-screen bg-black pt-28 pb-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 mb-2">Checkout</p>
          <h1 className="text-4xl font-bold uppercase tracking-widest text-white mb-12">Complete Order</h1>

          <div className="grid gap-10">

            {/* Order Summary */}
            <div className="border border-white/8 p-6">
              <h2 className="text-xs uppercase tracking-[0.4em] text-white/40 mb-5">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center gap-4">
                    <div className="w-14 h-16 bg-white/5 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{item.name}</p>
                      <p className="text-xs text-white/40 uppercase tracking-widest">Size: {item.size} · Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm text-white">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t border-white/8 mt-6 pt-6">
                <span className="text-xs uppercase tracking-[0.35em] text-white/50">Total</span>
                <span className="text-xl font-bold text-white">€{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Customer Info */}
              <div className="border border-white/8 p-6">
                <h2 className="text-xs uppercase tracking-[0.4em] text-white/40 mb-5">Customer Info</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.4em] text-white/30 mb-2">Name</label>
                    <div className="bg-white/5 border border-white/8 px-4 py-3 text-sm text-white/60">{profile?.name}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.4em] text-white/30 mb-2">Email</label>
                    <div className="bg-white/5 border border-white/8 px-4 py-3 text-sm text-white/60 truncate">{profile?.email}</div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border border-white/8 p-6">
                <h2 className="text-xs uppercase tracking-[0.4em] text-white/40 mb-5">Shipping Address</h2>

                {savedAddresses.length > 0 && (
                  <div className="space-y-2 mb-5">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`w-full text-left p-4 border transition-colors flex items-start gap-3 ${
                          selectedAddressId === addr.id
                            ? "border-white/40 bg-white/5"
                            : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                          selectedAddressId === addr.id ? "border-white bg-white" : "border-white/30"
                        }`}>
                          {selectedAddressId === addr.id && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                        </div>
                        <div>
                          {addr.label && (
                            <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 mb-1">{addr.label}</p>
                          )}
                          <p className="text-sm text-white/75 leading-relaxed">{addr.address}</p>
                        </div>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setSelectedAddressId("new")}
                      className={`w-full text-left p-4 border transition-colors flex items-center gap-3 ${
                        selectedAddressId === "new"
                          ? "border-white/40 bg-white/5"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                        selectedAddressId === "new" ? "border-white bg-white" : "border-white/30"
                      }`}>
                        {selectedAddressId === "new" && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                      </div>
                      <span className="text-xs uppercase tracking-[0.35em] text-white/50">Use a different address</span>
                    </button>
                  </div>
                )}

                {selectedAddressId === "new" && (
                  <textarea
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Street address, City, ZIP Code, Country"
                    rows={3}
                    required
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors resize-none"
                  />
                )}
              </div>

              {error && <p className="text-red-400/80 text-xs tracking-wide">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white text-black py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Placing Order..." : `Place Order · €${totalPrice.toFixed(2)}`}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

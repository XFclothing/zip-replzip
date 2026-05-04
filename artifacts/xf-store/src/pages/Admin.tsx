import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { supabase, Order } from "@/lib/supabase";

const STATUSES = ["pending", "processing", "shipped", "completed"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_COLORS: Record<Status, string> = {
  pending: "text-yellow-400/80 border-yellow-400/30",
  processing: "text-blue-400/80 border-blue-400/30",
  shipped: "text-purple-400/80 border-purple-400/30",
  completed: "text-green-400/80 border-green-400/30",
};

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/login?redirect=/admin");
  }, [user, isAdmin, loading]);

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
    setOrdersLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchOrders();
  }, [isAdmin]);

  async function updateStatus(orderId: string, status: Status) {
    setUpdating(orderId);
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    setUpdating(null);
  }

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  if (loading || ordersLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-28 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-2">Admin Panel</p>
              <h1 className="text-4xl font-bold uppercase tracking-widest text-foreground">Orders</h1>
            </div>
            <div className="md:ml-auto flex gap-2 flex-wrap">
              {(["all", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-[0.35em] border transition-colors ${
                    filterStatus === s
                      ? "border-foreground/50 text-foreground"
                      : "border-foreground/10 text-foreground/30 hover:text-foreground/60 hover:border-foreground/25"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <span className="text-xs text-foreground/30 uppercase tracking-widest">{filtered.length} orders</span>
          </div>

          {filtered.length === 0 ? (
            <p className="text-foreground/25 text-xs uppercase tracking-widest py-12 text-center">No orders</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => (
                <div key={order.id} className="border border-foreground/8 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3 flex-wrap">
                        <span className="text-foreground font-semibold text-sm">${order.total_price.toFixed(2)}</span>
                        <span className="text-foreground/25 text-xs">
                          {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/40 tracking-wide mb-3">{order.shipping_address}</p>
                      {order.order_items && (
                        <div className="space-y-1.5">
                          {order.order_items.map((item) => (
                            <p key={item.id} className="text-xs text-foreground/50">
                              {item.name} · {item.size} · ×{item.quantity} · ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <span className={`text-[10px] uppercase tracking-[0.35em] px-3 py-1.5 border ${STATUS_COLORS[order.status as Status] || "text-foreground/50 border-foreground/20"} text-center`}>
                        {order.status}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as Status)}
                        disabled={updating === order.id}
                        className="bg-foreground/5 border border-foreground/10 text-foreground/60 text-xs px-3 py-2 outline-none cursor-pointer hover:border-foreground/25 transition-colors disabled:opacity-50"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-background">{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase, Order, Ticket, TicketMessage } from "@/lib/supabase";

const STATUSES = ["pending", "processing", "shipped"] as const;
type OrderStatus = (typeof STATUSES)[number];

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400/80 border-yellow-400/30",
  processing: "text-blue-400/80 border-blue-400/30",
  shipped: "text-purple-400/80 border-purple-400/30",
  delivered: "text-teal-400/80 border-teal-400/30",
  completed: "text-green-400/80 border-green-400/30",
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "text-yellow-400/80",
  answered: "text-green-400/80",
  closed: "text-foreground/30",
};

export default function Worker() {
  const { user, role, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"orders" | "delivered" | "old_orders" | "tickets">("orders");

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [activeOldOrder, setActiveOldOrder] = useState<Order | null>(null);

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!loading && (role !== "worker" && role !== "founder")) navigate("/login");
  }, [role, loading]);

  useEffect(() => {
    fetchOrders();
    fetchTickets();
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) console.error("Orders fetch error:", error.message);
    setOrders((data as Order[]) || []);
    setOrdersLoading(false);
  }

  async function fetchTickets() {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
    setTicketsLoading(false);
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    setUpdatingOrder(orderId);
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    setUpdatingOrder(null);
  }

  async function openTicket(ticket: Ticket) {
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    setTicketMessages((data as TicketMessage[]) || []);
    setActiveTicket(ticket);
  }

  async function sendReply() {
    if (!reply.trim() || !activeTicket) return;
    setReplying(true);
    const { data } = await supabase
      .from("ticket_messages")
      .insert({ ticket_id: activeTicket.id, sender_role: "worker", message: reply.trim() })
      .select()
      .single();
    if (data) {
      setTicketMessages((prev) => [...prev, data as TicketMessage]);
      await supabase.from("tickets").update({ status: "answered" }).eq("id", activeTicket.id);
      setTickets((prev) => prev.map((t) => t.id === activeTicket.id ? { ...t, status: "answered" } : t));
      setActiveTicket((prev) => prev ? { ...prev, status: "answered" } : prev);
    }
    setReply("");
    setReplying(false);
  }

  async function updateTicketStatus(status: string) {
    if (!activeTicket) return;
    await supabase.from("tickets").update({ status }).eq("id", activeTicket.id);
    setTickets((prev) => prev.map((t) => t.id === activeTicket.id ? { ...t, status: status as Ticket["status"] } : t));
    setActiveTicket((prev) => prev ? { ...prev, status: status as Ticket["status"] } : prev);
  }

  async function closeAndDeleteTicket() {
    if (!activeTicket) return;
    await supabase.from("ticket_messages").delete().eq("ticket_id", activeTicket.id);
    await supabase.from("tickets").delete().eq("id", activeTicket.id);
    setTickets((prev) => prev.filter((t) => t.id !== activeTicket.id));
    setActiveTicket(null);
    setTicketMessages([]);
  }

  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "old_orders" && o.status !== "completed");
  const deliveredOrders = orders.filter((o) => o.status === "delivered" || o.status === "completed");
  const oldOrders = orders.filter((o) => o.status === "old_orders");
  const filteredOrders = filterStatus === "all" ? activeOrders : activeOrders.filter((o) => o.status === filterStatus);

  async function confirmDelivery(orderId: string) {
    await supabase.from("orders").update({ status: "old_orders" }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "old_orders" } : o));
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-28 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-2">Staff Access</p>
            <h1 className="text-4xl font-bold uppercase tracking-widest text-foreground">Worker Panel</h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-foreground/10 mb-10 flex-wrap">
            {(["orders", "delivered", "old_orders", "tickets"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-3 text-xs uppercase tracking-[0.4em] transition-colors border-b-2 -mb-px ${
                  tab === t ? "border-white text-foreground" : "border-transparent text-foreground/30 hover:text-foreground/60"
                }`}
              >
                {t === "orders" && <>Orders</>}
                {t === "delivered" && <>Delivered <span className="text-teal-400/50">({deliveredOrders.length})</span></>}
                {t === "old_orders" && <>Old Orders <span className="text-foreground/25">({oldOrders.length})</span></>}
                {t === "tickets" && <>Tickets</>}
              </button>
            ))}
          </div>

          {/* Orders Tab */}
          {tab === "orders" && (
            <div>
              <div className="flex gap-2 flex-wrap mb-8">
                {(["all", ...STATUSES] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-4 py-2 text-[10px] uppercase tracking-[0.35em] border transition-colors ${
                      filterStatus === s ? "border-foreground/50 text-foreground" : "border-foreground/10 text-foreground/30 hover:text-foreground/60 hover:border-foreground/25"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-foreground/30 uppercase tracking-widest mb-6">{filteredOrders.length} orders</p>
              {ordersLoading ? (
                <div className="flex justify-center py-16"><div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" /></div>
              ) : filteredOrders.length === 0 ? (
                <p className="text-foreground/25 text-xs uppercase tracking-widest py-12 text-center">No orders</p>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="border border-foreground/8 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-2 flex-wrap">
                            <span className="text-foreground font-semibold text-sm">${order.total_price.toFixed(2)}</span>
                            <span className="text-foreground/25 text-xs">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {(order as any).profiles && (
                            <p className="text-xs text-foreground/60 mb-1">
                              {(order as any).profiles.name} · {(order as any).profiles.email}
                            </p>
                          )}
                          <p className="text-xs text-foreground/35 tracking-wide mb-3">{order.shipping_address}</p>
                          {order.order_items && (
                            <div className="space-y-1">
                              {order.order_items.map((item) => (
                                <p key={item.id} className="text-xs text-foreground/45">
                                  {item.name} · {item.size} · ×{item.quantity} · ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col gap-2">
                          <span className={`text-[10px] uppercase tracking-[0.35em] px-3 py-1.5 border ${ORDER_STATUS_COLORS[order.status as OrderStatus] || "text-foreground/50 border-foreground/20"} text-center`}>
                            {order.status}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            disabled={updatingOrder === order.id}
                            className="bg-foreground/5 border border-foreground/10 text-foreground/60 text-xs px-3 py-2 outline-none cursor-pointer hover:border-foreground/25 transition-colors disabled:opacity-50"
                          >
                            {STATUSES.map((s) => <option key={s} value={s} className="bg-background">{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delivered Orders Tab */}
          {tab === "delivered" && (
            <div>
              <p className="text-xs text-foreground/30 uppercase tracking-widest mb-6">{deliveredOrders.length} delivered orders</p>
              {ordersLoading ? (
                <div className="flex justify-center py-16"><div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" /></div>
              ) : deliveredOrders.length === 0 ? (
                <p className="text-foreground/25 text-xs uppercase tracking-widest py-12 text-center">No delivered orders</p>
              ) : (
                <div className="space-y-4">
                  {deliveredOrders.map((order) => (
                    <div key={order.id} className="border border-teal-400/15 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-2 flex-wrap">
                            <span className="text-foreground font-semibold text-sm">${order.total_price.toFixed(2)}</span>
                            <span className="text-foreground/25 text-xs">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-xs text-foreground/35 tracking-wide mb-3">{order.shipping_address}</p>
                          {order.order_items && (
                            <div className="space-y-1">
                              {order.order_items.map((item) => (
                                <p key={item.id} className="text-xs text-foreground/45">
                                  {item.name} · {item.size} · ×{item.quantity} · ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                          <span className="text-[10px] uppercase tracking-[0.35em] px-3 py-1.5 border text-teal-400/80 border-teal-400/30 text-center">
                            Delivered by customer
                          </span>
                          <button
                            onClick={() => confirmDelivery(order.id)}
                            className="text-[10px] uppercase tracking-[0.35em] px-4 py-2 bg-foreground/10 text-foreground/70 hover:bg-foreground/20 hover:text-foreground transition-colors border border-foreground/10"
                          >
                            Confirm &amp; Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Old Orders Tab */}
          {tab === "old_orders" && (
            <div>
              <p className="text-xs text-foreground/30 uppercase tracking-widest mb-6">{oldOrders.length} old orders</p>
              {ordersLoading ? (
                <div className="flex justify-center py-16"><div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" /></div>
              ) : oldOrders.length === 0 ? (
                <p className="text-foreground/25 text-xs uppercase tracking-widest py-12 text-center">No old orders</p>
              ) : (
                <div className="space-y-3">
                  {oldOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setActiveOldOrder(order)}
                      className="w-full border border-foreground/8 p-5 text-left hover:border-foreground/20 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-foreground/30 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                          <p className="text-foreground/70 font-semibold mt-1">${order.total_price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-[0.35em] text-foreground/30">Old Order</span>
                          <span className="text-foreground/15 group-hover:text-foreground/40 transition-colors text-xs">›</span>
                        </div>
                      </div>
                      {order.order_items && order.order_items.length > 0 && (
                        <p className="text-xs text-foreground/25 mt-2">{order.order_items.map(i => i.name).join(", ")}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tickets Tab */}
          {tab === "tickets" && (
            <div>
              {ticketsLoading ? (
                <div className="flex justify-center py-16"><div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" /></div>
              ) : tickets.length === 0 ? (
                <p className="text-foreground/25 text-xs uppercase tracking-widest py-12 text-center">No support tickets</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => openTicket(ticket)}
                      className="w-full border border-foreground/8 p-5 text-left hover:border-foreground/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-foreground/40 mt-1">
                            {(ticket as any).profiles?.name} · {(ticket as any).profiles?.email}
                          </p>
                          <p className="text-xs text-foreground/25 mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest flex-shrink-0 ${TICKET_STATUS_COLORS[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Old Order Detail Modal */}
      <AnimatePresence>
        {activeOldOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveOldOrder(null)}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg bg-card border border-foreground/10 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-foreground/8">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.5em] text-foreground/25 mb-1">Order Details</p>
                    <p className="text-[10px] text-foreground/20 font-mono">{activeOldOrder.id.split("-")[0].toUpperCase()}</p>
                  </div>
                  <button onClick={() => setActiveOldOrder(null)} className="text-foreground/30 hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-8 py-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.4em] text-foreground/25 mb-2">Placed on</p>
                      <p className="text-sm text-foreground/70">{new Date(activeOldOrder.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      <p className="text-xs text-foreground/30 mt-0.5">{new Date(activeOldOrder.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-foreground/25 mb-2">Status</p>
                      <span className="text-xs uppercase tracking-widest font-semibold text-foreground/40">Old Order</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-foreground/25 mb-3">Shipping Address</p>
                    <div className="bg-foreground/3 border border-foreground/6 px-4 py-3">
                      <p className="text-sm text-foreground/60 leading-relaxed whitespace-pre-line">{activeOldOrder.shipping_address}</p>
                    </div>
                  </div>
                  {activeOldOrder.order_items && activeOldOrder.order_items.length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.4em] text-foreground/25 mb-3">Items ({activeOldOrder.order_items.length})</p>
                      <div className="border border-foreground/6 divide-y divide-foreground/5">
                        {activeOldOrder.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-sm text-foreground/70">{item.name}</p>
                              <p className="text-xs text-foreground/30 mt-0.5">{item.size} · ×{item.quantity}</p>
                            </div>
                            <p className="text-sm text-foreground/50">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                        <div className="flex items-center justify-between px-4 py-3 bg-foreground/3">
                          <p className="text-xs uppercase tracking-[0.35em] text-foreground/40">Total</p>
                          <p className="text-sm font-semibold text-foreground/80">${activeOldOrder.total_price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-foreground/8 flex justify-end">
                    <button onClick={() => setActiveOldOrder(null)} className="text-[9px] uppercase tracking-[0.3em] text-foreground/25 hover:text-foreground/60 px-3 py-2 transition-colors">Close</button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Ticket Modal */}
      <AnimatePresence>
        {activeTicket && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveTicket(null)}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 top-16 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-card border border-foreground/10 z-50 flex flex-col"
            >
              <div className="flex items-start justify-between p-6 border-b border-foreground/8">
                <div>
                  <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">Ticket</p>
                  <h3 className="text-base font-semibold text-foreground">{activeTicket.subject}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[10px] uppercase tracking-widest ${TICKET_STATUS_COLORS[activeTicket.status]}`}>{activeTicket.status}</span>
                    <select
                      value={activeTicket.status}
                      onChange={(e) => updateTicketStatus(e.target.value)}
                      className="bg-foreground/5 border border-foreground/10 text-foreground/50 text-[10px] px-2 py-1 outline-none"
                    >
                      {["open", "answered", "closed"].map((s) => <option key={s} value={s} className="bg-background">{s}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => setActiveTicket(null)} className="text-foreground/30 hover:text-foreground transition-colors mt-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-foreground/5 rounded p-4">
                  <p className="text-[10px] uppercase tracking-widest text-foreground/30 mb-2">Original message</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{activeTicket.message}</p>
                </div>
                {ticketMessages.map((msg) => (
                  <div key={msg.id} className={`p-4 ${msg.sender_role === "worker" ? "bg-foreground/8 ml-4" : "bg-foreground/5 mr-4"}`}>
                    <p className={`text-[10px] uppercase tracking-widest mb-2 ${msg.sender_role === "worker" ? "text-blue-400/60" : "text-foreground/30"}`}>
                      {msg.sender_role === "worker" ? "You (Staff)" : "User"}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{msg.message}</p>
                    <p className="text-[10px] text-foreground/20 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-foreground/8">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={sendReply}
                    disabled={replying || !reply.trim()}
                    className="flex-1 bg-foreground text-background py-3 text-xs uppercase tracking-[0.35em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40"
                  >
                    {replying ? "Sending..." : "Send Reply"}
                  </button>
                  <button
                    onClick={closeAndDeleteTicket}
                    className="px-4 py-3 text-xs uppercase tracking-[0.35em] border border-red-400/30 text-red-400/70 hover:bg-red-400/10 hover:text-red-400 transition-colors"
                    title="Close & delete this ticket"
                  >
                    Close & Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

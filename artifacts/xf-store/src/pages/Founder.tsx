import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { X, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase, Order, Ticket, TicketMessage, Admin } from "@/lib/supabase";

const STATUSES = ["pending", "processing", "shipped", "completed"] as const;
type OrderStatus = (typeof STATUSES)[number];

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "text-yellow-400/80 border-yellow-400/30",
  processing: "text-blue-400/80 border-blue-400/30",
  shipped: "text-purple-400/80 border-purple-400/30",
  completed: "text-green-400/80 border-green-400/30",
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "text-yellow-400/80",
  answered: "text-green-400/80",
  closed: "text-white/30",
};

const DEFAULT_PERMS = { view_orders: true, manage_orders: false, manage_tickets: false };

export default function Founder() {
  const { role, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"workers" | "orders" | "tickets">("workers");

  // Workers
  const [workers, setWorkers] = useState<Admin[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerEmail, setNewWorkerEmail] = useState("");
  const [addingWorker, setAddingWorker] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [confirmRemoveWorker, setConfirmRemoveWorker] = useState<Admin | null>(null);
  const [removingWorker, setRemovingWorker] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!loading && role !== "founder") navigate("/login");
    if (!loading && role === "founder") {
      fetchWorkers();
      fetchOrders();
      fetchTickets();
    }
  }, [role, loading]);

  async function fetchWorkers() {
    setWorkersLoading(true);
    const { data, error } = await supabase.from("admins").select("*").order("name", { ascending: true });
    if (error) console.error("fetchWorkers error:", error);
    setWorkers((data as Admin[]) || []);
    setWorkersLoading(false);
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) console.error("[Founder] fetchOrders error:", error.message);
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

  async function addWorker() {
    if (!newWorkerName.trim() || !newWorkerEmail.trim()) return;
    setAddingWorker(true);
    setAddError(null);
    const { error } = await supabase.from("admins").insert({
      name: newWorkerName.trim(),
      email: newWorkerEmail.trim().toLowerCase(),
      role: "worker",
      permissions: DEFAULT_PERMS,
    });
    if (error) {
      setAddError(error.message.includes("unique") ? "This email is already a worker." : error.message);
      setAddingWorker(false);
      return;
    }
    await fetchWorkers();
    setNewWorkerName("");
    setNewWorkerEmail("");
    setShowAddWorker(false);
    setAddingWorker(false);
  }

  async function confirmAndRemoveWorker() {
    if (!confirmRemoveWorker) return;
    setRemovingWorker(true);
    await supabase.from("admins").delete().eq("id", confirmRemoveWorker.id);
    setWorkers((prev) => prev.filter((w) => w.id !== confirmRemoveWorker.id));
    setRemovingWorker(false);
    setConfirmRemoveWorker(null);
  }

  async function updatePermissions(id: string, key: keyof Admin["permissions"], value: boolean) {
    const worker = workers.find((w) => w.id === id);
    if (!worker) return;
    const newPerms = { ...(worker.permissions || DEFAULT_PERMS), [key]: value };
    await supabase.from("admins").update({ permissions: newPerms }).eq("id", id);
    setWorkers((prev) => prev.map((w) => w.id === id ? { ...w, permissions: newPerms } : w));
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
      .select().single();
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

  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-28 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 mb-2">Full Access</p>
              <h1 className="text-4xl font-bold uppercase tracking-widest text-white">Founder Panel</h1>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/20 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              XF
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-10">
            {(["workers", "orders", "tickets"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-3 text-xs uppercase tracking-[0.4em] transition-colors border-b-2 -mb-px ${
                  tab === t ? "border-white text-white" : "border-transparent text-white/30 hover:text-white/60"
                }`}
              >
                {t}
                {t === "workers" && <span className="ml-2 text-white/30">({workers.length})</span>}
                {t === "orders" && <span className="ml-2 text-white/30">({orders.length})</span>}
                {t === "tickets" && <span className="ml-2 text-white/30">({tickets.filter(t => t.status === "open").length})</span>}
              </button>
            ))}
          </div>

          {/* Workers Tab */}
          {tab === "workers" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-white/30 uppercase tracking-widest">{workers.length} workers</p>
                <button
                  onClick={() => setShowAddWorker(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-white/20 text-xs uppercase tracking-[0.35em] text-white/60 hover:text-white hover:border-white/50 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Worker
                </button>
              </div>

              {workersLoading ? (
                <div className="flex justify-center py-16"><div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" /></div>
              ) : workers.length === 0 ? (
                <p className="text-white/25 text-xs uppercase tracking-widest py-12 text-center">No workers yet</p>
              ) : (
                <div className="space-y-4">
                  {workers.map((worker) => {
                    const perms = worker.permissions || DEFAULT_PERMS;
                    return (
                      <div key={worker.id} className="border border-white/8 p-6">
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div>
                            <p className="text-white font-medium">{worker.name}</p>
                            <p className="text-xs text-white/40 mt-1">{worker.email}</p>
                            <span className="text-[10px] uppercase tracking-widest text-white/25 mt-1 inline-block">{worker.role}</span>
                          </div>
                          <button
                            onClick={() => setConfirmRemoveWorker(worker)}
                            className="text-white/20 hover:text-red-400/70 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="border-t border-white/5 pt-4">
                          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-3">Permissions</p>
                          <div className="flex flex-wrap gap-3">
                            {(Object.keys(DEFAULT_PERMS) as (keyof typeof DEFAULT_PERMS)[]).map((key) => (
                              <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!perms[key]}
                                  onChange={(e) => updatePermissions(worker.id, key, e.target.checked)}
                                  className="accent-white w-3.5 h-3.5"
                                />
                                <span className="text-[10px] uppercase tracking-widest text-white/50">
                                  {key.replace(/_/g, " ")}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {tab === "orders" && (
            <div>
              <div className="flex gap-2 flex-wrap mb-8">
                {(["all", ...STATUSES] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-4 py-2 text-[10px] uppercase tracking-[0.35em] border transition-colors ${
                      filterStatus === s ? "border-white/50 text-white" : "border-white/10 text-white/30 hover:text-white/60 hover:border-white/25"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-6">{filteredOrders.length} orders</p>
              {ordersLoading ? (
                <div className="flex justify-center py-16"><div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" /></div>
              ) : filteredOrders.length === 0 ? (
                <p className="text-white/25 text-xs uppercase tracking-widest py-12 text-center">No orders</p>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="border border-white/8 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-2 flex-wrap">
                            <span className="text-white font-semibold text-sm">${order.total_price.toFixed(2)}</span>
                            <span className="text-white/25 text-xs">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {(order as any).profiles && (
                            <p className="text-xs text-white/60 mb-1">{(order as any).profiles.name} · {(order as any).profiles.email}</p>
                          )}
                          <p className="text-xs text-white/35 tracking-wide mb-3">{order.shipping_address}</p>
                          {order.order_items && (
                            <div className="space-y-1">
                              {order.order_items.map((item) => (
                                <p key={item.id} className="text-xs text-white/45">
                                  {item.name} · {item.size} · ×{item.quantity} · ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col gap-2">
                          <span className={`text-[10px] uppercase tracking-[0.35em] px-3 py-1.5 border ${ORDER_STATUS_COLORS[order.status as OrderStatus] || "text-white/50 border-white/20"} text-center`}>
                            {order.status}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            disabled={updatingOrder === order.id}
                            className="bg-white/5 border border-white/10 text-white/60 text-xs px-3 py-2 outline-none cursor-pointer hover:border-white/25 transition-colors disabled:opacity-50"
                          >
                            {STATUSES.map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tickets Tab */}
          {tab === "tickets" && (
            <div>
              {ticketsLoading ? (
                <div className="flex justify-center py-16"><div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" /></div>
              ) : tickets.length === 0 ? (
                <p className="text-white/25 text-xs uppercase tracking-widest py-12 text-center">No tickets</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <button key={ticket.id} onClick={() => openTicket(ticket)}
                      className="w-full border border-white/8 p-5 text-left hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-white/40 mt-1">{(ticket as any).profiles?.name} · {(ticket as any).profiles?.email}</p>
                          <p className="text-xs text-white/25 mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest flex-shrink-0 ${TICKET_STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Confirm Remove Worker Modal */}
      <AnimatePresence>
        {confirmRemoveWorker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !removingWorker && setConfirmRemoveWorker(null)}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm bg-[#0a0a0a] border border-white/10 p-8 z-50"
            >
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-2">Remove Worker</h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="text-white/70">{confirmRemoveWorker.name}</span>?
                  They will lose access immediately.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRemoveWorker(null)}
                  disabled={removingWorker}
                  className="flex-1 py-3 border border-white/15 text-xs uppercase tracking-[0.35em] text-white/50 hover:text-white hover:border-white/40 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndRemoveWorker}
                  disabled={removingWorker}
                  className="flex-1 py-3 bg-red-500/80 hover:bg-red-500 text-white text-xs uppercase tracking-[0.35em] font-semibold transition-colors disabled:opacity-40"
                >
                  {removingWorker ? "Removing..." : "Remove"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Worker Modal */}
      <AnimatePresence>
        {showAddWorker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddWorker(false)} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-[#0a0a0a] border border-white/10 p-8 z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Add Worker</h3>
                <button onClick={() => setShowAddWorker(false)} className="text-white/30 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-2">Name</label>
                  <input
                    type="text"
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    placeholder="Worker name"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-2">Email</label>
                  <input
                    type="email"
                    value={newWorkerEmail}
                    onChange={(e) => setNewWorkerEmail(e.target.value)}
                    placeholder="worker@email.com"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                {addError && <p className="text-red-400/80 text-xs">{addError}</p>}
                <p className="text-[10px] text-white/25 leading-relaxed">
                  The worker must sign up through the app using this email to gain access.
                </p>
                <button
                  onClick={addWorker}
                  disabled={addingWorker || !newWorkerName.trim() || !newWorkerEmail.trim()}
                  className="w-full bg-white text-black py-3.5 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-40"
                >
                  {addingWorker ? "Adding..." : "Add Worker"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ticket Modal */}
      <AnimatePresence>
        {activeTicket && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveTicket(null)} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 top-16 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-[#0a0a0a] border border-white/10 z-50 flex flex-col"
            >
              <div className="flex items-start justify-between p-6 border-b border-white/8">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Ticket</p>
                  <h3 className="text-base font-semibold text-white">{activeTicket.subject}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[10px] uppercase tracking-widest ${TICKET_STATUS_COLORS[activeTicket.status]}`}>{activeTicket.status}</span>
                    <select value={activeTicket.status} onChange={(e) => updateTicketStatus(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white/50 text-[10px] px-2 py-1 outline-none">
                      {["open", "answered", "closed"].map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => setActiveTicket(null)} className="text-white/30 hover:text-white transition-colors mt-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-white/5 rounded p-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Original message</p>
                  <p className="text-sm text-white/80 leading-relaxed">{activeTicket.message}</p>
                </div>
                {ticketMessages.map((msg) => (
                  <div key={msg.id} className={`p-4 ${msg.sender_role === "worker" ? "bg-white/8 ml-4" : "bg-white/5 mr-4"}`}>
                    <p className={`text-[10px] uppercase tracking-widest mb-2 ${msg.sender_role === "worker" ? "text-blue-400/60" : "text-white/30"}`}>
                      {msg.sender_role === "worker" ? "Staff" : "User"}
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">{msg.message}</p>
                    <p className="text-[10px] text-white/20 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/8">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply..." rows={3}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors resize-none mb-3"
                />
                <button onClick={sendReply} disabled={replying || !reply.trim()}
                  className="w-full bg-white text-black py-3 text-xs uppercase tracking-[0.35em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-40">
                  {replying ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

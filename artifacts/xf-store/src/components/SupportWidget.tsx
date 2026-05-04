import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Plus, ChevronLeft, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase, Ticket, TicketMessage } from "@/lib/supabase";
import { sendTicketNotificationToStaff } from "@/lib/email";

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "text-yellow-400/80",
  answered: "text-green-400/80",
  closed: "text-white/30",
};

type View = "list" | "ticket" | "new";

export function SupportWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      setTicketsLoading(true);
      supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setTickets((data as Ticket[]) || []);
          setTicketsLoading(false);
        });
    }
    if (!open) { setView("list"); setActiveTicket(null); }
  }, [open, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openTicket(ticket: Ticket) {
    setActiveTicket(ticket);
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    setMessages((data as TicketMessage[]) || []);
    setView("ticket");
  }

  async function sendReply() {
    if (!reply.trim() || !activeTicket || replying) return;
    setReplying(true);
    const { data } = await supabase
      .from("ticket_messages")
      .insert({ ticket_id: activeTicket.id, sender_role: "user", message: reply.trim() })
      .select().single();
    if (data) {
      setMessages((prev) => [...prev, data as TicketMessage]);
      await supabase.from("tickets").update({ status: "open" }).eq("id", activeTicket.id);
      setTickets((prev) => prev.map((t) => t.id === activeTicket.id ? { ...t, status: "open" } : t));
      setActiveTicket((prev) => prev ? { ...prev, status: "open" } : prev);
    }
    setReply("");
    setReplying(false);
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    const { error } = await supabase.from("tickets").insert({
      user_id: user!.id,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
    });
    if (error) { setCreateError(error.message); setCreating(false); return; }
    const { data: workers } = await supabase.from("admins").select("email");
    const workerEmails = (workers || []).map((w: any) => w.email).filter(Boolean);
    sendTicketNotificationToStaff({
      customerEmail: user!.email || "",
      customerName: user!.user_metadata?.name || user!.email?.split("@")[0] || "",
      subject: subject.trim(),
      message: message.trim(),
      workerEmails,
    });
    const { data: fresh } = await supabase
      .from("tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setTickets((fresh as Ticket[]) || []);
    setSubject("");
    setMessage("");
    setCreating(false);
    setView("list");
  }

  const hasUnread = tickets.some((t) => t.status === "answered");

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-[340px] h-[500px] bg-[#0a0a0a] border border-white/10 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-3">
                {view !== "list" && (
                  <button onClick={() => setView("list")} className="text-white/30 hover:text-white transition-colors mr-1">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
                    {view === "list" ? "Help Center" : view === "new" ? "New Ticket" : activeTicket?.subject}
                  </p>
                  {view === "list" && <p className="text-xs text-white/60 mt-0.5">XF Support</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {view === "list" && user && (
                  <button
                    onClick={() => { setCreateError(null); setSubject(""); setMessage(""); setView("new"); }}
                    className="text-white/30 hover:text-white transition-colors"
                    title="New Ticket"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Not logged in */}
              {!user && (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <MessageCircle className="w-8 h-8 text-white/20 mb-4" />
                  <p className="text-white/50 text-sm mb-2">Sign in to contact support</p>
                  <p className="text-white/25 text-xs mb-6">We're here to help with any questions.</p>
                  <a
                    href="/login?redirect=/support"
                    className="px-5 py-2.5 border border-white/20 text-xs uppercase tracking-[0.35em] text-white/60 hover:text-white hover:border-white/50 transition-colors"
                  >
                    Sign In
                  </a>
                </div>
              )}

              {/* Ticket List */}
              {user && view === "list" && (
                <div className="p-4">
                  {ticketsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <MessageCircle className="w-7 h-7 text-white/15 mb-4" />
                      <p className="text-white/30 text-xs uppercase tracking-widest mb-2">No tickets yet</p>
                      <p className="text-white/20 text-xs mb-6">Have a question? We're here to help.</p>
                      <button
                        onClick={() => { setCreateError(null); setSubject(""); setMessage(""); setView("new"); }}
                        className="px-4 py-2 border border-white/20 text-[10px] uppercase tracking-[0.35em] text-white/50 hover:text-white hover:border-white/50 transition-colors"
                      >
                        Open a Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => openTicket(ticket)}
                          className="w-full border border-white/8 p-4 text-left hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/80 font-medium truncate">{ticket.subject}</p>
                              <p className="text-[10px] text-white/30 mt-1">
                                {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <span className={`text-[9px] uppercase tracking-widest flex-shrink-0 ${TICKET_STATUS_COLORS[ticket.status]}`}>
                              {ticket.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* New Ticket Form */}
              {user && view === "new" && (
                <form onSubmit={createTicket} className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.4em] text-white/30 mb-2">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's your issue?"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-3 py-2.5 text-xs outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.4em] text-white/30 mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      required
                      rows={6}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-3 py-2.5 text-xs outline-none focus:border-white/30 transition-colors resize-none"
                    />
                  </div>
                  {createError && <p className="text-red-400/70 text-xs">{createError}</p>}
                  <button
                    type="submit"
                    disabled={creating || !subject.trim() || !message.trim()}
                    className="w-full bg-white text-black py-3 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-40"
                  >
                    {creating ? "Sending..." : "Send Ticket"}
                  </button>
                </form>
              )}

              {/* Ticket Thread */}
              {user && view === "ticket" && activeTicket && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="bg-white/5 p-3">
                      <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Your message</p>
                      <p className="text-xs text-white/70 leading-relaxed">{activeTicket.message}</p>
                    </div>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 ${msg.sender_role === "worker" ? "bg-white/8 ml-3" : "bg-white/3 mr-3"}`}
                      >
                        <p className={`text-[9px] uppercase tracking-widest mb-1.5 ${msg.sender_role === "worker" ? "text-blue-400/50" : "text-white/25"}`}>
                          {msg.sender_role === "worker" ? "Support" : "You"}
                        </p>
                        <p className="text-xs text-white/70 leading-relaxed">{msg.message}</p>
                        <p className="text-[9px] text-white/15 mt-1.5">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Reply bar (ticket view) */}
            {user && view === "ticket" && activeTicket?.status !== "closed" && (
              <div className="flex gap-2 p-3 border-t border-white/8 flex-shrink-0">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="Reply..."
                  className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/20 px-3 py-2 text-xs outline-none focus:border-white/30 transition-colors"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || replying}
                  className="px-3 py-2 bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {user && view === "ticket" && activeTicket?.status === "closed" && (
              <div className="px-5 py-3 border-t border-white/8 flex-shrink-0">
                <p className="text-[10px] uppercase tracking-widest text-white/25 text-center">This ticket is closed</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-13 h-13 bg-white text-black flex items-center justify-center shadow-lg hover:bg-white/90 transition-colors"
        style={{ width: 52, height: 52 }}
        aria-label="Support"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
        {!open && hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
        )}
      </motion.button>
    </div>
  );
}

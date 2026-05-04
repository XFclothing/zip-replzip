import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Plus, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase, Ticket, TicketMessage } from "@/lib/supabase";
import { sendTicketNotificationToStaff } from "@/lib/email";

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "text-yellow-400/80",
  answered: "text-green-400/80",
  closed: "text-foreground/30",
};

export default function Support() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login?redirect=/support");
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  async function fetchTickets() {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
    setTicketsLoading(false);
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setCreating(true);
    setCreateError(null);
    const { data: ticketData, error } = await supabase.from("tickets").insert({
      user_id: user!.id,
      subject: subject.trim(),
      status: "open",
    }).select().single();
    if (error) { setCreateError(error.message); setCreating(false); return; }
    await supabase.from("ticket_messages").insert({
      ticket_id: ticketData.id,
      sender_role: "user",
      message: message.trim(),
    });

    // Notify staff by email (fire and forget)
    const { data: workers } = await supabase.from("admins").select("email");
    const workerEmails = (workers || []).map((w: any) => w.email).filter(Boolean);
    sendTicketNotificationToStaff({
      customerEmail: user!.email || "",
      customerName: user!.user_metadata?.name || user!.email?.split("@")[0] || "",
      subject: subject.trim(),
      message: message.trim(),
      workerEmails,
    });

    await fetchTickets();
    setSubject("");
    setMessage("");
    setShowCreate(false);
    setCreating(false);
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
      .insert({ ticket_id: activeTicket.id, sender_role: "user", message: reply.trim() })
      .select().single();
    if (data) {
      setTicketMessages((prev) => [...prev, data as TicketMessage]);
      await supabase.from("tickets").update({ status: "open" }).eq("id", activeTicket.id);
      setTickets((prev) => prev.map((t) => t.id === activeTicket.id ? { ...t, status: "open" } : t));
      setActiveTicket((prev) => prev ? { ...prev, status: "open" } : prev);
    }
    setReply("");
    setReplying(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-28 pb-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-2">Help Center</p>
              <h1 className="text-4xl font-bold uppercase tracking-widest text-foreground">Support</h1>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-foreground/20 text-xs uppercase tracking-[0.35em] text-foreground/60 hover:text-foreground hover:border-foreground/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Ticket
            </button>
          </div>

          {ticketsLoading ? (
            <div className="flex justify-center py-16"><div className="w-5 h-5 border border-foreground/20 border-t-foreground/60 rounded-full animate-spin" /></div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-foreground/20 text-xs uppercase tracking-[0.5em] mb-4">No tickets yet</p>
              <p className="text-foreground/30 text-sm mb-8">Have a question or issue? We're here to help.</p>
              <button onClick={() => setShowCreate(true)}
                className="px-6 py-3 border border-foreground/20 text-xs uppercase tracking-[0.35em] text-foreground/50 hover:text-foreground hover:border-foreground/50 transition-colors">
                Open a Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className="w-full border border-foreground/8 p-5 text-left hover:border-foreground/20 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-foreground/30 mt-1">{new Date(ticket.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] uppercase tracking-widest ${TICKET_STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
                    <ChevronRight className="w-4 h-4 text-foreground/20" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-card border border-foreground/10 p-8 z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest">New Ticket</h3>
                <button onClick={() => setShowCreate(false)} className="text-foreground/30 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={createTicket} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-2">Subject</label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                    placeholder="What's the issue?" required
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-2">Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..." rows={5} required
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors resize-none"
                  />
                </div>
                {createError && <p className="text-red-400/80 text-xs">{createError}</p>}
                <button type="submit" disabled={creating || !subject.trim() || !message.trim()}
                  className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40">
                  {creating ? "Submitting..." : "Submit Ticket"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ticket Thread Modal */}
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
              className="fixed inset-x-4 top-16 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-card border border-foreground/10 z-50 flex flex-col"
            >
              <div className="flex items-start justify-between p-6 border-b border-foreground/8">
                <div>
                  <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">Ticket</p>
                  <h3 className="text-base font-semibold text-foreground">{activeTicket.subject}</h3>
                  <span className={`text-[10px] uppercase tracking-widest mt-1 inline-block ${TICKET_STATUS_COLORS[activeTicket.status]}`}>{activeTicket.status}</span>
                </div>
                <button onClick={() => setActiveTicket(null)} className="text-foreground/30 hover:text-foreground transition-colors mt-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-foreground/5 rounded p-4">
                  <p className="text-[10px] uppercase tracking-widest text-foreground/30 mb-2">Your message</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{activeTicket.message}</p>
                </div>
                {ticketMessages.map((msg) => (
                  <div key={msg.id} className={`p-4 rounded ${msg.sender_role === "worker" ? "bg-foreground/8 ml-4 border-l-2 border-blue-400/20" : "bg-foreground/5 mr-4"}`}>
                    <p className={`text-[10px] uppercase tracking-widest mb-2 ${msg.sender_role === "worker" ? "text-blue-400/60" : "text-foreground/30"}`}>
                      {msg.sender_role === "worker" ? "XF Support" : "You"}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{msg.message}</p>
                    <p className="text-[10px] text-foreground/20 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
                {tickets.find((t) => t.id === activeTicket.id)?.status === "closed" && (
                  <p className="text-center text-xs text-foreground/25 uppercase tracking-widest py-4">This ticket is closed</p>
                )}
              </div>

              {activeTicket.status !== "closed" && (
                <div className="p-4 border-t border-foreground/8">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                    placeholder="Send a follow-up message..." rows={3}
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors resize-none mb-3"
                  />
                  <button onClick={sendReply} disabled={replying || !reply.trim()}
                    className="w-full bg-foreground text-background py-3 text-xs uppercase tracking-[0.35em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40">
                    {replying ? "Sending..." : "Send Message"}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

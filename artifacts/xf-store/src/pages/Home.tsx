import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import xfLogo from "@assets/ChatGPT_Image_3._Mai_2026,_19_49_35_1777830790029.png";
import xfLogoDark from "/logo-dark.png";
import { featured } from "@/data/products";
import { useLang } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const TARGET_DATE = new Date("2026-09-01T00:00:00");

function useCountdown() {
  const calc = () => {
    const diff = TARGET_DATE.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    };
  };
  const [timeLeft, setTimeLeft] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

export default function Home() {
  const { days, hours, minutes } = useCountdown();
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim();
    await supabase.from("notify_emails").upsert({ email: cleanEmail }, { onConflict: "email" });
    fetch("/api/email/newsletter-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail }),
    }).catch(() => {});
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden py-24">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[700px] h-[700px] rounded-full bg-foreground/[0.03] blur-[160px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <img
              src={isDark ? xfLogo : xfLogoDark}
              alt="XF"
              data-testid="img-xf-logo-hero"
              className="h-28 md:h-36 w-auto dark:drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[0.25em] text-foreground uppercase mb-5"
          >
            {t.home.releasingSoon}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="text-xs md:text-sm uppercase tracking-[0.55em] text-foreground/50 mb-3"
          >
            {t.home.unseenCollection}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.05 }}
            className="text-[11px] uppercase tracking-[0.35em] text-foreground/25 mb-16"
          >
            {t.home.by}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.25 }}
            className="flex gap-10 md:gap-20 mb-16"
          >
            {[
              { value: days, label: t.home.days },
              { value: hours, label: t.home.hours },
              { value: minutes, label: t.home.minutes },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <span
                  data-testid={`text-countdown-${label.toLowerCase()}`}
                  className="text-5xl md:text-7xl font-bold text-foreground tabular-nums leading-none"
                >
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-[9px] uppercase tracking-[0.45em] text-foreground/30">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="w-full max-w-sm mb-10"
          >
            {submitted ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs uppercase tracking-[0.4em] text-foreground/50 py-4"
              >
                {t.home.onList}
              </motion.p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex border border-foreground/15 hover:border-foreground/30 transition-colors duration-300"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.home.notifyPlaceholder}
                  data-testid="input-email-signup"
                  className="flex-1 bg-transparent text-foreground placeholder-foreground/25 px-5 py-3.5 text-[11px] uppercase tracking-widest outline-none min-w-0"
                  required
                />
                <button
                  type="submit"
                  data-testid="button-email-submit"
                  className="px-5 py-3.5 text-[10px] uppercase tracking-widest text-foreground/40 hover:text-foreground hover:bg-foreground/8 transition-all border-l border-foreground/15 whitespace-nowrap"
                >
                  {t.home.notifyBtn}
                </button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.75 }}
          >
            <Link href="/shop">
              <button
                data-testid="button-view-collection"
                className="text-[10px] uppercase tracking-[0.5em] text-foreground/35 hover:text-foreground/80 transition-colors duration-400 border-b border-foreground/15 hover:border-foreground/40 pb-1"
              >
                {t.home.viewCollection}
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-background border-t border-foreground/6 py-20 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.55em] text-foreground/25 mb-2">{t.home.fromTheDrop}</p>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-foreground">
                {t.home.availableNow}
              </h2>
            </div>
            <Link href="/shop">
              <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-foreground/35 hover:text-foreground transition-colors group">
                {t.home.shopAll}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {featured.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={`/shop/${product.id}`}>
                  <div className="group cursor-pointer">
                    <div className="aspect-[3/4] bg-foreground/4 overflow-hidden mb-4 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                        <div className="bg-foreground text-background text-[10px] uppercase tracking-[0.4em] py-3 text-center font-semibold">
                          {t.shop.viewProduct}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2 px-1">
                      <div>
                        <p className="text-sm text-foreground font-medium tracking-wide">{product.name}</p>
                        <p className="text-[11px] text-foreground/35 uppercase tracking-[0.3em] mt-1">
                          {product.category === "tshirt" ? t.shop.tshirts : product.category === "jogger" ? t.shop.jogger : "Hoodie"}
                        </p>
                      </div>
                      <p className="text-sm text-foreground font-semibold tracking-wide flex-shrink-0">€{product.price}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}

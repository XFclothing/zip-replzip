import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X, User, Settings, LogOut, LogIn, UserPlus, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLang } from "@/context/LanguageContext";
import xfLogo from "@assets/ChatGPT_Image_3._Mai_2026,_19_49_35_1777830790029.png";
import xfLogoDark from "/logo-dark.png";

export function Nav() {
  const [location] = useLocation();
  const { itemCount, setCartOpen } = useCart();
  const { user, role, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const [, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setUserMenuOpen(false);
    await signOut();
    navigate("/");
  }

  const baseLinks = [
    { href: "/", label: t.nav.home },
    { href: "/shop", label: t.nav.shop },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  const roleLink =
    role === "founder" ? { href: "/founder", label: t.nav.founder } :
    role === "worker" ? { href: "/worker", label: t.nav.staff } :
    null;

  const links = [...baseLinks, ...(roleLink ? [roleLink] : [])];

  const isDark = theme === "dark";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen
            ? "bg-background/95 backdrop-blur-sm border-b border-foreground/8 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 z-50">
            <img
              src={isDark ? xfLogo : xfLogoDark}
              alt="XF Logo"
              data-testid="img-nav-logo"
              className="h-8 w-auto transition-opacity duration-300"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-10">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-[0.35em] transition-colors duration-200 ${
                  location === link.href
                    ? "text-foreground font-semibold"
                    : "text-foreground/50 hover:text-foreground"
                } ${link.href === "/founder" ? "text-foreground/70" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-5 z-50">

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "de" : "en")}
              title={lang === "en" ? "Deutsch" : "English"}
              className="text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors font-semibold"
              aria-label="Toggle language"
            >
              {lang === "en" ? "DE" : "EN"}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? t.nav.lightMode : t.nav.darkMode}
              className="text-foreground/40 hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDark
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            {/* User dropdown */}
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors"
                aria-label="User menu"
              >
                <User className="w-4 h-4" />
                {user && profile?.name && (
                  <span className="text-[11px] uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground transition-colors max-w-[100px] truncate">
                    {profile.name.split(" ")[0]}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-8 w-52 bg-card border border-foreground/10 shadow-2xl"
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-foreground/8">
                          <p className="text-xs font-semibold text-foreground uppercase tracking-[0.25em] truncate">
                            {profile?.name || "Account"}
                          </p>
                          <p className="text-[10px] text-foreground/35 mt-0.5 truncate">{profile?.email || user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/account" onClick={() => setUserMenuOpen(false)}>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-[0.35em] text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors text-left">
                              <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                              {t.nav.settings}
                            </button>
                          </Link>
                          <div className="border-t border-foreground/6 my-1" />
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-[0.35em] text-foreground/50 hover:text-red-400/80 hover:bg-foreground/5 transition-colors text-left"
                          >
                            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                            {t.nav.signOut}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link href="/login" onClick={() => setUserMenuOpen(false)}>
                          <button className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-[0.35em] text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors text-left">
                            <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
                            {t.nav.signIn}
                          </button>
                        </Link>
                        <Link href="/login?mode=signup" onClick={() => setUserMenuOpen(false)}>
                          <button className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-[0.35em] text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors text-left">
                            <UserPlus className="w-3.5 h-3.5 flex-shrink-0" />
                            {t.nav.register}
                          </button>
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <button
              data-testid="button-cart"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              data-testid="button-mobile-menu"
              className="md:hidden text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center space-y-8"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-2xl uppercase tracking-[0.25em] transition-colors ${
                  location === link.href ? "text-foreground font-bold" : "text-foreground/40 hover:text-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-foreground/10 pt-6 flex flex-col items-center gap-4 w-40">
              {user ? (
                <>
                  <Link href="/account" className="text-foreground/40 text-sm uppercase tracking-widest hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}>
                    {t.nav.settings}
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                    className="text-foreground/30 text-sm uppercase tracking-widest hover:text-red-400/70 transition-colors"
                  >
                    {t.nav.signOut}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-foreground/40 text-sm uppercase tracking-widest hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}>
                    {t.nav.signIn}
                  </Link>
                  <Link href="/login?mode=signup" className="text-foreground/40 text-sm uppercase tracking-widest hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}>
                    {t.nav.register}
                  </Link>
                </>
              )}
              {user && (
                <Link href="/support" className="text-foreground/30 text-sm uppercase tracking-widest hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}>
                  {t.nav.support}
                </Link>
              )}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-foreground/30 text-sm uppercase tracking-widest hover:text-foreground transition-colors mt-2"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? t.nav.lightMode : t.nav.darkMode}
              </button>
              <button
                onClick={() => setLang(lang === "en" ? "de" : "en")}
                className="text-foreground/30 text-sm uppercase tracking-widest hover:text-foreground transition-colors"
              >
                {lang === "en" ? "DE" : "EN"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

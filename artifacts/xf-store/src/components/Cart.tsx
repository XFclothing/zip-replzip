import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";

export function Cart() {
  const { items, cartOpen, setCartOpen, removeFromCart, updateQuantity, totalPrice, itemCount } = useCart();
  const { t } = useLang();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-foreground/8 z-[200] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-foreground/8">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-foreground/50" />
                <span className="text-xs uppercase tracking-[0.4em] text-foreground/70">
                  {t.cart.title} ({itemCount})
                </span>
              </div>
              <button onClick={() => setCartOpen(false)} className="text-foreground/40 hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <ShoppingBag className="w-10 h-10 text-foreground/15" />
                  <p className="text-xs uppercase tracking-[0.4em] text-foreground/30">{t.cart.empty}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                      <div className="w-20 h-24 bg-foreground/5 flex-shrink-0 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium tracking-wide text-foreground truncate">{item.name}</h3>
                        <p className="text-xs text-foreground/40 uppercase tracking-widest mt-1">{t.cart.size}: {item.size}</p>
                        <p className="text-sm text-foreground/80 mt-1">€{item.price}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                            className="w-7 h-7 border border-foreground/15 flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm text-foreground w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                            className="w-7 h-7 border border-foreground/15 flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.size)}
                        className="text-foreground/25 hover:text-foreground transition-colors self-start mt-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 py-6 border-t border-foreground/8 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-[0.35em] text-foreground/50">{t.cart.total}</span>
                  <span className="text-lg font-bold text-foreground">€{totalPrice.toFixed(2)}</span>
                </div>
                <Link href="/checkout" onClick={() => setCartOpen(false)}>
                  <button className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:opacity-90 transition-opacity">
                    {t.cart.checkout}
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

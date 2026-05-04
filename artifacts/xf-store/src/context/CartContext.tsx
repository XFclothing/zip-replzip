import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  cartOpen: boolean;
  loading: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity">) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0);

  // Load cart from DB for a given user
  const loadCartFromDB = useCallback(async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", uid);
    if (!error && data) {
      const dbItems: CartItem[] = data.map((row: any) => ({
        productId: row.product_id,
        name: row.name,
        price: Number(row.price),
        size: row.size,
        quantity: row.quantity,
        image: row.image || "",
      }));
      setItems(dbItems);
    }
    setLoading(false);
  }, []);

  // Merge local items into DB when user logs in
  const mergeLocalToDB = useCallback(async (uid: string, localItems: CartItem[]) => {
    if (localItems.length === 0) return;
    const rows = localItems.map((i) => ({
      user_id: uid,
      product_id: i.productId,
      name: i.name,
      price: i.price,
      size: i.size,
      image: i.image,
      quantity: i.quantity,
    }));
    await supabase.from("cart_items").upsert(rows, {
      onConflict: "user_id,product_id,size",
    });
  }, []);

  // Watch auth state
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        await mergeLocalToDB(uid, items);
        await loadCartFromDB(uid);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id ?? null;
      const prev = userId;
      setUserId(uid);
      if (uid && uid !== prev) {
        // User just logged in — merge local cart then load from DB
        setItems((current) => {
          mergeLocalToDB(uid, current).then(() => loadCartFromDB(uid));
          return current;
        });
      } else if (!uid) {
        // User logged out — clear items
        setItems([]);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addToCart(item: Omit<CartItem, "quantity">) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId && i.size === item.size);
      if (existing) {
        const updated = prev.map((i) =>
          i.productId === item.productId && i.size === item.size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
        if (userId) syncItemToDB(userId, { ...existing, quantity: existing.quantity + 1 });
        return updated;
      }
      const newItem = { ...item, quantity: 1 };
      if (userId) syncItemToDB(userId, newItem);
      return [...prev, newItem];
    });
    setCartOpen(true);
  }

  async function removeFromCart(productId: string, size: string) {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
    if (userId) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("size", size);
    }
  }

  async function updateQuantity(productId: string, size: string, quantity: number) {
    if (quantity <= 0) {
      await removeFromCart(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.size === size ? { ...i, quantity } : i
      )
    );
    if (userId) {
      await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("size", size);
    }
  }

  async function clearCart() {
    setItems([]);
    if (userId) {
      await supabase.from("cart_items").delete().eq("user_id", userId);
    }
  }

  return (
    <CartContext.Provider value={{ items, itemCount, totalPrice, cartOpen, loading, setCartOpen, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

async function syncItemToDB(userId: string, item: CartItem) {
  await supabase.from("cart_items").upsert(
    {
      user_id: userId,
      product_id: item.productId,
      name: item.name,
      price: item.price,
      size: item.size,
      image: item.image,
      quantity: item.quantity,
    },
    { onConflict: "user_id,product_id,size" }
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

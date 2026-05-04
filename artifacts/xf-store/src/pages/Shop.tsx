import React from "react";
import { motion } from "framer-motion";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { useLang } from "@/context/LanguageContext";

export default function Shop() {
  const { t } = useLang();

  const categories = [
    { key: "hoodie", label: t.shop.hoodies },
    { key: "tshirt", label: t.shop.tshirts },
    { key: "jogger", label: t.shop.jogger },
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container mx-auto px-6 lg:px-12">

        <div className="mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.5em] text-muted-foreground mb-4"
          >
            {t.shop.collection}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold uppercase tracking-widest"
          >
            {t.shop.drop}
          </motion.h1>
        </div>

        {categories.map((cat, catIndex) => {
          const catProducts = products.filter((p) => p.category === cat.key);
          if (catProducts.length === 0) return null;
          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: catIndex * 0.1 }}
              className="mb-24"
            >
              <div className="flex items-center gap-6 mb-12">
                <h2 className="text-xs uppercase tracking-[0.45em] text-muted-foreground">
                  {cat.label}
                </h2>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
                {catProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { t } = useLang();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const product = products.find((p) => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl tracking-widest uppercase">{t.product.notFound}</h1>
      </div>
    );
  }

  const backAngleImage = id === "xf-hoodie-black" ? "/images/product-hoodie-black-back.png" : product.image;

  function handleAddToCart() {
    if (product!.sizes.length > 0 && !selectedSize) {
      alert(t.product.selectSize);
      return;
    }
    addToCart({
      productId: product!.id,
      name: product!.name,
      price: product!.price,
      size: selectedSize || "ONE SIZE",
      image: product!.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="aspect-[3/4] bg-muted relative"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="aspect-[3/4] bg-muted relative"
            >
              <img
                src={backAngleImage}
                alt={`${product.name} alternate view`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          <div className="flex flex-col lg:sticky lg:top-32 h-fit">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest mb-4">
                {product.name}
              </h1>
              <p className="text-xl tracking-wider mb-10">€{product.price}</p>

              <div className="space-y-8 mb-10">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{t.product.description}</h3>
                  <p className="leading-relaxed text-foreground/80 font-light">
                    {product.description}
                  </p>
                </div>

                {product.sizes.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{t.product.size}</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`h-12 w-12 md:w-16 border flex items-center justify-center text-sm uppercase tracking-wider transition-all
                            ${selectedSize === size
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-foreground border-border hover:border-primary/50"
                            }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full rounded-none h-14 uppercase tracking-widest text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                onClick={handleAddToCart}
              >
                {added ? t.product.addedToCart : t.product.addToCart}
              </Button>

              <div className="mt-12 space-y-4 border-t border-border pt-8 text-xs uppercase tracking-widest text-muted-foreground">
                <p>{t.product.freeShipping}</p>
                <p>{t.product.returnPolicy}</p>
                <p>{t.product.designedIn}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

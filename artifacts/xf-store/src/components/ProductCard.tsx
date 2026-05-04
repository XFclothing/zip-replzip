import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Color {
  name: string;
  value: string;
  image: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    colors?: Color[];
  };
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const [, navigate] = useLocation();
  const [hoveredColor, setHoveredColor] = useState<number | null>(null);

  const colors = product.colors;
  const displayImage = colors && hoveredColor !== null ? colors[hoveredColor].image : product.image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex flex-col gap-4"
    >
      <Link href={`/shop/${product.id}`} className="aspect-[3/4] relative overflow-hidden bg-muted cursor-pointer">
        <motion.img
          key={displayImage}
          src={displayImage}
          alt={product.name}
          className="object-cover w-full h-full transition-all duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <Link href={`/shop/${product.id}`} className="font-medium text-lg tracking-wide hover:underline underline-offset-4">
            {product.name}
          </Link>
          <span className="text-muted-foreground">€{product.price}</span>
        </div>

        {/* Color swatches */}
        {colors && colors.length > 0 && (
          <div className="flex gap-2 items-center">
            {colors.map((color, idx) => (
              <button
                key={color.name}
                title={color.name}
                onMouseEnter={() => setHoveredColor(idx)}
                onMouseLeave={() => setHoveredColor(null)}
                onClick={() => navigate(`/shop/${product.id}`)}
                className="w-4 h-4 rounded-full border border-border hover:scale-125 transition-transform duration-200"
                style={{ backgroundColor: color.value }}
              />
            ))}
            <span className="text-xs text-muted-foreground tracking-wide ml-1">
              {colors.length} colors
            </span>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full uppercase tracking-widest rounded-none border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          onClick={() => navigate(`/shop/${product.id}`)}
        >
          Select Size
        </Button>
      </div>
    </motion.div>
  );
}

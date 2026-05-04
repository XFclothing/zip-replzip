import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";

type ColorVariant = {
  name: string;
  value: string;
  image: string;
  gallery?: string[];
  backImage?: string;
};

function InfoAccordion({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-xs uppercase tracking-widest text-foreground hover:text-muted-foreground transition-colors"
      >
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ul className="pb-5 space-y-2">
              {items.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground font-light leading-relaxed flex gap-2">
                  <span className="mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { addToCart } = useCart();
  const { t, lang } = useLang();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });

  const product = products.find((p) => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedSize(null);
    setSelectedColorIndex(0);
    setActiveSlide(0);
  }, [id]);

  useEffect(() => {
    setActiveSlide(0);
    emblaApi?.scrollTo(0);
  }, [selectedColorIndex, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl tracking-widest uppercase">{t.product.notFound}</h1>
      </div>
    );
  }

  const colors = (product as any).colors as ColorVariant[] | undefined;
  const activeColor = colors ? colors[selectedColorIndex] : null;
  const gallery: string[] = activeColor?.gallery
    ?? (activeColor ? [activeColor.image, activeColor.backImage ?? activeColor.image] : [product.image]);
  const mainImage = activeColor ? activeColor.image : product.image;
  const cartName = colors ? `${product.name} — ${activeColor!.name}` : product.name;

  function handleAddToCart() {
    if (product!.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart({
      productId: product!.id + (activeColor ? `-${activeColor.name.toLowerCase()}` : ""),
      name: cartName,
      price: product!.price,
      size: selectedSize || "ONE SIZE",
      image: mainImage,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

          {/* Gallery */}
          <div className="flex flex-col gap-4">
            {/* Back Arrow */}
            <button
              onClick={() => navigate("/shop")}
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Main Carousel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedColorIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden"
              >
                <div ref={emblaRef} className="overflow-hidden">
                  <div className="flex">
                    {gallery.map((img, idx) => (
                      <div
                        key={idx}
                        className="flex-none w-full aspect-[3/4] bg-muted relative overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`${cartName} view ${idx + 1}`}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prev/Next buttons */}
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={scrollPrev}
                      disabled={activeSlide === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all disabled:opacity-20"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={scrollNext}
                      disabled={activeSlide === gallery.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all disabled:opacity-20"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Dot indicators */}
                {gallery.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {gallery.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => emblaApi?.scrollTo(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          activeSlide === idx ? "bg-foreground w-4" : "bg-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Thumbnail strip */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => emblaApi?.scrollTo(idx)}
                    className={`flex-none w-16 aspect-[3/4] bg-muted overflow-hidden border-2 transition-all ${
                      activeSlide === idx ? "border-foreground" : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col lg:sticky lg:top-32 h-fit">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest mb-2">
                {product.name}
              </h1>
              {activeColor && (
                <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-2">
                  {activeColor.name}
                </p>
              )}
              <p className="text-xl tracking-wider mb-10">€{product.price}</p>

              <div className="space-y-8 mb-10">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{t.product.description}</h3>
                  <p className="leading-relaxed text-foreground/80 font-light">
                    {product.description}
                  </p>
                </div>

                {/* Color picker */}
                {colors && colors.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Color</h3>
                    <div className="flex gap-3">
                      {colors.map((color, idx) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColorIndex(idx)}
                          title={color.name}
                          className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                            selectedColorIndex === idx
                              ? "border-foreground scale-110"
                              : "border-transparent hover:border-foreground/40"
                          }`}
                          style={{
                            backgroundColor: color.value,
                            boxShadow: color.name === "White" ? "inset 0 0 0 1px #ccc" : undefined,
                          }}
                        >
                          {selectedColorIndex === idx && (
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                              {color.name}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size picker */}
                {product.sizes.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{t.product.size}</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => { setSelectedSize(size); setSizeError(false); }}
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

              {sizeError && (
                <div className="flex items-center gap-3 border border-foreground/20 bg-foreground/5 px-4 py-3">
                  <span className="text-foreground/50 text-lg leading-none">↑</span>
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/70">
                    {lang === "de" ? "Bitte Größe auswählen" : "Please select a size"}
                  </p>
                </div>
              )}

              <Button
                size="lg"
                className="w-full rounded-none h-14 uppercase tracking-widest text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                onClick={handleAddToCart}
              >
                {added ? t.product.addedToCart : t.product.addToCart}
              </Button>

              {/* Info Accordion */}
              <div className="mt-10 border-t border-border">
                {[
                  {
                    title: lang === "de" ? "Versand & Lieferzeit" : "Shipping & Delivery",
                    content: lang === "de"
                      ? [
                          "Lieferzeit: 1–2 Wochen nach Bestelleingang.",
                          "Kostenloser Versand ab €150.",
                          "Wir versenden aus Deutschland — international verfügbar.",
                          "Tracking-Link wird per E-Mail gesendet.",
                        ]
                      : [
                          "Delivery time: 1–2 weeks after order is placed.",
                          "Free shipping on orders over €150.",
                          "We ship from Germany — international shipping available.",
                          "Tracking link sent via email after dispatch.",
                        ],
                  },
                  {
                    title: lang === "de" ? "Rückgabe & Rückerstattung" : "Returns & Refunds",
                    content: lang === "de"
                      ? [
                          "14-tägiges Rückgaberecht ab Erhalt der Ware.",
                          "Artikel müssen ungetragen und ungewaschen zurückgesendet werden.",
                          "Rückerstattung innerhalb von 5–7 Werktagen nach Eingang.",
                          "Kontakt: support@xfclothing.com",
                        ]
                      : [
                          "14-day return window from date of delivery.",
                          "Items must be unworn and unwashed.",
                          "Refunds processed within 5–7 business days of receipt.",
                          "Contact us at: support@xfclothing.com",
                        ],
                  },
                  {
                    title: lang === "de" ? "Produktinfos" : "Product Info",
                    content: lang === "de"
                      ? [
                          "Im Studio entworfen — limitierte Auflagen.",
                          "100 % Premium Heavy Cotton.",
                          "Oversized Fit — für eine Größe größer bestellen empfohlen.",
                          "Maschinenwaschbar bei 30 °C, links waschen.",
                        ]
                      : [
                          "Designed in-studio — limited production runs.",
                          "100% Premium Heavy Cotton.",
                          "Oversized fit — consider sizing up.",
                          "Machine wash at 30°C, wash inside out.",
                        ],
                  },
                ].map((item, i) => (
                  <InfoAccordion key={i} title={item.title} items={item.content} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

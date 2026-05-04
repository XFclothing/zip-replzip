import React from "react";
import { motion } from "framer-motion";

export default function Collections() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-24 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-8xl font-bold uppercase tracking-widest mb-6"
          >
            FX Drop
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground uppercase tracking-widest text-sm max-w-xl mx-auto"
          >
            Campaign 001. The foundation of the new wardrobe.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          
          {/* Large Feature */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="col-span-1 md:col-span-8 md:col-start-3 mb-16"
          >
            <div className="aspect-[4/5] md:aspect-video w-full bg-muted relative overflow-hidden group">
              <img 
                src="/images/campaign-1.png" 
                alt="Campaign Shot 1" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
            <div className="mt-6 flex justify-between items-center border-b border-border pb-4">
              <span className="text-xs uppercase tracking-widest">Look 01</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Architectural Silhouette</span>
            </div>
          </motion.div>

          {/* Asymmetric Layout */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="col-span-1 md:col-span-5 md:mt-32"
          >
            <div className="aspect-[3/4] w-full bg-muted relative overflow-hidden group">
              <img 
                src="/images/campaign-2.png" 
                alt="Campaign Shot 2" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
            <div className="mt-6 border-b border-border pb-4">
              <span className="text-xs uppercase tracking-widest">Look 02</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="col-span-1 md:col-span-6 md:col-start-7 flex flex-col justify-center mt-16 md:mt-0"
          >
            <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-widest mb-8 leading-tight">
              Tension <br/> Between <br/> Form & Void
            </h2>
            <p className="text-muted-foreground leading-relaxed font-light mb-12 max-w-md">
              The Unseen Drop explores the relationship between heavy materials and minimal branding. 
              We stripped away everything decorative to reveal the pure architecture of the garments. 
              Built with 400gsm cotton and tactical hardware, these pieces are designed to age beautifully.
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

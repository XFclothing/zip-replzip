import React from "react";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">

        {/* Section 1: About XF */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-32"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-8">01</p>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest mb-12 leading-tight">
            About XF
          </h1>
          <div className="w-full h-[1px] bg-border mb-12" />
          <p className="text-xl md:text-2xl font-light leading-loose text-foreground/80 max-w-2xl">
            XF was founded by Xavier and Fynn.<br />
            A new generation of streetwear.<br />
            Minimal. Bold. Unseen.
          </p>
        </motion.div>

        {/* Section 2: Who Are We */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-8">02</p>
          <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-widest mb-12 leading-tight">
            Who Are We
          </h2>
          <div className="w-full h-[1px] bg-border mb-12" />
          <div className="space-y-8 text-lg md:text-xl font-light leading-loose text-foreground/70 max-w-2xl">
            <p>
              XF was founded by Xavier and Fynn, two young creators building something of their own.
            </p>
            <p>
              At just 15, we decided to turn our vision into reality.
            </p>
            <p>
              XF is more than clothing — it's a statement.<br />
              A new generation of streetwear.<br />
              Minimal. Bold. Unseen.
            </p>
          </div>
        </motion.div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="border-y border-border py-20 text-center"
        >
          <p className="text-2xl md:text-4xl uppercase tracking-[0.2em] font-bold leading-relaxed">
            Clean. Bold. Unseen.
          </p>
        </motion.div>

      </div>
    </div>
  );
}

import React from "react";
import { Link } from "wouter";
import { SiInstagram, SiTiktok } from "react-icons/si";
import xfLogo from "@assets/ChatGPT_Image_3._Mai_2026,_19_49_35_1777830790029.png";
import { useLang } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-background border-t border-foreground/8 mt-24 py-16">
      <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
        <div className="flex flex-col gap-5">
          <Link href="/">
            <img src={xfLogo} alt="XF Logo" data-testid="img-footer-logo" className="h-9 w-auto dark:invert-0 invert" />
          </Link>
          <p className="text-foreground/25 text-[11px] uppercase tracking-[0.35em] max-w-[220px] leading-relaxed">
            {t.footer.tagline}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12 md:gap-24">
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">{t.footer.links}</h4>
            <div className="flex flex-col gap-3 text-[11px] uppercase tracking-[0.3em] text-foreground/30">
              <Link href="/shop" className="hover:text-foreground transition-colors">{t.footer.shop}</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">{t.footer.about}</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">{t.footer.contact}</Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">{t.footer.social}</h4>
            <div className="flex gap-5 text-foreground/30">
              <a href="https://www.instagram.com/xfclothing2026/" target="_blank" rel="noopener noreferrer" data-testid="link-instagram" className="hover:text-foreground transition-colors">
                <SiInstagram className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@xf.clothing" target="_blank" rel="noopener noreferrer" data-testid="link-tiktok" className="hover:text-foreground transition-colors">
                <SiTiktok className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 mt-14 pt-8 border-t border-foreground/8 flex items-center justify-between">
        <p className="text-[10px] text-foreground/20 uppercase tracking-[0.35em]">{t.footer.copyright}</p>
      </div>
    </footer>
  );
}

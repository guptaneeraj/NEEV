import { motion } from "framer-motion";
import { Fireflies } from "./Particles";

export function Footer() {
  return (
    <section className="relative h-auto lg:h-screen flex flex-col items-center justify-center overflow-hidden bg-[#FAF3E0] py-16 lg:py-0" id="about">
      {/* Background Texture matching the rest of the site */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="footer-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1F4D2C" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      <Fireflies count={15} />

      <div className="relative z-10 w-full max-w-[1450px] mx-auto px-6 lg:px-12 flex flex-col items-center justify-center">

        {/* Top Branding - Integrated with the rest of the site's tone */}
        <div className="flex flex-col items-center text-center mb-12 lg:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-gold/50 shadow-xl bg-white p-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <img src="/assets/neev-logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </motion.div>
            <span className="text-3xl lg:text-5xl font-black tracking-widest text-[#1F4D2C]" style={{ fontFamily: "var(--font-heading)" }}>NEEV</span>
          </div>
          <p className="text-[var(--color-gold)] text-[10px] lg:text-sm tracking-[0.5em] uppercase font-black mb-4">The Foundation of Confident Parenting</p>
          <div className="w-32 h-1.5 bg-[#C9A84C] opacity-20 rounded-full" />
        </div>

        {/* The Central Circle of Trust - Unified Layout */}
        <div className="w-full max-w-5xl bg-white/40 backdrop-blur-2xl rounded-[4rem] border-2 border-[#C9A84C]/15 shadow-2xl p-10 lg:p-16 flex flex-col items-center gap-12 relative">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 w-full text-center">
             {/* Transparency */}
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Architecture</p>
                <h4 className="text-xl font-black text-[#1F4D2C] uppercase tracking-tighter">Clinical Science</h4>
                <p className="text-[13px] text-[#6B7F71] font-bold italic leading-relaxed">
                  Engineered on WHO, AAP, and IAP protocols for deep developmental accuracy.
                </p>
             </div>

             {/* Privacy */}
             <div className="space-y-4 pt-10 md:pt-0 border-t md:border-t-0 md:border-x border-[#C9A84C]/10 px-0 md:px-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Security</p>
                <h4 className="text-xl font-black text-[#1F4D2C] uppercase tracking-tighter">On-Device AI</h4>
                <p className="text-[13px] text-[#6B7F71] font-bold italic leading-relaxed">
                  Your logs never leave your phone. Zero-cloud architecture for ultimate family privacy.
                </p>
             </div>

             {/* Contact */}
             <div className="space-y-4 pt-10 md:pt-0 border-t md:border-t-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Contact</p>
                <div className="flex flex-col gap-2">
                   <a href="mailto:support@neevios.com" className="text-base font-black text-[#1F4D2C] hover:text-gold transition-colors">support@neevios.com</a>
                   <a href="https://wa.me/917877495121" className="text-[12px] font-bold text-[#6B7F71] uppercase tracking-widest hover:text-gold transition-colors">+91 78774 95121</a>
                </div>
             </div>
          </div>

          {/* Interactive Stack bar inside the box */}
          <div className="w-full pt-10 border-t border-[#C9A84C]/10 flex flex-wrap justify-center gap-6">
             {["Privacy Policy", "Terms of Service", "Clinical Integrity", "Beta Access"].map((link) => (
                <a key={link} href="#" className="flex items-center gap-2 px-4 py-2 rounded-full bg-forest/5 hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-all">
                   <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                   <span className="text-[10px] font-black text-[#1F4D2C] uppercase tracking-[0.1em]">{link}</span>
                </a>
             ))}
          </div>
        </div>

        {/* Corporate Footer Note */}
        <div className="mt-16 text-center space-y-4">
           <p className="text-[10px] font-black text-[#1F4D2C]/40 uppercase tracking-[0.4em]">Crafted with precision in Gurugram</p>
           <div className="flex flex-wrap justify-center items-center gap-4 text-[#6B7F71]/60 font-bold text-[10px] uppercase tracking-widest">
              <span>© 2025 Ecoraa Vision Pvt. Ltd.</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/40" />
              <span>UDYAM-HR-05-0180497</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/40" />
              <span>All Rights Reserved</span>
           </div>
        </div>
      </div>
    </section>
  );
}



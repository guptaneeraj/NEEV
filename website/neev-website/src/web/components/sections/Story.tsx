import { motion } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";

export function Story() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative min-h-[90vh] flex items-center py-10 lg:py-16 overflow-hidden bg-[#FAF3E0]" id="about" ref={ref}>
      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-6 lg:px-12">
        <motion.div
          className="relative p-10 md:p-14 lg:p-16 rounded-[3.5rem] overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.4)",
            backdropFilter: "blur(20px)",
            border: "2px solid rgba(201,168,76,0.15)",
            boxShadow: "0 20px 40px -10px rgba(31,77,44,0.05)"
          }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative Neurons */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-forest/5 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Main Narrative Column */}
            <div className="lg:col-span-8 space-y-8 text-[#6B7F71] leading-relaxed text-[15px] md:text-lg lg:text-[1.2rem] font-medium"
              style={{ fontFamily: "var(--font-body)" }}>
              <p>
                I kept noticing something that didn't sit right with me — most parents are raising their children
                without really understanding what the child actually needs at each stage. They're trying, but it's
                mostly guesswork. There's no clear direction, no structured guidance — just reacting day by day.
              </p>
              <p>
                When parents look for help, they usually find two sources. One is doctors, who focus on the clinical
                side — and rightly so — but that's limited to short, occasional visits. The rest of the time, guidance
                comes from family, friends, or traditional advice, which isn't always accurate or relevant.
              </p>
              <p className="hidden md:block">
                What's missing is a system that actually tracks a child's development continuously and tells parents
                what to do at the right time. Because by the time many parents reach a specialist with a
                concern, the most critical window of early development has partially passed.
              </p>
              <div className="pt-4">
                <p className="text-[#1F4D2C] font-black italic text-xl lg:text-2xl leading-snug"
                  style={{ fontFamily: "var(--font-tagline)" }}>
                  That gap — between daily parenting and clinical intervention — is what made NEEV real for us.
                </p>
              </div>

              {/* Branding moved to end of narrative column for one-page fit */}
              <div className="pt-8 border-t border-gold/10 mt-10">
                <div className="flex items-center gap-5">
                    <div className="relative w-14 h-14 lg:w-16 lg:h-16 shrink-0">
                        <div className="absolute inset-0 bg-gold/20 rounded-full animate-pulse blur-xl" />
                        <motion.div
                          className="relative w-full h-full rounded-full overflow-hidden border-2 border-gold/50 shadow-2xl bg-white p-1"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        >
                            <img src="/assets/neev-logo.jpeg" alt="Neev Logo" className="w-full h-full object-cover rounded-full" />
                        </motion.div>
                    </div>
                    <div>
                        <p className="text-[var(--color-gold)] text-[10px] tracking-[0.4em] uppercase font-black"
                            style={{ fontFamily: "var(--font-body)" }}>
                            Our Narrative
                        </p>
                        <h2 className="text-xl lg:text-2xl font-black text-[#1F4D2C] uppercase tracking-tighter"
                            style={{ fontFamily: "var(--font-heading)" }}>
                            Why we built <span className="text-gradient-gold">NEEV</span>
                        </h2>
                    </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8 pt-4">
                {/* Architecture / Founders */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold border-b border-gold/10 pb-3">The Architecture</p>
                    {[
                    { name: "Neeraj Gupta", role: "Co-founder & CTO" },
                    { name: "Rahul Yadav", role: "Co-founder & COO" },
                    ].map((founder) => (
                    <div key={founder.name} className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black bg-forest/5 text-[#1F4D2C] border border-forest/10 group-hover:bg-gold/10 group-hover:border-gold/30 transition-all duration-300">
                        {founder.name.charAt(0)}
                        </div>
                        <div>
                        <p className="text-sm font-black text-[#1F4D2C] uppercase tracking-tight"
                            style={{ fontFamily: "var(--font-heading)" }}>
                            {founder.name}
                        </p>
                        <p className="text-[10px] font-bold text-gold uppercase tracking-widest"
                            style={{ fontFamily: "var(--font-body)" }}>
                            {founder.role}
                        </p>
                        </div>
                    </div>
                    ))}
                </div>

                <div className="pt-6 space-y-3">
                    {["Ecoraa Vision Pvt. Ltd.", "Gurugram, India", "Startup India Registered"].map((tag, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-forest/5 border border-forest/10 text-[10px] font-black text-[#6B7F71] uppercase tracking-wider">
                           <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                           {tag}
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

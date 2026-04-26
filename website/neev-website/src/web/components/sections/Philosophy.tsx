import { motion } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";

const PILLARS = [
  {
    title: "From Intent to Responsibility",
    content: "Reliable guidance requires systems that are continuously improving, scientifically validated, and operationally sustainable. We made the mission executable.",
    icon: "🎯"
  },
  {
    title: "An Executable System",
    content: "Not content. Not opinion. A structured system delivering real-time, contextual guidance grounded in data, not assumptions.",
    icon: "⚙️"
  },
  {
    title: "Eliminating Guesswork",
    content: "We remove the layer of reactive confusion entirely, replacing it with structured, evidence-based, and developmentally appropriate actions.",
    icon: "🛡️"
  },
  {
    title: "Living Developmental Record",
    content: "Every interaction contributes to an evolving profile, providing professionals with longitudinal clarity for better diagnosis and intervention.",
    icon: "📈"
  }
];

export function Philosophy() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative min-h-[110vh] py-12 lg:py-20 overflow-hidden bg-[#FAF3E0]" id="philosophy" ref={ref}>
      {/* Background Neural Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="philosophy-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#philosophy-grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row-reverse gap-10 lg:gap-16 items-start">

          {/* Right Column: Manifesto (Shifted from Left) */}
          <motion.div
            className="flex-1 lg:sticky lg:top-0 space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-4">
              <p className="text-[var(--color-gold)] text-[clamp(10px,1.2vh,14px)] tracking-[0.4em] uppercase font-black" style={{ fontFamily: "var(--font-body)" }}>
                Our Philosophy
              </p>
              <h2 className="text-[clamp(32px,6vh,72px)] font-black text-[#1F4D2C] leading-[0.85] uppercase tracking-tighter" style={{ fontFamily: "var(--font-heading)" }}>
                Built on belief.<br />
                <span className="text-[#C9A84C]">Powered by precision.</span>
              </h2>
            </div>

            <div className="space-y-8 text-[#2D5F3F] font-bold leading-relaxed italic text-[clamp(16px,2.2vh,22px)]" style={{ fontFamily: "var(--font-tagline)" }}>
              <p>
                We started with a problem: parenting today is fragmented, driven by opinion and reactive guesswork.
              </p>
              <p>
                The first three years shape 70% of a child’s brain development. We built NEEV to close that structural gap with clinically aligned technology.
              </p>
            </div>

            {/* Position Card Integrated Here (Matching Science layout) */}
            <motion.div
               className="bg-[#1F4D2C] text-white p-8 lg:p-10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden border-l-8 border-[#C9A84C]"
               initial={{ opacity: 0, y: 20 }}
               animate={isVisible ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.6 }}
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 blur-2xl" />
               <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Our Position</h3>
               <p className="text-base lg:text-lg text-white/80 italic font-medium leading-relaxed">
                 "We are building a system that is clinically aligned and technically rigorous. Accessible—but not diluted."
               </p>
               <div className="pt-6 border-t border-white/10">
                  <ul className="flex flex-wrap gap-6">
                     {["Improve outcomes", "Clarity", "Collaboration"].map((v, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                           <span className="text-gold text-lg">✦</span>
                           <span className="text-[10px] font-black uppercase tracking-widest">{v}</span>
                        </li>
                     ))}
                  </ul>
               </div>
            </motion.div>
          </motion.div>

          {/* Left Column: Pillars (Shifted from Right) */}
          <div className="flex-1 grid grid-cols-1 gap-6 w-full">
            {PILLARS.map((p, i) => (
              <motion.div
                key={i}
                className="bg-white/50 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border-2 border-forest/5 hover:border-gold/30 transition-all duration-500 shadow-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex gap-7 items-start">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#A8D5BA]/20 flex items-center justify-center text-2xl border border-[#A8D5BA]/30">
                    {p.icon}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-[#1F4D2C] uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                      {p.title}
                    </h3>
                    <p className="text-[clamp(12px,1.5vh,14px)] text-[#6B7F71] leading-relaxed font-bold">
                      {p.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

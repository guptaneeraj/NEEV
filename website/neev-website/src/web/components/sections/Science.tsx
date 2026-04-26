import { motion } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";

const CARDS = [
  {
    title: "500+ Research Papers",
    description: "Neev’s intelligence layer is built on a curated body of over 500 research papers spanning early childhood development, neuroscience, pediatrics, and behavioral science. These studies are indexed and processed through a semantic retrieval system, allowing the platform to access contextually relevant knowledge rather than static information.",
    icon: "📚",
    accent: "bg-blue-500/10 border-blue-500/20 text-blue-700"
  },
  {
    title: "1000+ Developmental Activities",
    description: "Neev includes a structured library of over 1000 developmental activities designed across key domains such as gross motor, fine motor, sensory integration, language development, and early cognition. Each activity is mapped to specific developmental milestones and categorized by energy level, age group, and skill focus.",
    icon: "🧩",
    accent: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
  },
  {
    title: "156-Week Developmental Curriculum",
    description: "The 156-week curriculum provides a continuous, stage-wise developmental framework from birth to 3 years—covering the most critical window of early brain development. Built on milestone progression models and pediatric guidelines, this curriculum structures development into weekly phases.",
    icon: "📋",
    accent: "bg-amber-500/10 border-amber-500/20 text-amber-700"
  }
];

export function Science() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative min-h-[110vh] flex flex-col items-center justify-start py-12 lg:py-20 overflow-hidden bg-[#FAF3E0]" id="science" ref={ref}>

      {/* Background Neural Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row-reverse gap-10 lg:gap-16 items-start">

          {/* Right Column: Scientific Manifesto (Shifted from Left) */}
          <motion.div
            className="flex-1 space-y-6 lg:sticky lg:top-0"
            initial={{ opacity: 0, x: 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div>
                <p className="text-[var(--color-gold)] text-[clamp(10px,1.2vh,14px)] tracking-[0.4em] uppercase font-black mb-3" style={{ fontFamily: "var(--font-body)" }}>
                The Methodology
                </p>
                <h2 className="text-[clamp(32px,6vh,72px)] font-black text-[#1F4D2C] leading-[0.85] uppercase tracking-tighter mb-8" style={{ fontFamily: "var(--font-heading)" }}>
                Built on Research.<br />
                <span className="text-[#C9A84C]">Powered by Love.</span>
                </h2>
            </div>

            <div className="space-y-8 max-w-2xl">
              <p className="text-[clamp(16px,2.2vh,22px)] text-[#2D5F3F] font-bold leading-relaxed italic" style={{ fontFamily: "var(--font-tagline)" }}>
                Every recommendation in Neev is grounded in structured, peer-reviewed developmental science drawn from globally recognized frameworks such as the WHO, AAP, and IAP.
              </p>

              <p className="text-[clamp(13px,1.6vh,17px)] text-[#6B7F71] leading-relaxed font-medium">
                Neev continuously interprets research across multiple domains—including cognitive, motor, nutrition, and sleep science—mapping it against each child’s real-time data to transform knowledge into practical, evolving guidance.
              </p>

              <div className="pt-10 border-t border-forest/10 flex flex-wrap gap-10">
                <div className="space-y-2">
                   <p className="text-3xl font-black text-[#1F4D2C]">WHO</p>
                   <p className="text-[10px] font-black text-[#C9A84C] tracking-widest uppercase">Standards</p>
                </div>
                <div className="space-y-2">
                   <p className="text-3xl font-black text-[#1F4D2C]">AAP</p>
                   <p className="text-[10px] font-black text-[#C9A84C] tracking-widest uppercase">Guidelines</p>
                </div>
                <div className="space-y-2">
                   <p className="text-3xl font-black text-[#1F4D2C]">IAP</p>
                   <p className="text-[10px] font-black text-[#C9A84C] tracking-widest uppercase">Protocols</p>
                </div>
              </div>

              {/* Scientific Footer Note (Shifted below right section) */}
                <motion.div
                className="p-8 rounded-[2rem] bg-[#1F4D2C] text-white shadow-xl mt-10 border-l-8 border-[#C9A84C]"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 }}
                >
                <p className="text-[clamp(13px,1.6vh,15px)] font-bold italic leading-relaxed opacity-90">
                    "Our intelligence layer adapts insights based on the child's current developmental stage, observed patterns, and specific needs—ensuring that recommendations are grounded in validated research."
                </p>
                </motion.div>
            </div>
          </motion.div>

          {/* Left Column: Scientific Pillars (Shifted from Right) */}
          <div className="flex-1 grid grid-cols-1 gap-6 w-full">
            {CARDS.map((card, i) => (
              <motion.div
                key={i}
                className="group relative bg-white/50 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border-2 border-forest/5 hover:border-gold/30 transition-all duration-500 shadow-xl shadow-forest/[0.02]"
                initial={{ opacity: 0, x: -30 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-start gap-7">
                   <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${card.accent}`}>
                      {card.icon}
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-xl lg:text-2xl font-black text-[#1F4D2C] uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                         {card.title}
                      </h3>
                      <p className="text-[clamp(12px,1.5vh,14px)] text-[#6B7F71] leading-relaxed font-bold">
                         {card.description}
                      </p>
                   </div>
                </div>

                {/* Animated Connection Dot */}
                <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-gold/40 animate-pulse" />
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

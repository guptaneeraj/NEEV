import { motion } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";

export function PulseShowcase() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative min-h-screen flex items-center justify-center py-12 lg:py-16 overflow-hidden bg-[#FAF3E0]" ref={ref}>
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — phones */}
          <motion.div
            className="flex gap-4 md:gap-6 justify-center scale-90 md:scale-100"
            initial={{ opacity: 0, x: -40 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            {/* Morning phone */}
            <div className="phone-mockup">
              <div className="phone-mockup-inner animate-float" style={{ animationDelay: "0s" }}>
                <div className="relative w-[150px] md:w-[200px] rounded-[2rem] overflow-hidden shadow-xl"
                  style={{ border: "6px solid #1a1a1a", background: "#1a1a1a" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-[#1a1a1a] rounded-b-xl z-10" />
                  <img src="/assets/pulse-summary.jpeg" alt="Morning Pulse" className="w-full" loading="lazy" />
                </div>
                <p className="text-center text-[10px] md:text-xs mt-3 text-[var(--color-warmgrey)]"
                  style={{ fontFamily: "var(--font-tagline)", fontStyle: "italic" }}>
                  🌅 Morning Entry
                </p>
              </div>
            </div>
            {/* Evening phone */}
            <div className="phone-mockup mt-8 md:mt-12">
              <div className="phone-mockup-inner animate-float" style={{ animationDelay: "1s" }}>
                <div className="relative w-[150px] md:w-[200px] rounded-[2rem] overflow-hidden shadow-xl"
                  style={{ border: "6px solid #1a1a1a", background: "#1a1a1a" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-[#1a1a1a] rounded-b-xl z-10" />
                  <img src="/assets/the-pulse.jpeg" alt="Evening Pulse" className="w-full" loading="lazy" />
                </div>
                <p className="text-center text-[10px] md:text-xs mt-3 text-[var(--color-warmgrey)]"
                  style={{ fontFamily: "var(--font-tagline)", fontStyle: "italic" }}>
                  🌙 Evening Review
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right — content */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: 40 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-[var(--color-gold)] text-sm tracking-[0.3em] uppercase mb-3"
              style={{ fontFamily: "var(--font-body)" }}>
              The Pulse
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-forest-deep)] mb-6"
              style={{ fontFamily: "var(--font-heading)" }}>
              The first app that tracks{" "}
              <span className="text-gradient-gold">you</span>, not just baby
            </h2>
            <p className="text-[var(--color-warmgrey)] text-sm md:text-base mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0"
              style={{ fontFamily: "var(--font-body)" }}>
              Your wellbeing directly shapes your child's development. The Pulse tracks your mood,
              energy, and intentions twice daily — revealing patterns you never noticed.
            </p>

            {/* Mood flow visual */}
            <div className="p-4 md:p-5 rounded-2xl mb-6 max-w-xl mx-auto lg:mx-0"
              style={{
                background: "rgba(255,249,235,0.8)",
                border: "1px solid rgba(201,168,76,0.1)"
              }}
            >
              <div className="flex items-center justify-between mb-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <span key={d} className="text-[10px] md:text-xs text-[var(--color-warmgrey)]" style={{ fontFamily: "var(--font-body)" }}>{d}</span>
                ))}
              </div>
              <svg viewBox="0 0 300 60" className="w-full">
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M0 45 Q25 30 50 25 Q75 20 100 15 Q125 10 150 20 Q175 30 200 18 Q225 6 250 12 Q275 18 300 10"
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={isVisible ? { pathLength: 1 } : {}}
                  transition={{ duration: 2, delay: 0.5 }}
                />
                <path
                  d="M0 45 Q25 30 50 25 Q75 20 100 15 Q125 10 150 20 Q175 30 200 18 Q225 6 250 12 Q275 18 300 10 L300 60 L0 60 Z"
                  fill="url(#moodGrad)"
                />
              </svg>
              <p className="text-[10px] md:text-xs text-[var(--color-gold)] mt-2 text-center"
                style={{ fontFamily: "var(--font-tagline)", fontStyle: "italic" }}>
                "You're most energised on Tuesday mornings"
              </p>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3">
              {["Mood Tracking", "Energy Patterns", "Intention Matching", "AI Insights"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] md:text-xs"
                  style={{
                    background: "rgba(122,158,106,0.1)",
                    color: "var(--color-sage)",
                    fontFamily: "var(--font-body)"
                  }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

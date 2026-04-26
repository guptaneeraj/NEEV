import { motion } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";
import { useRef } from "react";

const TESTIMONIALS = [
  {
    name: "Kritika Rathore",
    role: "Fashion Design Student, Noida",
    emoji: "👗",
    quote: "Managing my nephew and niece, the AI feature has been incredibly helpful. It feels like having constant support for every concern around their growth.",
  },
  {
    name: "Atul",
    role: "Sales Professional (MNC), Gurgaon",
    emoji: "💼",
    quote: "Aligning meetings with my child’s sleep is critical. Neev helps me plan my schedule perfectly and even keeps track of Aarav’s diet.",
  },
  {
    name: "Deepanjali Gautam",
    role: "PhD Scholar & Gov Professional",
    emoji: "🎓",
    quote: "With my research schedule, my nanny and I both use Neev to stay aligned. It helps us manage Devi’s routine together, ensuring nothing is missed.",
  },
  {
    name: "Riya Sharma",
    role: "Corporate Professional, Delhi",
    emoji: "👩",
    quote: "As a single working mom, the mood recording helped me align work with my baby's sleep cycle. Managed his nutrition effectively with AI advice.",
  },
  {
    name: "Sunita Verma",
    role: "Government Teacher, Gurugram",
    emoji: "👩‍🏫",
    quote: "This app keeps routines structured and removes misconceptions. It guides me with clarity, helping ensure my child's development stays on track.",
  },
  {
    name: "Amit Gupta",
    role: "Business Owner, Noida",
    emoji: "👨",
    quote: "With three-month-old twins, simplicity matters. The app is easy to use, tracks growth clearly, and suggests practical activities without overwhelm.",
  },
];

export function Testimonials() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative w-full py-12 lg:py-24 overflow-hidden bg-[#FAF3E0]" ref={ref} id="reviews">
      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-6 lg:px-12">
        <motion.div
          className="text-center mb-16 lg:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-[var(--color-gold)] text-[11px] lg:text-sm tracking-[0.5em] uppercase font-black mb-4"
            style={{ fontFamily: "var(--font-body)" }}>
            Parental Perspectives
          </p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#1F4D2C] leading-tight uppercase tracking-tighter"
            style={{ fontFamily: "var(--font-heading)" }}>
            Voices from the <span className="text-[#C9A84C]">NEEV Circle</span>
          </h2>
          <div className="w-32 h-2 bg-[#C9A84C] mx-auto mt-8 rounded-full opacity-30" />
        </motion.div>

        {/* Grid Layout - 3 per row on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              className="group relative p-8 lg:p-10 rounded-[3rem] transition-all duration-500 flex flex-col justify-between min-h-[320px] lg:min-h-[380px] hover:translate-y-[-10px]"
              style={{
                background: "rgba(255, 255, 255, 0.45)",
                backdropFilter: "blur(20px)",
                border: "2px solid rgba(201, 168, 76, 0.1)",
                boxShadow: "0 20px 40px -15px rgba(31, 77, 44, 0.05)"
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.15 }}
            >
              <div className="space-y-6">
                <div className="text-4xl lg:text-5xl text-[#C9A84C]/20 font-serif leading-none">“</div>
                <p className="text-[14px] md:text-base lg:text-[1.1rem] text-[#6B7F71] leading-relaxed font-bold italic"
                   style={{ fontFamily: "var(--font-tagline)" }}>
                  {t.quote}
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-forest/5 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#A8D5BA]/20 flex items-center justify-center text-3xl shadow-inner border border-[#A8D5BA]/30 group-hover:bg-gold/10 group-hover:border-gold/30 transition-colors duration-300">
                  {t.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-base font-black text-[#1F4D2C] uppercase tracking-tight"
                    style={{ fontFamily: "var(--font-heading)" }}>
                    {t.name}
                  </p>
                  <p className="text-[10px] md:text-[11px] text-[#C9A84C] font-black uppercase tracking-widest leading-tight mt-1">
                    {t.role}
                  </p>
                </div>
              </div>

              {/* Decorative Glow on Hover */}
              <div className="absolute inset-0 rounded-[3rem] bg-gold/0 group-hover:bg-gold/[0.02] transition-colors duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


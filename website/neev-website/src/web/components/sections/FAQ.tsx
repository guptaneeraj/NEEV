import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";

const FAQS = [
  {
    q: "Is my child's data safe with NEEV?",
    a: "We're fully DPDP Act 2023 compliant with end-to-end encryption. Your family data is yours, always."
  },
  {
    q: "What age group is NEEV designed for?",
    a: "NEEV covers the critical 0–3 year developmental window, with special focus on pregnant parents and children below 1.5 years. Our 156-week curriculum and 1000+ activities span from birth through preschool."
  },
  {
    q: "Can I add multiple children?",
    a: "Yes! Go to Settings > Little Ones to add more children. Each child gets their own developmental profile, milestone tracking, and personalized activity plans."
  },
  {
    q: "Is NEEV only in English?",
    a: "Currently available in English. Hindi and regional language support (Marathi, Tamil, Telugu, Bengali, Kannada) is planned within 90 days of launch."
  },
  {
    q: "Does NEEV replace my pediatrician?",
    a: "No. NEEV does not provide medical diagnoses. It strengthens your conversations with doctors by giving them continuous developmental data between visits. Always consult a qualified healthcare professional for medical concerns."
  },
];

export function FAQ() {
  const { ref, isVisible } = useScrollReveal();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative min-h-screen flex items-center justify-center py-24 overflow-hidden section-cream" ref={ref}>
      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-[var(--color-gold)] text-sm tracking-[0.3em] uppercase mb-3"
            style={{ fontFamily: "var(--font-body)" }}>
            Questions?
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-forest-deep)]"
            style={{ fontFamily: "var(--font-heading)" }}>
            Frequently asked
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,249,235,0.7)",
                border: `1px solid ${open === i ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.08)"}`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-sm font-medium text-[var(--color-forest-deep)] pr-4"
                  style={{ fontFamily: "var(--font-body)" }}>
                  {faq.q}
                </span>
                <motion.span
                  className="text-[var(--color-gold)] text-lg shrink-0"
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5">
                      <p className="text-sm text-[var(--color-warmgrey)] leading-relaxed"
                        style={{ fontFamily: "var(--font-body)" }}>
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

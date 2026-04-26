import { useState } from "react";
import { motion } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";
import { Fireflies } from "./Particles";
import { saveToWaitlist } from "../../lib/directus";

export function Waitlist() {
  const { ref, isVisible } = useScrollReveal();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await saveToWaitlist(email, "parent");
      setSubmitted(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center py-24 overflow-hidden section-forest" id="waitlist" ref={ref}>
      <Fireflies count={12} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="text-3xl mb-6">🌱</div>
          <h2 className="text-2xl md:text-4xl font-bold text-[var(--color-cream)] mb-4"
            style={{ fontFamily: "var(--font-heading)" }}>
            Your parenting companion is{" "}
            <span className="text-gradient-gold">one tap away</span>
          </h2>
          <p className="text-[var(--color-sage)] mb-4 max-w-lg mx-auto text-sm"
            style={{ fontFamily: "var(--font-body)" }}>
            Join 323+ parents already in beta. Be the first to experience AI-powered parenting 
            when we launch on 19 June 2026.
          </p>
          <p className="text-xs text-[var(--color-sage)]/60 mb-8"
            style={{ fontFamily: "var(--font-body)" }}>
            Some features are in testing. WhatsApp support: +91 78774 95121
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 px-4 py-3 rounded-full text-xs outline-none text-[var(--color-forest-deep)]"
                style={{
                  background: "rgba(255,249,235,0.1)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  color: "var(--color-cream)",
                  fontFamily: "var(--font-body)"
                }}
              />
              <motion.button
                type="submit"
                className="px-6 py-3 rounded-full text-xs font-medium text-[var(--color-forest-deep)] whitespace-nowrap cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, var(--color-gold), var(--color-amber))",
                  fontFamily: "var(--font-body)"
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Notified
              </motion.button>
            </form>
          ) : (
            <motion.div
              className="p-6 rounded-2xl inline-block"
              style={{
                background: "rgba(122,158,106,0.1)",
                border: "1px solid rgba(122,158,106,0.2)"
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-2xl mb-2">🌳</div>
              <p className="text-[var(--color-cream)] font-medium"
                style={{ fontFamily: "var(--font-heading)" }}>
                You're on the list!
              </p>
              <p className="text-sm text-[var(--color-sage)]" style={{ fontFamily: "var(--font-body)" }}>
                We'll notify you when NEEV launches.
              </p>
            </motion.div>
          )}

          {/* Contact cards */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:neevios@support.com"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs text-[var(--color-sage)] hover:text-[var(--color-cream)] transition-colors"
              style={{
                background: "rgba(255,249,235,0.05)",
                border: "1px solid rgba(201,168,76,0.1)",
                fontFamily: "var(--font-body)"
              }}
            >
              <span>🤝</span>
              <span>neevios@support.com</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

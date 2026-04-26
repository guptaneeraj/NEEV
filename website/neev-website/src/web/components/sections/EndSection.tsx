import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";
import { Fireflies } from "./Particles";
import { saveToWaitlist } from "../../lib/directus";

const FAQS = [
  {
    q: "Is my child's data safe with NEEV?",
    a: "We're fully DPDP Act 2023 compliant with end-to-end encryption. Your family data is yours, always."
  },
  {
    q: "What age group is NEEV for?",
    a: "NEEV covers the critical 0–3 year window, with special focus on pregnancy and children below 1.5 years."
  },
  {
    q: "Can I add multiple children?",
    a: "Yes! Each child gets their own developmental profile, milestones, and personalized activity plans."
  },
  {
    q: "Is NEEV only in English?",
    a: "Currently in English. Hindi, Marathi, Tamil, and Telugu support is coming within 90 days of launch."
  },
  {
    q: "Does it work offline?",
    a: "Yes, core developmental logs and on-device AI guidance work without an active internet connection."
  },
  {
    q: "Can both parents sync data?",
    a: "Absolutely. Our 'Family Sync' feature keeps both parents and caregivers aligned in real-time."
  },
  {
    q: "How much does NEEV cost?",
    a: "We offer a 'Foundational' free tier and a 'Deep' premium subscription for advanced AI insights."
  },
  {
    q: "Is there support for twins?",
    a: "Yes, NEEV's architecture is designed to manage multiple developmental profiles simultaneously."
  },
  {
    q: "Does NEEV replace doctors?",
    a: "No. It strengthens conversations with doctors by providing continuous developmental data between visits."
  },
  {
    q: "Who reviews the science?",
    a: "Our engine is trained on WHO/AAP/IAP data and reviewed by a panel of senior Indian pediatricians."
  },
  {
    q: "Where is my data stored?",
    a: "Primarily on your device. Encrypted backups are stored in our secure Indian data centers."
  },
];

export function EndSection() {
  const { ref, isVisible } = useScrollReveal();
  const [open, setOpen] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("parent");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitted) return;

    if (email) {
      setIsSubmitting(true);
      try {
        const res = await saveToWaitlist(email, category);
        if (res.success) {
          setSubmitted(true);
        } else {
          alert(res.error);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center py-16 lg:py-24 overflow-hidden bg-[#FAF3E0]" id="waitlist" ref={ref}>
      <Fireflies count={20} />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-6 lg:px-12 flex flex-col gap-16 lg:gap-24">

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start justify-between h-full">

          {/* Left Column: FAQ & Support Manifesto */}
          <motion.div
            className="flex-[1.2] space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-4">
              <p className="text-[var(--color-gold)] text-[11px] lg:text-sm tracking-[0.4em] uppercase font-black" style={{ fontFamily: "var(--font-body)" }}>
                Support & FAQ
              </p>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#1F4D2C] leading-[0.9] uppercase tracking-tighter" style={{ fontFamily: "var(--font-heading)" }}>
                Everything You Need<br />
                <span className="text-[#C9A84C]">To Build Deep.</span>
              </h2>
              <p className="text-sm lg:text-lg text-[#2D5F3F] font-bold italic max-w-lg" style={{ fontFamily: "var(--font-tagline)" }}>
                Deep dives into our technology, privacy, and clinical-grade parenting support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAQS.map((faq, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    background: open === i ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.35)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${open === i ? "rgba(201,168,76,0.4)" : "rgba(31,77,44,0.08)"}`,
                  }}
                >
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer group"
                  >
                    <span className="text-[12px] lg:text-[14px] font-black text-[#1F4D2C] pr-4 uppercase tracking-tight">
                      {faq.q}
                    </span>
                    <span className={`text-[var(--color-gold)] text-xl font-light transition-transform duration-300 ${open === i ? "rotate-45" : "rotate-0"}`}>
                      +
                    </span>
                  </button>
                  <AnimatePresence>
                    {open === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-5 pb-5">
                          <p className="text-[11px] lg:text-[13px] text-[#6B7F71] leading-relaxed font-bold">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Waitlist Card */}
          <div className="flex-[0.8] w-full flex justify-center lg:justify-end h-full lg:sticky lg:top-24">
            <div id="waitlist-form" className="w-full max-w-lg space-y-6 bg-white/50 backdrop-blur-xl p-8 lg:p-12 rounded-[3.5rem] border-2 border-[#C9A84C]/15 shadow-2xl">
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-2xl shadow-inner">🌱</div>
                   <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#1F4D2C] text-[9px] font-black text-white uppercase tracking-widest h-fit mt-2">323 Parents in Beta</div>
                </div>

                <h2 className="text-3xl lg:text-4xl font-black text-[#1F4D2C] mb-4 leading-[1.1] uppercase tracking-tighter">
                  Your journey is <br /><span className="text-gradient-gold">one tap away</span>
                </h2>
                <p className="text-[#6B6555] text-sm lg:text-base mb-8 font-bold leading-relaxed italic">
                  Join our exclusive waitlist for early access. Launching 19 June 2026.
                </p>

                {!submitted ? (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-gold uppercase tracking-[0.2em] ml-2">I am a...</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          disabled={isSubmitting}
                          className={`w-full px-6 py-4 rounded-full text-sm outline-none bg-white/40 border-2 border-[#C9A84C]/10 text-[#1F4D2C] font-black appearance-none cursor-pointer focus:border-gold/30 transition-all ${isSubmitting ? 'opacity-50' : ''}`}
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%231F4D2C\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.2em' }}
                        >
                          <option value="parent">Parent / Caregiver</option>
                          <option value="investor">Investor / Partner</option>
                          <option value="clinician">Clinician / Doctor</option>
                        </select>

                        <label className="text-[9px] font-black text-gold uppercase tracking-[0.2em] ml-2">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="rishi.parent@gmail.com"
                          required
                          disabled={isSubmitting}
                          className={`w-full px-6 py-4 rounded-full text-sm outline-none bg-white/40 border-2 border-[#C9A84C]/10 text-[#1F4D2C] font-black focus:border-gold/30 transition-all placeholder:opacity-30 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 lg:py-5 rounded-full text-sm font-black text-white shadow-xl cursor-pointer bg-[#1F4D2C] uppercase tracking-[0.2em] mt-4 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      whileHover={!isSubmitting ? { scale: 1.02, backgroundColor: "#2D5F3F" } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    >
                      {isSubmitting ? 'Processing...' : 'Get Early Access'}
                    </motion.button>
                  </form>
                ) : (
                  <motion.div
                    className="p-8 rounded-[2.5rem] bg-[#7A9E6A]/20 border-2 border-[#7A9E6A]/30 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="text-4xl mb-4">🌳</div>
                    <p className="text-[#1F4D2C] font-black text-xl uppercase tracking-tighter">You're in the circle!</p>
                    <p className="text-[#1F4D2C]/70 text-xs font-bold mt-2 italic">Check your email for the next steps.</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



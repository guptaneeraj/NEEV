import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";
import { saveToWaitlist } from "../../lib/directus";

const TABS = [
  {
    id: "parents",
    label: "For Parents",
    icon: "👶",
    headline: "Your AI co-pilot for the first 3 years",
    content: "This app will become your go-to companion for your child's early neural development. From personalized daily activities to sleep predictions, Neev tracks your child and your daily routine.",
    features: [
      "Daily Rhythm check-ins track YOUR wellbeing too",
      "1000+ age-specific activities refreshed every 24h",
      "SweetSpot sleep window predictions",
      "On-device AI — absolute privacy for your data",
    ],
    cta: "Download Beta",
    ctaLink: "#waitlist",
  },
  {
    id: "investors",
    label: "For Investors",
    icon: "📈",
    headline: "Big Opportunity in early childhood",
    content: "Neev sits at the intersection of a large, continuously renewing market and a structurally broken system. India has 25M+ births annually with no unified, personalized parenting infrastructure.",
    features: [
      "300+ beta families already onboarded",
      "93-95% projected gross margins",
      "Scalable clinical-grade data engine",
      "Strategic professional network integration",
    ],
    cta: "Request Pitch Deck",
    ctaLink: "#waitlist",
  },
  {
    id: "doctors",
    label: "For Clinicians",
    icon: "🩺",
    headline: "Continuous developmental data between visits",
    content: "Neev provides continuous, structured data from a child's daily environment — capturing behavior, sleep, activity, and early developmental patterns between visits.",
    features: [
      "WHO + IAP aligned clinical content",
      "High-resolution developmental dashboards",
      "DPDP Act 2023 fully compliant storage",
      "Evidence-based intervention mapping"
    ],
    cta: "Partner With NEEV",
    ctaLink: "#waitlist",
  },
];

export function Audience() {
  const { ref, isVisible } = useScrollReveal();
  const [activeTab, setActiveTab] = useState<string>("parents");
  const active = TABS.find((t) => t.id === activeTab);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme styling logic
  const themeStyles = {
    parents: {
      bg: "bg-[#FAF3E0]",
      accent: "#1F4D2C",
      glow: "rgba(31, 77, 44, 0.04)",
      border: "rgba(31, 77, 44, 0.08)",
    },
    investors: {
      bg: "bg-[#FFF9EA]",
      accent: "#C9A84C",
      glow: "rgba(201, 168, 76, 0.06)",
      border: "rgba(201, 168, 76, 0.15)",
    },
    doctors: {
      bg: "bg-[#F0F7F4]",
      accent: "#2D5F3F",
      glow: "rgba(45, 95, 63, 0.06)",
      border: "rgba(45, 95, 63, 0.15)",
    }
  }[activeTab as keyof typeof themeStyles] || themeStyles.parents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitted) return;

    if (email && activeTab) {
      setIsSubmitting(true);
      const categoryMap: Record<string, string> = {
        parents: "parent",
        investors: "investor",
        doctors: "clinician"
      };

      try {
        const res = await saveToWaitlist(email, categoryMap[activeTab] || activeTab);
        if (res.success) {
          setSubmitted(true);
        } else {
          alert(res.error);
        }
      } catch (err) {
        alert("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section
      className={`relative h-auto lg:h-screen flex flex-col items-center justify-center py-10 lg:py-0 transition-colors duration-700 ease-in-out overflow-hidden ${themeStyles.bg}`}
      ref={ref}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatePresence mode="wait">
          {activeTab === "parents" && (
            <motion.div key="p-bg" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <div className="absolute top-[15%] left-[10%] text-4xl opacity-10">🍃</div>
              <div className="absolute bottom-[15%] right-[10%] text-4xl opacity-10">🍃</div>
            </motion.div>
          )}
          {activeTab === "investors" && (
            <motion.div key="i-bg" initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} exit={{ opacity: 0 }} className="absolute inset-0">
               <svg width="100%" height="100%"><pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#C9A84C" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill="url(#g)" /></svg>
            </motion.div>
          )}
          {activeTab === "doctors" && (
            <motion.div key="d-bg" initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} exit={{ opacity: 0 }} className="absolute inset-0">
               <svg width="100%" height="100%"><pattern id="n" width="80" height="80" patternUnits="userSpaceOnUse"><circle cx="40" cy="40" r="1" fill="#1F4D2C" /></pattern><rect width="100%" height="100%" fill="url(#n)" /></svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 w-full max-w-[1450px] mx-auto px-4 md:px-10 h-full flex flex-col justify-center">
        {/* Header - Compact */}
        <motion.div
          className="text-center mb-8 lg:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
        >
          <p className="text-[var(--color-gold)] text-[10px] lg:text-xs tracking-[0.4em] uppercase font-black mb-2">Built For Everyone</p>
          <h2 className="text-2xl md:text-5xl font-black text-[#1F4D2C] leading-none uppercase tracking-tighter">
            One mission. <span className="text-gradient-gold">Many partners.</span>
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-between gap-6 lg:gap-8 min-h-[500px] lg:h-[65vh]">

          {/* Left: Interactive Features & Selection */}
          <div className="flex-[1.1] w-full flex flex-col gap-6 lg:gap-8">
            {/* Horizontal Persona Selection - Enlarged, Full Width & Pulsating Border */}
            <div className="flex justify-between gap-4 lg:gap-6 w-full">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSubmitted(false); }}
                  className={`relative flex-1 px-4 lg:px-8 py-4 lg:py-5 rounded-2xl text-[10px] lg:text-sm font-black transition-all uppercase tracking-[0.15em] group overflow-visible ${
                    activeTab === tab.id ? "text-white shadow-2xl scale-105" : "text-[#6B6555] bg-white/60 hover:bg-white/90"
                  }`}
                  style={{
                    background: activeTab === tab.id ? themeStyles.accent : "",
                    fontFamily: "var(--font-body)"
                  }}
                >
                  {/* Pulsating Border for Selected Tab */}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="active-border"
                      className="absolute -inset-1 rounded-[1.25rem] border-2 border-gold/40 z-[0]"
                      animate={{
                        opacity: [0.3, 0.7, 0.3],
                        scale: [1, 1.03, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-lg lg:text-xl">{tab.icon}</span>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Content Display */}
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 bg-white/40 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border-2 border-white/60 shadow-xl flex flex-col justify-center"
                >
                  <h3 className="text-xl lg:text-3xl font-black text-[#1F4D2C] mb-4 uppercase tracking-tighter leading-tight">
                    {active.headline}
                  </h3>
                  <p className="text-[#6B7F71] text-[13px] lg:text-[15px] mb-8 font-bold italic leading-relaxed">
                    {active.content}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {active.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/60 border border-[#C9A84C]/10">
                        <span className="text-gold text-lg">✦</span>
                        <span className="text-[10px] lg:text-[11px] font-black text-[#1F4D2C] uppercase tracking-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Notification Command Center (Static) */}
          <div className="flex-[0.9] w-full max-w-md lg:max-w-none">
            <div className="h-full bg-white/80 backdrop-blur-2xl p-8 lg:p-12 rounded-[2.5rem] border-2 border-[#C9A84C]/15 shadow-2xl flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 blur-3xl" />

              <div className="text-4xl lg:text-5xl mb-6">🌱</div>
              <h2 className="text-2xl lg:text-3xl font-black text-[#1F4D2C] mb-3 leading-tight uppercase tracking-tighter">
                Stay in <br /><span className="text-gradient-gold">the circle</span>
              </h2>
              <p className="text-[#6B6555] text-[12px] lg:text-[14px] mb-8 font-bold italic leading-relaxed opacity-80">
                Join our curated waitlist. <br />Beta release: 19 June 2026.
              </p>

                  {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gold uppercase tracking-widest ml-4">Direct Contact</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="rishi@neevios.com"
                          required
                          disabled={isSubmitting}
                          className={`w-full px-6 py-4 rounded-full text-sm outline-none bg-white border-2 border-[#C9A84C]/10 text-[#1F4D2C] font-black focus:border-gold/30 transition-all shadow-inner placeholder:opacity-20 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 lg:py-5 rounded-full text-sm font-black text-white shadow-xl bg-[#1F4D2C] uppercase tracking-[0.2em] mt-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      >
                        {isSubmitting ? 'Syncing...' : 'Request Access'}
                      </motion.button>
                    </form>
                  ) : (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-6">
                  <div className="text-4xl mb-3">🌳</div>
                  <p className="text-[#1F4D2C] font-black text-xl uppercase tracking-tighter">Profile Synced</p>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}



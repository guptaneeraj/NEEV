import { motion } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";

const PLANS = [
  {
    name: "Neev Starter",
    duration: "6 Months",
    price: "₹4,000",
    originalPrice: "₹8,000",
    desc: "Value choice for initial milestones.",
    tag: "Limited Offer",
    features: [
      "Full access to Neev platform",
      "Unlimited AI parenting guidance",
      "Daily Nurture Path plans",
      "Personalized Routine Insights",
      "Growth tracking & analytics",
      "1 Expert Session Included",
    ],
    cta: "Get Started",
    featured: false,
    note: "50% discount for first 10,000 families"
  },
  {
    name: "Neev Annual",
    duration: "1 Year",
    price: "₹12,000",
    originalPrice: "₹16,000",
    desc: "Extended visibility for the first year.",
    tag: "25% Discount",
    features: [
      "Everything in 6-month plan",
      "Extended tracking duration",
      "Deeper developmental insights",
      "Long-term pattern visibility",
      "1 Expert Session Included",
    ],
    cta: "Choose Annual",
    featured: false,
    note: "25% discount for first 10,000 families"
  },
  {
    name: "Neev Foundation",
    duration: "3 Years",
    price: "₹24,000",
    originalPrice: "₹48,000",
    desc: "The complete 0–3 year journey.",
    tag: "Best Value",
    features: [
      "Complete 0–3 year journey",
      "Full 156-week curriculum",
      "Continuous AI guidance & adaptation",
      "Personalized Routine Insights",
      "3 Expert Sessions Included",
      "Maximum long-term savings",
    ],
    cta: "Go All-In",
    featured: true,
    note: "50% discount for first 10,000 families"
  },
  {
    name: "Clinics & Professionals",
    duration: "Enterprise",
    price: "Custom",
    desc: "Bespoke solutions for providers.",
    tag: "B2B Integration",
    features: [
      "Bulk onboarding tools",
      "Clinical dashboard integration",
      "Co-branded programs",
      "Dedicated priority support",
      "API Access (Optional)",
    ],
    cta: "Contact Us",
    featured: false,
    mailto: "mailto:neevios@support.com"
  }
];

export function Pricing() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="relative min-h-screen py-8 lg:py-12 overflow-hidden bg-[#FAF3E0]" id="pricing" ref={ref}>
      {/* Background Neural Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pricing-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pricing-grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-6 lg:px-12">
        <motion.div
          className="text-center mb-10 lg:mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-[clamp(32px,5vh,64px)] font-black text-[#1F4D2C] leading-tight uppercase tracking-tighter mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Invest in your child's <span className="text-[#C9A84C]">foundation.</span>
          </h2>
          <div className="w-24 h-1.5 bg-[#C9A84C] mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 mb-16">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`group relative flex flex-col p-8 lg:p-10 rounded-[3rem] transition-all duration-700 h-full ${
                plan.featured
                  ? "bg-[#1F4D2C] text-white shadow-2xl scale-105 z-20 border-2 border-gold/30"
                  : "bg-white/40 backdrop-blur-xl border-2 border-forest/5 shadow-xl hover:border-gold/20"
              }`}
              initial={{ opacity: 0, y: 50 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -10 }}
            >
              {/* Badge */}
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg ${
                plan.featured ? "bg-gold text-[#1F4D2C]" : "bg-white text-gold border border-gold/20"
              }`}>
                {plan.tag}
              </div>

              <div className="mb-8">
                <h3 className={`text-xl lg:text-2xl font-black uppercase tracking-tight mb-1 ${plan.featured ? "text-white" : "text-[#1F4D2C]"}`} style={{ fontFamily: "var(--font-heading)" }}>
                  {plan.name}
                </h3>
                <p className={`text-[10px] font-bold italic ${plan.featured ? "text-white/60" : "text-[#6B7F71]"}`} style={{ fontFamily: "var(--font-tagline)" }}>
                   {plan.duration} — {plan.desc}
                </p>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-3">
                  <span className={`text-3xl lg:text-4xl font-black ${plan.featured ? "text-gold" : "text-[#1F4D2C]"}`} style={{ fontFamily: "var(--font-heading)" }}>
                    {plan.price}
                  </span>
                  {plan.originalPrice && (
                    <span className={`text-lg line-through opacity-40 font-bold ${plan.featured ? "text-white" : "text-[#1F4D2C]"}`}>
                      {plan.originalPrice}
                    </span>
                  )}
                </div>
                {plan.note && (
                  <p className={`text-[10px] mt-2 font-black uppercase tracking-wider ${plan.featured ? "text-gold/80" : "text-gold"}`}>
                    {plan.note}
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-12 flex-1">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className={`text-sm mt-0.5 ${plan.featured ? "text-gold" : "text-[#7A9E6A]"}`}>✦</span>
                    <span className={`text-[12px] leading-snug font-bold ${plan.featured ? "text-white/90" : "text-[#6B7F71]"}`} style={{ fontFamily: "var(--font-body)" }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {plan.price === "Custom" ? (
                <div
                  className={`mt-auto block text-center py-4 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-500 bg-forest/5 text-[#1F4D2C] border border-forest/10`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Contact us at support@neevios.com
                </div>
              ) : (
                <a
                  href={plan.mailto || "#waitlist-form"}
                  className={`block text-center py-4 rounded-full text-xs lg:text-sm font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                    plan.featured
                      ? "bg-gold text-[#1F4D2C] hover:bg-white hover:scale-105 shadow-xl shadow-black/20"
                      : "bg-[#1F4D2C] text-white hover:bg-[#1F4D2C]/90 hover:scale-105"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {plan.cta}
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

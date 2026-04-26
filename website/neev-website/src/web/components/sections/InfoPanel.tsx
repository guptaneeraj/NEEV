import { motion, AnimatePresence } from "framer-motion";

interface InfoPanelProps {
  screen: string;
}

const INFO_DATA: Record<string, { title: string; subtitle: string; features: string[]; icon: string; description: string }> = {
  landing: {
    icon: "🏛️",
    title: "NEEV Foundation",
    subtitle: "Built on developmental science to support Indian parents.",
    description: "The NEEV ecosystem begins with a calm, cinematic entrance. Our neural engine is designed to nurture the first three years of life, providing optimized support that evolves precisely with your child's brain architecture. We combine longitudinal data with empathetic guidance to ensure every milestone is a moment of growth and connection.",
    features: ["Cinematic 3D Visuals", "Predictive AI Core", "Science-Backed Design"]
  },
  login: {
    icon: "🔐",
    title: "Privacy First",
    subtitle: "Security with real-time OTP.",
    description: "We use secure OTP based authentication to ensure your family's sensitive developmental data never leaves your phone. NEEV is built on the belief that privacy is a fundamental parenting right. Our architecture uses edge-computing to process translations and predictions locally, ensuring zero cloud-dependency for your personal logs.",
    features: ["DPDP Act Compliant", "End-to-End Encryption", "Instant Email OTP"]
  },
  dashboard: {
    icon: "🏠",
    title: "Nurture Dashboard",
    subtitle: "Your daily control center for mindful parenting.",
    description: "Alisha's dashboard adapts dynamically to the time of day and energy levels. It features a Live Age Counter for Rohan, morning intentions, and the Nurture Pulse—an AI observation layer that analyzes daily rhythms to provide empathetic guidance, ensuring you stay balanced and focused throughout the day.",
    features: ["Morning/Evening Pulse", "Real-time Age Tracking", "Empathetic AI Insights"]
  },
  insights: {
    icon: "🪄",
    title: "Discovery Hub",
    subtitle: "1000+ Activities curated by NEEV Intelligence.",
    description: "Powered by thousands of peer-reviewed clinical papers, the Discovery Hub filters activities by developmental domains: Gross Motor, Cognitive, Language, and more. It ensures every play session has a purposeful neural impact, helping you transform ordinary moments into powerful developmental opportunities.",
    features: ["Domain Filtering", "Neural Plasticity Focus", "Actionable Play Intelligence"]
  },
  plan: {
    icon: "🌿",
    title: "Weekly Journey",
    subtitle: "Algorithmically-balanced growth plans.",
    description: "NEEV learns your child's energy levels and developmental gaps to generate a fresh 'Nurture Path' every 24 hours. Track progress across physical and cognitive pillars with our integrated activity logger, providing a longitudinal view of your child's growth and your parenting journey.",
    features: ["Goal-Oriented Curation", "Energy-Balanced Tasks", "Integrated Growth Log"]
  },
  aichat: {
    icon: "✨",
    title: "NEEV Intelligence",
    subtitle: "An expert on-device AI parenting assistant.",
    description: "Trained on standard WHO, AAP, and IAP guidelines, NEEV Intelligence provides instant clinical-grade guidance. Ask anything from sleep patterns to nutrition—available 24/7 in a secure private session. Our local Large Language Model ensures your conversations are never uploaded or analyzed by third parties.",
    features: ["Private Local LLM", "Clinical-Grade Advice", "Immediate Guidance"]
  },
  profile: {
    icon: "👩",
    title: "Personal Profile",
    subtitle: "Managing your family's developmental circle.",
    description: "Customize your parenting role and manage multiple 'Little Ones' with individual growth trackers. The profile section is the core of your account settings, subscriptions, and access to our dedicated Help Center support, allowing you to tailor the NEEV experience to your unique family structure.",
    features: ["Role Management", "Multi-Child Support", "Direct Support Access"]
  },
  pulse_detail: {
    icon: "💓",
    title: "The Pulse Details",
    subtitle: "Tracking your emotional rhythm as a parent.",
    description: "Parenting wellness directly impacts child development. The Pulse tracks your morning intentions versus evening reviews, spotting patterns that help you stay energized and connected throughout the journey. It creates a feedback loop of mindfulness that benefits both you and your child's environment.",
    features: ["Mood Pattern Analysis", "Energy Level Tracking", "Mindful Reflection"]
  },
  nurture_hub: {
    icon: "🏠",
    title: "Nurture Hub",
    subtitle: "The command center for your child's growth.",
    description: "The Nurture Hub centralizes every dimension of early development. It monitors progress across milestones, tracks health vitals, and predicts daily rhythms. It's designed to give you a high-resolution view of your child's journey, ensuring no developmental opportunity is missed.",
    features: ["Neural Foundation Tracking", "Holistic Growth View", "Predictive Development"]
  },
  milestones: {
    icon: "🏆",
    title: "Milestones",
    subtitle: "Validated tracking for every leap.",
    description: "Based on global pediatric standards, our milestone tracker observes your child's emerging skills. We provide a structured roadmap from birth to 3 years, helping you recognize and support key developmental windows in physical, cognitive, and social domains.",
    features: ["CDC & WHO Standards", "Emerging Skill Alerts", "Achievement History"]
  },
  health: {
    icon: "🌡️",
    title: "Health Shield",
    subtitle: "A longitudinal record of physical wellness.",
    description: "Log vitals, growth metrics, and vaccinations in a secure, encrypted vault. NEEV turns static health data into actionable insights, helping you spot trends and facilitating more informed conversations with your pediatrician during visits.",
    features: ["Vitals Logging", "Growth Percentiles", "Medical Data Privacy"]
  },
  rhythm: {
    icon: "⏰",
    title: "Biological Rhythm",
    subtitle: "Syncing with your child's natural clock.",
    description: "Our AI analyzes sleep, feeding, and energy patterns to map your child's unique biological rhythm. By understanding these cycles, NEEV predicts optimal windows for play and rest, reducing friction and supporting neural stability.",
    features: ["SweetSpot Prediction", "Sleep Quality Tracking", "Routine Optimization"]
  },
  insights_detail: {
    icon: "🧠",
    title: "Deep Insights",
    subtitle: "Clinical-grade AI observations.",
    description: "Deep Insights bridge the gap between daily data and scientific understanding. Our engine synthesizes your child's activity and rhythm logs to generate a comprehensive 'Developmental DNA' profile, offering tailored guidance for the weeks ahead.",
    features: ["AI Neural Analysis", "Pattern Recognition", "Personalized Guidance"]
  }
};

export function InfoPanel({ screen }: InfoPanelProps) {
  const data = INFO_DATA[screen] || INFO_DATA.landing;

  return (
    <div className="relative w-full h-full max-w-[500px] flex items-center justify-center">
      {/* Symmetrical Border matching the phone height and shape exactly */}
      <div className="w-full h-auto min-h-[500px] sm:min-h-[600px] lg:h-[80vh] xl:h-[85vh] max-h-[700px] bg-white/40 backdrop-blur-xl rounded-[2.5rem] border-4 border-[#C9A84C]/20 shadow-2xl p-6 lg:p-8 flex flex-col transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col h-full justify-center space-y-4"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-3xl mb-6 shadow-sm border border-[#FDE68A] overflow-hidden">
                {screen === "profile" ? (
                  <img src="/assets/profile-photo.jpeg" className="w-full h-full object-cover" />
                ) : (
                  data.icon
                )}
              </div>

              <h3 className="text-2xl lg:text-3xl font-black text-[#1F4D2C] mb-3 leading-tight uppercase tracking-tighter" style={{ fontFamily: "var(--font-heading)" }}>
                {data.title}
              </h3>

              <p className="text-base lg:text-lg text-[#2D5F3F] font-bold mb-3 italic leading-snug" style={{ fontFamily: "var(--font-tagline)" }}>
                {data.subtitle}
              </p>

              <p className="text-[13px] lg:text-[15px] text-[#6B7F71] leading-relaxed mb-6 font-medium">
                {data.description}
              </p>
            </div>

            {/* Feature tabs / pointers */}
            <div className="space-y-3">
              {data.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/60 p-3.5 rounded-2xl border border-[#A8D5BA]/40 shadow-sm group hover:border-[#A8D5BA] transition-all duration-300">
                  <div className="w-6 h-6 rounded-full bg-[#1F4D2C] flex items-center justify-center shadow-md">
                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <span className="text-[11px] lg:text-[13px] font-black text-[#1F4D2C] uppercase tracking-widest">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -inset-4 rounded-[4rem] bg-[#C9A84C]/5 blur-3xl -z-10" />
    </div>
  );
}

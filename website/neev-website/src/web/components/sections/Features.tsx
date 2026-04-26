import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollReveal } from "./useScrollReveal";

const FEATURES = [
  {
    id: "pulse_morning",
    icon: "☀️",
    name: "The Pulse (Morning)",
    tagline: "Intentional Beginnings",
    image: "/assets/the-pulse.jpeg",
    description: "Start your day with neural intentionality. The Morning Pulse is a clinical-grade intentionality tool that allows you to set your parenting focus and track your baseline energy levels before the day unfolds. By aligning your internal state with your child's needs early, you create a physiological buffer against daily stress and unpredictable developmental challenges. This proactive approach ensures you are mentally present for the most critical windows of connection.",
    detail: "Trained on thousands of clinical papers, the Pulse provides foresight to plan interaction when you are at your best. It creates a data-backed record of the family's emotional journey, allowing for longitudinal energy mapping and burnout prevention.",
    benefit: "Reduces parental reactivity and significantly increases presence during the first 1000 days.",
    access: "Auto-activates on the main Dashboard between 5 AM and 11 AM daily. High priority entry.",
    scientificBasis: "Rooted in Mindfulness-Based Stress Reduction (MBSR) and energy allocation theory.",
    markings: [
      { text: "Intent Setting", desc: "Prioritize specific developmental pillars for the day ahead." },
      { text: "Energy Baseline", desc: "Log physiological readiness to align tasks with your capacity." },
      { text: "Neural Focus", desc: "Calibrate your attention to match your child's current leap." }
    ]
  },
  {
    id: "pulse_evening",
    icon: "🌙",
    name: "The Pulse (Evening)",
    tagline: "Mindful Reflection",
    image: "/assets/the-pulse2.jpeg",
    description: "Close the feedback loop with high-fidelity reflection. The Evening Pulse is more than a log; it is a mindful pause where you review your morning intentions against the day's actual developmental outcomes. This process helps the NEEV engine correlate your perceived energy with completed activities, building a deep longitudinal profile of your unique parenting rhythm and identifying subtle burnout signals before they impact the home environment.",
    detail: "Correlates intentionality with outcomes to provide a 24-hour neural satisfaction score. It identifies 'Energy Leaks'—times when your effort didn't match the developmental impact, helping you optimize for tomorrow.",
    benefit: "Improves sleep quality and emotional regulation through structured daily closure and gratitude logging.",
    access: "Accessible via the 'Review Day' card on the Dashboard from 6 PM onwards. Critical for AI accuracy.",
    scientificBasis: "Based on Cognitive Behavioral Reflection (CBR) and sleep architecture research.",
    markings: [
      { text: "Reflection Log", desc: "Compare morning intentions with evening developmental reality." },
      { text: "Pattern Analysis", desc: "Identify recurring energy peaks and emotional troughs." },
      { text: "Closure Note", desc: "Transition from active parenting to restorative rest with intent." }
    ]
  },
  {
    id: "nurture_path",
    icon: "🌿",
    name: "Nurture Path",
    tagline: "Your Daily Bond",
    image: "/assets/nurture-path.jpeg",
    description: "An intelligent daily plan generated fresh every 24 hours. Our algorithm reads your child's age, energy needs, and developmental stage to select the perfect activities. The Nurture Path ensures every interaction is a purposeful neural building block, transforming ordinary moments into powerful developmental opportunities. It dynamically adjusts based on the energy you logged in your Pulse, ensuring you never feel overwhelmed.",
    detail: "Combines 1000+ activities with real-time energy data. Every task is balanced between High Energy (Motor), Focused (Cognitive), and Low Energy (Sensory) to ensure a perfectly optimized developmental day.",
    benefit: "Ensures age-appropriate stimulation and removes the 'what do I do now?' guesswork from daily parenting.",
    access: "Located at the center of the main Dashboard. Refreshes every midnight for a new start.",
    scientificBasis: "Aligned with WHO Early Childhood Development standards and neural plasticity windows.",
    markings: [
      { text: "Today's Plan", desc: "A curated list of 3-5 high-impact activities for your specific day." },
      { text: "Skill Mastery", desc: "Track progress toward specific milestones within each activity." },
      { text: "Activity Types", desc: "Visual balance between physical, cognitive, and sensory tasks." }
    ]
  },
  {
    id: "discovery_hub",
    icon: "🪄",
    name: "Discovery Hub",
    tagline: "1000+ Expert Activities",
    image: "/assets/discovery-hub.jpeg",
    description: "A clinical library of 1000+ age-appropriate activities algorithmically selected based on your child's current neural plasticity windows. Vetted by experts to target specific domains like language, sensory, and motor skills, the Discovery Hub is your deep-dive resource for purposeful play. It allows you to explore developmental paths beyond the daily Nurture Path, focusing on areas where your child is showing the most interest or needs additional support.",
    detail: "Encourages active exploration and purposeful play. This library directly strengthens milestones by promoting complex development through consistent engagement. Each activity includes clinical 'Why it Matters' context.",
    benefit: "Transforms play into structured brain-building sessions vetted by clinical child specialists.",
    access: "Tap the magic wand icon on the main navigation bar to enter the Hub. Fully searchable.",
    scientificBasis: "Research sourced from the AAP and Indian Academy of Pediatrics (IAP) developmental logs.",
    markings: [
      { text: "Domain Filters", desc: "Filter by Gross Motor, Fine Motor, Cognitive, Language, or Sensory." },
      { text: "Vetted Content", desc: "Every activity is backed by clinical research and pediatric standards." },
      { text: "Expert Guidance", desc: "Clear instructions and developmental impact explainers for each task." }
    ]
  },
  {
    id: "neev_intelligence",
    icon: "✨",
    name: "Neev Intelligence",
    tagline: "Private On-Device LLM",
    image: "/assets/neev-intelligence.jpeg",
    description: "Powered by a secure, on-device Large Language Model. NEEV AI provides instant clinical-grade guidance without ever uploading sensitive data to the cloud. It answers complex questions about feeding, sleep architecture, and behavior in a secure private session. This is not just a chatbot; it is a clinical companion trained on standard WHO, AAP, and IAP guidelines to provide the same level of support you would get from a world-class specialist.",
    detail: "The model runs entirely offline, ensuring absolute data privacy. It understands the nuances of Indian parenting and combines it with global developmental science for personalized, immediate advice.",
    benefit: "Instant, private pediatrician-grade support available 24/7 without wait times or cloud privacy risks.",
    access: "Primary 'Intelligence' card at the footer of your main dashboard. Available for unlimited use.",
    scientificBasis: "Trained on 500+ research papers and clinical guidelines from WHO, AAP, and IAP.",
    markings: [
      { text: "Private Session", desc: "Your conversations never leave your device. Absolute privacy by design." },
      { text: "Clinical Grade", desc: "Information sourced from peer-reviewed medical journals and standards." },
      { text: "Immediate Reply", desc: "Get research-backed answers to your parenting queries in seconds." }
    ]
  },
  {
    id: "live_counter",
    icon: "⏱️",
    name: "Live Age Counter",
    tagline: "Precision Metrics",
    image: "/assets/neev-intelligence.jpeg",
    description: "Experience your child's journey down to the millisecond with our high-precision Live Age Counter, keeping you connected to their rapid architecture changes. During the first three years, a child's brain forms 1 million new neural connections every second. This counter is a psychological anchor, reminding you of the incredible speed of development and the value of every single moment you spend in meaningful interaction.",
    detail: "By visualizing growth in real-time, parents develop a stronger temporal bond with their child's evolution. It serves as a constant reminder that these foundational years are fleeting and immensely powerful.",
    benefit: "Provides a powerful psychological anchor to the importance of the foundational first 1000 days.",
    access: "Permanently visible at the top of the main Dashboard home view for immediate temporal awareness.",
    scientificBasis: "Rooted in developmental psychology and temporal bonding research.",
    markings: [
      { text: "Millisecond Sync", desc: "Track growth in real-time to appreciate the pace of neural evolution." },
      { text: "Temporal Bond", desc: "Strengthen the psychological connection to your child's early stages." },
      { text: "Growth Epochs", desc: "Visualizes where your child stands in the critical 1000-day window." }
    ]
  },
  {
    id: "neural_observation",
    icon: "👁️",
    name: "Neural Observation",
    tagline: "AI Pattern Analysis",
    image: "/assets/neural-observation.jpeg",
    description: "NEEV's empathetic AI observation layer analyzes daily data points to provide immediate, actionable feedback based on parent-child rhythms. It spots developmental trends weeks before they become apparent to the naked eye, identifying subtle patterns in rhythm and milestone progression. This 'second pair of eyes' helps you stay ahead of developmental leaps and provides the context needed to understand sudden changes in behavior or sleep.",
    detail: "Identifies correlations between activity types and sleep quality. It acts as a digital specialist rooted in real-world observations, translating complex data into simple, empathetic parenting advice.",
    benefit: "Gives you the foresight to predict developmental leaps and adjust your parenting strategy proactively.",
    access: "Integrated throughout the Dashboard as smart AI insight cards that update in real-time.",
    scientificBasis: "Powered by proprietary pattern recognition algorithms calibrated to developmental milestones.",
    markings: [
      { text: "Trend Spotting", desc: "Identify emerging skills and behaviors before they fully manifest." },
      { text: "Neural Alerts", desc: "Actionable notifications when the AI detects a developmental shift." },
      { text: "Empathetic Logic", desc: "Insights delivered with the nuance and care of a human specialist." }
    ]
  },
  {
    id: "growth_foundation",
    icon: "📈",
    name: "Growth Foundation",
    tagline: "WHO Curve Analysis",
    image: "/assets/growth-foundation.jpeg",
    description: "Physical measurement tracking with integrated WHO curve analysis. Monitor weight, height, and head circumference against international standards with clinical precision. The Growth Foundation module doesn't just log numbers; it plots them on high-fidelity growth charts, giving you immediate clarity on your child's physical development trajectory and ensuring they are thriving according to global benchmarks.",
    detail: "Provides immediate percentile mapping and trend graphing. It identifies growth plateaus or rapid changes that may require nutritional adjustments or clinical consultation.",
    benefit: "Immediate peace of mind regarding physical development and early identification of nutritional needs.",
    access: "Accessible via the 'Growth' pillar in the Nurture Hub. Supports multiple 'Little Ones'.",
    scientificBasis: "Directly utilizes the World Health Organization (WHO) Child Growth Standards (0-5 years).",
    markings: [
      { text: "WHO Accuracy", desc: "Compare metrics against global benchmarks for age and gender." },
      { text: "Percentile Map", desc: "Instant calculation of where your child stands relative to peers." },
      { text: "Head Growth", desc: "Dedicated tracking for brain volume indicators in early infancy." }
    ]
  },
  {
    id: "rhythm_hub",
    icon: "⏰",
    name: "Biological Rhythm Hub",
    tagline: "Sleep & Feed Monitoring",
    image: "/assets/biological-rhythm-hub.jpeg",
    description: "Monitor sleep cycles and feeding interval patterns with millisecond accuracy. The Rhythm Hub learns your child's unique internal clock to predict optimal next windows for rest and nutrition. By understanding these biological markers, you can anticipate your child's needs before they become overtired or distressed, leading to a much calmer household and significantly improved sleep architecture for the whole family.",
    detail: "Uses historical data to forecast sleep pressure and hunger cues. The predictive engine gets more accurate every day as it learns your baby's specific biological signature.",
    benefit: "Significantly improves sleep duration and reduces bedtime battles for both child and parent.",
    access: "Located under the 'Rhythm' section of the Nurture Hub. Integrated with daily reminders.",
    scientificBasis: "Based on circadian rhythm science and infant sleep architecture research.",
    markings: [
      { text: "Next Window", desc: "AI-predicted optimal time for the next nap or night sleep cycle." },
      { text: "Hunger Cues", desc: "Identify patterns in feeding intervals to predict hunger before crying starts." },
      { text: "Rhythm Depth", desc: "Analyze the consistency of your child's daily biological cycles." }
    ]
  },
  {
    id: "nutritional_engine",
    icon: "🍎",
    name: "Nutritional Engine",
    tagline: "Dietary Insights",
    image: "/assets/nutritional-engine.jpeg",
    description: "Comprehensive feeding logs and age-specific dietary insights. Track milk intake, solid introductions, and nutritional diversity as your child grows. The Nutritional Engine analyzes feeding frequency and volume to provide suggestions on meal timing and age-appropriate food variety, supporting the critical gut-brain axis development that occurs during the first three years of life.",
    detail: "Includes a dedicated 'First Solids' tracker to monitor for sensitivities and allergies. It maps nutrient intake against developmental requirements to ensure a balanced foundation.",
    benefit: "Ensures balanced nutrition and identifies potential sensitivities or allergies at the earliest stage.",
    access: "Enter via the 'Nutrition' card in the Nurture Hub. Supports complex multi-feed logging.",
    scientificBasis: "Nutrition guidelines sourced from UNICEF, WHO, and the IAP Nutrition Chapter.",
    markings: [
      { text: "Feeding Log", desc: "Track breast, bottle, or solid feeds with precise volume and timing." },
      { text: "Solid Map", desc: "Chronological record of new food introductions and baby's reactions." },
      { text: "Nutrient Sync", desc: "AI suggestions for food variety based on child's current growth leap." }
    ]
  },
  {
    id: "health_shield",
    icon: "🛡️",
    name: "Health Shield",
    tagline: "Integrated Medical History",
    image: "/assets/health-shield.jpeg",
    description: "Integrated vaccination tracking and medical history. Keep a secure, encrypted record of all clinical visits, symptoms, and upcoming immunization schedules. The Health Shield sends timely reminders for upcoming vaccinations and stores digital copies of medical records, ensuring you have every critical piece of health data available in your palm during emergency pediatric visits or routine checkups.",
    detail: "Includes a symptom logger and a temperature tracker. All medical data is stored with end-to-end encryption, ensuring only authorized family members have access.",
    benefit: "Ensures you never miss a critical immunization and have a complete medical vault for life.",
    access: "Located within the 'Medical' section of the Nurture Hub. Automated reminder system.",
    scientificBasis: "Immunization schedules based on the IAP (Indian Academy of Pediatrics) 2024 calendar.",
    markings: [
      { text: "Vax Reminders", desc: "Automated alerts for upcoming and overdue clinical immunizations." },
      { text: "Medical Vault", desc: "Securely upload and store prescriptions, reports, and health IDs." },
      { text: "Symptom Log", desc: "Record fever, stools, and mood to provide doctors with structured data." }
    ]
  },
  {
    id: "journey_hub",
    icon: "🏠",
    name: "Journey Hub",
    tagline: "Managing Your Legacy",
    image: "/assets/journey-hub.jpeg",
    description: "Symmetrical management for multiple children and family legacy. Your primary control center for profiles, settings, and private circles. The Journey Hub ensures that every memory, milestone, and measurement is organized into a beautiful, navigable archive that serves as a living record of your growth as a parent. It is the gatekeeper of your family's data privacy and the foundation of your account management.",
    detail: "Enables family sharing with up to 5 members (Grandparents, Nannies, etc.). Each member gets a specific role that controls what developmental data they can view and edit.",
    benefit: "Centralizes family management and gives you absolute control over data privacy and access.",
    access: "Tap the profile/home icon from any main dashboard screen. The core of your NEEV account.",
    scientificBasis: "Designed around data governance best practices and the DPDP Act 2023 guidelines.",
    markings: [
      { text: "Multi-Child", desc: "Seamlessly switch between children with distinct developmental profiles." },
      { text: "Privacy Control", desc: "Manage sharing permissions and secure your family's neural data." },
      { text: "Family Circle", desc: "Connect caregivers to the child's rhythm for consistent parenting." }
    ]
  }
];

export function Features() {
  const { ref, isVisible } = useScrollReveal();
  const [activeId, setActiveId] = useState<string | null>("pulse_morning");
  const activeFeature = useMemo(() => FEATURES.find(f => f.id === activeId), [activeId]);

  return (
    <section className="relative min-h-full w-full flex flex-col items-center justify-start overflow-visible bg-[#FAF3E0] pt-28 lg:pt-4" id="features" ref={ref}>

      {/* Ecosystem Header */}
      <div className="w-full text-center mt-4 lg:mt-6 mb-8 lg:mb-10 z-20 pointer-events-none px-10 lg:px-4">
        <h2 className="text-xl md:text-2xl lg:text-[1.85rem] font-black text-[#1F4D2C] leading-tight tracking-tight uppercase" style={{ fontFamily: "var(--font-heading)" }}>
          Where <span className="text-[#C9A84C] text-4xl lg:text-[3.5rem] font-black leading-none inline-block align-baseline translate-y-[2px]">12</span> Pillars Converge Into One Intelligent Ecosystem
        </h2>
      </div>

      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-10 lg:px-12 flex flex-col lg:flex-row items-stretch justify-between gap-8 h-auto lg:h-[540px] pb-24 lg:pb-0">

        {/* Left Section: Interactive Axon Pulse Navigator */}
        <div className="relative flex-none lg:flex-[0.7] h-auto lg:h-full flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-gold/10 pb-6 lg:pb-0 lg:pr-6">

          {/* Inner Golden Pulse Line - Permanent Downward */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-100 z-0">
             <motion.div
                className="absolute left-0 right-0 h-64 bg-gradient-to-b from-transparent via-gold/80 to-transparent"
                animate={{ top: ["-100%", "200%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
             />
          </div>

          {/* Vertical Green Pulse Line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-forest/30 overflow-hidden z-20">
             <motion.div
                className="w-full h-40 bg-gradient-to-b from-transparent via-forest-deep to-transparent"
                animate={{ top: ["-30%", "130%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ position: 'absolute' }}
             />
          </div>

          <div className="flex flex-row lg:flex-col gap-3 h-auto lg:h-full overflow-x-auto lg:overflow-y-auto invisible-scrollbar py-4 lg:py-1 z-10 w-full">
            {FEATURES.map((f) => (
              <motion.button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-500 min-w-[200px] lg:min-w-0 lg:w-full text-left border-2 ${
                  activeId === f.id
                    ? "bg-white border-[#C9A84C] shadow-xl scale-[1.02] z-30"
                    : "bg-white/30 border-transparent hover:bg-white/50"
                }`}
                whileHover={{ x: 5 }}
              >
                <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-lg lg:text-xl shadow-sm ${activeId === f.id ? "bg-amber-100" : "bg-white"}`}>
                  {f.icon}
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] lg:text-[11px] font-black uppercase tracking-widest ${activeId === f.id ? "text-[#1F4D2C]" : "text-[#1F4D2C]/60"}`}>{f.name}</p>
                  <p className="text-[8px] lg:text-[9px] font-bold text-[#C9A84C] italic leading-none">{f.tagline}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right Integrated View - Cinematic Neural Assembly Portal */}
        <div className="flex-[2.3] h-auto lg:h-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 lg:gap-6 relative bg-white/40 backdrop-blur-xl rounded-[2rem] lg:rounded-[3rem] border-2 border-gold/10 p-4 lg:p-10 shadow-2xl overflow-visible lg:overflow-hidden">
          <AnimatePresence mode="wait">
            {activeFeature && (
              <motion.div
                key={activeFeature.id}
                className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 lg:gap-6 w-full h-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {/* Information Column */}
                <div className="flex-1 lg:flex-[1.2] flex flex-col justify-start lg:justify-between h-auto lg:h-full py-1 lg:pr-4 lg:border-r border-gold/10 overflow-visible lg:overflow-y-auto invisible-scrollbar">
                  <div className="space-y-4 lg:space-y-6">
                    <div className="flex items-center gap-4 lg:gap-5">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-3xl lg:text-4xl shadow-sm border border-[#FDE68A]">
                        {activeFeature.icon}
                        </div>
                        <div>
                            <h3 className="text-xl lg:text-2xl font-black text-[#1F4D2C] uppercase tracking-tighter leading-none mb-1">
                            {activeFeature.name}
                            </h3>
                            <p className="text-base lg:text-lg font-bold text-gold italic leading-none">{activeFeature.tagline}</p>
                        </div>
                    </div>

                    <div className="space-y-3 lg:space-y-4">
                        <p className="text-[13px] lg:text-[14px] text-[#6B7F71] leading-relaxed font-bold">
                        {activeFeature.description}
                        </p>
                        <div className="p-4 lg:p-5 bg-[#A8D5BA]/20 rounded-2xl border-l-4 border-[#7A9E6A]">
                          <p className="text-[9px] lg:text-[10px] font-black text-[#2D5F3F] uppercase tracking-widest mb-1">Deep Clinical Context:</p>
                          <p className="text-[11px] lg:text-[12px] text-[#1F4D2C] font-semibold italic leading-snug">{activeFeature.detail}</p>
                        </div>
                    </div>
                  </div>

                  <div className="pt-4 lg:pt-5 mt-4 border-t border-gold/10 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <span className="text-[9px] lg:text-[10px] font-black text-forest/40 uppercase tracking-widest block">Primary Benefit</span>
                          <p className="text-[11px] lg:text-[12px] font-black text-[#1F4D2C] leading-tight">{activeFeature.benefit}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] lg:text-[10px] font-black text-forest/40 uppercase tracking-widest block">How to Access</span>
                          <p className="text-[11px] lg:text-[12px] font-black text-[#1F4D2C] leading-tight">{activeFeature.access}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Phone Simulator - MIDDLE of portal */}
                <div className="relative flex-none lg:flex-[0.7] flex items-center justify-center py-6 lg:py-0 order-last lg:order-none">
                  <div className="relative w-[180px] lg:w-full max-w-[240px] h-[360px] lg:h-[480px] rounded-[2rem] lg:rounded-[3rem] border-[6px] lg:border-[10px] border-[#1a1a1a] bg-[#1a1a1a] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] overflow-hidden">
                    <img src={activeFeature.image} className="w-full h-full object-cover" alt={activeFeature.name} />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 lg:w-16 h-2 lg:h-3.5 bg-[#1a1a1a] rounded-b-xl z-20" />
                  </div>
                </div>

                {/* Scientific Basis & Detailed Markings Column */}
                <div className="flex-1 lg:flex-[0.6] h-auto lg:h-full flex flex-col justify-start lg:justify-between lg:pl-2 w-full">
                   <div className="w-full">
                      <div className="mb-4">
                          <p className="text-[9px] lg:text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-1">Key Sections</p>
                          <div className="h-1 w-12 bg-gold/30 rounded-full" />
                      </div>

                      <div className="space-y-4 lg:space-y-6">
                          {activeFeature.markings.map((m, idx) => (
                            <motion.div
                                key={idx}
                                className="group flex flex-col gap-1.5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                            >
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
                                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#1F4D2C]">{m.text}</span>
                                </div>
                                <p className="text-[9px] lg:text-[10px] font-bold text-[#6B6555] italic leading-tight pl-4 border-l border-gold/20">
                                  {m.desc}
                                </p>
                            </motion.div>
                          ))}
                      </div>
                   </div>

                   <div className="mt-8 lg:mt-auto p-4 rounded-2xl bg-forest text-white shadow-xl border-l-4 border-gold">
                      <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Scientific Basis</p>
                      <p className="text-[10px] lg:text-[11px] font-bold leading-tight italic">
                        {activeFeature.scientificBasis}
                      </p>
                   </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

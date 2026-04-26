import { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader } from "../components/sections/Loader";
import { Portal } from "../components/sections/Portal";
import { Hero } from "../components/sections/Hero";
import { Philosophy } from "../components/sections/Philosophy";
import { Features } from "../components/sections/Features";
import { Science } from "../components/sections/Science";
import { PulseShowcase } from "../components/sections/PulseShowcase";
import { Testimonials } from "../components/sections/Testimonials";
import { Audience } from "../components/sections/Audience";
import { Pricing } from "../components/sections/Pricing";
import { Story } from "../components/sections/Story";
import { EndSection } from "../components/sections/EndSection";
import { Footer } from "../components/sections/Footer";
import { LeafParticles } from "../components/sections/Particles";
import { CustomCursor } from "../components/sections/CustomCursor";
import { Scene3D } from "../components/sections/Scene3D";

const NAV_MAP: Record<string, string> = {
  foundation: "FOUNDATION",
  features: "FEATURES",
  science: "SCIENCE",
  parents: "FOR PARENTS",
  reviews: "REVIEWS",
  pricing: "PRICING",
  story: "OUR STORY",
  philosophy: "PHILOSOPHY",
  newsletter: "NEWSLETTER",
  join: "JOIN US",
  about: "ABOUT US",
};

export default function Index() {
  const [phase, setPhase] = useState<"loading" | "portal" | "site">("loading");
  const [activeId, setActiveId] = useState("foundation");

  // Track which IDs are in which sidebar slots
  const [leftIds, setLeftIds] = useState(["features", "science", "parents", "philosophy", "pricing"]);
  const [rightIds, setRightIds] = useState(["story", "reviews", "newsletter", "join", "about"]);

  const onLoaderComplete = useCallback(() => setPhase("portal"), []);
  const onEnter = useCallback(() => setPhase("site"), []);

  const ActiveComponent = useMemo(() => {
    switch (activeId) {
      case "foundation": return <Hero />;
      case "features": return <Features />;
      case "science": return <Science />;
      case "parents": return <PulseShowcase />;
      case "reviews": return <Testimonials />;
      case "pricing": return <Pricing />;
      case "story": return <Story />;
      case "philosophy": return <Philosophy />;
      case "newsletter": return <EndSection />;
      case "join": return <Audience />;
      case "about": return <Footer />;
      default: return <Hero />;
    }
  }, [activeId]);

  const handleNavClick = (id: string, side: 'left' | 'right') => {
    const prevActive = activeId;
    if (side === 'left') {
      setLeftIds(prev => prev.map(item => item === id ? prevActive : item));
    } else {
      setRightIds(prev => prev.map(item => item === id ? prevActive : item));
    }
    setActiveId(id);
  };

  const navButtonClass = "group relative py-[1.2vh] lg:py-[2.2vh] px-1 md:px-2 lg:px-4 flex flex-col items-center justify-center transition-all duration-500 cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 border-b border-forest/10 last:border-b-0 w-full";
  const navLabelClass = "text-[clamp(11px,2.4vh,32px)] font-black tracking-tight lg:tracking-normal uppercase transition-colors duration-300 whitespace-nowrap";

  return (
    <div style={{ backgroundColor: phase === "site" ? "transparent" : "#FAF3E0", minHeight: "100vh", overflow: "hidden", position: "relative" }}>
      <CustomCursor />
      <Scene3D />

      <AnimatePresence>{phase === "loading" && <Loader onComplete={onLoaderComplete} />}</AnimatePresence>
      <AnimatePresence>{phase === "portal" && <Portal onEnter={onEnter} />}</AnimatePresence>

      <div style={{ visibility: phase === "site" ? "visible" : "hidden", height: "100dvh", width: "100%", position: "fixed", inset: 0, overflow: "hidden" }}>
        <LeafParticles />

        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* HEADER BAR */}
          <div className="absolute top-0 left-0 right-0 h-16 lg:h-28 flex items-center z-[110]">
             <div className="w-full max-w-[95vw] lg:max-w-[1200px] mx-auto flex items-center px-4 lg:px-10">
                {/* Left Logo - Positioned between end and center */}
                <div className="flex-1 flex items-center justify-center pointer-events-auto">
                    <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="flex items-center gap-2 lg:gap-4 group">
                      <motion.div
                        className="w-8 h-8 lg:w-14 lg:h-14 rounded-full overflow-hidden border-2 border-gold/50 shadow-lg transform"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      >
                        <img src="/assets/neev-logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                      </motion.div>
                      <span className="text-lg lg:text-3xl font-black tracking-widest text-forest" style={{ fontFamily: "var(--font-heading)" }}>NEEV</span>
                    </a>
                </div>

                {/* Center Title */}
                <div className="flex-1 flex justify-center">
                    <motion.div key={activeId} layoutId={`nav-label-${activeId}`} className="text-sm md:text-2xl lg:text-4xl font-black tracking-[0.2em] lg:tracking-[0.4em] text-forest border-y-2 lg:border-y-4 border-gold pt-1 pb-1.5 lg:pt-2 lg:pb-3 px-4 lg:px-10 pointer-events-auto text-center" style={{ fontFamily: "var(--font-heading)" }}>
                      {NAV_MAP[activeId]}
                    </motion.div>
                </div>

                {/* Right Action - Positioned between end and center */}
                <div className="flex-1 flex items-center justify-center pointer-events-auto scale-75 lg:scale-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick("newsletter", "right");
                      }}
                      className="px-6 py-2 lg:px-10 lg:py-4 rounded-full text-xs lg:text-base font-bold text-white shadow-xl hover:shadow-forest/30 transition-all active:scale-95 bg-gradient-to-br from-forest to-forest-deep cursor-pointer"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Download Beta
                    </button>
                </div>
             </div>
          </div>

          {/* LEFT SIDEBAR */}
          <motion.div
            animate={{
              boxShadow: ["0 0 10px rgba(31, 77, 44, 0.1)", "0 0 30px rgba(31, 77, 44, 0.4)", "0 0 10px rgba(31, 77, 44, 0.1)"],
              borderColor: ["rgba(31, 77, 44, 0.05)", "rgba(31, 77, 44, 0.4)", "rgba(31, 77, 44, 0.05)"]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0.5 lg:left-4 top-1/2 -translate-y-1/2 w-8 lg:w-20 py-[1vh] lg:py-[2vh] flex flex-col items-center justify-center z-50 bg-[#A8D5BA]/15 backdrop-blur-3xl rounded-full border-2 border-forest/10 opacity-80 hover:opacity-100 transition-all duration-500 overflow-hidden"
          >
            {/* Inner Golden Pulse Line - Permanent Downward - Hardcoded visibility */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-100">
               <motion.div className="absolute left-0 right-0 h-64 bg-gradient-to-b from-transparent via-gold/40 to-transparent" animate={{ top: ["-100%", "200%"] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
            </div>

            {/* Vertical Green Pulse Line (Features Style) - Hardcoded visibility */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-forest/10 overflow-hidden">
               <motion.div
                  className="w-full h-40 bg-gradient-to-b from-transparent via-forest to-transparent"
                  animate={{ top: ["-30%", "130%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ position: 'absolute' }}
               />
            </div>

            {leftIds.map((id) => (
              <motion.button key={id} layoutId={`nav-label-${id}`} onClick={() => handleNavClick(id, 'left')} className={navButtonClass}>
                <span className={`${navLabelClass} [writing-mode:vertical-lr] rotate-180 text-forest group-hover:text-forest-deep`}>{NAV_MAP[id]}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* RIGHT SIDEBAR */}
          <motion.div
            animate={{
              boxShadow: ["0 0 10px rgba(31, 77, 44, 0.1)", "0 0 30px rgba(31, 77, 44, 0.4)", "0 0 10px rgba(31, 77, 44, 0.1)"],
              borderColor: ["rgba(31, 77, 44, 0.05)", "rgba(31, 77, 44, 0.4)", "rgba(31, 77, 44, 0.05)"]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-0.5 lg:right-4 top-1/2 -translate-y-1/2 w-8 lg:w-20 py-[1vh] lg:py-[2vh] flex flex-col items-center justify-center z-50 bg-[#A8D5BA]/15 backdrop-blur-3xl rounded-full border-2 border-forest/10 opacity-80 hover:opacity-100 transition-all duration-500 overflow-hidden"
          >
            {/* Inner Golden Pulse Line - Permanent Downward - Hardcoded visibility */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-100">
               <motion.div className="absolute left-0 right-0 h-64 bg-gradient-to-b from-transparent via-gold/40 to-transparent" animate={{ top: ["-100%", "200%"] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
            </div>

            {/* Vertical Green Pulse Line (Features Style) - Hardcoded visibility */}
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-forest/10 overflow-hidden">
               <motion.div
                  className="w-full h-40 bg-gradient-to-b from-transparent via-forest to-transparent"
                  animate={{ top: ["-30%", "130%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ position: 'absolute' }}
               />
            </div>

            {rightIds.map((id) => (
              <motion.button key={id} layoutId={`nav-label-${id}`} onClick={() => handleNavClick(id, 'right')} className={navButtonClass}>
                <span className={`${navLabelClass} [writing-mode:vertical-lr] text-forest group-hover:text-forest-deep`}>{NAV_MAP[id]}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        <main className="absolute inset-0 z-0 pt-8 lg:pt-14 overflow-hidden">
           <AnimatePresence mode="wait" initial={false}>
              <motion.div
                 key={activeId}
                 initial={{ opacity: 0, scale: 0.99, y: 5 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 1.01, y: -5 }}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className="h-full w-full overflow-y-auto px-8 lg:px-20 scroll-smooth custom-scrollbar"
                 style={{ WebkitOverflowScrolling: "touch" }}
              >
                 <div className="min-h-full pb-16 flex flex-col items-center justify-center">
                    {ActiveComponent}
                 </div>
              </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

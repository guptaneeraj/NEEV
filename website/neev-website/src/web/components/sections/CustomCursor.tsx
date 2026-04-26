import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";

export function CustomCursor() {
  const [isIntroduced, setIsIntroduced] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const introTriggered = useRef(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const introText = "Hi, I’m a neuron—one of billions. Come with me. I’ll guide you through NEEV, a research-backed platform shaping your child’s early brain development—aligned with global standards, designed for parents worldwide.";

  useEffect(() => {
    // Disable all cursor logic on mobile
    if (window.innerWidth < 768) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleInteraction = () => {
      if (!introTriggered.current) {
        introTriggered.current = true;
        triggerIntro();
      } else {
        // If clicked again, close it immediately
        setShowIntro(false);
        setIsIntroduced(true);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleInteraction);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleInteraction);
    };
  }, []);

  const triggerIntro = () => {
    setShowIntro(true);
    // Automatically hide after 10 seconds if not clicked away
    setTimeout(() => {
      setShowIntro(false);
      setIsIntroduced(true);
    }, 10000);
  };

  // Only render on desktop
  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none hidden md:block">

      {/* Intro Message Box */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed top-0 left-0 ml-16 bg-white/95 backdrop-blur-2xl p-6 rounded-[2.5rem] border-2 border-gold/40 shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-w-sm pointer-events-none"
            style={{ translateX: cursorXSpring, translateY: cursorYSpring, y: "-50%" }}
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
          >
            <div className="flex items-center gap-2 mb-3">
               <motion.div
                 className="flex gap-0.5"
                 animate={{ opacity: [0.4, 1, 0.4] }}
                 transition={{ duration: 1, repeat: Infinity }}
               >
                  {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-gold rounded-full" />)}
               </motion.div>
               <p className="text-forest font-black uppercase text-[10px] tracking-[0.3em]">Neural Transmission</p>
            </div>

            <p className="text-forest-deep text-sm font-bold leading-relaxed italic" style={{ fontFamily: "var(--font-tagline)" }}>
              "{introText}"
            </p>

            <div className="mt-5 h-1 w-full bg-forest/5 rounded-full overflow-hidden">
               <motion.div
                 className="h-full bg-gold"
                 initial={{ width: "0%" }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 10, ease: "linear" }}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Neuron Cursor - Smaller by 1/3rd */}
      <motion.div
        className="fixed top-0 left-0 w-14 h-14 flex items-center justify-center pointer-events-none"
        style={{
          translateX: cursorXSpring,
          translateY: cursorYSpring,
          x: "-50%",
          y: "-50%",
        }}
      >
        <motion.div
          className="w-full h-full relative"
          animate={{
            rotate: showIntro ? [0, 20, -15, 10, 0] : [0, 5, -5, 0],
            scale: showIntro ? [1, 1.15, 1] : [1, 1.05, 1]
          }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/assets/cursor.png"
            alt="Neuron Cursor"
            className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(201,168,76,0.6)]"
            onError={(e) => {
               (e.target as HTMLImageElement).src = '/assets/cursor.jpeg';
            }}
          />
        </motion.div>
      </motion.div>

      {/* Trailing Neural Pulse - Gold Glow */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 shadow-[0_0_15px_rgba(201,168,76,0.2)]"
        style={{
          translateX: useSpring(cursorX, { damping: 45, stiffness: 100 }),
          translateY: useSpring(cursorY, { damping: 45, stiffness: 100 }),
          x: "-50%",
          y: "-50%",
        }}
      />
    </div>
  );
}

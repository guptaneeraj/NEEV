import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Loader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => setPhase(3), 2500);
    const t4 = setTimeout(() => onComplete(), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(180deg, #FAF3E0 0%, #FFF9EB 100%)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Real Logo animation */}
          <motion.div
            className="relative scale-75 lg:scale-100"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            transition={{
              scale: { duration: 1, type: "spring", bounce: 0.4 },
              opacity: { duration: 1 },
              rotate: { duration: 15, repeat: Infinity, ease: "linear" }
            }}
          >
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#C9A84C] shadow-2xl">
              <img
                src="/assets/neev-logo.jpeg"
                className="w-full h-full object-cover"
                alt="Neev Logo"
              />
            </div>
            {/* Ambient Pulse around logo */}
            <motion.div
              className="absolute -inset-4 rounded-full border-2 border-[#7A9E6A]/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* Text Status */}
          <motion.div
            className="mt-12 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-[#1F4D2C] text-sm font-bold tracking-[0.4em] uppercase">
              {phase >= 2 ? "Growing foundations..." : "NEEV Awakening..."}
            </div>
            {/* Progress vine */}
            <div className="mt-4 w-48 h-1 bg-[#1F4D2C]/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #7A9E6A, #C9A84C)" }}
                initial={{ width: "0%" }}
                animate={{ width: phase >= 2 ? "100%" : phase >= 1 ? "50%" : "0%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

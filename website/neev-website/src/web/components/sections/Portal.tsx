import { motion } from "framer-motion";
import { Fireflies } from "./Particles";

export function Portal({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#060E09" }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        onCanPlayThrough={(e) => {
          (e.target as HTMLVideoElement).play().catch(() => {});
        }}
      >
        <source src="/assets/neural-growth.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30" />

      <Fireflies count={20} />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        {/* Logo Container - Glow Removed */}
        <motion.div
          className="relative w-24 h-24 lg:w-32 lg:h-32 mb-6 lg:mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{
            scale: { type: "spring", bounce: 0.5, duration: 1, delay: 0.5 },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
          }}
        >
          <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-[#C9A84C]">
             <img
                src="/assets/neev-logo.jpeg"
                className="w-full h-full object-cover"
                alt="Neev Logo"
              />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-7xl font-black tracking-widest text-white mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.2em" }}
          transition={{ duration: 1.5, delay: 0.8 }}
        >
          NEEV
        </motion.h1>

        <motion.p
          className="text-[#C9A84C] text-[10px] md:text-lg font-bold tracking-[0.1em] uppercase mb-8 lg:mb-10 italic max-w-2xl px-4"
          style={{ fontFamily: "var(--font-tagline)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          Neural Engine for Early Values,<br />Intelligence & Optimized Support.
        </motion.p>

        <motion.button
          onClick={onEnter}
          className="group relative px-8 lg:px-12 py-3.5 lg:py-5 rounded-full overflow-hidden glass hover:bg-white/20 transition-all duration-500 shadow-xl border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10 text-white tracking-[0.2em] uppercase text-xs lg:text-sm font-black"
            style={{ fontFamily: "var(--font-body)" }}>
            Enter the NEEV Ecosystem
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

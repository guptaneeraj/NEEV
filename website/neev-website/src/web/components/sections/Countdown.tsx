import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LAUNCH = Date.UTC(2026, 5, 18, 18, 31, 0);

function getTimeLeft() {
  const diff = Math.max(0, LAUNCH - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function Digit({ value }: { value: string }) {
  return (
    <div className="relative w-[1.1rem] h-[1.8rem] sm:w-[1.4rem] sm:h-[2.2rem] md:w-7 md:h-11 lg:w-8 lg:h-13 bg-[#1A1A1A] rounded-[0.3rem] sm:rounded-md overflow-hidden flex items-center justify-center border-t border-white/5 shadow-md"
      style={{ backdropFilter: "blur(4px)" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -5, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tighter"
          style={{
            color: "#C9A84C",
            fontFamily: "monospace"
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>

      <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-black/40 z-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
}

function FlapUnit({ value, label }: { value: number; label: string }) {
  const displayValue = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <div className="flex gap-0.5 sm:gap-1">
        <Digit value={displayValue[0]} />
        <Digit value={displayValue[1]} />
      </div>
      <span className="text-[6px] sm:text-[8px] font-bold uppercase tracking-[0.1em] text-[#1F4D2C]/40">
        {label}
      </span>
    </div>
  );
}

export function Countdown() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex gap-1 sm:gap-2.5 md:gap-3 lg:gap-4 items-center justify-center">
      <FlapUnit value={time.days} label="Days" />
      <FlapUnit value={time.hours} label="Hours" />
      <FlapUnit value={time.minutes} label="Mins" />
      <FlapUnit value={time.seconds} label="Secs" />
    </div>
  );
}





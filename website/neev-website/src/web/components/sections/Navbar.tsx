import { useState, useEffect } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-500 ${scrolled ? "bg-white/70 backdrop-blur-xl py-2 lg:py-3 shadow-lg border-b border-white/20" : "py-4 lg:py-6"}`}>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 flex items-center justify-between">
        {/* Logo - Updated to use app logo */}
        <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="flex items-center gap-3 lg:gap-5 group pointer-events-auto">
          <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-[#C9A84C]/50 shadow-lg transform group-hover:scale-105 transition-transform duration-300">
            <img
              src="/assets/neev-logo.jpeg"
              alt="NEEV Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl lg:text-4xl font-black tracking-[0.2em] text-[#1F4D2C]"
            style={{ fontFamily: "var(--font-heading)" }}>
            NEEV
          </span>
        </a>
      </div>
    </nav>
  );
}

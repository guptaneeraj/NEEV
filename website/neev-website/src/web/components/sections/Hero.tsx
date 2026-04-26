import { useState } from "react";
import { Countdown } from "./Countdown";
import { Fireflies } from "./Particles";
import { HeroPhone } from "./HeroPhone";
import { InfoPanel } from "./InfoPanel";

export function Hero() {
  const [currentScreen, setCurrentScreen] = useState("landing");

  return (
    <section className="relative h-auto lg:h-screen flex flex-col items-center justify-start lg:justify-center overflow-hidden bg-[#FAF3E0] pt-6 sm:pt-10 lg:pt-0 pb-16 lg:pb-0" id="hero">
      <Fireflies />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col lg:flex-row items-center lg:items-center justify-center gap-4 sm:gap-8 lg:gap-0 h-full">
        {/* Left Content - Balanced for center alignment */}
        <div className="flex flex-col items-center text-center w-full lg:flex-1 max-w-[540px] space-y-5 sm:space-y-6 lg:space-y-10 justify-start pt-2 lg:pt-0">
          <div className="space-y-3 md:space-y-5">
            <h1 className="text-3xl md:text-5xl lg:text-[3.6rem] xl:text-[4.2rem] font-black leading-[1.1] text-[#1F4D2C]">
              The first three years shape <br /><span className="text-[#C9A84C]">a lifetime</span>
            </h1>

            <p className="text-sm md:text-lg lg:text-lg xl:text-2xl text-[#6B6555] max-w-md leading-relaxed font-semibold italic opacity-90 mx-auto">
              Personalized AI guidance for pregnancy and your child's early years.
            </p>

            <div className="text-[12px] md:text-[15px] lg:text-[15px] xl:text-[17px] text-[#6B7F71] max-w-md leading-relaxed font-medium border-l-4 border-[#C9A84C] pl-5 md:pl-6 py-3 bg-white/30 backdrop-blur-sm shadow-sm rounded-r-2xl mx-auto">
              Neev combines developmental science to give you real-time,
              personalized guidance. Our on-device AI ensures your data is never shared.
            </div>
          </div>

          {/* Timer Box - Compact but Scaled */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 w-full max-w-[85%] sm:max-w-md p-4 sm:p-6 lg:p-8 rounded-[2rem] bg-white/50 backdrop-blur-md border-2 border-[#C9A84C]/20 shadow-xl shadow-[#C9A84C]/5 mx-auto">
            <p className="text-[8px] sm:text-[10px] lg:text-[11px] font-bold text-[#1F4D2C] opacity-70 text-center uppercase tracking-[0.2em] leading-none">
              Live on App Store in:
            </p>

            <div className="w-full flex justify-center scale-90 sm:scale-100">
              <Countdown />
            </div>

            <div
              className="inline-flex items-center gap-1.5 px-3 lg:px-6 py-1.5 rounded-full shadow-md border border-[#7A9E6A]/30 bg-white"
            >
              <span className="w-1 h-1 lg:w-2 lg:h-2 rounded-full bg-[#7A9E6A] animate-pulse" />
              <span className="text-[8px] lg:text-[10px] font-bold tracking-[0.15em] uppercase text-[#7A9E6A]">
                323 families already in beta
              </span>
            </div>
          </div>
        </div>

        {/* Center - The Phone Emulator - Exactly Centered */}
        <div className="flex flex-none lg:flex-1 items-center justify-center relative pointer-events-auto w-full max-w-[95%] sm:max-w-[330px] lg:max-w-[360px] z-20">
           <HeroPhone onScreenChange={setCurrentScreen} />
        </div>

        {/* Right - Modern Information Provider - Balanced for center alignment */}
        <div className="flex flex-none lg:flex-1 items-center justify-center relative w-full max-w-[460px] lg:max-w-[500px]">
           <InfoPanel screen={currentScreen} />
        </div>
      </div>
    </section>
  );
}

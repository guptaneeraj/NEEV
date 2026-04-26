import { AppSimulator } from "./AppSimulator";

interface PhoneModelProps {
  onScreenChange?: (screen: any) => void;
}

export function HeroPhone({ onScreenChange }: PhoneModelProps) {
  return (
    <div className="relative w-full max-w-[290px] sm:max-w-[310px] md:max-w-[320px] h-[580px] sm:h-[620px] lg:h-[80vh] xl:h-[85vh] max-h-[700px] mx-auto pointer-events-auto flex items-center justify-center">
      {/* High-Fidelity Phone Border */}
      <div className="relative w-full h-full rounded-[2.8rem] border-[9px] md:border-[11px] border-[#1a1a1a] bg-[#1a1a1a] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Notch - Smaller and Refined */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 md:w-20 h-3 md:h-4 bg-[#1a1a1a] rounded-b-2xl z-20" />

        {/* App Content - Perfectly matched to inner frame */}
        <div className="w-full h-full bg-[#FAF3E0] relative z-10">
          <AppSimulator onScreenChange={onScreenChange} />
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-black/10 z-20" />
      </div>

      {/* Decorative Outer Glow */}
      <div className="absolute -inset-4 rounded-[4rem] bg-[#C9A84C]/5 blur-2xl -z-10" />
    </div>
  );
}

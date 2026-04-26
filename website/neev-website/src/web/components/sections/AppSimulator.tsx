import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Screen = "landing" | "login" | "otp" | "dashboard" | "insights" | "plan" | "aichat" | "profile" | "pulse_detail" | "nurture_hub" | "milestones" | "health" | "rhythm" | "insights_detail";

interface AppSimulatorProps {
  onScreenChange?: (screen: Screen) => void;
}

export function AppSimulator({ onScreenChange }: AppSimulatorProps) {
  const [history, setHistory] = useState<Screen[]>(["landing"]);
  const [otpSent, setOtpSent] = useState(false);
  const [activeCheckin, setActiveCheckin] = useState<"morning" | "evening" | null>(null);

  const currentScreen = history[history.length - 1];

  useEffect(() => {
    onScreenChange?.(currentScreen);
  }, [currentScreen, onScreenChange]);

  const navigate = (screen: Screen) => {
    setHistory(prev => [...prev, screen]);
  };

  const goBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
      if (currentScreen === "otp") setOtpSent(false);
    }
  };

  const LandingScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-between py-[6vh] px-[8%] text-center bg-black relative animate-in fade-in duration-500 overflow-hidden pointer-events-auto h-full w-full">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110 pointer-events-none">
        <source src="/assets/neural-growth.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center mt-[2vh]">
        <motion.div
          className="w-[10vh] h-[10vh] rounded-full border-2 border-[#A8D5BA] p-1 mb-[1.5vh] shadow-[0_0_20px_rgba(168,230,207,0.4)] flex items-center justify-center bg-[#a8e6cf33] overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
           <img src="/assets/neev-logo.jpeg" className="w-full h-full object-cover rounded-full" alt="logo" />
        </motion.div>
        <h1 className="text-[clamp(2rem,5vh,3.5rem)] font-black text-white tracking-[0.2em] leading-none mb-[1vh]">NEEV</h1>
        <p className="text-white text-[clamp(0.6rem,1.2vh,0.9rem)] font-bold tracking-[0.2em] uppercase opacity-90">AI-Guided Parenting</p>
      </div>

      <div className="relative z-10 space-y-[1.5vh] mb-[1.5vh]">
        <h2 className="text-white text-[clamp(0.9rem,1.8vh,1.3rem)] font-black leading-[1.3] px-1">
          Neural Engine for Early Values,<br/>Intelligence & Optimized Support.
        </h2>
        <p className="text-[#E0E9E3] text-[clamp(0.55rem,1.1vh,0.8rem)] font-bold leading-relaxed opacity-80">
          Personalized guidance for pregnancy<br/>and your child's early years
        </p>
      </div>

      <div className="relative z-10 w-full mb-[4vh] flex flex-col items-center">
        <button
          onClick={() => navigate("login")}
          className="relative w-full py-[1.8vh] bg-[#A8D5BA] rounded-full text-[#2D5F3F] font-black text-[clamp(0.9rem,2vh,1.3rem)] shadow-[0_0_30px_rgba(168,230,207,0.5)] cursor-pointer active:scale-95 transition-all border-2 lg:border-4 border-white animate-pulse z-10 overflow-hidden mb-[1vh]"
        >
          <span className="relative z-10">Begin Journey</span>
          <div className="absolute inset-0 bg-white/20 -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </button>

        <div className="flex flex-col items-center pointer-events-none space-y-[0.3vh] mb-[1vh]">
          <span className="text-[4vh] drop-shadow-md animate-bounce">👆</span>
          <div className="flex items-center gap-2 bg-[#C9A84C] text-black text-[clamp(0.5rem,1.1vh,0.7rem)] font-black px-[2vh] py-[1vh] rounded-full shadow-[0_0_20px_rgba(201,168,76,0.6)] border-2 border-white/20">
             <span>Tap Here</span>
          </div>
        </div>
      </div>
    </div>
  );

  const LoginScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-start py-[5vh] px-[8%] bg-black relative text-left animate-in slide-in-from-right duration-300 overflow-hidden pointer-events-auto h-full w-full">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"><source src="/assets/neural-growth.mp4" type="video/mp4" /></video>
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      <div className="relative z-30 w-full mb-[3vh]">
        <button onClick={goBack} className="text-white bg-white/10 w-[5vh] h-[5vh] rounded-full flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer border-2 border-white shadow-xl">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-[2.5vh] h-[2.5vh]"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
      </div>
      <div className="relative z-10 flex flex-col items-center text-center mb-[3vh]">
        <motion.div
          className="w-[7vh] h-[7vh] rounded-full border-2 border-[#A8D5BA] p-0.5 mb-[1.2vh] bg-black/20 overflow-hidden shadow-lg"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          <img src="/assets/neev-logo.jpeg" className="w-full h-full object-cover rounded-full" alt="logo" />
        </motion.div>
        <h1 className="text-[clamp(1.2rem,3.5vh,2.2rem)] font-black text-white tracking-[0.2em] leading-none">NEEV</h1>
      </div>
      <div className="relative z-10 w-full space-y-[2vh]">
        <div className="text-center">
          <h3 className="text-white text-[clamp(1rem,2.5vh,1.5rem)] font-black mb-[0.5vh]">{otpSent ? 'Verify' : 'Login'}</h3>
          <p className="text-[#E0E9E3] text-[clamp(0.55rem,1.1vh,0.75rem)] font-bold opacity-80">{otpSent ? "Verification code sent to parent@neevios.com" : "Let's continue your parenting journey"}</p>
        </div>
        {!otpSent ? (
          <div className="w-full h-[5vh] bg-white/10 rounded-[15px] border border-[#a8e6cf4d] flex items-center px-4">
             <svg className="text-[#A8D5BA] mr-3 w-[2vh] h-[2.5vh]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
             <input type="text" placeholder="Email" className="bg-transparent flex-1 outline-none text-white text-[clamp(0.65rem,1.4vh,0.9rem)] font-black" readOnly value="parent@neevios.com" />
          </div>
        ) : (
          <div className="flex justify-between w-full gap-2 px-1">
            {[1,2,3,4,5,6].map(i => <div key={i} className="w-[14%] aspect-[3/4] rounded-xl bg-white border-2 border-[#A8D5BA] flex items-center justify-center text-[#2D5F3F] font-black text-[clamp(0.8rem,1.8vh,1.2rem)] shadow-inner">●</div>)}
          </div>
        )}
        <button onClick={() => !otpSent ? setOtpSent(true) : navigate("dashboard")} className="w-full py-[1.8vh] bg-[#A8D5BA] rounded-full text-[#2D5F3F] font-black text-[clamp(0.7rem,1.6vh,1.1rem)] shadow-xl cursor-pointer">
          {otpSent ? 'Verify & Continue' : 'Get OTP'}
        </button>
      </div>
    </div>
  );

  const DashboardScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in fade-in duration-500 overflow-hidden relative pointer-events-auto text-left h-full w-full">
      <div className="p-3 flex items-center justify-between border-b border-[#FDE68A] bg-white pt-[4vh] z-10">
        <div className="flex items-center gap-2">
          <div onClick={() => navigate("profile")} className="w-[4.5vh] h-[4.5vh] rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center cursor-pointer overflow-hidden">
             <img src="/assets/profile-photo.jpeg" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[clamp(7px,1.1vh,9px)] text-[#6B7F71] italic font-serif leading-none">Good morning</p>
            <p className="text-[clamp(10px,1.6vh,14px)] font-black text-[#2D5F3F]">Alisha</p>
          </div>
        </div>
        <motion.div
          onClick={goBack}
          className="w-[4.5vh] h-[4.5vh] rounded-full overflow-hidden border-2 border-[#C9A84C]/30 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          <img src="/assets/neev-logo.jpeg" className="w-full h-full object-cover" />
        </motion.div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-[1.5vh] z-10 pb-[4vh]">
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={() => navigate("insights")} className="bg-white p-[1vh] rounded-xl border-1.5 border-[#FDE68A] flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"><span className="text-[1.8vh]">🪄</span><span className="text-[clamp(6px,0.9vh,8px)] font-black text-[#2D5F3F] uppercase tracking-tighter">Discovery</span></button>
          <button onClick={() => navigate("plan")} className="bg-white p-[1vh] rounded-xl border-1.5 border-[#FDE68A] flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"><span className="text-[1.8vh]">🌿</span><span className="text-[clamp(6px,0.9vh,8px)] font-black text-[#2D5F3F] uppercase tracking-tighter">Plan</span></button>
          <button onClick={() => navigate("nurture_hub")} className="bg-white p-[1vh] rounded-xl border-1.5 border-[#FDE68A] flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"><span className="text-[1.8vh]">🏠</span><span className="text-[clamp(6px,0.9vh,8px)] font-black text-[#2D5F3F] uppercase tracking-tighter">Hub</span></button>
          <button onClick={() => navigate("pulse_detail")} className="bg-white p-[1vh] rounded-xl border-1.5 border-[#FDE68A] flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"><span className="text-[1.8vh]">💓</span><span className="text-[clamp(6px,0.9vh,8px)] font-black text-[#2D5F3F] uppercase tracking-tighter">Pulse</span></button>
        </div>

        <div className="bg-white p-[1.5vh] rounded-[1.5rem] border-1.5 border-[#FDE68A] shadow-sm space-y-[1vh]">
           <div className="flex items-center gap-2"><div className="w-[2.5vh] h-[2.5vh] rounded-full bg-[#2D5F3F] flex items-center justify-center text-[1vh] text-white">💓</div><span className="text-[clamp(7px,1.1vh,9px)] font-black text-[#2D5F3F] tracking-widest uppercase">The Pulse</span></div>
           <div className="flex gap-2">
              <button onClick={() => setActiveCheckin("morning")} className={`flex-1 py-[1.2vh] rounded-xl flex flex-col items-center justify-center border transition-all ${activeCheckin === "morning" ? "bg-[#A8D5BA] border-[#2D5F3F]" : "bg-[#E0F2E9] border-[#A8D5BA]/30"}`}><span className="text-[2vh]">☀️</span><span className="text-[clamp(7px,1.1vh,9px)] font-black text-[#2D5F3F] uppercase mt-0.5">Morning</span></button>
              <button onClick={() => setActiveCheckin("evening")} className={`flex-1 py-[1.2vh] rounded-xl flex flex-col items-center justify-center border transition-all ${activeCheckin === "evening" ? "bg-[#FDE68A] border-[#C9A84C]" : "bg-[#FFF1F2] border-[#FECDD3]/30"}`}><span className="text-[2vh]">🌙</span><span className="text-[clamp(7px,1.1vh,9px)] font-black text-[#6B7F71] uppercase mt-0.5">Evening</span></button>
           </div>
           <p className="text-[clamp(9px,1.3vh,12px)] font-bold italic text-[#6B7F71] leading-relaxed">{activeCheckin === "morning" ? "Intention: Connected. Energy: High." : activeCheckin === "evening" ? "Review: Reflective. Energy: Calm." : "Neev is analyzing your morning rhythm..."}</p>
        </div>

        <div className="bg-white p-[1.5vh] rounded-[1.5rem] border-1.5 border-[#FDE68A] shadow-sm space-y-[1vh] text-left">
           <div className="flex items-center gap-2"><div className="w-[2.5vh] h-[2.5vh] rounded-full bg-[#2D5F3F] flex items-center justify-center text-[1vh] text-white">🌱</div><span className="text-[clamp(7px,1.1vh,9px)] font-black text-[#2D5F3F] tracking-widest uppercase">Nurture Pulse</span></div>
           <div className="space-y-0"><p className="text-[clamp(9px,1.3vh,12px)] text-[#6B7F71] italic font-serif leading-none">Rohan is</p>
              <div className="flex items-end gap-1"><span className="text-[2.5vh] font-black text-[#2D5F3F]">14</span><span className="text-[1vh] font-bold text-[#6B7F71] mb-[0.3vh]">MON</span><span className="text-[2.5vh] font-black text-[#2D5F3F]">12</span><span className="text-[1vh] font-bold text-[#6B7F71] mb-[0.3vh]">DAYS</span><span className="text-[2.5vh] font-black text-[#A8D5BA]">42</span><span className="text-[1vh] font-bold text-[#6B7F71] mb-[0.3vh]">SEC</span></div>
           </div>
           <div className="bg-[#F8FAFC] p-[1.2vh] rounded-xl border-l-4 border-[#2D5F3F]"><p className="text-[clamp(7px,1.1vh,9px)] font-black text-[#2D5F3F] tracking-widest mb-0.5 uppercase">AI Suggestion:</p><p className="text-[clamp(9px,1.3vh,12px)] font-bold text-[#6B7F71] italic leading-snug">"Rohan is showing high sensory awareness today."</p></div>
        </div>
        <div onClick={() => navigate("aichat")} className="bg-[#1F4D2C] p-[2vh] rounded-[2rem] flex items-center gap-[1.5vh] cursor-pointer shadow-xl hover:brightness-110 active:scale-95 transition-all">
          <motion.div
            className="w-[5vh] h-[5vh] rounded-full overflow-hidden bg-[#FEF3C7] flex items-center justify-center shadow-lg"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <img src="/assets/neev-logo.jpeg" className="w-full h-full object-cover" />
          </motion.div>
          <div className="flex-1 text-left"><p className="text-white font-black text-[clamp(12px,2vh,18px)] leading-none mb-1">NEEV Intelligence</p><p className="text-[#A8D5BA] text-[clamp(7px,1.1vh,9px)] font-bold uppercase tracking-wider">AI Assistant</p></div>
        </div>
      </div>
    </div>
  );

  const DiscoveryScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto text-left h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white shadow-sm">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md active:scale-90 transition-all z-30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 text-center pr-[6vh]"><p className="text-[clamp(14px,2vh,20px)] font-black text-[#2D5F3F] leading-tight">Discovery Hub</p><p className="text-[clamp(8px,1.2vh,10px)] text-[#6B7F71] font-bold uppercase tracking-wider">Play Intelligence</p></div>
      </div>
      <div className="flex-1 p-[3vh] space-y-[3vh] overflow-y-auto">
        <div className="bg-white p-[1.5vh] rounded-[2.2rem] border-1.5 border-[#FDE68A] flex items-center gap-[2vh] shadow-sm">
           <div className="w-[7vh] h-[7vh] rounded-full bg-[#FFFBEB] flex items-center justify-center text-[3.5vh] border border-[#FEF3C7]">🌟</div>
           <div className="flex-1 text-left"><p className="text-[clamp(8px,1.1vh,9px)] font-black text-[#6B7F71] tracking-[0.2em] uppercase">Neev Intelligence</p><p className="text-[clamp(13px,1.9vh,18px)] font-black text-[#2D5F3F]">All Focus Areas</p></div>
        </div>
        <div className="bg-white p-[3vh] rounded-[2.5rem] border border-[#F1F5F9] shadow-md space-y-[2.5vh]">
           <div className="flex items-center gap-[2vh] text-left"><div className="w-[8vh] h-[8vh] bg-[#F0F9FF] rounded-2xl flex items-center justify-center text-[4vh] shadow-inner border border-blue-50">👁️</div><div className="flex-1"><p className="text-[clamp(8px,1.2vh,10px)] font-black text-[#2D5F3F] tracking-widest uppercase">Visual Processing</p><p className="text-[clamp(16px,2.2vh,22px)] font-black text-[#2D5F3F]">Shadow Play</p></div></div>
           <div className="bg-[#F8FAFC] p-[2.5vh] rounded-2xl border border-[#E2E8F0]"><p className="text-[clamp(11px,1.5vh,14px)] leading-relaxed text-[#2D5F3F] font-medium text-left">Focuses on interpreting visual information. This activity encourages active exploration helping baby reach key developmental milestones.</p></div>
        </div>
      </div>
    </div>
  );

  const PlanScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto text-left h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white shadow-sm">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md active:scale-90 transition-all z-30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 text-center pr-[6vh]"><p className="text-[clamp(14px,2vh,20px)] font-black text-[#2D5F3F] leading-tight">Weekly Journey</p><p className="text-[clamp(8px,1.2vh,10px)] text-[#6B7F71] font-bold uppercase tracking-wider">Daily Curated Plan</p></div>
      </div>
      <div className="flex-1 p-[3vh] space-y-[3.5vh] overflow-y-auto">
        <div className="space-y-[1.5vh]">
           <div className="flex justify-between items-end"><span className="text-[clamp(14px,1.9vh,18px)] font-black text-[#2D5F3F]">Today's Goals</span><span className="text-[clamp(8px,1.2vh,11px)] font-bold text-[#2D5F3F] opacity-70">4 activities</span></div>
           <div className="h-[1.5vh] bg-gray-200 rounded-full overflow-hidden shadow-inner"><div className="h-full w-3/4 bg-[#A8D5BA] rounded-full" /></div>
        </div>
        {['🎾 Tummy Time Reach', '🧩 Shape Sorter'].map((title, i) => (
          <div key={i} className="bg-white p-[2.5vh] rounded-[2rem] border-1.5 border-[#FDE68A] shadow-sm flex items-center gap-[2vh]">
            <div className="w-[7vh] h-[7vh] rounded-[20px] bg-gray-50 flex items-center justify-center text-[3.5vh] border border-gray-100 shadow-inner">{title.split(' ')[0]}</div>
            <div className="flex-1 font-black text-[#2D5F3F] text-[clamp(12px,1.7vh,15px)] text-left">{title.split(' ').slice(1).join(' ')}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const AIChatScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-bottom duration-600 relative overflow-hidden pointer-events-auto h-full w-full">
       <div className="absolute top-[5vh] left-[2.5vh] z-20">
          <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-lg active:scale-90 transition-all z-30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
       </div>
       <div className="flex-1 flex flex-col items-center justify-center p-[5vh] text-center space-y-[4vh] bg-gradient-to-b from-[#FFF9F0] to-[#E0F2E9]">
          <div className="relative">
            <div className="w-[16vh] h-[16vh] rounded-full bg-[#1F4D2C] p-[0.7vh] shadow-[0_0_40px_rgba(31,77,44,0.3)]">
               <motion.div
                className="w-full h-full rounded-full overflow-hidden border-3 border-[#A8D5BA] flex items-center justify-center bg-[#FEF3C7]"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                  <img src="/assets/neev-logo.jpeg" className="w-full h-full object-cover rounded-full" />
               </motion.div>
            </div>
          </div>
          <div className="space-y-[1vh]">
            <p className="text-[clamp(18px,3vh,28px)] font-black text-[#2D5F3F] tracking-tighter leading-none uppercase">NEEV Intelligence</p>
          </div>
          <div className="bg-white/80 p-[3vh] rounded-[2.5rem] border border-[#A8D5BA]/40 shadow-inner backdrop-blur-sm">
             <p className="text-[clamp(11px,1.5vh,13px)] text-[#6B7F71] font-bold leading-relaxed italic opacity-80">"I am here to guide you through every milestone, every challenge, and every joyful moment of your child's first three years."</p>
          </div>
          <div className="w-full py-[2.5vh] bg-[#1F4D2C] rounded-full shadow-2xl flex items-center justify-center gap-[1.5vh]"><div className="w-[2vh] h-[2vh] rounded-full border-2 border-white/20 border-t-white animate-spin"/><p className="text-white font-black text-[clamp(8px,1.2vh,10px)] uppercase tracking-widest font-bold">Connecting Foundation</p></div>
       </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white shadow-sm">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md active:scale-90 transition-all z-30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 text-center pr-[6vh]"><p className="text-[clamp(14px,2vh,19px)] font-black text-[#2D5F3F] leading-tight">My Profile</p></div>
      </div>
      <div className="flex-1 p-[3vh] space-y-[3vh] overflow-y-auto text-left">
         <div className="flex flex-col items-center py-[2vh]">
            <div className="w-[12vh] h-[12vh] rounded-full bg-[#FEF3C7] border-4 border-white shadow-lg flex items-center justify-center mb-[2vh] overflow-hidden">
               <img src="/assets/profile-photo.jpeg" className="w-full h-full object-cover" />
            </div>
            <p className="text-[clamp(16px,2.2vh,20px)] font-black text-[#2D5F3F]">Alisha</p>
            <p className="text-[clamp(8px,1.2vh,10px)] text-[#6B7F71] uppercase tracking-widest font-bold mt-1">Parent (Mother)</p>
         </div>
         <div className="space-y-[1.5vh]">
            {["Settings", "Little Ones", "Subscription", "Help Center"].map((item) => (
              <button key={item} className="w-full p-[2.5vh] bg-white rounded-2xl border border-[#FDE68A] flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50">
                 <span className="text-[clamp(12px,1.6vh,14px)] font-black text-[#2D5F3F]">{item}</span>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="2.5" className="w-[2vh] h-[2vh]"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
         </div>
      </div>
    </div>
  );

  const PulseDetailScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white shadow-sm">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md active:scale-90 transition-all z-30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 text-center pr-[6vh]"><p className="text-[clamp(14px,2vh,19px)] font-black text-[#2D5F3F] leading-tight">The Pulse</p><p className="text-[clamp(8px,1.2vh,10px)] text-[#6B7F71] font-bold uppercase tracking-wider">Your Daily Rhythm</p></div>
      </div>
      <div className="flex-1 p-[3vh] space-y-[3vh] overflow-y-auto text-left">
         <div className="bg-white p-[3vh] rounded-[2.5rem] border border-[#FDE68A] shadow-md space-y-[3vh]">
            <div>
               <p className="text-[clamp(8px,1.2vh,10px)] font-black text-[#2D5F3F] tracking-widest uppercase mb-[2vh]">MORNING INTENTION</p>
               <div className="grid grid-cols-3 gap-2">
                  {["Energized", "Calm", "Tired"].map(m => (
                    <div key={m} className="p-[1.5vh] bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center gap-1">
                       <span className="text-[2.5vh]">{m === "Energized" ? "⚡" : m === "Calm" ? "🧘" : "😴"}</span>
                       <span className="text-[clamp(8px,1vh,9px)] font-bold text-[#2D5F3F]">{m}</span>
                    </div>
                  ))}
               </div>
            </div>
            <div>
               <p className="text-[clamp(8px,1.2vh,10px)] font-black text-[#2D5F3F] tracking-widest uppercase mb-[2vh]">EVENING REVIEW</p>
               <div className="h-[0.5vh] bg-gray-100 rounded-full relative"><div className="absolute h-full w-2/3 bg-[#A8D5BA] rounded-full" /></div>
               <p className="text-[clamp(10px,1.5vh,11px)] text-[#6B7F71] mt-[1vh] font-bold italic">Reflecting on a productive day...</p>
            </div>
         </div>
      </div>
    </div>
  );

  const NurtureHubScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white shadow-sm">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md active:scale-90 transition-all z-30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 text-center pr-[6vh]"><p className="text-[clamp(14px,2vh,19px)] font-black text-[#2D5F3F] leading-tight">Nurture Hub</p><p className="text-[clamp(8px,1.2vh,10px)] text-[#6B7F71] font-bold uppercase tracking-wider">Growth Foundation</p></div>
      </div>
      <div className="flex-1 p-[3vh] space-y-[3vh] overflow-y-auto text-left">
         <div className="bg-[#1F4D2C] p-[3vh] rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A8D5BA] mb-2">Current Goal</p>
            <h4 className="text-xl font-black uppercase tracking-tight mb-4">Neural Foundation</h4>
            <div className="flex items-center gap-3">
               <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-gold" />
               </div>
               <span className="text-xs font-black">65%</span>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Milestones", icon: "🏆", count: "12/18", id: "milestones" },
              { label: "Health", icon: "🌡️", count: "Log", id: "health" },
              { label: "Rhythm", icon: "⏰", count: "Track", id: "rhythm" },
              { label: "Insights", icon: "🧠", count: "Deep", id: "insights_detail" }
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigate(item.id as Screen)}
                className="bg-white p-[2vh] rounded-2xl border border-[#FDE68A] shadow-sm flex flex-col items-center gap-1 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                 <span className="text-[3vh]">{item.icon}</span>
                 <span className="text-[clamp(10px,1.4vh,12px)] font-black text-[#2D5F3F] uppercase tracking-tighter">{item.label}</span>
                 <span className="text-[clamp(8px,1vh,10px)] font-bold text-[#6B7F71]">{item.count}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );

  const MilestonesScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg></button>
        <div className="flex-1 text-center pr-[6vh] font-black text-[#2D5F3F]">Milestones</div>
      </div>
      <div className="p-[3vh] space-y-[2vh]">
        {["Gross Motor", "Cognitive", "Social"].map((m, i) => (
          <div key={i} className="bg-white p-[2vh] rounded-2xl border border-[#FDE68A] flex items-center justify-between shadow-sm">
             <span className="font-bold text-[#2D5F3F]">{m}</span>
             <div className="w-[3vh] h-[3vh] rounded-full bg-[#A8D5BA] flex items-center justify-center text-white text-xs">✓</div>
          </div>
        ))}
      </div>
    </div>
  );

  const HealthScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg></button>
        <div className="flex-1 text-center pr-[6vh] font-black text-[#2D5F3F]">Health Log</div>
      </div>
      <div className="p-[3vh] space-y-[2vh]">
        <div className="bg-white p-[3vh] rounded-[2rem] border border-[#FDE68A] text-center">
           <p className="text-[clamp(10px,1.4vh,12px)] font-black text-[#2D5F3F] uppercase mb-1">Last Weight</p>
           <p className="text-3xl font-black text-[#2D5F3F]">9.2 <span className="text-sm font-bold text-[#6B7F71]">KG</span></p>
        </div>
      </div>
    </div>
  );

  const RhythmScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg></button>
        <div className="flex-1 text-center pr-[6vh] font-black text-[#2D5F3F]">Daily Rhythm</div>
      </div>
      <div className="p-[3vh]">
        <div className="bg-[#1F4D2C] p-[3vh] rounded-[2rem] text-white text-center">
           <p className="text-[clamp(10px,1.4vh,12px)] font-bold text-[#A8D5BA] uppercase mb-1">SweetSpot Prediction</p>
           <p className="text-2xl font-black italic uppercase">12:45 PM</p>
        </div>
      </div>
    </div>
  );

  const InsightsDetailScreen = () => (
    <div className="flex-1 flex flex-col bg-[#FFF9F0] animate-in slide-in-from-right duration-300 pointer-events-auto h-full w-full">
      <div className="p-4 flex items-center pt-[5vh] border-b border-black/5 bg-white">
        <button onClick={goBack} className="w-[6vh] h-[6vh] bg-white rounded-xl flex items-center justify-center border-2 border-[#FDE68A] cursor-pointer shadow-md"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5F3F" strokeWidth="4" className="w-[3vh] h-[3vh]"><path d="M15 18l-6-6 6-6"/></svg></button>
        <div className="flex-1 text-center pr-[6vh] font-black text-[#2D5F3F]">Deep Insights</div>
      </div>
      <div className="p-[3vh]">
        <div className="bg-white p-[3vh] rounded-[2rem] border border-[#FDE68A] shadow-sm">
           <p className="text-[13px] text-[#6B7F71] font-bold italic leading-relaxed">"Neev is observing a significant uptick in cognitive engagement through tactile play."</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col relative pointer-events-auto select-none overflow-hidden rounded-[2.8rem] bg-black">
      {currentScreen === "landing" && <LandingScreen />}
      {currentScreen === "login" && <LoginScreen />}
      {currentScreen === "otp" && <OTPScreen />}
      {currentScreen === "dashboard" && <DashboardScreen />}
      {currentScreen === "insights" && <DiscoveryScreen />}
      {currentScreen === "plan" && <PlanScreen />}
      {currentScreen === "aichat" && <AIChatScreen />}
      {currentScreen === "profile" && <ProfileScreen />}
      {currentScreen === "pulse_detail" && <PulseDetailScreen />}
      {currentScreen === "nurture_hub" && <NurtureHubScreen />}
      {currentScreen === "milestones" && <MilestonesScreen />}
      {currentScreen === "health" && <HealthScreen />}
      {currentScreen === "rhythm" && <RhythmScreen />}
      {currentScreen === "insights_detail" && <InsightsDetailScreen />}
    </div>
  );
}



import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';

interface WelcomeSplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({
  onFinish,
  durationMs = 2400,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Step 1: Logo & Welcome text appearance
    const t1 = setTimeout(() => setStep(1), 100);
    // Step 2: MSbook title pop & subtitle
    const t2 = setTimeout(() => setStep(2), 600);
    // Step 3: Badges & ready status
    const t3 = setTimeout(() => setStep(3), 1200);

    // Fade out start
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 500);

    // Complete exit
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, durationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      onClick={() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setIsVisible(false);
          if (onFinish) onFinish();
        }, 300);
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between py-12 px-6 select-none bg-gradient-to-b from-[#0F4D32] via-[#0B3B26] to-[#072418] text-white transition-all duration-500 cursor-pointer ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl animate-pulse delay-700" />
      </div>

      {/* Top Spacer */}
      <div className="w-full flex items-center justify-end">
        <span className="text-[10px] font-semibold text-emerald-200/60 uppercase tracking-widest">
          Tap to skip
        </span>
      </div>

      {/* Center Animated Logo & Typography */}
      <div className="flex flex-col items-center text-center space-y-6 relative z-10 max-w-xs">
        {/* Animated Brand Monogram Icon */}
        <div
          className={`relative transition-all duration-700 ease-out transform ${
            step >= 1 ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-6'
          }`}
        >
          {/* Subtle Outer Pulsing Ring */}
          <div className="absolute -inset-3 rounded-3xl bg-emerald-400/20 blur-sm animate-ping opacity-30" />
          
          <div className="w-24 h-24 rounded-3xl bg-white text-[#0F4D32] shadow-2xl flex flex-col items-center justify-center border-2 border-emerald-100/40 relative overflow-hidden">
            {/* Glossy top sheen */}
            <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
            <span className="font-black text-4xl tracking-tighter leading-none">MS</span>
            <span className="text-[9px] font-black tracking-widest text-[#0F4D32]/80 uppercase mt-1">
              BOOK
            </span>
          </div>
        </div>

        {/* Text Container with Staggered Fade & Slide */}
        <div className="space-y-2">
          {/* Tagline */}
          <div
            className={`transition-all duration-600 delay-100 ease-out transform ${
              step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold tracking-[0.2em] uppercase border border-white/15 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Welcome to</span>
            </span>
          </div>

          {/* Main Title: MSbook */}
          <h1
            className={`text-4xl sm:text-5xl font-black tracking-tight text-white transition-all duration-700 ease-out transform drop-shadow-lg ${
              step >= 2 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'
            }`}
          >
            MSbook
          </h1>

          {/* Subtitle */}
          <p
            className={`text-xs text-emerald-100/90 font-medium tracking-wide transition-all duration-700 delay-150 ease-out transform ${
              step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Smart Accounting & Khata Suite
          </p>
        </div>

        {/* Animated Loading Bar */}
        <div
          className={`w-44 h-1.5 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/10 transition-all duration-500 ${
            step >= 2 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-300 via-white to-emerald-200 rounded-full transition-all duration-1000 ease-out"
            style={{ width: step >= 3 ? '100%' : step >= 2 ? '60%' : '15%' }}
          />
        </div>
      </div>

      {/* Footer Branding & Version */}
      <div
        className={`flex flex-col items-center space-y-1 text-center transition-all duration-700 ease-out transform ${
          step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[11px] font-bold border border-white/15">
          v5.8.9 Release
        </span>
        <span className="text-[10px] text-emerald-200/60 font-medium">
          Fast • Safe • 100% Offline Ready
        </span>
      </div>
    </div>
  );
};

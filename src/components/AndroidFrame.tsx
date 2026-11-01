import React, { useEffect, useState } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  onSystemBackPressed: () => void;
  canGoBack: boolean;
  isFramed: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  onSystemBackPressed,
  canGoBack,
  isFramed,
}) => {
  const [timeStr, setTimeStr] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isFramed) {
    return (
      <div className="w-full h-full flex flex-col bg-[#F8FAF8] overflow-hidden">
        {/* Status Bar */}
        <div className="h-7 bg-[#0F4D32] text-white flex items-center justify-between px-4 text-xs font-medium select-none shrink-0">
          <span>{timeStr}</span>
          <div className="flex items-center space-x-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">{children}</div>

        {/* Android 3-Button Navigation Bar */}
        <div className="h-11 bg-white border-t border-slate-200 flex items-center justify-around px-8 select-none shrink-0 z-10">
          <button
            onClick={onSystemBackPressed}
            disabled={!canGoBack}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
              canGoBack
                ? 'text-slate-800 hover:bg-slate-100 active:bg-slate-200 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title={canGoBack ? 'Android System Back Button' : 'Cannot go back (At root)'}
          >
            {/* Standard Android Back Triangle */}
            <svg
              className="w-4 h-4 fill-current rotate-180"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {/* Android Home Circle */}
          <div className="p-2 text-slate-800 flex items-center justify-center opacity-80">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-800" />
          </div>

          {/* Android Overview Square */}
          <div className="p-2 text-slate-800 flex items-center justify-center opacity-80">
            <div className="w-3.5 h-3.5 rounded-[3px] border-2 border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto my-auto w-[385px] h-[780px] max-h-[calc(100vh-80px)] rounded-[44px] bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-800/60 flex flex-col shrink-0 select-none">
      {/* Inner Screen Bezel */}
      <div className="w-full h-full rounded-[34px] overflow-hidden bg-[#F8FAF8] flex flex-col relative shadow-inner">
        {/* Android Punch Hole Camera & Speaker */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black z-30 pointer-events-none ring-1 ring-black/20" />

        {/* Android Status Bar */}
        <div className="h-8 bg-[#0F4D32] text-white flex items-center justify-between px-6 text-[12px] font-semibold select-none shrink-0 z-20">
          <span className="font-mono tracking-tight">{timeStr}</span>
          <div className="flex items-center space-x-1.5 opacity-90">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-hidden relative z-10">{children}</div>

        {/* Android System 3-Button Navigation Bar */}
        <div className="h-11 bg-white border-t border-slate-100 flex items-center justify-around px-10 select-none shrink-0 z-20">
          <button
            onClick={onSystemBackPressed}
            disabled={!canGoBack}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
              canGoBack
                ? 'text-slate-800 hover:bg-slate-100 active:bg-slate-200 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title={canGoBack ? 'Android System Back Button' : 'Back (Disabled at root)'}
          >
            <svg
              className="w-4 h-4 fill-current rotate-180"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <div className="p-2 text-slate-800 flex items-center justify-center opacity-80">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-800" />
          </div>

          <div className="p-2 text-slate-800 flex items-center justify-center opacity-80">
            <div className="w-3.5 h-3.5 rounded-[3px] border-2 border-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
};

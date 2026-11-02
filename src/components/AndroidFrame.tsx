import React from 'react';

interface AndroidFrameProps {
  children: React.ReactNode;
  onSystemBackPressed?: () => void;
  canGoBack?: boolean;
  isFramed?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAF8] overflow-hidden relative">
      <div className="flex-1 overflow-hidden relative flex flex-col">{children}</div>
    </div>
  );
};

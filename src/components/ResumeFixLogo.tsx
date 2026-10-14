import React from 'react';

interface ResumeFixLogoProps {
  className?: string;
  variant?: 'mark' | 'full';
  showText?: boolean;
}

export const ResumeFixLogo: React.FC<ResumeFixLogoProps> = ({
  className = 'w-9 h-9',
  variant = 'mark',
  showText = false,
}) => {
  if (variant === 'full' || showText) {
    return (
      <div className="flex items-center gap-2">
        <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
          <img
            src="/resumefix-logo.svg"
            alt="Resume Fix Logo"
            className="w-full h-full object-contain filter drop-shadow-2xs"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-xs hover:border-slate-700 transition-colors ${className}`}
      title="Resume Fix Logo"
    >
      <img
        src="/resumefix-logo.svg"
        alt="Resume Fix Logo"
        className="w-[115%] h-[115%] object-contain scale-110 filter brightness-105"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

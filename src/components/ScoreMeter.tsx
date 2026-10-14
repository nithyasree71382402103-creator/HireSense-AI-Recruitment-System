import React, { useState, useEffect } from 'react';

interface ScoreMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subtitle?: string;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  size = 180,
  strokeWidth = 14,
  label = 'ATS Score',
  subtitle = 'System Calculated'
}) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // ms
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * normalizedScore));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [normalizedScore]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine color scheme
  let strokeColor = '#10B981'; // Emerald 500 for >= 75
  let textColor = 'text-emerald-600';
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (normalizedScore < 50) {
    strokeColor = '#EF4444'; // Red 500
    textColor = 'text-red-600';
    badgeBg = 'bg-red-50 text-red-700 border-red-200';
  } else if (normalizedScore < 75) {
    strokeColor = '#3B82F6'; // Blue 500
    textColor = 'text-blue-600';
    badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90 filter drop-shadow-xs">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1200 ease-out"
          />
        </svg>

        {/* Center score readout with animated counter */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold tracking-tight transition-colors duration-500 ${textColor}`}>
            {displayScore}%
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            {label}
          </span>
        </div>
      </div>

      {subtitle && (
        <span className={`mt-3 inline-block px-3 py-1 text-xs font-medium rounded-full border transition-all duration-500 ${badgeBg}`}>
          {subtitle}
        </span>
      )}
    </div>
  );
};

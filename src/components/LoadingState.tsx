import React from 'react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Analyzing data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};

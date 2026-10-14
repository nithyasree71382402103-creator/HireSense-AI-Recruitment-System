import React from 'react';

interface SkillBadgeProps {
  name: string;
  category?: string;
  variant?: 'default' | 'matched' | 'missing' | 'partial' | 'selectable';
  selected?: boolean;
  onClick?: () => void;
  note?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  name,
  category,
  variant = 'default',
  selected = false,
  onClick,
  note,
}) => {
  let styleClasses = 'bg-slate-100 text-slate-800 border-slate-200';

  if (variant === 'matched') {
    styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (variant === 'missing') {
    styleClasses = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (variant === 'partial') {
    styleClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (variant === 'selectable') {
    styleClasses = selected
      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50';
  }

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={note || category}
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition-all ${styleClasses} ${
        onClick ? 'cursor-pointer select-none active:scale-95' : ''
      }`}
    >
      {variant === 'matched' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      )}
      {variant === 'missing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />
      )}
      {variant === 'partial' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      )}
      <span>{name}</span>
      {category && (
        <span className="text-[10px] opacity-65 font-normal">
          · {category}
        </span>
      )}
    </Component>
  );
};

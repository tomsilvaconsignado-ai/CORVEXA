import React from 'react';
import { BRAND_CONFIG } from '../../constants/brand';

interface LogoProps {
  variant?: 'full' | 'compact' | 'symbol' | 'on-dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = ''
}) => {
  // Height classes by size
  const sizeClasses = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20'
  }[size];

  // If on-dark, provide a clean, rounded white container or subtle background pill
  if (variant === 'on-dark') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="bg-white p-1.5 px-2.5 rounded-lg shadow-sm flex items-center justify-center shrink-0">
          <img
            src={BRAND_CONFIG.logo.url}
            alt={BRAND_CONFIG.logo.alt}
            className={`${sizeClasses} w-auto object-contain`}
            loading="eager"
          />
        </div>
        {showTagline && (
          <div className="flex flex-col min-w-0">
            <span className="text-white text-xs font-bold tracking-wider leading-none">
              {BRAND_CONFIG.name}
            </span>
            <span className="text-[10px] text-cyan-400 font-medium truncate mt-1">
              {BRAND_CONFIG.tagline}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src={BRAND_CONFIG.logo.url}
          alt={BRAND_CONFIG.logo.alt}
          className={`${sizeClasses} w-auto object-contain`}
          loading="eager"
        />
        {showTagline && (
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-500 font-medium tracking-wide truncate">
              {BRAND_CONFIG.tagline}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Full default presentation
  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <img
        src={BRAND_CONFIG.logo.url}
        alt={BRAND_CONFIG.logo.alt}
        className={`${sizeClasses} w-auto object-contain`}
        loading="eager"
      />
      {showTagline && (
        <span className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">
          {BRAND_CONFIG.slogan}
        </span>
      )}
    </div>
  );
};

import React from 'react';
import { BRAND_CONFIG } from '../config/brandConfig';

export const Hero: React.FC = () => {
  return (
    <div className="relative pt-32 pb-16 animate-reveal sm:pt-44 sm:pb-20 md:pt-52 md:pb-24">
      {BRAND_CONFIG.assets.bannerUrl && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src={BRAND_CONFIG.assets.bannerUrl}
            alt={`${BRAND_CONFIG.identity.storeName} banner`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <h1 className="mb-6 text-5xl font-black tracking-tighter brand-gradient-text sm:text-7xl md:mb-8 md:text-8xl">
          {BRAND_CONFIG.identity.storeName}
        </h1>
        
        <p className="mx-auto max-w-2xl text-xs font-medium uppercase leading-relaxed tracking-[0.14em] text-white/45 animate-slide-up sm:text-sm sm:tracking-[0.2em] md:text-base [animation-delay:200ms]">
          {BRAND_CONFIG.copy.heroTagline}
        </p>
      </div>
    </div>
  );
};

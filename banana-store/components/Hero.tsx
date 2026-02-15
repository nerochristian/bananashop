import React from 'react';
import { BRAND_CONFIG } from '../config/brandConfig';

export const Hero: React.FC = () => {
  return (
    <div className="relative pt-52 pb-24 animate-reveal">
      {BRAND_CONFIG.assets.bannerUrl && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src={BRAND_CONFIG.assets.bannerUrl}
            alt={`${BRAND_CONFIG.identity.storeName} banner`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-8 brand-gradient-text">
          {BRAND_CONFIG.identity.storeName}
        </h1>
        
        <p className="max-w-2xl mx-auto text-sm md:text-base font-medium text-white/40 leading-relaxed uppercase tracking-[0.2em] animate-slide-up [animation-delay:200ms]">
          {BRAND_CONFIG.copy.heroTagline}
        </p>
      </div>
    </div>
  );
};

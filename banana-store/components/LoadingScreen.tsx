import React from 'react';
import { LayoutGrid, Loader2, Shield } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen relative z-10 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-[34px] border border-[#facc15]/25 bg-[#070707]/90 p-10 text-center shadow-[0_0_90px_rgba(250,204,21,0.08)]">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[75%] -translate-x-1/2 bg-yellow-500/15 blur-[90px]" />

        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[26px] border border-[#facc15]/35 bg-[#facc15]/10">
          {BRAND_CONFIG.assets.logoUrl ? (
            <img
              src={BRAND_CONFIG.assets.logoUrl}
              alt={`${BRAND_CONFIG.identity.storeName} logo`}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <LayoutGrid className="h-12 w-12 text-[#facc15]" strokeWidth={2.5} />
          )}
          <span className="absolute -bottom-2 -right-2 rounded-full border border-[#facc15]/35 bg-black p-1.5">
            <Loader2 className="h-4 w-4 animate-spin text-[#facc15]" />
          </span>
        </div>

        <h1 className="relative text-3xl font-black tracking-tight text-white">{BRAND_CONFIG.identity.storeName}</h1>
        <p className="relative mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-yellow-200/70">
          Loading storefront
        </p>

        <div className="relative mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-center gap-2 text-white/70">
            <Shield className="h-4 w-4 text-[#facc15]" />
            <span className="text-xs font-bold uppercase tracking-[0.16em]">Secure initialization</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-[#facc15]/20 bg-black/50">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#facc15] to-yellow-300 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { X as XMark } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onLogoClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onAdminClick, onLogoClick }) => {
  const openExternal = (url: string) => {
    if (!url || url === '#') return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const ringClass =
    'pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#facc15]/75 opacity-0 transition-opacity duration-700 group-hover:opacity-100';
  const navItemClass =
    'group relative overflow-hidden rounded-full border border-white/10 bg-black/40 px-5 py-2 text-sm font-bold text-white/90 transition-all hover:border-[#facc15]/45 hover:text-white';

  return (
    <nav className="fixed left-0 top-0 z-50 w-full px-2 py-2 pointer-events-none sm:px-4 sm:py-4">
      <div className="mx-auto flex max-w-[1900px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(90deg,rgba(0,0,0,0.88),rgba(0,80,58,0.34),rgba(0,0,0,0.92))] px-3 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.46)] backdrop-blur-xl pointer-events-auto sm:px-5">
        <button
          className="group relative flex items-center justify-center rounded-xl border border-white/10 bg-black/35 p-2 transition-all hover:border-[#facc15]/45"
          onClick={onLogoClick}
          aria-label="Home"
        >
          <span className={ringClass} />
          <div className="relative rounded-lg bg-white p-1.5">
            <XMark className="h-8 w-8 text-black" strokeWidth={4.2} />
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onAdminClick} className={navItemClass}>
            <span className={ringClass} />
            <span className="relative">Account</span>
          </button>

          <button onClick={onLogoClick} className={`${navItemClass} hidden sm:inline-flex`}>
            <span className={ringClass} />
            <span className="relative">Guides</span>
          </button>

          <button
            onClick={() => openExternal(BRAND_CONFIG.links.discord === '#' ? BRAND_CONFIG.links.support : BRAND_CONFIG.links.discord)}
            className={`${navItemClass} hidden sm:inline-flex`}
          >
            <span className={ringClass} />
            <span className="relative">Discord</span>
          </button>

          <button onClick={() => (window.location.href = '/terms')} className={`${navItemClass} hidden sm:inline-flex`}>
            <span className={ringClass} />
            <span className="relative">Terms</span>
          </button>

          <button onClick={() => (window.location.href = '/privacy')} className={navItemClass}>
            <span className={ringClass} />
            <span className="relative">Privacy</span>
          </button>

          <button
            onClick={onCartClick}
            className="hidden rounded-full border border-[#facc15]/35 bg-[#facc15]/10 px-3 py-2 text-xs font-black text-[#facc15] transition-all hover:bg-[#facc15]/20 md:inline-flex"
          >
            Cart {cartCount}
          </button>
        </div>
      </div>
    </nav>
  );
};

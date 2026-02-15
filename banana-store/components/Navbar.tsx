
import React from 'react';
import { ShoppingCart, User, MessageCircle, LayoutGrid } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onLogoClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onAdminClick, onLogoClick }) => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-4 py-8 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Left Links Placeholder */}
        <div className="flex-1 hidden md:flex items-center gap-6">
        </div>

        {/* Centered Logo Container */}
        <div className="flex-1 flex justify-center">
          <button 
            className="flex items-center gap-3 cursor-pointer bg-black/40 backdrop-blur-xl border border-white/5 px-5 py-2 rounded-2xl shadow-2xl hover:border-yellow-400/30 transition-all active:scale-95 group"
            onClick={onLogoClick}
          >
            <div className="bg-[#facc15] p-1.5 rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
              {BRAND_CONFIG.assets.logoUrl ? (
                <img
                  src={BRAND_CONFIG.assets.logoUrl}
                  alt={`${BRAND_CONFIG.identity.storeName} logo`}
                  className="w-5 h-5 rounded-sm object-cover"
                />
              ) : (
                <LayoutGrid className="w-5 h-5 text-black" strokeWidth={3} />
              )}
            </div>
            <span className="text-xl font-black tracking-tighter text-white">{BRAND_CONFIG.identity.storeName}</span>
          </button>
        </div>

        {/* Right Side Controls */}
        <div className="flex-1 flex items-center justify-end gap-6">
          <button 
            onClick={onAdminClick}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>
          
          <button className="hidden sm:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{BRAND_CONFIG.emojis.support} Support</span>
          </button>

          <button 
            onClick={onCartClick}
            className="flex items-center gap-2 bg-[#facc15] hover:bg-[#eab308] text-black px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-tighter transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart ({cartCount})</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

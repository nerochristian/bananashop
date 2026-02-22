import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { BRAND_CONFIG } from '../config/brandConfig';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const staggerStyle = (ms: number): React.CSSProperties => ({ ['--stagger' as any]: `${ms}ms` } as React.CSSProperties);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] animate-fade-in" onClick={onClose} />
      <div className="cart-panel-entrance fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
        <div className="cart-item-entrance flex items-center justify-between border-b border-white/5 p-5 sm:p-8" style={staggerStyle(40)}>
          <h2 className="text-xl font-black uppercase tracking-tighter italic text-white sm:text-2xl">Your <span className="text-[#facc15]">Basket</span></h2>
          <button onClick={onClose} className="hover-physics p-3 text-white/40 hover:text-white rounded-2xl hover:bg-white/5 hover:rotate-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="scrollbar-hide flex-1 space-y-5 overflow-y-auto p-4 sm:space-y-6 sm:p-8">
          {items.length === 0 ? (
            <div className="cart-item-entrance text-center py-20 flex flex-col items-center justify-center h-full" style={staggerStyle(90)}>
              <div className="ambient-orb w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Minus className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/20 font-black uppercase tracking-[0.2em] text-xs italic">{BRAND_CONFIG.emojis.cartEmpty} {BRAND_CONFIG.copy.cartEmptyMessage}</p>
              <button onClick={onClose} className="hover-physics mt-6 text-[#facc15] font-black uppercase text-[10px] tracking-[0.3em] hover:tracking-[0.4em]">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div 
                key={item.id} 
                className="cart-item-entrance hover-physics hover-pop group flex gap-4 rounded-[24px] border border-white/5 bg-white/[0.02] p-4 hover:border-[#facc15]/20 sm:gap-5 sm:rounded-[32px] sm:p-5"
                style={staggerStyle(80 + index * 70)}
              >
                <div className="w-20 h-20 rounded-2xl bg-black border border-white/5 overflow-hidden flex-shrink-0 relative">
                  <img src={item.image} alt="" className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 truncate text-sm font-black uppercase tracking-tight text-white transition-colors group-hover:text-[#facc15]">{item.name}</h3>
                  <p className="text-[#facc15] font-black text-lg mb-4 tracking-tighter">${(item.price * item.quantity).toFixed(2)}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 bg-black rounded-xl p-1 border border-white/10">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="hover-physics p-1.5 text-white/40 hover:text-white hover:scale-110"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="hover-physics p-1.5 text-white/40 hover:text-white hover:scale-110"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="hover-physics p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-item-entrance border-t border-white/5 bg-black/40 p-5 backdrop-blur-md sm:p-8" style={staggerStyle(170 + items.length * 70)}>
            <div className="flex items-center justify-between mb-8">
              <div className="text-left">
                <span className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px] block mb-1">Grand Total</span>
                <span className="text-[9px] font-black text-[#facc15] uppercase tracking-widest">Immediate Delivery</span>
              </div>
              <span className="text-3xl font-black tracking-tighter italic text-white animate-pop-in sm:text-4xl">${total.toFixed(2)}</span>
            </div>
            <button 
              onClick={onCheckout}
              className="hover-physics hover-pop group flex w-full items-center justify-center gap-3 rounded-3xl bg-[#facc15] py-5 text-xs font-black uppercase tracking-[0.24em] text-black shadow-[0_10px_40px_rgba(250,204,21,0.2)] active:scale-[0.98] hover:bg-yellow-300 sm:py-6 sm:tracking-[0.3em]"
            >
              PROCEED TO SECURE CHECKOUT
              <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1 group-hover:scale-110" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

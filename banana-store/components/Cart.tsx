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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between animate-slide-up">
          <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">Your <span className="text-[#facc15]">Basket</span></h2>
          <button onClick={onClose} className="p-3 text-white/40 hover:text-white rounded-2xl hover:bg-white/5 transition-all transform hover:rotate-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center h-full animate-fade-in">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Minus className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/20 font-black uppercase tracking-[0.2em] text-xs italic">{BRAND_CONFIG.emojis.cartEmpty} {BRAND_CONFIG.copy.cartEmptyMessage}</p>
              <button onClick={onClose} className="mt-6 text-[#facc15] font-black uppercase text-[10px] tracking-[0.3em] hover:tracking-[0.4em] transition-all">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div 
                key={item.id} 
                className="flex gap-5 p-5 rounded-[32px] bg-white/[0.02] border border-white/5 group hover:border-[#facc15]/20 transition-all animate-reveal"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-20 h-20 rounded-2xl bg-black border border-white/5 overflow-hidden flex-shrink-0 relative">
                  <img src={item.image} alt="" className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-black text-sm uppercase tracking-tight mb-1 group-hover:text-[#facc15] transition-colors">{item.name}</h3>
                  <p className="text-[#facc15] font-black text-lg mb-4 tracking-tighter">${(item.price * item.quantity).toFixed(2)}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 bg-black rounded-xl p-1 border border-white/10">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1.5 text-white/40 hover:text-white transition-colors hover:scale-110"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1.5 text-white/40 hover:text-white transition-colors hover:scale-110"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all transform hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-md animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <div className="text-left">
                <span className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px] block mb-1">Grand Total</span>
                <span className="text-[9px] font-black text-[#facc15] uppercase tracking-widest">Immediate Delivery</span>
              </div>
              <span className="text-4xl font-black text-white tracking-tighter italic animate-pop-in">${total.toFixed(2)}</span>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full py-6 bg-[#facc15] hover:bg-yellow-300 text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(250,204,21,0.2)] active:scale-[0.98] group"
            >
              PROCEED TO SECURE CHECKOUT
              <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

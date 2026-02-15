import React, { useState } from 'react';
import { Lock, ArrowLeft, LayoutGrid } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brandConfig';

interface LoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple hardcoded password for demo
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <button 
        onClick={onBack}
        className="absolute top-10 left-10 text-white/40 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Store
      </button>

      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 rounded-[40px] p-12 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#facc15] rounded-2xl mx-auto flex items-center justify-center mb-6 rotate-6 shadow-xl shadow-yellow-400/20">
            {BRAND_CONFIG.assets.logoUrl ? (
              <img
                src={BRAND_CONFIG.assets.logoUrl}
                alt={`${BRAND_CONFIG.identity.storeName} logo`}
                className="w-8 h-8 rounded object-cover"
              />
            ) : (
              <LayoutGrid className="w-8 h-8 text-black" strokeWidth={3} />
            )}
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">{BRAND_CONFIG.identity.adminPanelName}</h2>
          <p className="text-white/30 mt-2 text-xs font-bold uppercase tracking-widest">Authorized Access Only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Access Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#facc15] transition-all"
              placeholder="••••••••"
            />
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">Invalid Credentials</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-[#facc15] hover:bg-yellow-300 text-black font-black py-5 rounded-2xl transition-all shadow-xl shadow-yellow-400/10 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
          >
            Authenticate
          </button>
        </form>
        
        <div className="mt-10 text-center">
          <p className="text-white/10 text-[9px] font-bold uppercase tracking-widest">
            {BRAND_CONFIG.copy.authSecurityLine}
          </p>
        </div>
      </div>
    </div>
  );
};

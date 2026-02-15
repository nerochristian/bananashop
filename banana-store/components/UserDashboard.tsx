
import React, { useState, useEffect } from 'react';
import { StorageService, Order, User } from '../services/storageService';
import { Package, Key, ExternalLink, Shield, LogOut, LayoutGrid, Fingerprint, Lock, ShieldCheck, Activity } from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onBrowse: () => void;
}

const DecryptingInput = ({ value }: { value?: string }) => {
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [displayValue, setDisplayValue] = useState('');
  const safeValue = String(value || '');

  useEffect(() => {
    if (!safeValue) {
      setIsDecrypting(false);
      setDisplayValue('');
      return;
    }
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayValue(safeValue.split('').map((char, index) => {
        if (index < iteration) return char;
        return 'ABCDEFGHILMNOPQRSTUVZ0123456789!@#$%^&*'[Math.floor(Math.random() * 40)];
      }).join(''));
      
      if (iteration >= safeValue.length) {
        setIsDecrypting(false);
        clearInterval(interval);
      }
      iteration += 1/3;
    }, 30);
    return () => clearInterval(interval);
  }, [safeValue]);

  return (
    <div className="relative group/key">
      <input 
        readOnly 
        value={displayValue} 
        className={`w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono transition-colors ${isDecrypting ? 'text-yellow-400/50' : 'text-[#22c55e]'} focus:outline-none`} 
      />
      {!isDecrypting && safeValue && (
        <button 
          onClick={() => navigator.clipboard.writeText(safeValue)} 
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white text-black text-[9px] font-black uppercase px-3 py-1.5 rounded-lg opacity-0 group-hover/key:opacity-100 transition-all"
        >
          Copy
        </button>
      )}
    </div>
  );
};

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout, onBrowse }) => {
  const orders = StorageService.getUserOrders(user.id)
    .filter((order) => order.status === 'completed')
    .reverse();

  return (
    <div className="min-h-screen pt-32 pb-40 px-6 max-w-7xl mx-auto relative overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-4 h-4 text-[#facc15]" />
            <span className="text-[10px] font-black text-[#facc15] uppercase tracking-[0.3em]">Identity Verified</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4 italic uppercase">Member <span className="text-[#facc15]">Vault</span></h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Active Session: {user.email}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onBrowse} className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">Browse Store</button>
          <button onClick={onLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/10 transition-all flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center gap-4 mb-2">
            <Package className="w-6 h-6 text-[#facc15]" />
            <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">Decrypted Licenses</h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-dashed border-white/10 rounded-[40px] p-20 text-center flex flex-col items-center">
               <Fingerprint className="w-12 h-12 text-white/5 mb-6" />
               <p className="text-white/20 font-black uppercase tracking-widest text-xs">No active licenses found in your vault</p>
               <button onClick={onBrowse} className="mt-6 text-[#facc15] font-black uppercase text-[10px] tracking-widest border-b border-[#facc15]/20 pb-1">Initialize first acquisition</button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden group hover:border-[#facc15]/20 transition-all shadow-2xl">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Protocol ID: {order.id}</span>
                       <span className="bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded text-[8px] font-black tracking-widest border border-[#22c55e]/20">AUTHENTICATED</span>
                    </div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="p-8 space-y-4">
                    {order.items.map(item => (
                      <div key={item.id} className="bg-black/40 border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-lg font-black text-white tracking-tight italic uppercase">{item.name}</h4>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Secure Premium Access</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-2xl">
                             <Lock className="w-5 h-5 text-[#facc15]" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Key Pair (Credentials)</label>
                          {order.credentials?.[item.id] ? (
                            <DecryptingInput value={order.credentials[item.id]} />
                          ) : (
                            <div className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-red-300/80">
                              No credential found for this item. Contact support with order ID `{order.id}`.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
           <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                <Shield className="w-32 h-32 text-[#facc15]" />
              </div>
              <Shield className="w-10 h-10 text-[#facc15] mb-6" />
              <h3 className="text-xl font-black text-white mb-4 tracking-tight italic uppercase">Security Mandate</h3>
              <p className="text-xs font-medium text-white/30 leading-relaxed uppercase tracking-wider mb-6 relative z-10">
                All vault sessions are monitored. changing passwords on "Shared" plans will trigger a <span className="text-red-500">Security Invalidation</span> of your warranty.
              </p>
              <div className="p-4 bg-[#facc15]/5 border border-[#facc15]/10 rounded-2xl flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#facc15] animate-pulse"></div>
                 <span className="text-[9px] font-black text-[#facc15] uppercase tracking-widest">Vault Protection Active</span>
              </div>
           </div>
           
           <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10">
              <h3 className="text-lg font-black text-white mb-6 tracking-tight italic uppercase">Vault Operations</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-white/30 hover:text-white transition-colors cursor-pointer group">
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#facc15] group-hover:text-black transition-colors"><Fingerprint className="w-3.5 h-3.5" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Update Security Prefs</span>
                </li>
                <li className="flex items-center gap-3 text-white/30 hover:text-white transition-colors cursor-pointer group">
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#facc15] group-hover:text-black transition-colors"><Activity className="w-3.5 h-3.5" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Global Activity Logs</span>
                </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

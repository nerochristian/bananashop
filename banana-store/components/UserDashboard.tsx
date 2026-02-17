
import React, { useState, useEffect } from 'react';
import { Order, User } from '../services/storageService';
import { ShopApiService } from '../services/shopApiService';
import { Package, Shield, LogOut, Fingerprint, Lock, ShieldCheck, Activity, Unlink2 } from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onBrowse: () => void;
  onUserUpdate: (user: User) => void;
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

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout, onBrowse, onUserUpdate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isUnlinkingDiscord, setIsUnlinkingDiscord] = useState(false);
  const [discordActionError, setDiscordActionError] = useState('');

  const discordLinked = Boolean((user.discordId || '').trim());
  const discordLabel = user.discordUsername || (user.discordId ? `Discord ${user.discordId}` : 'Connected Discord');

  useEffect(() => {
    let cancelled = false;
    ShopApiService.getOrders({ userId: user.id, status: 'completed' })
      .then((rows) => {
        if (cancelled) return;
        setOrders(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const handleUnlinkDiscord = async () => {
    if (!discordLinked || isUnlinkingDiscord) return;
    setDiscordActionError('');
    setIsUnlinkingDiscord(true);
    try {
      const updatedUser = await ShopApiService.authDiscordUnlink(user.id, user.email);
      onUserUpdate(updatedUser);
    } catch (unlinkError) {
      setDiscordActionError(unlinkError instanceof Error ? unlinkError.message : 'Failed to unlink Discord');
    } finally {
      setIsUnlinkingDiscord(false);
    }
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-7xl overflow-hidden px-4 pb-24 pt-24 sm:px-6 sm:pb-40 sm:pt-32">
      <header className="relative z-10 mb-12 flex flex-col justify-between gap-6 md:mb-20 md:flex-row md:items-end md:gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-4 h-4 text-[#facc15]" />
            <span className="text-[10px] font-black text-[#facc15] uppercase tracking-[0.3em]">Identity Verified</span>
          </div>
          <h1 className="mb-3 text-3xl font-black uppercase tracking-tighter text-white italic sm:mb-4 sm:text-5xl">Member <span className="text-[#facc15]">Vault</span></h1>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 sm:tracking-[0.4em]">Active Session: {user.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${
                discordLinked
                  ? 'border-[#5865F2]/40 bg-[#5865F2]/15 text-[#C7CEFF]'
                  : 'border-white/15 bg-white/5 text-white/45'
              }`}
            >
              {discordLinked ? `Connected Discord${discordLabel ? `: ${discordLabel}` : ''}` : 'Discord Not Connected'}
            </span>
            {discordLinked && (
              <button
                type="button"
                onClick={handleUnlinkDiscord}
                disabled={isUnlinkingDiscord}
                className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-red-300 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Unlink2 className="h-3.5 w-3.5" />
                {isUnlinkingDiscord ? 'Unlinking...' : 'Unlink Discord'}
              </button>
            )}
          </div>
          {discordActionError && (
            <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-red-400">{discordActionError}</p>
          )}
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <button onClick={onBrowse} className="rounded-2xl border border-white/5 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 sm:px-6 sm:py-4">Browse Store</button>
          <button onClick={onLogout} className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 sm:px-6 sm:py-4">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2 lg:space-y-10">
          <div className="flex items-center gap-4 mb-2">
            <Package className="w-6 h-6 text-[#facc15]" />
            <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">Decrypted Licenses</h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="flex flex-col items-center rounded-[26px] border border-dashed border-white/10 bg-[#0a0a0a] p-10 text-center sm:rounded-[40px] sm:p-20">
               <Fingerprint className="w-12 h-12 text-white/5 mb-6" />
               <p className="text-white/20 font-black uppercase tracking-widest text-xs">No active licenses found in your vault</p>
               <button onClick={onBrowse} className="mt-6 text-[#facc15] font-black uppercase text-[10px] tracking-widest border-b border-[#facc15]/20 pb-1">Initialize first acquisition</button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} className="group overflow-hidden rounded-[26px] border border-white/5 bg-[#0a0a0a] shadow-2xl transition-all hover:border-[#facc15]/20 sm:rounded-[40px]">
                  <div className="flex flex-col gap-2 border-b border-white/5 bg-white/[0.01] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                       <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Protocol ID: {order.id}</span>
                       <span className="bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded text-[8px] font-black tracking-widest border border-[#22c55e]/20">AUTHENTICATED</span>
                    </div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-4 p-4 sm:p-8">
                    {order.items.map(item => (
                      <div key={item.id} className="rounded-3xl border border-white/5 bg-black/40 p-4 sm:p-6">
                        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
                          <div className="min-w-0">
                            <h4 className="truncate text-base font-black uppercase tracking-tight text-white italic sm:text-lg">{item.name}</h4>
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

        <div className="space-y-6 sm:space-y-8">
           <div className="group relative overflow-hidden rounded-[26px] border border-white/5 bg-[#0a0a0a] p-6 sm:rounded-[40px] sm:p-10">
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
           
           <div className="rounded-[26px] border border-white/5 bg-[#0a0a0a] p-6 sm:rounded-[40px] sm:p-10">
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

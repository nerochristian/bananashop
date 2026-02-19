import React, { useEffect, useState } from 'react';
import type { Order, User } from '../services/storageService';
import { ShopApiService } from '../services/shopApiService';
import { Package, Shield, LogOut, Fingerprint, Lock, ShieldCheck, Activity, Loader2 } from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onBrowse: () => void;
  onUserUpdate: (user: User) => void;
}

const JUST_SIGNED_IN_KEY = 'robloxkeys.just_signed_in';
const VAULT_THEME_KEY_PREFIX = 'robloxkeys.vault_theme';

const DiscordGlyph = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
    <path d="M20.32 4.37A19.79 19.79 0 0 0 15.46 3c-.21.37-.44.87-.6 1.26a18.4 18.4 0 0 0-5.72 0A12.9 12.9 0 0 0 8.54 3a19.74 19.74 0 0 0-4.86 1.37C.59 9.06-.24 13.63.17 18.14a19.9 19.9 0 0 0 5.95 2.99c.48-.66.9-1.36 1.27-2.1-.7-.27-1.37-.6-2-.97.17-.13.34-.27.5-.41 3.86 1.81 8.05 1.81 11.86 0 .17.14.33.28.5.41-.64.37-1.31.7-2 .97.36.74.79 1.44 1.27 2.1a19.82 19.82 0 0 0 5.95-2.99c.49-5.23-.84-9.76-3.15-13.77ZM8.1 15.36c-1.16 0-2.11-1.06-2.11-2.36s.93-2.36 2.11-2.36 2.13 1.07 2.11 2.36c0 1.3-.94 2.36-2.11 2.36Zm7.8 0c-1.16 0-2.11-1.06-2.11-2.36s.93-2.36 2.11-2.36 2.13 1.07 2.11 2.36c0 1.3-.94 2.36-2.11 2.36Z" />
  </svg>
);

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
      setDisplayValue(
        safeValue
          .split('')
          .map((char, index) => {
            if (index < iteration) return char;
            return 'ABCDEFGHILMNOPQRSTUVZ0123456789!@#$%^&*'[Math.floor(Math.random() * 40)];
          })
          .join('')
      );

      if (iteration >= safeValue.length) {
        setIsDecrypting(false);
        clearInterval(interval);
      }
      iteration += 1 / 3;
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
  const [isDiscordConnecting, setIsDiscordConnecting] = useState(false);
  const [isDiscordDisconnecting, setIsDiscordDisconnecting] = useState(false);
  const [discordActionError, setDiscordActionError] = useState('');
  const [isDiscordPromptOpen, setIsDiscordPromptOpen] = useState(false);
  const [isDiscordStatusOpen, setIsDiscordStatusOpen] = useState(false);
  const [vaultThemeLevel, setVaultThemeLevel] = useState(62);

  const discordLinked = Boolean((user.discordId || '').trim());
  const vaultThemeRatio = Math.max(0, Math.min(1, vaultThemeLevel / 100));

  useEffect(() => {
    const storageKey = `${VAULT_THEME_KEY_PREFIX}.${user.id || 'guest'}`;
    const raw = localStorage.getItem(storageKey);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      setVaultThemeLevel(62);
      return;
    }
    const clamped = Math.max(0, Math.min(100, Math.round(parsed)));
    setVaultThemeLevel(clamped);
  }, [user.id]);

  useEffect(() => {
    const storageKey = `${VAULT_THEME_KEY_PREFIX}.${user.id || 'guest'}`;
    localStorage.setItem(storageKey, String(Math.max(0, Math.min(100, Math.round(vaultThemeLevel)))));
  }, [user.id, vaultThemeLevel]);

  useEffect(() => {
    let cancelled = false;
    ShopApiService.getOrders({ status: 'completed' })
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordStatus = (params.get('discord') || '').trim().toLowerCase();
    if (!discordStatus) return;

    const clearVaultQuery = () => {
      window.history.replaceState({}, document.title, '/vault');
    };

    if (discordStatus === 'linked') {
      const callbackEmail = (params.get('email') || '').trim().toLowerCase();
      if (callbackEmail && callbackEmail !== user.email.trim().toLowerCase()) {
        setDiscordActionError('Discord was linked to a different account. Please try again.');
        clearVaultQuery();
        return;
      }

      const updatedUser: User = {
        ...user,
        discordId: (params.get('discordId') || user.discordId || '').trim(),
        discordUsername: (params.get('discordUsername') || user.discordUsername || '').trim(),
        discordAvatar: (params.get('discordAvatar') || user.discordAvatar || '').trim(),
        discordLinkedAt: new Date().toISOString(),
      };

      onUserUpdate(updatedUser);
      setDiscordActionError('');
      setIsDiscordPromptOpen(false);
      sessionStorage.removeItem(JUST_SIGNED_IN_KEY);
      clearVaultQuery();
      return;
    }

    const reason = (params.get('message') || 'discord_link_failed').replace(/[_-]+/g, ' ');
    setDiscordActionError(`Discord connect failed: ${reason}`);
    clearVaultQuery();
  }, [onUserUpdate, user]);

  useEffect(() => {
    if (discordLinked) {
      sessionStorage.removeItem(JUST_SIGNED_IN_KEY);
      setIsDiscordPromptOpen(false);
      return;
    }

    const justSignedIn = sessionStorage.getItem(JUST_SIGNED_IN_KEY) === '1';
    if (justSignedIn) {
      setIsDiscordPromptOpen(true);
    }
  }, [discordLinked]);

  const handleDiscordButtonClick = async () => {
    if (discordLinked) {
      setIsDiscordStatusOpen(true);
      return;
    }
    await startDiscordConnect();
  };

  const startDiscordConnect = async () => {
    if (isDiscordConnecting || discordLinked) return;

    setDiscordActionError('');
    setIsDiscordConnecting(true);

    try {
      const { linkToken } = await ShopApiService.authGetDiscordLinkToken();
      const { url } = await ShopApiService.authGetDiscordConnectUrl(linkToken, `${window.location.origin}/vault`);
      window.location.href = url;
    } catch (connectError) {
      setDiscordActionError(connectError instanceof Error ? connectError.message : 'Failed to start Discord connect');
      setIsDiscordConnecting(false);
    }
  };

  const disconnectDiscord = async () => {
    if (!discordLinked || isDiscordDisconnecting) return;
    setDiscordActionError('');
    setIsDiscordDisconnecting(true);
    try {
      const updatedUser = await ShopApiService.authDiscordUnlink();
      onUserUpdate(updatedUser);
      setIsDiscordStatusOpen(false);
    } catch (disconnectError) {
      setDiscordActionError(disconnectError instanceof Error ? disconnectError.message : 'Failed to disconnect Discord');
    } finally {
      setIsDiscordDisconnecting(false);
    }
  };

  const dismissDiscordPrompt = () => {
    setIsDiscordPromptOpen(false);
    sessionStorage.removeItem(JUST_SIGNED_IN_KEY);
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-7xl overflow-hidden px-4 pb-24 pt-24 sm:px-6 sm:pb-40 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: 0.2 + vaultThemeRatio * 0.65,
            background: `
              radial-gradient(circle at 18% 22%, rgba(250, 204, 21, ${0.07 + vaultThemeRatio * 0.34}), transparent 42%),
              radial-gradient(circle at 82% 78%, rgba(250, 204, 21, ${0.04 + vaultThemeRatio * 0.24}), transparent 46%),
              linear-gradient(135deg, rgba(250, 204, 21, ${0.02 + vaultThemeRatio * 0.18}) 0%, rgba(0, 0, 0, 0) 58%)
            `,
          }}
        />
      </div>

      <header className="relative z-10 mb-12 flex flex-col justify-between gap-6 md:mb-20 md:flex-row md:items-end md:gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-4 h-4 text-[#facc15]" />
            <span className="text-[10px] font-black text-[#facc15] uppercase tracking-[0.3em]">Identity Verified</span>
          </div>
          <h1 className="mb-3 text-3xl font-black uppercase tracking-tighter text-white italic sm:mb-4 sm:text-5xl">
            Member <span className="text-[#facc15]">Vault</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 sm:tracking-[0.4em]">Active Session: {user.email}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <button
            onClick={onBrowse}
            className="rounded-2xl border border-white/5 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 sm:px-6 sm:py-4"
          >
            Browse Store
          </button>

          <button
            onClick={handleDiscordButtonClick}
            disabled={isDiscordConnecting}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all sm:px-6 sm:py-4 ${
              discordLinked
                ? 'border-[#5865F2]/45 bg-[#5865F2]/30 text-white hover:bg-[#5865F2]/40'
                : 'border-[#5865F2]/35 bg-[#5865F2]/20 text-[#D6DCFF] hover:bg-[#5865F2]/35 disabled:cursor-not-allowed disabled:opacity-70'
            }`}
          >
            {isDiscordConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DiscordGlyph className="h-4 w-4" />}
            {discordLinked ? 'Connected' : 'Connect Discord'}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 sm:px-6 sm:py-4"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {discordActionError && (
        <p className="relative z-10 mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-red-300">
          {discordActionError}
        </p>
      )}

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
              <button onClick={onBrowse} className="mt-6 text-[#facc15] font-black uppercase text-[10px] tracking-widest border-b border-[#facc15]/20 pb-1">
                Initialize first acquisition
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="group overflow-hidden rounded-[26px] border border-white/5 bg-[#0a0a0a] shadow-2xl transition-all hover:border-[#facc15]/20 sm:rounded-[40px]">
                  <div className="flex flex-col gap-2 border-b border-white/5 bg-white/[0.01] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Protocol ID: {order.id}</span>
                      <span className="bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded text-[8px] font-black tracking-widest border border-[#22c55e]/20">AUTHENTICATED</span>
                    </div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-4 p-4 sm:p-8">
                    {order.items.map((item) => (
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
              All vault sessions are monitored. changing passwords on "shared" plans will trigger a <span className="text-red-500">security invalidation</span> of your warranty.
            </p>
            <div className="p-4 bg-[#facc15]/5 border border-[#facc15]/10 rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#facc15] animate-pulse"></div>
              <span className="text-[9px] font-black text-[#facc15] uppercase tracking-widest">Vault Protection Active</span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/5 bg-[#0a0a0a] p-6 sm:rounded-[40px] sm:p-10">
            <h3 className="text-lg font-black text-white mb-6 tracking-tight italic uppercase">Vault Operations</h3>

            <div className="mb-6 rounded-2xl border border-[#facc15]/20 bg-[#0d0d0d] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">Vault Theme</p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#facc15]">{vaultThemeLevel}% Yellow</p>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={vaultThemeLevel}
                onChange={(event) => setVaultThemeLevel(Number(event.target.value))}
                className="w-full accent-[#facc15]"
                aria-label="Vault color balance slider"
              />

              <div className="mt-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                <span>Black</span>
                <span>Yellow</span>
              </div>
            </div>

            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white/30 hover:text-white transition-colors cursor-pointer group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#facc15] group-hover:text-black transition-colors">
                  <Fingerprint className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Update Security Prefs</span>
              </li>
              <li className="flex items-center gap-3 text-white/30 hover:text-white transition-colors cursor-pointer group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#facc15] group-hover:text-black transition-colors">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Global Activity Logs</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {isDiscordPromptOpen && !discordLinked && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-[#5865F2]/30 bg-[#0B0F1D] p-6 shadow-2xl sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#D8DEFF]">
              <DiscordGlyph className="h-3.5 w-3.5" />
              Discord Link
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">Connect your Discord?</h3>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-white/70">
              Link your Discord to this account for faster support, account recovery, and upcoming vault features.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={dismissDiscordPrompt}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:bg-white/10"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={startDiscordConnect}
                disabled={isDiscordConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#5865F2]/45 bg-[#5865F2]/30 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#5865F2]/45 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDiscordConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DiscordGlyph className="h-4 w-4" />}
                {isDiscordConnecting ? 'Connecting...' : 'Connect Discord'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDiscordStatusOpen && discordLinked && (
        <div className="fixed inset-0 z-[121] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#5865F2]/35 bg-[#0A1022] shadow-2xl">
            <div className="border-b border-white/10 bg-[#5865F2]/15 px-6 py-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/45 bg-[#5865F2]/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#D8DEFF]">
                <DiscordGlyph className="h-3.5 w-3.5" />
                Connected
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">Discord Linked</h3>
              <p className="mt-2 text-sm font-semibold text-white/75">
                Your vault account is connected to Discord and ready for linked features.
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/45">Discord User</p>
                <p className="truncate text-sm font-black text-white">{user.discordUsername || 'Unknown User'}</p>
                <p className="truncate text-xs font-semibold text-white/55">{user.discordId || 'No ID'}</p>
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/20 px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsDiscordStatusOpen(false)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:bg-white/10 sm:w-auto"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={disconnectDiscord}
                  disabled={isDiscordDisconnecting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/15 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-300 transition-all hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isDiscordDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isDiscordDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

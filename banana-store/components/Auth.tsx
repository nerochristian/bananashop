import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Lock, UserPlus, ArrowLeft, LayoutGrid, LogIn, ShieldCheck, KeyRound, Link2, Loader2 } from 'lucide-react';
import { User } from '../services/storageService';
import { BRAND_CONFIG } from '../config/brandConfig';
import { ShopApiService } from '../services/shopApiService';

interface AuthProps {
  onAuthComplete: (user: User) => void;
  onBack: () => void;
}

const PENDING_DISCORD_AUTH_KEY = 'robloxkeys.pending_discord_auth';

interface PendingDiscordAuth {
  user: User;
  linkToken: string;
}

const readPendingDiscordAuth = (): PendingDiscordAuth | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_DISCORD_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingDiscordAuth;
    if (!parsed?.user || !parsed?.linkToken) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writePendingDiscordAuth = (payload: PendingDiscordAuth | null) => {
  if (!payload) {
    sessionStorage.removeItem(PENDING_DISCORD_AUTH_KEY);
    return;
  }
  sessionStorage.setItem(PENDING_DISCORD_AUTH_KEY, JSON.stringify(payload));
};

export const Auth: React.FC<AuthProps> = ({ onAuthComplete, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [error, setError] = useState('');
  const [discordPrompt, setDiscordPrompt] = useState('');
  const [pendingDiscordUser, setPendingDiscordUser] = useState<User | null>(null);
  const [pendingDiscordToken, setPendingDiscordToken] = useState('');
  const [isDiscordConnecting, setIsDiscordConnecting] = useState(false);

  const isOtpStep = useMemo(() => isLogin && Boolean(otpToken), [isLogin, otpToken]);

  const resetOtpStep = () => {
    setOtpToken('');
    setOtpCode('');
    setOtpNotice('');
  };

  const clearDiscordLinkState = () => {
    setDiscordPrompt('');
    setPendingDiscordUser(null);
    setPendingDiscordToken('');
    writePendingDiscordAuth(null);
  };

  const startDiscordConnect = async (user: User, linkToken: string) => {
    setIsDiscordConnecting(true);
    setError('');

    try {
      const returnUrl = `${window.location.origin}/auth`;
      writePendingDiscordAuth({ user, linkToken });
      const result = await ShopApiService.authGetDiscordConnectUrl(linkToken, returnUrl);
      window.location.href = result.url;
    } catch (discordError) {
      setError(discordError instanceof Error ? discordError.message : 'Failed to start Discord connect');
      setIsDiscordConnecting(false);
    }
  };

  const handleAuthenticatedUser = async (
    authenticatedUser: User,
    discordLinkToken?: string,
    requiresDiscord?: boolean,
    message?: string,
    autoConnect: boolean = false
  ) => {
    const hasDiscord = Boolean((authenticatedUser.discordId || '').trim());
    const shouldHandleDiscordLink = Boolean(!hasDiscord && discordLinkToken && (requiresDiscord || autoConnect));

    if (shouldHandleDiscordLink) {
      setPendingDiscordUser(authenticatedUser);
      setPendingDiscordToken(discordLinkToken);
      setDiscordPrompt(message || (requiresDiscord ? 'Connect Discord to continue.' : 'Connect Discord to unlock linked profile features.'));
      writePendingDiscordAuth({ user: authenticatedUser, linkToken: discordLinkToken });

      if (autoConnect) {
        await startDiscordConnect(authenticatedUser, discordLinkToken);
      }
      return;
    }

    clearDiscordLinkState();
    onAuthComplete(authenticatedUser);
  };

  const handleConnectDiscordFromSignin = async () => {
    setError('');

    if (pendingDiscordUser && pendingDiscordToken) {
      await startDiscordConnect(pendingDiscordUser, pendingDiscordToken);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) {
      setError('Enter your email and password first.');
      return;
    }

    try {
      const loginResult = await ShopApiService.authLogin(cleanEmail, cleanPassword);
      if (loginResult.requires2fa) {
        setOtpToken(loginResult.otpToken);
        setOtpNotice(loginResult.message);
        setOtpCode('');
        setDiscordPrompt('Verify your email code, then connect Discord.');
        return;
      }

      await handleAuthenticatedUser(
        loginResult.user,
        loginResult.discordLinkToken,
        loginResult.requiresDiscord,
        loginResult.message,
        true
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordStatus = (params.get('discord') || '').trim().toLowerCase();
    if (!discordStatus) {
      return;
    }

    const clearAuthQuery = () => {
      window.history.replaceState({}, document.title, '/auth');
    };

    if (discordStatus === 'linked') {
      const pending = readPendingDiscordAuth();
      if (pending?.user) {
        const discordId = (params.get('discordId') || pending.user.discordId || '').trim();
        const discordUsername = (params.get('discordUsername') || pending.user.discordUsername || '').trim();
        const discordAvatar = (params.get('discordAvatar') || pending.user.discordAvatar || '').trim();
        const linkedUser: User = {
          ...pending.user,
          discordId,
          discordUsername,
          discordAvatar,
          discordLinkedAt: new Date().toISOString(),
        };

        clearDiscordLinkState();
        clearAuthQuery();
        onAuthComplete(linkedUser);
        return;
      }

      setError('Discord linked. Please sign in again to refresh your session.');
      clearDiscordLinkState();
      clearAuthQuery();
      return;
    }

    const reason = (params.get('message') || 'discord_link_failed').replace(/[_-]+/g, ' ');
    setError(`Discord connect failed: ${reason}`);
    setIsDiscordConnecting(false);
    clearAuthQuery();
  }, [onAuthComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (isLogin) {
        if (isOtpStep) {
          const cleanCode = otpCode.trim();
          if (!cleanCode) {
            setError('Verification code is required');
            return;
          }
          const verified = await ShopApiService.authVerifyOtp(otpToken, cleanCode);
          await handleAuthenticatedUser(
            verified.user,
            verified.discordLinkToken,
            verified.requiresDiscord,
            verified.message,
            false
          );
          return;
        }

        if (!cleanEmail || !cleanPassword) {
          setError('Email and password are required');
          return;
        }

        const loginResult = await ShopApiService.authLogin(cleanEmail, cleanPassword);
        if (loginResult.requires2fa) {
          setOtpToken(loginResult.otpToken);
          setOtpNotice(loginResult.message);
          setOtpCode('');
          return;
        }

        await handleAuthenticatedUser(
          loginResult.user,
          loginResult.discordLinkToken,
          loginResult.requiresDiscord,
          loginResult.message,
          false
        );
        return;
      }

      if (!cleanEmail || !cleanPassword) {
        setError('Email and password are required');
        return;
      }

      clearDiscordLinkState();
      const user: User = await ShopApiService.authRegister(cleanEmail, cleanPassword);
      onAuthComplete(user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050505] px-3 sm:px-4">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/5 blur-[120px] sm:h-[600px] sm:w-[600px]"></div>

      <button
        onClick={onBack}
        className="absolute left-4 top-5 z-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 transition-colors hover:text-white sm:left-10 sm:top-10"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Store
      </button>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-white/5 bg-[#0a0a0a] p-6 shadow-2xl sm:rounded-[48px] sm:p-12">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <ShieldCheck className="h-24 w-24 text-[#facc15]" />
        </div>

        <div className="relative mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 rotate-6 items-center justify-center rounded-2xl bg-[#facc15] shadow-xl shadow-yellow-400/20">
            {BRAND_CONFIG.assets.logoUrl ? (
              <img
                src={BRAND_CONFIG.assets.logoUrl}
                alt={`${BRAND_CONFIG.identity.storeName} logo`}
                className="h-8 w-8 rounded object-cover"
              />
            ) : (
              <LayoutGrid className="h-8 w-8 text-black" strokeWidth={3} />
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-white sm:text-3xl">
            {isOtpStep ? 'Email Verification' : isLogin ? 'Welcome Back' : BRAND_CONFIG.copy.authJoinHeading}
          </h2>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/30">
            {isOtpStep ? 'Enter your one-time code to continue' : isLogin ? 'Access your digital vault' : 'Start your premium journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-6">
          {!isOtpStep ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-2 block text-[10px] font-black uppercase tracking-widest text-white/20">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-black px-12 py-4 font-bold text-white outline-none transition-all focus:border-[#facc15]"
                    placeholder="name@email.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="ml-2 block text-[10px] font-black uppercase tracking-widest text-white/20">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-black px-12 py-4 font-bold text-white outline-none transition-all focus:border-[#facc15]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#facc15]/20 bg-[#facc15]/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#facc15]/80">
                {otpNotice || `Verification code sent to ${email}`}
              </div>
              <div className="space-y-1.5">
                <label className="ml-2 block text-[10px] font-black uppercase tracking-widest text-white/20">One-Time Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    required
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-2xl border border-white/5 bg-black px-12 py-4 font-bold tracking-[0.28em] text-white outline-none transition-all focus:border-[#facc15] sm:tracking-[0.35em]"
                    placeholder="000000"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={resetOtpStep}
                className="w-full rounded-2xl border border-white/10 bg-black py-3 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white/90"
              >
                Use a Different Login
              </button>
            </div>
          )}

          {discordPrompt && (
            <div className="space-y-3 rounded-2xl border border-[#5865F2]/35 bg-[#5865F2]/10 px-4 py-3">
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#AAB3FF]">{discordPrompt}</p>
              <button
                type="button"
                onClick={handleConnectDiscordFromSignin}
                disabled={isDiscordConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5865F2]/45 bg-[#5865F2]/20 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#5865F2]/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDiscordConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {isDiscordConnecting ? 'Connecting Discord...' : 'Connect Discord'}
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-500/10 bg-red-500/5 py-3 text-center text-[10px] font-black uppercase text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#facc15] py-5 text-xs font-black uppercase tracking-widest text-black shadow-xl shadow-yellow-400/10 transition-all hover:bg-yellow-300"
          >
            {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isOtpStep ? 'Verify Code' : isLogin ? 'Authenticate' : 'Create Account'}
          </button>

          {isLogin && !isOtpStep && !discordPrompt && (
            <button
              type="button"
              onClick={handleConnectDiscordFromSignin}
              disabled={isDiscordConnecting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5865F2]/30 bg-[#5865F2]/10 py-4 text-[10px] font-black uppercase tracking-widest text-[#C6CCFF] transition-all hover:bg-[#5865F2]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDiscordConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {isDiscordConnecting ? 'Connecting...' : 'Connect Discord'}
            </button>
          )}
        </form>

        <div className="relative mt-8 border-t border-white/5 pt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              resetOtpStep();
              clearDiscordLinkState();
              setError('');
            }}
            className="text-[10px] font-black uppercase tracking-widest text-white/30 transition-colors hover:text-white"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>

      <div className="fixed bottom-7 hidden text-[9px] font-black uppercase tracking-[0.4em] text-white/10 sm:block">
        Encrypted AES-256 Session Layer Active
      </div>
    </div>
  );
};


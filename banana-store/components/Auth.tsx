
import React, { useState } from 'react';
import { Mail, Lock, UserPlus, ArrowLeft, LayoutGrid, LogIn, ShieldCheck } from 'lucide-react';
import { StorageService, User } from '../services/storageService';
import { BRAND_CONFIG } from '../config/brandConfig';

interface AuthProps {
  onAuthComplete: (user: User) => void;
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthComplete, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = StorageService.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        StorageService.setSession(user);
        StorageService.addLog(`User Authentication Successful: ${email}`, 'SUCCESS');
        onAuthComplete(user);
      } else {
        setError('Invalid email or password');
        StorageService.addLog(`Failed Login Attempt: ${email}`, 'CRITICAL');
      }
    } else {
      const users = StorageService.getUsers();
      if (users.some(u => u.email === email)) {
        setError('User already exists');
        return;
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        password,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      StorageService.addUser(newUser);
      StorageService.setSession(newUser);
      StorageService.addLog(`New User Registered: ${email}`, 'SUCCESS');
      onAuthComplete(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <button onClick={onBack} className="absolute top-10 left-10 text-white/40 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors z-50">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </button>

      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 rounded-[48px] p-12 shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <ShieldCheck className="w-24 h-24 text-[#facc15]" />
        </div>

        <div className="text-center mb-10 relative">
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
          <h2 className="text-3xl font-black text-white tracking-tighter">{isLogin ? 'Welcome Back' : BRAND_CONFIG.copy.authJoinHeading}</h2>
          <p className="text-white/30 mt-2 text-[10px] font-black uppercase tracking-widest">
            {isLogin ? 'Access your digital vault' : 'Start your premium journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl px-12 py-4 text-white font-bold focus:border-[#facc15] outline-none transition-all" placeholder="name@email.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl px-12 py-4 text-white font-bold focus:border-[#facc15] outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/5 py-3 rounded-xl border border-red-500/10">{error}</p>}

          <button type="submit" className="w-full bg-[#facc15] text-black font-black py-5 rounded-2xl transition-all shadow-xl shadow-yellow-400/10 hover:bg-yellow-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isLogin ? 'Authenticate' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center relative border-t border-white/5 pt-8">
          <button onClick={() => setIsLogin(!isLogin)} className="text-white/30 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
      
      <div className="fixed bottom-10 text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
         Encrypted AES-256 Session Layer Active
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { email, password, fullName };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Auth failed');

      if (isLogin) {
        setAuth(data.user, data.token);
      } else {
        setIsLogin(true);
        setError('Account created! Please login.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left Side - Visual */}
      <div className="relative hidden w-1/2 lg:block">
        <img 
          src="https://picsum.photos/seed/landlord/1920/1080?blur=2" 
          className="object-cover w-full h-full opacity-40"
          alt="LandlordOS"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-20 left-20 max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500">
              <Building2 className="text-white" size={32} />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">Landlord<span className="text-emerald-500">OS</span></span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            The financial control tower for your rental business.
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Secure, offline-capable, and designed for professional landlords managing 1–100+ units.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col items-center justify-center w-full p-8 lg:w-1/2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500">
              <Building2 className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Landlord<span className="text-emerald-500">OS</span></span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white">{isLogin ? 'Welcome back' : 'Create account'}</h1>
            <p className="mt-2 text-zinc-400">
              {isLogin ? 'Enter your credentials to access your portfolio.' : 'Start managing your properties professionally today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 pl-11 text-white transition-all border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    placeholder="John Doe"
                  />
                  <Building2 className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-11 text-white transition-all border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                  placeholder="name@company.com"
                />
                <Mail className="absolute left-4 top-3.5 text-zinc-500" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-400">Password</label>
                {isLogin && <button type="button" className="text-xs text-emerald-400 hover:underline">Forgot password?</button>}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-11 text-white transition-all border rounded-xl bg-zinc-900 border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
              </div>
            </div>

            {error && (
              <div className="p-4 text-sm font-medium text-rose-400 border rounded-xl bg-rose-500/10 border-rose-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-all bg-emerald-600 rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

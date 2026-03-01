import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(error.message);
        } else {
          setEmailSent(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await supabase.auth.resend({ type: 'signup', email });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email.');
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#05060B] text-[#F4F6FF] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#4F46E5] flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">JARVIS</span>
          </div>

          <div className="data-card p-8 bg-[#0B0E16] text-center">
            <div className="w-16 h-16 rounded-full bg-[#4F46E5]/20 border border-[#4F46E5]/30 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-[#4F46E5]" />
            </div>

            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-[#A7ACBF] text-sm mb-1">
              We sent a confirmation link to
            </p>
            <p className="text-[#F4F6FF] font-medium text-sm mb-6">{email}</p>

            <p className="text-[#A7ACBF] text-sm mb-6">
              Click the link in the email to activate your account. The link expires in 24 hours.
            </p>

            <div className="border-t border-white/10 pt-6">
              <p className="text-[#A7ACBF] text-sm mb-3">Didn't receive it?</p>
              <button
                type="button"
                onClick={handleResend}
                className="text-[#4F46E5] hover:text-[#6366F1] text-sm font-medium transition-colors"
              >
                Resend email
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setEmailSent(false); setMode('login'); setError(''); }}
              className="mt-6 flex items-center gap-2 text-[#A7ACBF] hover:text-white transition-colors text-sm mx-auto"
            >
              ← Back to Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060B] text-[#F4F6FF] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#4F46E5] flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight">JARVIS</span>
        </div>

        <div className="data-card p-8">
          {/* Tab toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden mb-8">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-[#4F46E5] text-white'
                  : 'text-[#A7ACBF] hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-[#4F46E5] text-white'
                  : 'text-[#A7ACBF] hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-[#A7ACBF] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7ACBF]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-[#5A5F7A] focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-[#A7ACBF] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7ACBF]" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-[#5A5F7A] focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
              </div>
            </div>

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-[#A7ACBF] mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7ACBF]" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder-[#5A5F7A] focus:outline-none focus:border-[#4F46E5] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Log In'
                : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

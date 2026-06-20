'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Leaf, ArrowRight, Mail, KeyRound } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    setSuccessMsg('');
    setDevResetUrl('');
    setPreviewUrl('');
    try {
      const res = await authApi.forgotPassword(data.email);
      setSuccessMsg(res.data.message || 'Password reset link sent to your email.');
      if (res.data.resetUrl) {
        setDevResetUrl(res.data.resetUrl);
      }
      if (res.data.previewUrl) {
        setPreviewUrl(res.data.previewUrl);
      }
      toast.success('Reset email sent successfully! ✉️');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C84B00] to-[#E65100] py-12 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-saffron-gradient rounded-2xl flex items-center justify-center shadow-warm group-hover:shadow-warm-lg transition-shadow">
              <Leaf className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-4xl font-bold text-white mt-4 mb-2">Reset Password</h1>
          <p className="text-white/80 text-sm">We'll help you get back into your account</p>
        </div>

        <div className="bg-gradient-to-b from-[#3D1000] to-[#5A1C08] border border-white/10 rounded-3xl shadow-2xl p-8 space-y-6 relative overflow-hidden text-white">
          {successMsg ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <KeyRound className="w-8 h-8 text-[#FFD700] animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-xl text-white">Request Successful</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {successMsg}
                </p>
              </div>

              {/* Ethereal Inbox Preview Link */}
              {previewUrl && (
                <div className="p-4 bg-white/10 border border-white/20 rounded-2xl text-left space-y-2">
                  <p className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">✉️ Ethereal Sandbox Inbox</p>
                  <p className="text-xs text-white/70 leading-relaxed font-medium">
                    An email has been delivered to your virtual mailbox. Click the button below to view the email and access the reset link:
                  </p>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="block text-center py-2 px-4 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#F9A825] hover:from-[#FFE066] hover:to-[#FFB300] text-[#3D1000] font-bold text-xs transition-colors">
                    Open Virtual Inbox
                  </a>
                </div>
              )}

              {/* Dev mode testing helper */}
              {devResetUrl && !previewUrl && (
                <div className="p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl text-left space-y-2">
                  <p className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">🛠️ Development Shortcut Link</p>
                  <p className="text-xs text-white/60">Click the button below to navigate directly to the reset page:</p>
                  <Link href={devResetUrl} className="block text-center py-2 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#3D1000] font-bold text-xs transition-colors">
                    Go to Reset Password Page
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#FFD700] hover:text-[#FFE066] hover:underline">
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="email">Email Address</label>
                <div className="relative">
                  <input id="email" type="email" autoComplete="email" className="input pl-11"
                    placeholder="you@example.com" {...register('email')} />
                  <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#F9A825] hover:from-[#FFE066] hover:to-[#FFB300] text-[#3D1000] font-bold text-base transition-all duration-200 shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#3D1000] border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Send Reset Link <ArrowRight className="w-4 h-4" /></span>
                )}
              </button>

              <p className="text-center text-sm text-white/70">
                Remember your password?{' '}
                <Link href="/auth/login" className="font-bold text-[#FFD700] hover:text-[#FFE066] hover:underline transition-colors">
                  Login here
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-white/60 mt-6">
          🌿 100% Pure Vegetarian · Annada Pure Veg, Pune
        </p>
      </div>
    </div>
  );
}

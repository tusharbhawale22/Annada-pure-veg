'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Leaf, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Reset token is missing in URL.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, { password: data.password });
      toast.success('Password reset successful! 🎉');
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
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
          <h1 className="font-display text-4xl font-bold text-white mt-4 mb-2">New Password</h1>
          <p className="text-white/80 text-sm">Choose a strong, secure new password</p>
        </div>

        <div className="bg-gradient-to-b from-[#3D1000] to-[#5A1C08] border border-white/10 rounded-3xl shadow-2xl p-8 space-y-6 relative overflow-hidden text-white">
          {!token ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-display font-bold text-xl text-white">Invalid Reset Link</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                The password reset link is invalid or is missing the reset token. Please request a new link from the forgot password page.
              </p>
              <div className="pt-2">
                <Link href="/auth/forgot-password" className="inline-flex items-center gap-2 text-sm font-bold text-[#FFD700] hover:text-[#FFE066] hover:underline">
                  Go to Forgot Password
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-display font-bold text-xl text-white">Password Updated</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Your password has been successfully updated. Redirecting you to login page...
              </p>
              <div className="pt-2">
                <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#FFD700] hover:text-[#FFE066] hover:underline">
                  Click here if not redirected
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="password">New Password</label>
                <div className="relative">
                  <input id="password" type={showPw ? 'text' : 'password'} className="input pr-11"
                    placeholder="••••••••" {...register('password')} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <input id="confirmPassword" type={showConfirmPw ? 'text' : 'password'} className="input pr-11"
                    placeholder="••••••••" {...register('confirmPassword')} />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso transition-colors">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#F9A825] hover:from-[#FFE066] hover:to-[#FFB300] text-[#3D1000] font-bold text-base transition-all duration-200 shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#3D1000] border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
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

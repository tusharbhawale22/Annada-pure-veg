'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Eye, EyeOff, Leaf, Check } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router  = useRouter();
  const params  = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { setUser } = useAuthStore();
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });
  const password = watch('password', '');

  const passwordRules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter',  valid: /[A-Z]/.test(password) },
    { label: 'One number',            valid: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      setUser(res.data.user);
      toast.success(`Welcome to Annada, ${res.data.user.name.split(' ')[0]}! 🌿`);
      router.push(redirect);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-20 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-48 h-48 bg-saffron-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-gold-800/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-saffron-gradient rounded-2xl flex items-center justify-center shadow-warm group-hover:shadow-warm-lg transition-shadow">
              <Leaf className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold text-espresso mt-4 mb-1">Create Account</h1>
          <p className="text-espresso/60 text-sm">Join Annada Pure Veg — fresh food, every day</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-4">
          <div>
            <label className="input-label" htmlFor="name">Full Name</label>
            <input id="name" type="text" autoComplete="name" className="input" placeholder="Priya Kulkarni" {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="input-label" htmlFor="email">Email Address</label>
            <input id="email" type="email" autoComplete="email" className="input" placeholder="priya@example.com" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="input-label" htmlFor="phone">Mobile Number</label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-warm-200 border border-warm-300 rounded-xl text-sm font-semibold text-espresso/60 flex-shrink-0">
                🇮🇳 +91
              </div>
              <input id="phone" type="tel" autoComplete="tel" className="input" maxLength={10} placeholder="9876543210" {...register('phone')} />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="input-label" htmlFor="password">Password</label>
            <div className="relative">
              <input id="password" type={showPw ? 'text' : 'password'} className="input pr-11" placeholder="Minimum 8 characters" {...register('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength indicators */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordRules.map((rule) => (
                  <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.valid ? 'text-leaf' : 'text-espresso/40'}`}>
                    <Check className={`w-3 h-3 ${rule.valid ? 'opacity-100' : 'opacity-30'}`} />
                    {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" className="input" placeholder="Repeat password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base mt-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </span>
            ) : 'Create Account 🌿'}
          </button>

          <p className="text-center text-sm text-espresso/60">
            Already have an account?{' '}
            <Link href={`/auth/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-semibold text-saffron-900 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

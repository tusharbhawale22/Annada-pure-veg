'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router  = useRouter();
  const [redirect, setRedirect] = useState('/');
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setRedirect(searchParams.get('redirect') || '/');
  }, []);
  const { setUser } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const user = res.data.user;
      setUser(user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🌿`);
      
      // Safety: Never redirect a non-admin to an admin route
      let finalRedirect = redirect;
      if (user.role !== 'admin' && redirect.startsWith('/admin')) {
        finalRedirect = '/';
      }
      
      router.push(finalRedirect);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
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
          <h1 className="font-display text-4xl font-bold text-white mt-4 mb-2">Welcome Back</h1>
          <p className="text-white/80 text-sm">Login to your Annada Pure Veg account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-gradient-to-b from-[#3D1000] to-[#5A1C08] border border-white/10 rounded-3xl shadow-2xl p-8 space-y-6 relative overflow-hidden text-white">

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="email">Email Address</label>
            <input id="email" type="email" autoComplete="email" className="input"
              placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-white/90" htmlFor="password">Password</label>
            </div>
            <div className="relative">
              <input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                className="input pr-11" placeholder="••••••••" {...register('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#F9A825] hover:from-[#FFE066] hover:to-[#FFB300] text-[#3D1000] font-bold text-base transition-all duration-200 shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#3D1000] border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              <span className="flex items-center gap-2">Login <ArrowRight className="w-4 h-4" /></span>
            )}
          </button>

          <p className="text-center text-sm text-white/70">
            Don't have an account?{' '}
            <Link href={`/auth/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-bold text-[#FFD700] hover:text-[#FFE066] hover:underline transition-colors">
              Register here
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-white/60 mt-6">
          🌿 100% Pure Vegetarian · Annada Pure Veg, Pune
        </p>
      </div>
    </div>
  );
}

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
import { Eye, EyeOff, Leaf, Check, MapPin } from 'lucide-react';

const registerSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters'),
  email:   z.string().email('Enter a valid email'),
  phone:   z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  confirmPassword: z.string(),
  // Address fields — optional but encouraged
  addressLine1: z.string().optional(),
  addressArea:  z.string().optional(),
  addressPincode: z.string().optional(),
  addressLandmark: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).superRefine((d, ctx) => {
  const hasAnyAddress = d.addressLine1 || d.addressArea || (d.addressPincode && d.addressPincode.trim() !== '') || d.addressLandmark;
  
  if (hasAnyAddress) {
    if (!d.addressLine1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Address is required if saving delivery info', path: ['addressLine1'] });
    }
    if (!d.addressArea) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Area is required', path: ['addressArea'] });
    }
    if (!d.addressPincode || !/^\d{6}$/.test(d.addressPincode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid 6-digit pincode', path: ['addressPincode'] });
    }
  }
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router  = useRouter();
  const [redirect, setRedirect] = useState('/');
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setRedirect(searchParams.get('redirect') || '/');
  }, []);
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
      // Build address object if user filled it in
      const address = data.addressLine1 && data.addressArea && data.addressPincode
        ? {
            label:    'Home',
            line1:    data.addressLine1,
            area:     data.addressArea,
            pincode:  data.addressPincode,
            landmark: data.addressLandmark || '',
          }
        : undefined;

      const payload = {
        name:     data.name,
        email:    data.email,
        phone:    data.phone,
        password: data.password,
        address,
      };
      const res = await authApi.register(payload);
      const user = res.data.user;
      toast.success('Registration successful! Please login.');
      
      let finalRedirect = redirect;
      if (user && user.role !== 'admin' && redirect.startsWith('/admin')) {
        finalRedirect = '/';
      }
      
      router.push(`/auth/login?redirect=${encodeURIComponent(finalRedirect)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C84B00] to-[#E65100] py-12 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-saffron-gradient rounded-2xl flex items-center justify-center shadow-warm group-hover:shadow-warm-lg transition-shadow">
              <Leaf className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-4xl font-bold text-white mt-4 mb-2">Create Account</h1>
          <p className="text-white/80 text-sm">Join Annada Pure Veg — fresh food, every day</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-gradient-to-b from-[#3D1000] to-[#5A1C08] border border-white/10 rounded-3xl shadow-2xl p-8 space-y-5 relative overflow-hidden text-white">

          {/* ── Personal Info ── */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="name">Full Name</label>
            <input id="name" type="text" autoComplete="name" className="input" placeholder="Priya Kulkarni" {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="email">Email Address</label>
            <input id="email" type="email" autoComplete="email" className="input" placeholder="priya@example.com" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="phone">Mobile Number</label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-white/10 border border-white/20 rounded-xl text-sm font-semibold text-white/80 flex-shrink-0">
                🇮🇳 +91
              </div>
              <input id="phone" type="tel" autoComplete="tel" className="input" maxLength={10} placeholder="9763216146" {...register('phone')} />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="password">Password</label>
            <div className="relative">
              <input id="password" type={showPw ? 'text' : 'password'} className="input pr-11" placeholder="Minimum 8 characters" {...register('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordRules.map((rule) => (
                  <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.valid ? 'text-green-400' : 'text-white/40'}`}>
                    <Check className={`w-3 h-3 ${rule.valid ? 'opacity-100' : 'opacity-30'}`} />
                    {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" className="input" placeholder="Repeat password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {/* ── Delivery Address (saves you from re-entering at checkout) ── */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Delivery Address <span className="text-white/60 font-normal">(optional)</span></p>
                <p className="text-xs text-white/60">Save now — we'll use this automatically at checkout</p>
              </div>
            </div>

            <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <div>
                <label className="block text-xs font-semibold text-white/85 mb-1" htmlFor="addressLine1">Flat / House No. &amp; Building Name</label>
                <input
                  id="addressLine1"
                  type="text"
                  className="input text-sm"
                  placeholder="e.g. Flat 402, Lotus Heights"
                  {...register('addressLine1')}
                />
                {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/85 mb-1" htmlFor="addressArea">Area</label>
                  <input
                    id="addressArea"
                    type="text"
                    className="input text-sm"
                    placeholder="e.g. Kharadi"
                    {...register('addressArea')}
                  />
                  {errors.addressArea && <p className="text-red-500 text-xs mt-1">{errors.addressArea.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/85 mb-1" htmlFor="addressPincode">Pincode</label>
                  <input
                    id="addressPincode"
                    type="text"
                    className="input text-sm"
                    placeholder="411014"
                    maxLength={6}
                    {...register('addressPincode')}
                  />
                  {errors.addressPincode && <p className="text-red-500 text-xs mt-1">{errors.addressPincode.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/85 mb-1" htmlFor="addressLandmark">Landmark <span className="text-white/60 font-normal">(optional)</span></label>
                <input
                  id="addressLandmark"
                  type="text"
                  className="input text-sm"
                  placeholder="Near blue gate, opp. ABC school"
                  {...register('addressLandmark')}
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#F9A825] hover:from-[#FFE066] hover:to-[#FFB300] text-[#3D1000] font-bold text-base transition-all duration-200 shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#3D1000] border-t-transparent rounded-full animate-spin" />
                Creating account...
              </span>
            ) : 'Create Account 🌿'}
          </button>

          <p className="text-center text-sm text-white/70">
            Already have an account?{' '}
            <Link href={`/auth/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-bold text-[#FFD700] hover:text-[#FFE066] hover:underline transition-colors">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

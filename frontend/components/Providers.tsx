/**
 * components/Providers.tsx — App-wide context providers
 */
'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Manually rehydrate cart store from localStorage after mount
    // This works alongside skipHydration: true to avoid SSR/client mismatch
    useCartStore.persist.rehydrate();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 30px rgba(44,24,16,0.15)',
          },
          success: {
            style: { background: '#388E3C', color: '#fff' },
            iconTheme: { primary: '#fff', secondary: '#388E3C' },
          },
          error: {
            style: { background: '#c0392b', color: '#fff' },
            iconTheme: { primary: '#fff', secondary: '#c0392b' },
          },
        }}
      />
    </QueryClientProvider>
  );
}

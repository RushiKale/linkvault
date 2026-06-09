'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ToastProvider } from '@/lib/toast';
import { setToastErrorHandler } from '@/lib/api';
import { showToast } from '@/lib/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setToastErrorHandler((msg: string) => showToast(msg, 'error'));
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}

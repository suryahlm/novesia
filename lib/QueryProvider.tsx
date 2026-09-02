import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 menit - cache bertahan di memory, ganti tab instant tanpa reload
            gcTime: 1000 * 60 * 30,    // 30 menit garbage collection time
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    []
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

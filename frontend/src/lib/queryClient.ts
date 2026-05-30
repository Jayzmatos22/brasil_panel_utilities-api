import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5min — dado considerado "fresco"
      gcTime: 1000 * 60 * 30,      // 30min — quanto fica em memória
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Menggunakan useState agar QueryClient hanya dibuat sekali per sesi pengguna
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Mencegah fetch berulang saat pindah tab browser
        staleTime: 1000 * 60 * 5,    // Data dianggap segar selama 5 menit
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
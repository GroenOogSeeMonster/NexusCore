'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Temporarily disabled until packages are installed
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// import { Toaster } from 'sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 403) return false
        return failureCount < 3
      },
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Temporarily disabled until packages are installed */}
      {/* <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#F9FAFB',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
}
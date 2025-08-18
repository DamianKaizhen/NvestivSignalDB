'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Performance optimizations
            staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
            gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection
            
            // Background refetching optimizations
            refetchOnWindowFocus: false, // Disable refetch on window focus for better UX
            refetchOnMount: true, // Refetch when component mounts
            refetchOnReconnect: true, // Refetch when network reconnects
            
            // Retry configuration
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Don't retry more than 3 times
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Network mode for better offline handling
            networkMode: 'online',
          },
          mutations: {
            // Retry mutations on network errors
            retry: (failureCount, error: any) => {
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              return failureCount < 2
            },
            networkMode: 'online',
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
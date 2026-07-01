import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import { router } from '@/router'
import { store } from '@/store'
import { queryClient } from '@/lib/queryClient'

export default function App() {
  return (
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            richColors
            expand
            closeButton
            toastOptions={{
              classNames: {
                toast: 'rounded-xl shadow-lg border border-gray-100',
                title: 'font-semibold text-sm',
                description: 'text-xs text-gray-500',
              },
            }}
          />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  )
}

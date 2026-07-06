import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/layout/CartDrawer'
import { useAppSelector } from '@/store'

// ---- Lazy pages ----
const Home = lazy(() => import('@/pages/Home'))
const Catalog = lazy(() => import('@/pages/Catalog'))
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const Dashboard = lazy(() => import('@/pages/user/Dashboard'))
const VirtualTryOn = lazy(() => import('@/pages/VirtualTryOn'))
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))

// ---- Layout ----
function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <CartDrawer />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

// ---- Auth guard ----
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: window.location.pathname }} />
  }
  return <>{children}</>
}

// ---- Auth layout (no header/footer) ----
function AuthLayout() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

function StaticPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500">This page is coming soon.</p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-8xl font-bold text-brand-100 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'catalog', element: <Catalog /> },
      { path: 'products/:slug', element: <ProductDetail /> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      // Placeholder routes — add components as you build them
      { path: 'try-on', element: <VirtualTryOn /> },
      { path: 'face-shape', element: <div className="p-8 text-center text-xl">Face Shape Detection — Coming Soon</div> },
      { path: 'wishlist', element: <div className="p-8 text-center text-xl">Wishlist</div> },
      { path: 'orders', element: <div className="p-8 text-center text-xl">My Orders</div> },
      { path: 'orders/:id', element: <ProtectedRoute><OrderSuccess /></ProtectedRoute> },
      { path: 'prescriptions', element: <div className="p-8 text-center text-xl">My Prescriptions</div> },
      { path: 'eye-test', element: <div className="p-8 text-center text-xl">Eye Test Booking</div> },
      { path: 'stores', element: <div className="p-8 text-center text-xl">Store Locator</div> },
      { path: 'offers', element: <div className="p-8 text-center text-xl">Offers</div> },
      { path: 'terms', element: <StaticPage title="Terms & Conditions" /> },
      { path: 'privacy', element: <StaticPage title="Privacy Policy" /> },
      { path: 'cookies', element: <StaticPage title="Cookie Policy" /> },
      { path: 'warranty', element: <StaticPage title="Warranty Policy" /> },
      { path: 'about', element: <StaticPage title="About Lenskart" /> },
      { path: 'careers', element: <StaticPage title="Careers" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'auth/login', element: <Login /> },
      { path: 'auth/register', element: <Register /> },
      { path: 'auth/forgot-password', element: <StaticPage title="Forgot Password" /> },
    ],
  },
])

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ShoppingCart, Heart, User, Menu, X,
  Phone, MapPin, ChevronDown, Glasses,
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleCart } from '@/store/slices/cartSlice'
import { closeMobileMenu, openMobileMenu, openSearch } from '@/store/slices/uiSlice'
import { useProductSearch } from '@/hooks/api/useProducts'
import { useDebounce } from '@/hooks/ui/useDebounce'
import { cn, formatPrice } from '@/lib/utils'

const NAV_LINKS = [
  {
    label: 'Eyeglasses',
    href: '/catalog?category=eyeglasses',
    children: [
      { label: 'Men', href: '/catalog?category=eyeglasses&gender=MEN' },
      { label: 'Women', href: '/catalog?category=eyeglasses&gender=WOMEN' },
      { label: 'Kids', href: '/catalog?category=eyeglasses&gender=KIDS' },
      { label: 'Blue Light', href: '/catalog?blueLight=true' },
    ],
  },
  {
    label: 'Sunglasses',
    href: '/catalog?category=sunglasses',
    children: [
      { label: "Men's Sunglasses", href: '/catalog?category=sunglasses&gender=MEN' },
      { label: "Women's Sunglasses", href: '/catalog?category=sunglasses&gender=WOMEN' },
      { label: 'Polarized', href: '/catalog?polarized=true' },
      { label: 'Sports', href: '/catalog?category=sports' },
    ],
  },
  {
    label: 'Contact Lenses',
    href: '/catalog?category=contact-lenses',
    children: [],
  },
  { label: 'Eye Test', href: '/eye-test', children: [] },
  { label: 'Offers', href: '/offers', children: [] },
  { label: 'Stores', href: '/stores', children: [] },
]

export default function Header() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const { cart } = useAppSelector((s) => s.cart)
  const { productIds: wishlistIds } = useAppSelector((s) => s.wishlist)
  const { isMobileMenuOpen } = useAppSelector((s) => s.ui)

  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: searchResults } = useProductSearch(debouncedSearch, 6)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const itemCount = cart?.itemCount ?? 0

  return (
    <>
      {/* Top bar */}
      <div className="bg-brand-700 text-white text-xs py-1.5 hidden md:block">
        <div className="page-container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="tel:1800123456" className="flex items-center gap-1 hover:text-brand-200 transition-colors">
              <Phone className="w-3 h-3" /> 1800-123-4567
            </a>
            <span className="text-brand-400">|</span>
            <span className="text-brand-200">Free shipping on orders above ₹500</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/stores" className="flex items-center gap-1 hover:text-brand-200 transition-colors">
              <MapPin className="w-3 h-3" /> Find a Store
            </Link>
            <span className="text-brand-400">|</span>
            <Link to="/eye-test" className="hover:text-brand-200 transition-colors">Book Eye Test</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={cn(
          'sticky top-0 z-50 bg-white transition-shadow duration-300',
          scrolled ? 'shadow-nav' : 'border-b border-gray-100',
        )}
      >
        <div className="page-container">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                <Glasses className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">
                Lens<span className="text-brand-600">kart</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-6 flex-1">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.children.length > 0 && setHoveredNav(link.label)}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <Link
                    to={link.href}
                    className={cn(
                      'flex items-center gap-0.5 px-3 py-2 text-sm font-medium rounded-lg',
                      'text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-all',
                    )}
                  >
                    {link.label}
                    {link.children.length > 0 && (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {hoveredNav === link.label && link.children.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-xs relative" ref={searchRef as React.RefObject<HTMLDivElement>}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search frames, lenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              {/* Search dropdown */}
              <AnimatePresence>
                {isSearchFocused && debouncedSearch.length >= 2 && searchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                  >
                    {searchResults.content.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">No results found</p>
                    ) : (
                      <>
                        {searchResults.content.map((product) => (
                          <Link
                            key={product.id}
                            to={`/products/${product.slug}`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            <img
                              src={product.images[0]?.url || '/placeholder.png'}
                              alt={product.name}
                              className="w-10 h-8 object-cover rounded-lg bg-gray-100"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                              <p className="text-xs text-brand-600 font-semibold">{formatPrice(product.finalPrice)}</p>
                            </div>
                          </Link>
                        ))}
                        <button
                          onClick={() => navigate(`/catalog?q=${encodeURIComponent(debouncedSearch)}`)}
                          className="w-full px-4 py-2.5 text-sm text-brand-600 font-medium hover:bg-brand-50 border-t border-gray-100 transition-colors"
                        >
                          See all results for "{debouncedSearch}"
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Mobile search */}
              <button
                onClick={() => dispatch(openSearch())}
                className="md:hidden btn-ghost p-2"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="btn-ghost p-2 relative" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistIds.length > 9 ? '9+' : wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => dispatch(toggleCart())}
                className="btn-ghost p-2 relative"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </button>

              {/* User */}
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-ghost p-2" aria-label="Dashboard">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Link>
              ) : (
                <Link
                  to="/auth/login"
                  className="hidden sm:inline-flex btn-primary py-2 px-4 text-xs"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile menu */}
              <button
                onClick={() =>
                  isMobileMenuOpen ? dispatch(closeMobileMenu()) : dispatch(openMobileMenu())
                }
                className="lg:hidden btn-ghost p-2"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-y-0 right-0 w-72 bg-white z-40 shadow-2xl overflow-y-auto"
          >
            <div className="p-6 pt-20">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <nav className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <div key={link.label}>
                    <Link
                      to={link.href}
                      onClick={() => dispatch(closeMobileMenu())}
                      className="block px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-xl"
                    >
                      {link.label}
                    </Link>
                    {link.children.length > 0 && (
                      <div className="ml-4 space-y-0.5">
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.href}
                            onClick={() => dispatch(closeMobileMenu())}
                            className="block px-4 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    onClick={() => dispatch(closeMobileMenu())}
                    className="btn-primary w-full text-center"
                  >
                    My Account
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth/login"
                      onClick={() => dispatch(closeMobileMenu())}
                      className="btn-primary w-full text-center"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth/register"
                      onClick={() => dispatch(closeMobileMenu())}
                      className="btn-outline w-full text-center"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeMobileMenu())}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  )
}

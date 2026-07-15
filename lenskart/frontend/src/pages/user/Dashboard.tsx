import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  User, Package, Heart, MapPin, FileText, Calendar,
  ChevronRight, LogOut, Settings, Eye, Star, Clock,
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { logout } from '@/store/slices/authSlice'
import { useOrders } from '@/hooks/api/useOrders'
import { formatPrice, formatDate, getInitials } from '@/lib/utils'

const MENU_ITEMS = [
  { icon: Package, label: 'My Orders', href: '/orders', badge: null },
  { icon: Heart, label: 'Wishlist', href: '/wishlist', badge: null },
  { icon: MapPin, label: 'Saved Addresses', href: '/dashboard/addresses', badge: null },
  { icon: FileText, label: 'My Prescriptions', href: '/prescriptions', badge: null },
  { icon: Calendar, label: 'Eye Test Bookings', href: '/eye-test/bookings', badge: null },
  { icon: Star, label: 'Reviews & Ratings', href: '/dashboard/reviews', badge: null },
  { icon: Settings, label: 'Account Settings', href: '/dashboard/settings', badge: null },
]

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  DISPATCHED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-gray-100 text-gray-700',
}

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { data: ordersData } = useOrders(0, 3)

  return (
    <>
      <Helmet>
        <title>My Account — Lenskart</title>
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="page-container py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Profile card */}
              <div className="bg-gradient-to-br from-brand-600 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                      {getInitials(user?.fullName ?? 'U')}
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-lg">{user?.fullName}</h2>
                    <p className="text-white/70 text-sm">{user?.email}</p>
                    {user?.phone && (
                      <p className="text-white/70 text-sm">{user.phone}</p>
                    )}
                  </div>
                </div>
                <Link
                  to="/dashboard/settings"
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" /> Edit Profile
                </Link>
              </div>

              {/* Menu */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                {MENU_ITEMS.map(({ icon: Icon, label, href }, idx) => (
                  <Link
                    key={href}
                    to={href}
                    className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group ${
                      idx < MENU_ITEMS.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">
                      {label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                  </Link>
                ))}

                {/* Logout */}
                <button
                  onClick={() => dispatch(logout())}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 transition-colors text-left group border-t border-gray-100"
                >
                  <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                    Sign Out
                  </span>
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Orders', value: ordersData?.totalElements ?? 0, icon: Package, color: 'text-brand-600 bg-brand-50' },
                  { label: 'Wishlist', value: useAppSelector((s) => s.wishlist.productIds.length), icon: Heart, color: 'text-red-500 bg-red-50' },
                  { label: 'Saved Addresses', value: '–', icon: MapPin, color: 'text-green-600 bg-green-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"
                  >
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Recent Orders</h3>
                  <Link to="/orders" className="text-sm text-brand-600 font-semibold hover:text-brand-700">
                    View All
                  </Link>
                </div>

                {!ordersData || ordersData.content.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">No orders yet</p>
                    <Link to="/catalog" className="btn-primary text-sm">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {ordersData.content.map((order) => (
                      <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {order.items[0]?.product?.images?.[0]?.url && (
                            <img
                              src={order.items[0].product.images[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">{order.orderNumber}</p>
                            <span className={`badge ${ORDER_STATUS_COLOR[order.status]}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(order.createdAt)} • {order.items.length} item(s)
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                          <ChevronRight className="w-4 h-4 text-gray-300 mt-0.5 ml-auto group-hover:text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Eye, label: 'Virtual Try-On', href: '/try-on', color: 'bg-brand-50 text-brand-600' },
                  { icon: Calendar, label: 'Book Eye Test', href: '/eye-test', color: 'bg-green-50 text-green-600' },
                  { icon: FileText, label: 'Upload Prescription', href: '/prescriptions', color: 'bg-purple-50 text-purple-600' },
                  { icon: Clock, label: 'Track Order', href: '/orders', color: 'bg-orange-50 text-orange-600' },
                  { icon: Star, label: 'Write a Review', href: '/dashboard/reviews', color: 'bg-yellow-50 text-yellow-600' },
                  { icon: MapPin, label: 'Add Address', href: '/dashboard/addresses', color: 'bg-teal-50 text-teal-600' },
                ].map(({ icon: Icon, label, href, color }) => (
                  <Link
                    key={label}
                    to={href}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all text-center group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

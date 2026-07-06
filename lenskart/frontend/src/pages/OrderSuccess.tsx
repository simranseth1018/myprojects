import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { CheckCircle2, Package, Truck, MapPin, Clock, ShoppingBag, Loader2 } from 'lucide-react'
import { useOrder } from '@/hooks/api/useOrders'
import { formatPrice } from '@/lib/utils'

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const { data: order, isLoading } = useOrder(id ?? '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page-container py-20 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <Link to="/catalog" className="btn-primary mt-4 inline-flex">Continue Shopping</Link>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Order {order.orderNumber} — Lenskart</title>
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="page-container py-8 max-w-3xl mx-auto">
          {/* Success header */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Placed Successfully!</h1>
              <p className="text-gray-500">
                Thank you for shopping with Lenskart. Your order #{order.orderNumber} has been confirmed.
              </p>
            </motion.div>
          )}

          {!isSuccess && (
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Order #{order.orderNumber}</h1>
          )}

          {/* Order status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  order.status === 'CANCELLED' ? 'bg-red-100' : 'bg-brand-100'
                }`}>
                  {order.status === 'DELIVERED' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : order.status === 'CANCELLED' ? (
                    <Package className="w-5 h-5 text-red-600" />
                  ) : (
                    <Truck className="w-5 h-5 text-brand-600" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{order.status.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">
                    Payment: {order.paymentStatus} via {order.paymentMethod ?? 'N/A'}
                  </p>
                </div>
              </div>
              {order.estimatedDelivery && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Delivery</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* Shipping address */}
            {order.shippingAddress && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{order.shippingAddress.name}</span>
                  {' — '}
                  {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                  {order.shippingAddress.phone && <span> | {order.shippingAddress.phone}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Order items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Items ({order.items.length})</h3>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 py-3">
                  <img
                    src={item.productImageUrl || '/placeholder.png'}
                    alt={item.productName}
                    className="w-16 h-12 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">
                      {item.variantColor && `${item.variantColor} • `}Qty: {item.quantity}
                    </p>
                    {item.lensOptionName && (
                      <p className="text-xs text-teal-600">{item.lensOptionName}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {formatPrice(Number(item.totalPrice))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className={Number(order.shippingFee) === 0 ? 'text-teal-600' : ''}>
                  {Number(order.shippingFee) === 0 ? 'Free' : formatPrice(Number(order.shippingFee))}
                </span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount</span>
                  <span className="text-green-600">-{formatPrice(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{formatPrice(Number(order.totalAmount))}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link to="/catalog" className="btn-primary flex-1 py-3 justify-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>
            <Link to="/dashboard" className="btn-outline flex-1 py-3 justify-center">
              My Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

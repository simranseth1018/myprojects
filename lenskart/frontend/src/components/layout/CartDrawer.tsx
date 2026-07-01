import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Trash2, Plus, Minus, ChevronRight, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { closeCart } from '@/store/slices/cartSlice'
import { useUpdateCartItem, useRemoveCartItem } from '@/hooks/api/useCart'
import { formatPrice } from '@/lib/utils'

export default function CartDrawer() {
  const dispatch = useAppDispatch()
  const { cart, isOpen } = useAppSelector((s) => s.cart)
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCart())}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-600" />
                <h2 className="font-bold text-gray-900">
                  Cart
                  {cart && cart.itemCount > 0 && (
                    <span className="ml-1.5 text-sm text-gray-500 font-normal">
                      ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {!cart || cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Your cart is empty</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Add some frames or lenses to get started
                  </p>
                  <Link
                    to="/catalog"
                    onClick={() => dispatch(closeCart())}
                    className="btn-primary"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.items.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex gap-3">
                        <Link
                          to={`/products/${item.product.slug}`}
                          onClick={() => dispatch(closeCart())}
                          className="flex-shrink-0"
                        >
                          <img
                            src={item.product.images[0]?.url || '/placeholder.png'}
                            alt={item.product.name}
                            className="w-20 h-16 object-cover rounded-xl bg-gray-100"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.product.slug}`}
                            onClick={() => dispatch(closeCart())}
                            className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {item.variant && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.variant.colorName}
                            </p>
                          )}
                          {item.lensOption && (
                            <p className="text-xs text-teal-600 mt-0.5 font-medium">
                              + {item.lensOption.name}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity control */}
                            <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                              <button
                                onClick={() =>
                                  item.quantity > 1
                                    ? updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                                    : removeItem.mutate(item.id)
                                }
                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors rounded-l-lg"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                                }
                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors rounded-r-lg"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                {formatPrice(item.totalPrice)}
                              </span>
                              <button
                                onClick={() => removeItem.mutate(item.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart && cart.items.length > 0 && (
              <div className="p-5 border-t border-gray-100 space-y-4 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-teal-600">
                      {cart.subtotal >= 500 ? 'Free' : formatPrice(99)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(cart.subtotal + (cart.subtotal >= 500 ? 0 : 99))}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={() => dispatch(closeCart())}
                  className="btn-primary w-full justify-center gap-2"
                >
                  Proceed to Checkout
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/cart"
                  onClick={() => dispatch(closeCart())}
                  className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

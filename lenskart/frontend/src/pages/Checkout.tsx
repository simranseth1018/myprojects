import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MapPin, CreditCard, ShieldCheck, ChevronRight,
  Package, Check, Loader2, Tag,
} from 'lucide-react'
import { useAppSelector } from '@/store'
import { useAddresses, useAddAddress } from '@/hooks/api/useUser'
import { usePlaceOrder, useVerifyPayment, useApplyCoupon } from '@/hooks/api/useOrders'
import { initiateRazorpayPayment } from '@/lib/razorpay'
import { formatPrice, cn } from '@/lib/utils'
import type { Address } from '@/types/user'
import { toast } from 'sonner'

type Step = 'address' | 'payment' | 'review'

const addressSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone'),
  line1: z.string().min(5, 'Enter your address'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Enter your city'),
  state: z.string().min(2, 'Enter your state'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode'),
  type: z.enum(['HOME', 'WORK', 'OTHER']),
})

type AddressFormData = z.infer<typeof addressSchema>

export default function Checkout() {
  const navigate = useNavigate()
  const { cart } = useAppSelector((s) => s.cart)
  const { user } = useAppSelector((s) => s.auth)

  const [step, setStep] = useState<Step>('address')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addNewAddress, setAddNewAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('COD')
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)

  const { data: addresses, refetch: refetchAddresses } = useAddresses()
  const addAddress = useAddAddress()
  const placeOrder = usePlaceOrder()
  const verifyPayment = useVerifyPayment()
  const applyCoupon = useApplyCoupon()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { type: 'HOME' },
  })

  const subtotal = cart?.subtotal ?? 0
  const shipping = subtotal >= 500 ? 0 : 99
  const total = subtotal + shipping - discount

  const handleApplyCoupon = async () => {
    if (!couponCode || !cart) return
    try {
      const result = await applyCoupon.mutateAsync({ code: couponCode, cartId: cart.id })
      if (result.valid) {
        setDiscount(result.discountAmount)
        setCouponApplied(true)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {}
  }

  // Save new address and proceed to payment
  const handleAddressSubmit = async (data: AddressFormData) => {
    try {
      const result = await addAddress.mutateAsync({
        type: data.type,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: true,
      } as Omit<Address, 'id' | 'userId'>)
      setSelectedAddressId(result.id)
      await refetchAddresses()
      setAddNewAddress(false)
      setStep('payment')
    } catch {
      toast.error('Failed to save address')
    }
  }

  const handleContinueToPayment = () => {
    if (addNewAddress || !addresses || addresses.length === 0) {
      // Trigger form validation and submit
      handleSubmit(handleAddressSubmit)()
      return
    }
    // Using existing address
    if (!selectedAddressId && addresses?.length > 0) {
      const defaultAddr = addresses.find((a: Address) => a.isDefault)
      setSelectedAddressId(defaultAddr?.id ?? addresses[0].id)
    }
    setStep('payment')
  }

  const handlePlaceOrder = async () => {
    const addressId = selectedAddressId ?? addresses?.find((a: Address) => a.isDefault)?.id ?? addresses?.[0]?.id

    if (!addressId) {
      toast.error('Please add a delivery address first')
      setStep('address')
      return
    }

    try {
      const result = await placeOrder.mutateAsync({
        addressId,
        paymentMethod,
      })

      if (paymentMethod === 'COD') {
        navigate(`/orders/${result.order.id}?success=true`)
        toast.success('Order placed successfully!')
        return
      }

      // Online payment via Razorpay
      await initiateRazorpayPayment({
        orderId: result.order.id,
        razorpayOrderId: result.razorpayOrderId,
        amount: result.amount,
        userName: user?.fullName ?? '',
        userEmail: user?.email ?? '',
        userPhone: user?.phone ?? '',
        onSuccess: async (response) => {
          await verifyPayment.mutateAsync({
            orderId: result.order.id,
            razorpayOrderId: result.razorpayOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          navigate(`/orders/${result.order.id}?success=true`)
          toast.success('Payment successful! Order placed.')
        },
        onDismiss: () => {
          toast.error('Payment cancelled. Your order is saved — you can retry payment later.')
        },
      })
    } catch {
      toast.error('Failed to place order. Please try again.')
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="page-container py-20 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <Link to="/catalog" className="btn-primary">Continue Shopping</Link>
      </div>
    )
  }

  const STEPS: { key: Step; label: string; icon: typeof MapPin }[] = [
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'review', label: 'Review', icon: ShieldCheck },
  ]

  return (
    <>
      <Helmet>
        <title>Checkout — Lenskart</title>
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="page-container py-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-8">
            {STEPS.map((s, idx) => (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => {
                    const stepOrder: Step[] = ['address', 'payment', 'review']
                    const currentIdx = stepOrder.indexOf(step)
                    const targetIdx = stepOrder.indexOf(s.key)
                    if (targetIdx <= currentIdx) setStep(s.key)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                    step === s.key
                      ? 'bg-brand-600 text-white shadow-md'
                      : STEPS.findIndex((x) => x.key === step) > idx
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-500',
                  )}
                >
                  {STEPS.findIndex((x) => x.key === step) > idx ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Step content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Address step */}
                {step === 'address' && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-5">Delivery Address</h2>

                    {/* Saved addresses */}
                    {addresses && addresses.length > 0 && !addNewAddress && (
                      <div className="space-y-3 mb-4">
                        {addresses.map((addr: Address) => (
                          <label
                            key={addr.id}
                            className={cn(
                              'flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                              selectedAddressId === addr.id || (!selectedAddressId && addr.isDefault)
                                ? 'border-brand-500 bg-brand-50'
                                : 'border-gray-200 hover:border-gray-300',
                            )}
                          >
                            <input
                              type="radio"
                              name="address"
                              value={addr.id}
                              checked={selectedAddressId === addr.id || (!selectedAddressId && addr.isDefault)}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 accent-brand-600"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-gray-900">{addr.fullName}</p>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{addr.type}</span>
                                {addr.isDefault && (
                                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Default</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5">Phone: {addr.phone}</p>
                            </div>
                          </label>
                        ))}
                        <button
                          onClick={() => setAddNewAddress(true)}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-brand-600 font-semibold hover:border-brand-400 hover:bg-brand-50 transition-all"
                        >
                          + Add New Address
                        </button>
                      </div>
                    )}

                    {/* New address form */}
                    {(addNewAddress || !addresses || addresses.length === 0) && (
                      <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                            <input {...register('fullName')} className={cn('input-field', errors.fullName && 'border-red-300')} placeholder="John Doe" />
                            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                            <input {...register('phone')} className={cn('input-field', errors.phone && 'border-red-300')} placeholder="9876543210" />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 1</label>
                          <input {...register('line1')} className={cn('input-field', errors.line1 && 'border-red-300')} placeholder="House/Flat no., Street name" />
                          {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1.message}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 2 (Optional)</label>
                          <input {...register('line2')} className="input-field" placeholder="Area, Landmark" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                            <input {...register('city')} className={cn('input-field', errors.city && 'border-red-300')} />
                            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                            <input {...register('state')} className={cn('input-field', errors.state && 'border-red-300')} />
                            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode</label>
                            <input {...register('pincode')} className={cn('input-field', errors.pincode && 'border-red-300')} maxLength={6} />
                            {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {(['HOME', 'WORK', 'OTHER'] as const).map((t) => (
                            <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                              <input {...register('type')} type="radio" value={t} className="accent-brand-600" />
                              <span className="text-sm font-medium text-gray-700">{t}</span>
                            </label>
                          ))}
                        </div>
                      </form>
                    )}

                    <button
                      onClick={handleContinueToPayment}
                      disabled={addAddress.isPending}
                      className="btn-primary w-full mt-6 py-3 justify-center gap-2"
                    >
                      {addAddress.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving address...</>
                      ) : (
                        <>Continue to Payment <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Payment step */}
                {step === 'payment' && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-5">Payment Method</h2>

                    <div className="space-y-3 mb-6">
                      {[
                        {
                          value: 'RAZORPAY' as const,
                          label: 'Pay Online',
                          desc: 'UPI, Cards, Net Banking, Wallets via Razorpay',
                          icon: '💳',
                        },
                        {
                          value: 'COD' as const,
                          label: 'Cash on Delivery',
                          desc: 'Pay when your order arrives',
                          icon: '💵',
                        },
                      ].map(({ value, label, desc, icon }) => (
                        <label
                          key={value}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                            paymentMethod === value
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-gray-200 hover:border-gray-300',
                          )}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={value}
                            checked={paymentMethod === value}
                            onChange={() => setPaymentMethod(value)}
                            className="accent-brand-600"
                          />
                          <div className="text-2xl">{icon}</div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{label}</p>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('address')}
                        className="btn-outline flex-1 py-3 justify-center"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep('review')}
                        className="btn-primary flex-1 py-3 justify-center gap-2"
                      >
                        Review Order <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Review step */}
                {step === 'review' && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-5">Review Order</h2>

                    <div className="space-y-3 mb-6">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <img
                            src={item.product.images[0]?.url || '/placeholder.png'}
                            alt={item.product.name}
                            className="w-16 h-12 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                            <p className="text-xs text-gray-500">{item.variant?.colorName ?? 'Default'} • Qty: {item.quantity}</p>
                            {item.lensOption && (
                              <p className="text-xs text-teal-600">{item.lensOption.name}</p>
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                            {formatPrice(item.totalPrice)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6 flex items-start gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-green-800">Secure Checkout</p>
                        <p className="text-xs text-green-600">
                          Your payment and personal data are protected by 256-bit SSL encryption.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep('payment')} className="btn-outline flex-1 py-3 justify-center">Back</button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={placeOrder.isPending || verifyPayment.isPending}
                        className="btn-primary flex-1 py-3 justify-center gap-2"
                      >
                        {placeOrder.isPending || verifyPayment.isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                        ) : (
                          <><ShieldCheck className="w-4 h-4" /> Place Order ({formatPrice(total)})</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-2">
                      <img
                        src={item.product.images[0]?.url || '/placeholder.png'}
                        alt=""
                        className="w-12 h-10 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900 flex-shrink-0">{formatPrice(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={couponApplied}
                      className="input-field pl-8 text-xs py-2"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || couponApplied}
                    className="px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    Apply
                  </button>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({cart.itemCount} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className={shipping === 0 ? 'text-teal-600 font-medium' : ''}>
                      {shipping === 0 ? 'Free' : formatPrice(shipping)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Coupon Discount</span>
                      <span className="text-green-600">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 100% secure payments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

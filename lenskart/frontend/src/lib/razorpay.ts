declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  image?: string
  order_id: string
  handler: (response: RazorpayPaymentResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayInstance {
  open: () => void
  close: () => void
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export interface InitiatePaymentParams {
  orderId: string
  razorpayOrderId: string
  amount: number
  currency?: string
  userName: string
  userEmail: string
  userPhone: string
  onSuccess: (response: RazorpayPaymentResponse) => void
  onDismiss?: () => void
}

function isRazorpayConfigured(): boolean {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID
  return !!key && key !== 'rzp_test_xxxxxxxxxxxxxxxx' && !key.startsWith('your-')
}

/**
 * Mock payment flow for development without Razorpay credentials.
 * Shows a confirm dialog simulating payment, then calls onSuccess with mock data.
 */
function mockPayment(params: InitiatePaymentParams): void {
  const confirmed = window.confirm(
    `[Mock Payment]\n\n` +
    `Amount: ₹${params.amount.toFixed(2)}\n` +
    `Order: ${params.razorpayOrderId}\n\n` +
    `Click OK to simulate successful payment\n` +
    `Click Cancel to dismiss`
  )

  if (confirmed) {
    params.onSuccess({
      razorpay_payment_id: `pay_mock_${Date.now()}`,
      razorpay_order_id: params.razorpayOrderId,
      razorpay_signature: 'mock_signature_for_dev',
    })
  } else {
    params.onDismiss?.()
  }
}

export async function initiateRazorpayPayment(params: InitiatePaymentParams): Promise<void> {
  // Use mock payment if Razorpay is not configured
  if (!isRazorpayConfigured()) {
    mockPayment(params)
    return
  }

  const loaded = await loadRazorpayScript()
  if (!loaded) throw new Error('Failed to load Razorpay SDK')

  const options: RazorpayOptions = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: params.amount * 100, // paise
    currency: params.currency || 'INR',
    name: 'Lenskart',
    description: `Order #${params.orderId}`,
    image: '/logo.png',
    order_id: params.razorpayOrderId,
    handler: params.onSuccess,
    prefill: {
      name: params.userName,
      email: params.userEmail,
      contact: params.userPhone,
    },
    theme: { color: '#0284c7' },
    modal: { ondismiss: params.onDismiss },
  }

  const razorpay = new window.Razorpay(options)
  razorpay.open()
}

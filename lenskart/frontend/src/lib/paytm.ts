declare global {
  interface Window {
    Paytm?: {
      CheckoutJS: {
        init: (config: PaytmConfig) => Promise<void>
        invoke: () => void
      }
    }
  }
}

interface PaytmConfig {
  root: string
  flow: string
  data: {
    orderId: string
    token: string
    tokenType: string
    amount: string
  }
  merchant: {
    mid: string
    redirect: boolean
  }
  handler: {
    transactionStatus: (response: PaytmPaymentResponse) => void
    notifyMerchant: (eventName: string, data: unknown) => void
  }
}

export interface PaytmPaymentResponse {
  STATUS: string
  TXNID: string
  ORDERID: string
  CHECKSUMHASH: string
}

export function loadPaytmScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Paytm) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/MOCK_MERCHANT.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export interface InitiatePaytmParams {
  orderId: string
  paytmOrderId: string
  txnToken: string
  amount: number
  merchantId: string
  onSuccess: (response: PaytmPaymentResponse) => void
  onDismiss?: () => void
}

function isPaytmConfigured(): boolean {
  const mid = import.meta.env.VITE_PAYTM_MERCHANT_ID
  return !!mid && mid !== 'MOCK_MERCHANT' && !mid.startsWith('your-')
}

/**
 * Mock payment flow for development without Paytm credentials.
 */
function mockPaytmPayment(params: InitiatePaytmParams): void {
  const confirmed = window.confirm(
    `[Mock Paytm Payment]\n\n` +
    `Amount: ₹${params.amount.toFixed(2)}\n` +
    `Order: ${params.paytmOrderId}\n\n` +
    `Click OK to simulate successful Paytm payment\n` +
    `Click Cancel to dismiss`,
  )

  if (confirmed) {
    params.onSuccess({
      STATUS: 'TXN_SUCCESS',
      TXNID: `paytm_txn_${Date.now()}`,
      ORDERID: params.paytmOrderId,
      CHECKSUMHASH: 'mock_checksum_for_dev',
    })
  } else {
    params.onDismiss?.()
  }
}

export async function initiatePaytmPayment(params: InitiatePaytmParams): Promise<void> {
  if (!isPaytmConfigured()) {
    mockPaytmPayment(params)
    return
  }

  const loaded = await loadPaytmScript()
  if (!loaded || !window.Paytm) throw new Error('Failed to load Paytm SDK')

  const config: PaytmConfig = {
    root: '#paytm-checkout',
    flow: 'DEFAULT',
    data: {
      orderId: params.paytmOrderId,
      token: params.txnToken,
      tokenType: 'TXN_TOKEN',
      amount: params.amount.toFixed(2),
    },
    merchant: {
      mid: params.merchantId,
      redirect: false,
    },
    handler: {
      transactionStatus: (response) => {
        if (response.STATUS === 'TXN_SUCCESS') {
          params.onSuccess(response)
        } else {
          params.onDismiss?.()
        }
      },
      notifyMerchant: () => {},
    },
  }

  await window.Paytm.CheckoutJS.init(config)
  window.Paytm.CheckoutJS.invoke()
}

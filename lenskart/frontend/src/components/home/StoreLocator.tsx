import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Clock, Navigation, Search, Store } from 'lucide-react'
import { useNearbyStores } from '@/hooks/api/useOrders'
import { useDebounce } from '@/hooks/ui/useDebounce'
import { isValidPincode } from '@/lib/utils'
import type { Store as StoreType } from '@/types/order'

function StoreCard({ store }: { store: StoreType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Store className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900">{store.name}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{store.city}, {store.state} — {store.pincode}</p>
          </div>
        </div>
        {store.distance !== undefined && (
          <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full">
            {store.distance < 1 ? `${(store.distance * 1000).toFixed(0)}m` : `${store.distance.toFixed(1)}km`}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 flex items-start gap-1 mb-2">
        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
        {store.address}
      </p>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        {store.phone && (
          <a href={`tel:${store.phone}`} className="flex items-center gap-1 hover:text-brand-600 transition-colors">
            <Phone className="w-3 h-3" /> {store.phone}
          </a>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> 10am – 9pm
        </span>
      </div>

      {store.services.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {store.services.map((s) => (
            <span key={s} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {s}
            </span>
          ))}
        </div>
      )}

      <a
        href={`https://maps.google.com/?q=${store.latitude},${store.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors"
      >
        <Navigation className="w-3 h-3" /> Get Directions
      </a>
    </motion.div>
  )
}

export default function StoreLocator() {
  const [pincode, setPincode] = useState('')
  const debouncedPincode = useDebounce(pincode, 600)
  const { data: stores, isLoading } = useNearbyStores(debouncedPincode)

  const isValid = isValidPincode(debouncedPincode)

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="page-container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-1">
              Our Stores
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Find a Store Near You
            </h2>
            <p className="text-gray-500 text-sm">
              Visit any of our 1000+ stores for expert eye care & personalized styling.
            </p>
          </div>

          {/* Search input */}
          <div className="flex gap-3 max-w-sm mx-auto mb-8">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter your pincode"
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setPincode(val)
                }}
                className="input-field pl-9"
                maxLength={6}
              />
            </div>
            <button className="btn-primary px-4 gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Results */}
          {isLoading && isValid && (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="skeleton h-4 w-40 rounded mb-2" />
                  <div className="skeleton h-3 w-full rounded mb-1.5" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                </div>
              ))}
            </div>
          )}

          {stores && stores.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {stores.slice(0, 4).map((store: import('@/types/order').Store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}

          {stores && stores.length === 0 && isValid && !isLoading && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No stores found near {debouncedPincode}. Try a different pincode.
            </div>
          )}

          {!debouncedPincode && (
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-6">Or use your current location</p>
              <button
                onClick={() => {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    // In production: reverse geocode to get pincode
                    console.log(pos.coords)
                  })
                }}
                className="btn-outline gap-2"
              >
                <Navigation className="w-4 h-4" />
                Use My Location
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

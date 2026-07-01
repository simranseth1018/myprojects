import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Tag, Truck, RotateCcw, Shield, Headphones } from 'lucide-react'

const OFFERS = [
  {
    id: 1,
    title: 'Buy 1 Get 1 FREE',
    description: 'On all eyeglasses frames. Mix & match any style.',
    badge: 'HOT DEAL',
    badgeColor: 'bg-red-500',
    bg: 'from-brand-600 to-brand-800',
    href: '/catalog?offer=bogo',
    icon: Tag,
    expiry: '2 days left',
  },
  {
    id: 2,
    title: '40% Off on Lenses',
    description: 'Anti-glare, blue-cut & progressive lenses at record low prices.',
    badge: 'LIMITED',
    badgeColor: 'bg-amber-500',
    bg: 'from-purple-600 to-purple-900',
    href: '/catalog?lensDiscount=40',
    icon: Clock,
    expiry: 'Ends tonight',
  },
  {
    id: 3,
    title: 'Frame of the Month',
    description: 'Premium titanium frames starting at just ₹999.',
    badge: 'EXCLUSIVE',
    badgeColor: 'bg-teal-500',
    bg: 'from-teal-600 to-teal-900',
    href: '/catalog?offer=fotm',
    icon: Shield,
    expiry: 'This month only',
  },
]

const TRUST_BADGES = [
  { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹500' },
  { icon: RotateCcw, title: '30-Day Returns', desc: 'Hassle-free returns' },
  { icon: Shield, title: '1-Year Warranty', desc: 'On all frames & lenses' },
  { icon: Headphones, title: '24/7 Support', desc: 'We are always here' },
]

export default function OffersBanner() {
  return (
    <>
      {/* Offer cards */}
      <section className="py-12 md:py-16">
        <div className="page-container">
          <div className="section-header">
            <div>
              <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-1">
                Special Offers
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Today's Best Deals
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {OFFERS.map((offer, idx) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={offer.href}
                  className={`block relative overflow-hidden rounded-2xl bg-gradient-to-br ${offer.bg} p-6 h-48 group`}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-8 border-white" />
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full border-4 border-white" />
                  </div>

                  {/* Badge */}
                  <span className={`inline-block ${offer.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3`}>
                    {offer.badge}
                  </span>

                  {/* Icon */}
                  <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <offer.icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
                  <p className="text-sm text-white/80 mb-4 line-clamp-2">{offer.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {offer.expiry}
                    </span>
                    <span className="text-xs text-white font-semibold group-hover:underline">
                      Shop Now →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-brand-50 border-y border-brand-100">
        <div className="page-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, title, desc }, idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-11 h-11 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

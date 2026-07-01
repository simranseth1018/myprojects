import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Eye, Camera, Calendar } from 'lucide-react'
import HeroBanner from '@/components/home/HeroBanner'
import CategoryGrid from '@/components/home/CategoryGrid'
import TrendingProducts from '@/components/home/TrendingProducts'
import OffersBanner from '@/components/home/OffersBanner'
import ReviewsSection from '@/components/home/ReviewsSection'
import StoreLocator from '@/components/home/StoreLocator'

const AI_FEATURES = [
  {
    icon: Camera,
    title: 'AI Face Shape Detection',
    description: 'Upload a selfie and our AI identifies your face shape to recommend the perfect frames.',
    href: '/face-shape',
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
  },
  {
    icon: Eye,
    title: 'Virtual Try-On',
    description: 'See how any frame looks on your face in real-time using AR technology.',
    href: '/try-on',
    color: 'from-brand-500 to-teal-500',
    bg: 'bg-brand-50',
    text: 'text-brand-600',
  },
  {
    icon: Calendar,
    title: 'Home Eye Test',
    description: 'Book a certified optician for a comprehensive eye exam at your doorstep.',
    href: '/eye-test',
    color: 'from-green-500 to-teal-500',
    bg: 'bg-green-50',
    text: 'text-green-600',
  },
]

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Lenskart — India's #1 Eyewear Brand | Buy Glasses Online</title>
        <meta
          name="description"
          content="Shop 5000+ eyeglasses, sunglasses & contact lenses. AI face detection, virtual try-on, home eye test. Free delivery & 30-day returns."
        />
        <meta name="keywords" content="eyeglasses, sunglasses, contact lenses, buy glasses online, lenskart, prescription glasses" />
        <meta property="og:title" content="Lenskart — India's #1 Eyewear Brand" />
        <meta property="og:description" content="Shop 5000+ eyeglasses, sunglasses & contact lenses with AI virtual try-on." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://lenskart.com" />
      </Helmet>

      <main>
        {/* Hero */}
        <HeroBanner />

        {/* Categories */}
        <CategoryGrid />

        {/* AI Features */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-gray-900 to-brand-950">
          <div className="page-container">
            <div className="text-center mb-10">
              <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-1">
                Powered by AI
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Smart Features for Smarter Shopping
              </h2>
              <p className="text-gray-400 text-sm max-w-xl mx-auto">
                Experience the future of eyewear shopping with cutting-edge AI and AR technology.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {AI_FEATURES.map(({ icon: Icon, title, description, href, color, bg, text }, idx) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.12 }}
                >
                  <Link
                    to={href}
                    className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{description}</p>
                    <span className={`text-sm font-semibold ${text} bg-white/10 px-3 py-1 rounded-lg group-hover:bg-white/20 transition-colors`}>
                      Try it now →
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending */}
        <TrendingProducts />

        {/* Offers */}
        <OffersBanner />

        {/* Reviews */}
        <ReviewsSection />

        {/* Store Locator */}
        <StoreLocator />

        {/* CTA Banner */}
        <section className="py-16 bg-gradient-to-r from-brand-600 to-teal-600">
          <div className="page-container text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Ready to Find Your Perfect Pair?
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                Use our AI face detection to discover frames that complement your unique features.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/face-shape"
                  className="px-8 py-3.5 bg-white text-brand-700 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                >
                  Detect My Face Shape
                </Link>
                <Link
                  to="/catalog"
                  className="px-8 py-3.5 bg-white/10 border-2 border-white text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                >
                  Browse All Frames
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sparkles, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

const SLIDES = [
  {
    id: 1,
    tag: 'New Collection 2024',
    title: 'See the World\nin New Light',
    subtitle: 'Premium eyewear crafted for those who dare to be different. AI face-shape detection included.',
    cta: { label: 'Shop Now', href: '/catalog' },
    secondary: { label: 'Virtual Try-On', href: '/try-on' },
    bg: 'from-brand-900 via-brand-800 to-teal-900',
    accent: 'bg-teal-400',
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80',
    stats: [
      { value: '5000+', label: 'Frame Styles' },
      { value: '3M+', label: 'Happy Customers' },
      { value: '100%', label: 'Quality Assured' },
    ],
  },
  {
    id: 2,
    tag: 'Limited Time Offer',
    title: 'Buy 1 Get 1\nFree on Frames',
    subtitle: 'Mix and match your favourite styles. Offer valid till stocks last. Free home delivery.',
    cta: { label: 'Grab the Deal', href: '/catalog?offer=bogo' },
    secondary: { label: 'View All Offers', href: '/offers' },
    bg: 'from-purple-900 via-purple-800 to-pink-900',
    accent: 'bg-pink-400',
    image: 'https://images.unsplash.com/photo-1556306535-38febf6cdbe9?w=800&q=80',
    stats: [
      { value: '40%', label: 'Off on Lenses' },
      { value: 'Free', label: 'Home Delivery' },
      { value: '30-Day', label: 'Easy Returns' },
    ],
  },
  {
    id: 3,
    tag: 'Trending Now',
    title: 'Summer Sunglasses\nCollection',
    subtitle: 'UV400 protection meets high fashion. Explore our curated collection of designer sunglasses.',
    cta: { label: 'Explore Sunglasses', href: '/catalog?category=sunglasses' },
    secondary: { label: 'Find Your Shape', href: '/face-shape' },
    bg: 'from-amber-900 via-orange-800 to-red-900',
    accent: 'bg-amber-400',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80',
    stats: [
      { value: 'UV400', label: 'Protection' },
      { value: '200+', label: 'Brands' },
      { value: '7-Day', label: 'Free Returns' },
    ],
  },
]

export default function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isPlaying, setIsPlaying] = useState(true)

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((c) => (c + 1) % SLIDES.length)
  }, [])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isPlaying, next])

  const slide = SLIDES[current]

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
  }

  return (
    <section
      className="relative h-[480px] md:h-[580px] lg:h-[640px] overflow-hidden"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            'absolute inset-0 bg-gradient-to-br',
            slide.bg,
          )}
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt=""
              className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          </div>

          {/* Decorative elements */}
          <div className={cn('absolute top-12 right-12 w-64 h-64 rounded-full opacity-10 blur-3xl', slide.accent)} />
          <div className={cn('absolute bottom-8 left-1/2 w-48 h-48 rounded-full opacity-10 blur-3xl', slide.accent)} />

          {/* Content */}
          <div className="relative h-full page-container flex items-center">
            <div className="max-w-2xl">
              {/* Tag */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold mb-4"
              >
                <Sparkles className="w-3 h-3" />
                {slide.tag}
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 whitespace-pre-line text-shadow-lg"
              >
                {slide.title}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base md:text-lg text-white/80 mb-8 max-w-lg leading-relaxed"
              >
                {slide.subtitle}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap gap-3 mb-10"
              >
                <Link
                  to={slide.cta.href}
                  className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
                >
                  {slide.cta.label}
                </Link>
                <Link
                  to={slide.secondary.href}
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {slide.secondary.label}
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-8"
              >
                {slide.stats.map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-white/60 mt-0.5">{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setDirection(idx > current ? 1 : -1); setCurrent(idx) }}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              idx === current ? 'w-8 bg-white' : 'w-2 bg-white/40',
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

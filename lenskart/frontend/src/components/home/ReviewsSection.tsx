import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

const REVIEWS = [
  {
    id: 1,
    name: 'Priya Sharma',
    city: 'Mumbai',
    rating: 5,
    title: 'Absolutely love my new frames!',
    body: 'The virtual try-on feature is incredible — I knew exactly how the frames would look before ordering. Delivery was super fast and the quality is top-notch.',
    product: 'Airflex Round Glasses',
    avatar: null,
    date: '2 days ago',
    verified: true,
  },
  {
    id: 2,
    name: 'Rahul Gupta',
    city: 'Bangalore',
    rating: 5,
    title: 'Best eyewear experience ever',
    body: 'Ordered progressive lenses for the first time. The optician at the store was very helpful, and the lenses are crystal clear. Worth every rupee!',
    product: 'Classic Aviator Sunglasses',
    avatar: null,
    date: '1 week ago',
    verified: true,
  },
  {
    id: 3,
    name: 'Ananya Reddy',
    city: 'Hyderabad',
    rating: 5,
    title: 'Game-changer for WFH warriors',
    body: 'My eyes were constantly strained from screen time. These blue-light glasses have made a massive difference. No more headaches after long video calls!',
    product: 'ProShield Blue Light',
    avatar: null,
    date: '2 weeks ago',
    verified: true,
  },
  {
    id: 4,
    name: 'Vikram Singh',
    city: 'Delhi',
    rating: 5,
    title: 'Face shape detection is spot on',
    body: "The AI told me to go for round frames and it was the best advice. I've gotten so many compliments. The process from selecting to delivery was seamless.",
    product: 'Urban Round Frames',
    avatar: null,
    date: '3 weeks ago',
    verified: true,
  },
  {
    id: 5,
    name: 'Meera Iyer',
    city: 'Chennai',
    rating: 4,
    title: 'Great quality, fast delivery',
    body: 'Ordered sunglasses for the summer. The UV protection is great and they look exactly like the pictures. Would have given 5 stars if delivery was faster.',
    product: 'Sunset Wayfarer',
    avatar: null,
    date: '1 month ago',
    verified: true,
  },
]

const STATS = [
  { value: '4.8★', label: 'Average Rating', sub: 'from 50K+ reviews' },
  { value: '98%', label: 'Satisfaction Rate', sub: 'verified buyers' },
  { value: '3M+', label: 'Happy Customers', sub: 'across India' },
]

export default function ReviewsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  return (
    <section className="py-12 md:py-16">
      <div className="page-container">
        <div className="section-header">
          <div>
            <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-1">
              Customer Love
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              What Our Customers Say
            </h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-brand-50 rounded-2xl">
          {STATS.map(({ value, label, sub }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-brand-600">{value}</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">{label}</div>
              <div className="text-xs text-gray-500">{sub}</div>
            </div>
          ))}
        </div>

        {/* Reviews carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
        >
          {REVIEWS.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="flex-shrink-0 w-72 sm:w-80 bg-white rounded-2xl shadow-product p-5 border border-gray-100"
            >
              {/* Quote icon */}
              <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center mb-3">
                <Quote className="w-4 h-4 text-brand-600" />
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn('w-3.5 h-3.5', s <= review.rating ? 'star-filled' : 'star-empty')}
                  />
                ))}
              </div>

              <h4 className="font-bold text-sm text-gray-900 mb-1.5">{review.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                {review.body}
              </p>

              <div className="text-xs text-brand-600 font-medium mb-3 bg-brand-50 px-2 py-1 rounded-lg inline-block">
                {review.product}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(review.name)}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-gray-900">{review.name}</p>
                    {review.verified && (
                      <span className="text-[10px] text-teal-600 font-medium">✓ Verified</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">{review.city} • {review.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

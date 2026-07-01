import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    label: "Men's Eyeglasses",
    href: '/catalog?category=eyeglasses&gender=MEN',
    image: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&q=80',
    count: '2000+ styles',
    color: 'from-blue-500/20 to-transparent',
  },
  {
    label: "Women's Eyeglasses",
    href: '/catalog?category=eyeglasses&gender=WOMEN',
    image: 'https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=400&q=80',
    count: '2500+ styles',
    color: 'from-pink-500/20 to-transparent',
  },
  {
    label: 'Sunglasses',
    href: '/catalog?category=sunglasses',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&q=80',
    count: '1200+ styles',
    color: 'from-amber-500/20 to-transparent',
  },
  {
    label: 'Computer Glasses',
    href: '/catalog?blueLight=true',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    count: '500+ styles',
    color: 'from-purple-500/20 to-transparent',
  },
  {
    label: "Kids' Eyewear",
    href: '/catalog?gender=KIDS',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80',
    count: '300+ styles',
    color: 'from-green-500/20 to-transparent',
  },
  {
    label: 'Contact Lenses',
    href: '/catalog?category=contact-lenses',
    image: 'https://images.unsplash.com/photo-1576174464184-fb78fe882bfd?w=400&q=80',
    count: 'Daily & Monthly',
    color: 'from-teal-500/20 to-transparent',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function CategoryGrid() {
  return (
    <section className="py-12 md:py-16">
      <div className="page-container">
        <div className="section-header">
          <div>
            <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-1">
              Browse by Category
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Find Your Perfect Frame
            </h2>
          </div>
          <Link
            to="/catalog"
            className="hidden sm:flex items-center gap-1 text-sm text-brand-600 font-semibold hover:gap-2 transition-all"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {CATEGORIES.map((cat) => (
            <motion.div key={cat.label} variants={itemVariants}>
              <Link
                to={cat.href}
                className="group relative overflow-hidden rounded-2xl aspect-[3/4] block shadow-product hover:shadow-product-hover transition-all duration-300"
              >
                {/* Image */}
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="font-bold text-sm leading-tight">{cat.label}</h3>
                  <p className="text-xs text-white/70 mt-0.5">{cat.count}</p>
                </div>

                {/* Arrow */}
                <div className="absolute top-3 right-3 w-7 h-7 bg-white/0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-white/20 transition-all duration-300 backdrop-blur-sm">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

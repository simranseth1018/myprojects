import { Link } from 'react-router-dom'
import {
  Glasses, Mail, Phone, MapPin, ChevronRight,
} from 'lucide-react'

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
  ],
  'Help & Support': [
    { label: 'FAQs', href: '/faq' },
    { label: 'Track Order', href: '/orders' },
    { label: 'Returns & Refunds', href: '/returns' },
    { label: 'Contact Us', href: '/contact' },
  ],
  'Quick Links': [
    { label: 'Eyeglasses', href: '/catalog?category=eyeglasses' },
    { label: 'Sunglasses', href: '/catalog?category=sunglasses' },
    { label: 'Eye Test at Home', href: '/eye-test' },
    { label: 'Find a Store', href: '/stores' },
  ],
  Policies: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Warranty', href: '/warranty' },
  ],
}

const SOCIALS = [
  { href: '#', label: 'Facebook', initial: 'f' },
  { href: '#', label: 'Twitter', initial: 'x' },
  { href: '#', label: 'Instagram', initial: 'ig' },
  { href: '#', label: 'YouTube', initial: 'yt' },
]

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'UPI', 'Razorpay', 'COD']

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      {/* Newsletter section */}
      <div className="bg-gradient-to-r from-brand-700 to-teal-700">
        <div className="page-container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-xl">Stay in Style</h3>
              <p className="text-brand-200 text-sm mt-1">
                Get exclusive offers, eye care tips & new arrivals in your inbox.
              </p>
            </div>
            <form
              className="flex w-full max-w-md gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-9 pr-4 py-3 bg-white rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-white text-brand-700 font-semibold rounded-xl text-sm hover:bg-brand-50 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="page-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Glasses className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">
                Lens<span className="text-brand-400">kart</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              India's leading eyewear brand. Discover thousands of styles with prescription,
              blue-light blocking, and progressive lenses — delivered to your door.
            </p>
            <div className="space-y-2 text-sm">
              <a href="tel:1800123456" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-brand-400" /> 1800-123-4567 (Toll Free)
              </a>
              <a href="mailto:support@lenskart.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-brand-400" /> support@lenskart.com
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>123 Vision Tower, MG Road, Gurugram, Haryana 122001</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-semibold mb-4 text-sm">{section}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm hover:text-white hover:pl-1 transition-all flex items-center gap-1 group"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="page-container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-sm text-gray-500">Trusted payments:</span>
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-medium rounded-lg"
                >
                  {method}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {SOCIALS.map(({ href, label, initial }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-600 transition-colors text-xs font-bold text-gray-300"
                >
                  {initial}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} Lenskart. All rights reserved. Made with ❤️ in India.
          </div>
        </div>
      </div>
    </footer>
  )
}

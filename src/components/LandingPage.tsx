import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coffee,
  Cookie,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store,
} from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';
import { ProductCategory } from '../types';
import { formatINR } from '../utils/whatsapp';

const CATEGORY_CARDS: {
  category: ProductCategory;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    category: 'Groceries',
    subtitle: 'Milk, bread, oats, daily pantry staples',
    icon: <ShoppingBasket className="w-5 h-5 text-violet-900" />,
  },
  {
    category: 'Snacks',
    subtitle: 'Noodles, biscuits, late-night hostel bites',
    icon: <Cookie className="w-5 h-5 text-amber-700" />,
  },
  {
    category: 'Beverages',
    subtitle: 'Instant coffee, tea, bottled drinking water',
    icon: <Coffee className="w-5 h-5 text-violet-900" />,
  },
  {
    category: 'Stationery',
    subtitle: 'A4 registers, exam pens, highlighters, folders',
    icon: <BookOpen className="w-5 h-5 text-violet-900" />,
  },
  {
    category: 'Personal Care',
    subtitle: 'Soaps, hygiene & everyday hostel grooming',
    icon: <Sparkles className="w-5 h-5 text-emerald-700" />,
  },
  {
    category: 'Other Essentials',
    subtitle: 'Detergent, room utilities & verified essentials',
    icon: <Package className="w-5 h-5 text-zinc-700" />,
  },
];

const FAQS = [
  {
    q: 'Where does CampusCart currently operate?',
    a: 'CampusCart is piloting exclusively around DGU Campus, Selaqui, Dehradun, and nearby hostel and PG clusters that participating local retailers can serve. New areas are added only as local partner capacity is verified.',
  },
  {
    q: 'How does WhatsApp ordering work?',
    a: 'Add products from one local retailer to your cart, enter your hostel or PG room details, and click "Continue to WhatsApp". CampusCart formats a clean itemized order request so you can confirm availability and delivery directly with the retailer.',
  },
  {
    q: 'Why is there a ₹20 delivery/service fee?',
    a: 'The ₹20 fee is our transparent pilot assumption designed to stay affordable for hostel and PG students while covering local handling and doorstep coordination. There are no hidden surge fees or markups added by CampusCart.',
  },
  {
    q: 'Is my order confirmed immediately when I click Continue to WhatsApp?',
    a: 'No. Your order status remains "Pending Retailer Confirmation" until the participating store manually confirms item availability and delivery arrangement.',
  },
  {
    q: 'Can medicines be ordered on CampusCart?',
    a: 'Medicines are strictly excluded unless a store is an explicitly verified, properly licensed pharmacy meeting all applicable compliance requirements.',
  },
];

export const LandingPage: React.FC = () => {
  const {
    setActiveView,
    setSelectedCategoryFilter,
    serviceAreas,
    stores,
    platformConfig,
    isUsingDemoFallback,
  } = useCampusCart();

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCategoryClick = (cat: ProductCategory) => {
    setSelectedCategoryFilter(cat);
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FAFAFA]">
      {/* 1. Storefront Hero */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-medium text-violet-900 tracking-wide mb-3">
              DGU Campus &amp; Selaqui, Dehradun · Student-Focused Quick Commerce Pilot
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 leading-[1.12] [text-wrap:balance] max-w-2xl">
              Everything You Need for Campus Life, Delivered.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl">
              Groceries, snacks, stationery, and everyday essentials from nearby stores, delivered conveniently to your hostel or PG.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter('All');
                  setActiveView('catalog');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-violet-900 hover:bg-violet-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 text-sm font-semibold rounded-lg transition-colors"
              >
                <span>Explore Categories</span>
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Simple WhatsApp Ordering
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                {formatINR(platformConfig.deliveryServiceFee)} Proposed Pilot Fee
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                UPI &amp; COD Supported
              </span>
            </div>
          </div>

          {/* Right Panel: Service Geography & Pilot Coverage */}
          <div className="lg:col-span-5 flex">
            <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-zinc-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <MapPin className="w-4 h-4 text-violet-900" />
                    <span>Active Pilot Coverage · Selaqui</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-800">
                    {isUsingDemoFallback ? 'Demo Catalogue' : `${stores.length} Active Stores`}
                  </span>
                </div>

                <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
                  For students living in hostels and PGs who need affordable daily essentials but cannot conveniently visit nearby shops, CampusCart connects you directly with local Selaqui retailers.
                </p>

                <div className="mt-5 space-y-2.5">
                  <p className="text-xs font-medium text-zinc-500">
                    Configured Hostel &amp; PG Clusters
                  </p>
                  {serviceAreas.slice(0, 4).map((area) => (
                    <div
                      key={area.id}
                      className="flex items-start justify-between gap-3 py-2 border-b border-zinc-200/80 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{area.name}</p>
                        <p className="text-xs text-zinc-500">{area.clusterType}</p>
                      </div>
                      <span className="text-xs font-medium text-emerald-700 shrink-0">Active</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('bundles')}
                  className="text-sm font-semibold text-violet-900 hover:text-violet-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View Student Essential Bundles</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Preview */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-zinc-950">
              Everyday Campus Essentials
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Browse practical categories tailored for hostel rooms, PG kitchens, and exam weeks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryFilter('All');
              setActiveView('catalog');
            }}
            className="text-sm font-semibold text-violet-900 hover:text-violet-700 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Open Full Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_CARDS.map((cat) => (
            <button
              key={cat.category}
              type="button"
              onClick={() => handleCategoryClick(cat.category)}
              className="group text-left bg-white border border-zinc-200 hover:border-violet-400 rounded-xl p-5 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-violet-50 flex items-center justify-center transition-colors">
                  {cat.icon}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-violet-900 transition-colors" />
              </div>
              <h3 className="font-display text-base font-semibold text-zinc-900">
                {cat.category}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">{cat.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 3. How It Works (3 Concise Steps) + Service Fee Transparency */}
      <section className="bg-white border-y border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl font-bold text-zinc-950">
              How CampusCart Works
            </h2>
            <p className="text-sm text-zinc-600 mt-1.5">
              Built for speed and clarity without heavy app downloads or complicated checkout steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2.5">
              <p className="font-mono-tabular text-xs font-semibold text-violet-900">01. Browse</p>
              <h3 className="font-display text-lg font-semibold text-zinc-900">
                Explore Nearby Stores
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Explore everyday essentials and customized student bundles from participating Selaqui retailers serving your hostel or PG cluster.
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="font-mono-tabular text-xs font-semibold text-violet-900">02. Order</p>
              <h3 className="font-display text-lg font-semibold text-zinc-900">
                Submit via WhatsApp
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Review your itemized cart and transparent {formatINR(platformConfig.deliveryServiceFee)} pilot service fee, then send your pre-filled order message through WhatsApp.
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="font-mono-tabular text-xs font-semibold text-emerald-700">03. Receive</p>
              <h3 className="font-display text-lg font-semibold text-zinc-900">
                Doorstep Coordination
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Coordinate delivery directly with the retailer based on store hours and receive your essentials at your hostel block or PG gate.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-200 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Transparent Pilot Pricing &amp; Local Retailer Support</span>
              </div>
              <h3 className="font-display text-xl font-bold text-zinc-900">
                Why Students &amp; Local Retailers Use CampusCart
              </h3>
              <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
                Instead of walking to distant shops between classes or postponing small purchases, students get affordable local access while nearby kirana and stationery shops gain structured digital orders without high marketplace commissions.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Store className="w-4 h-4 text-violet-900" />
                  <span>Are you a Selaqui shop owner?</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                  Partner with CampusCart to receive structured student orders via WhatsApp and partner dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('retailer')}
                className="px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Partner Onboarding
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="font-display text-2xl font-bold text-zinc-950 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-200">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-zinc-900">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-zinc-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-base font-bold text-zinc-900">CampusCart</p>
            <p className="text-xs text-zinc-500 mt-1">
              Your Campus Essentials, Delivered to Your Doorstep · DGU Campus, Selaqui, Dehradun, Uttarakhand
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              DGU Venture Quest Software Capstone Prototype · Pilot Service Fee Assumption: {formatINR(platformConfig.deliveryServiceFee)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-zinc-600">
            <button
              type="button"
              onClick={() => setActiveView('catalog')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              Browse Products
            </button>
            <button
              type="button"
              onClick={() => setActiveView('bundles')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              Student Bundles
            </button>
            <button
              type="button"
              onClick={() => setActiveView('orders')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              Order History
            </button>
            <button
              type="button"
              onClick={() => setActiveView('retailer')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              Retailer Portal
            </button>
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp-First MVP
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

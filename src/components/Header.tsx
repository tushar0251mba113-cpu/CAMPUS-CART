import React, { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { AppView, useCampusCart } from '../context/CampusCartContext';
import { formatINR } from '../utils/whatsapp';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setCartDrawerOpen,
    cart,
    cartSubtotal,
    platformConfig,
    isAdmin,
  } = useCampusCart();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const navItems: { id: AppView; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'bundles', label: 'Bundles' },
    { id: 'orders', label: 'My Orders' },
    { id: isAdmin ? 'admin' : 'retailer', label: isAdmin ? 'Admin' : 'Partner' },
  ];

  const handleNav = (id: AppView) => {
    setActiveView(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
      {platformConfig.promoBannerEnabled && platformConfig.promoBannerText && !bannerDismissed && (
        <div className="bg-violet-950 text-violet-50 px-4 py-1.5 text-xs flex items-center justify-between gap-4">
          <p className="mx-auto text-center truncate">{platformConfig.promoBannerText}</p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="text-violet-300 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-violet-800 rounded-md"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="28" height="28" rx="7" fill="#4C1D95" />
            <path
              d="M7.5 9.5H20.5L19.2 17.2C19.05 18.05 18.31 18.67 17.45 18.67H10.55C9.69 18.67 8.95 18.05 8.8 17.2L7.5 9.5Z"
              stroke="white"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M11 9.5V8.2C11 6.98 11.98 6 13.2 6H14.8C16.02 6 17 6.98 17 8.2V9.5"
              stroke="#4ADE80"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-lg font-bold tracking-tight text-zinc-900">
            CampusCart
          </span>
        </button>

        {/* Zone 2: 5 Single-Line Text Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 pb-0.5 transition-colors cursor-pointer ${
                  active
                    ? 'text-violet-900 border-b-2 border-violet-900'
                    : 'text-zinc-600 hover:text-zinc-900 border-b-2 border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-900 hover:bg-violet-800 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            <span className="font-mono-tabular text-violet-200">
              {itemCount > 0 ? `(${itemCount} · ${formatINR(cartSubtotal)})` : '(0)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeView === item.id
                  ? 'bg-violet-50 text-violet-900'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('retailer')}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Retailer Workbench
            </button>
          )}
        </div>
      )}
    </div>
  );
};

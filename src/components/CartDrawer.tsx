import React from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Store as StoreIcon, Trash2, X } from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';
import { formatINR } from '../utils/whatsapp';
import { ProductArtwork } from './ProductArtwork';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartStore,
    cartSubtotal,
    cartTotal,
    platformConfig,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    setActiveView,
  } = useCampusCart();

  if (!cartDrawerOpen) return null;

  const handleProceed = () => {
    setCartDrawerOpen(false);
    setActiveView('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[1px]"
        onClick={() => setCartDrawerOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-zinc-200 shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-violet-900" />
            <h2 className="font-display text-lg font-semibold text-zinc-900">Your Cart</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close cart"
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-semibold text-zinc-900 mb-1">
                Your cart is empty
              </h3>
              <p className="text-sm text-zinc-500 max-w-xs mb-6">
                Add groceries, snacks, stationery, or student bundles from participating Selaqui stores.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  setActiveView('catalog');
                }}
                className="px-4 py-2 bg-violet-900 text-white text-sm font-medium rounded-lg hover:bg-violet-800 transition-colors cursor-pointer"
              >
                Browse Essentials
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {cartStore && (
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-200">
                  <div className="flex items-start gap-2.5">
                    <StoreIcon className="w-4 h-4 text-violet-800 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-500">Fulfilling Store (1 store per order)</p>
                      <p className="text-sm font-semibold text-zinc-900">{cartStore.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-medium text-zinc-500 hover:text-red-700 transition-colors cursor-pointer shrink-0"
                  >
                    Clear Cart
                  </button>
                </div>
              )}

              <ul className="divide-y divide-zinc-100">
                {cart.map(({ product, quantity }) => (
                  <li key={product.id} className="py-4 flex gap-3.5">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                      <ProductArtwork
                        imageKey={product.imageKey}
                        imageUrl={product.imageUrl}
                        category={product.category}
                        name={product.name}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-zinc-900 truncate">
                          {product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          aria-label={`Remove ${product.name}`}
                          className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatINR(product.price)} · {product.unitLabel}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="inline-flex items-center border border-zinc-200 rounded-lg bg-zinc-50">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(product.id, quantity - 1)}
                            aria-label="Decrease quantity"
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-mono-tabular font-semibold text-zinc-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(product.id, quantity + 1)}
                            aria-label="Increase quantity"
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-mono-tabular font-semibold text-zinc-900">
                          {formatINR(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-zinc-600">
                <span>Product Subtotal (Retailer)</span>
                <span className="font-mono-tabular font-medium text-zinc-900">
                  {formatINR(cartSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>CampusCart Delivery/Service Fee</span>
                <span className="font-mono-tabular font-medium text-zinc-900">
                  {formatINR(platformConfig.deliveryServiceFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-base font-semibold text-zinc-900">
                <span>Order Total</span>
                <span className="font-mono-tabular text-violet-950">{formatINR(cartTotal)}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              {platformConfig.pilotFeeDisclaimer}
            </p>

            <button
              type="button"
              onClick={handleProceed}
              className="w-full py-3 px-4 bg-violet-900 hover:bg-violet-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

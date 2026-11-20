import React, { useState } from 'react';
import { Check, Info, PackageCheck, ShoppingBag, Store as StoreIcon } from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';
import { formatINR } from '../utils/whatsapp';

export const BundlesView: React.FC = () => {
  const { bundles, products, addBundleToCart, isUsingDemoFallback, setActiveView } = useCampusCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddBundle = (bundleId: string) => {
    const bundle = bundles.find((b) => b.id === bundleId);
    if (!bundle) return;
    addBundleToCart(bundle);
    setAddedId(bundleId);
    setTimeout(() => setAddedId(null), 1400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
            Student-Friendly Essential Bundles
          </h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            Pre-grouped hostel, study, and late-night packs built from actual retailer-configured products and prices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          Browse Individual Items
        </button>
      </div>

      {isUsingDemoFallback && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-800 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900">
            <span className="font-semibold">Demonstration Bundles:</span> Prices reflect the exact sum of configured demonstration product prices with no fabricated discounts.
          </p>
        </div>
      )}

      {bundles.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <PackageCheck className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <h2 className="font-display text-base font-semibold text-zinc-900">
            No active student bundles configured
          </h2>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            The administrator can configure and enable student bundles from the Admin Dashboard.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className="px-4 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg hover:bg-violet-800 cursor-pointer"
          >
            Go to Product Catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => {
            const hasPromoDifference = bundle.bundlePrice < bundle.regularPrice;
            const allItemsAvailable = bundle.items.every((bi) => {
              const prod = products.find((p) => p.id === bi.productId);
              return prod ? prod.available : true;
            });

            return (
              <article
                key={bundle.id}
                className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-violet-900 mb-1.5">
                    {bundle.category}
                  </p>
                  <h2 className="font-display text-lg font-bold text-zinc-950">
                    {bundle.name}
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                    {bundle.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
                      <StoreIcon className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{bundle.storeName}</span>
                    </div>

                    <ul className="space-y-2 text-xs">
                      {bundle.items.map((item) => (
                        <li
                          key={item.productId}
                          className="flex items-center justify-between gap-2 text-zinc-700"
                        >
                          <span className="truncate">
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="font-mono-tabular text-zinc-900 shrink-0">
                            {formatINR(item.unitPrice * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-500">Configured Bundle Total</span>
                    <div className="text-right">
                      {hasPromoDifference && (
                        <span className="font-mono-tabular text-xs text-zinc-400 line-through mr-2">
                          {formatINR(bundle.regularPrice)}
                        </span>
                      )}
                      <span className="font-mono-tabular text-xl font-bold text-zinc-950">
                        {formatINR(bundle.bundlePrice)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!allItemsAvailable}
                    onClick={() => handleAddBundle(bundle.id)}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 ${
                      addedId === bundle.id
                        ? 'bg-emerald-700 text-white'
                        : 'bg-violet-900 hover:bg-violet-800 text-white'
                    }`}
                  >
                    {addedId === bundle.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Bundle Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {allItemsAvailable ? 'Add Bundle to Cart' : 'One or More Items Unavailable'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';

export const StoreConflictModal: React.FC = () => {
  const { storeConflict, resolveStoreConflict } = useCampusCart();

  if (!storeConflict) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-conflict-title"
    >
      <div className="bg-white border border-zinc-200 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="store-conflict-title" className="font-display text-base font-semibold text-zinc-900">
              One Store Per WhatsApp Order
            </h3>
            <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
              Your cart currently has items from <span className="font-medium text-zinc-900">{storeConflict.existingStoreName}</span>.
              In CampusCart Version 1, each WhatsApp order is fulfilled by one local retailer so stock and delivery stay direct and reliable.
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg p-3 mb-5">
          To order from <span className="font-medium text-zinc-800">{storeConflict.newStoreName}</span>, either finish your current order first and place a separate one, or replace your cart now.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={() => resolveStoreConflict(false)}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Keep Current Cart
          </button>
          <button
            type="button"
            onClick={() => resolveStoreConflict(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-900 rounded-lg hover:bg-violet-800 transition-colors cursor-pointer"
          >
            Replace Cart with New Store
          </button>
        </div>
      </div>
    </div>
  );
};

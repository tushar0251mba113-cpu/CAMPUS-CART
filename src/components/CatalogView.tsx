import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Info,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Store as StoreIcon,
  X,
  XCircle,
} from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';
import { Product, ProductCategory } from '../types';
import { formatINR } from '../utils/whatsapp';
import { ProductArtwork } from './ProductArtwork';

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Groceries',
  'Snacks',
  'Beverages',
  'Stationery',
  'Personal Care',
  'Other Essentials',
];

type SortOption = 'default' | 'price-asc' | 'price-desc';

export const CatalogView: React.FC = () => {
  const {
    products,
    stores,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    addToCart,
    isUsingDemoFallback,
    setActiveView,
  } = useCampusCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedFlash, setAddedFlash] = useState<Record<string, boolean>>({});
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const activeStoreIds = useMemo(() => new Set(stores.map((s) => s.id)), [stores]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = products.filter((p) => {
      if (stores.length > 0 && !activeStoreIds.has(p.storeId)) return false;
      if (selectedCategoryFilter !== 'All' && p.category !== selectedCategoryFilter) return false;
      if (selectedStoreId !== 'all' && p.storeId !== selectedStoreId) return false;
      if (availableOnly && !p.available) return false;
      if (q) {
        const hay = `${p.name} ${p.description} ${p.storeName} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [
    products,
    stores.length,
    activeStoreIds,
    selectedCategoryFilter,
    selectedStoreId,
    availableOnly,
    searchQuery,
    sortBy,
  ]);

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, next: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(20, next)) }));
  };

  const handleAdd = (product: Product) => {
    const qty = getQty(product.id);
    addToCart(product, qty);
    setAddedFlash((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedFlash((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const detailStore = detailProduct
    ? stores.find((s) => s.id === detailProduct.storeId) || null
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Heading & Demo Notice */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
            Selaqui Campus Catalogue
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Everyday essentials from participating local stores around DGU Campus. Availability is manually updated by each store.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('bundles')}
          className="px-4 py-2 text-xs font-semibold text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          Browse Student Bundles
        </button>
      </div>

      {isUsingDemoFallback && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-800 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Demonstration Catalogue Active:</span> These products and stores are clearly labelled pilot demonstration entries until live Selaqui retailer partnerships and products are entered by the administrator.
          </p>
        </div>
      )}

      {/* Search, Store, Sort & Category Controls */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milk, noodles, registers, soap..."
              aria-label="Search products"
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              aria-label="Filter by store"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
            >
              <option value="all">All Selaqui Stores ({stores.length})</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort products"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
            >
              <option value="default">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 accent-violet-900 rounded"
              />
              <span>In stock only</span>
            </label>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const active = selectedCategoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-violet-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <p className="font-display text-base font-semibold text-zinc-900">
            No matching products found
          </p>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Try clearing your search term, changing category, or showing unavailable items.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryFilter('All');
              setSelectedStoreId('all');
              setAvailableOnly(false);
            }}
            className="px-4 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg hover:bg-violet-800 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const qty = getQty(product.id);
            const justAdded = Boolean(addedFlash[product.id]);
            return (
              <article
                key={product.id}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => setDetailProduct(product)}
                  className="aspect-[4/3] w-full overflow-hidden border-b border-zinc-200 text-left cursor-pointer"
                >
                  <ProductArtwork
                    imageKey={product.imageKey}
                    imageUrl={product.imageUrl}
                    category={product.category}
                    name={product.name}
                  />
                </button>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1.5">
                      <span>{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{product.storeName}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailProduct(product)}
                      className="text-left cursor-pointer"
                    >
                      <h2 className="font-display text-base font-semibold text-zinc-900 hover:text-violet-900 transition-colors leading-snug">
                        {product.name}
                      </h2>
                    </button>

                    <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono-tabular text-lg font-bold text-zinc-950">
                          {formatINR(product.price)}
                        </span>
                        <span className="text-xs text-zinc-500 ml-1.5">/ {product.unitLabel}</span>
                      </div>

                      {product.available ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
                          <XCircle className="w-3.5 h-3.5" />
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center border border-zinc-200 rounded-lg bg-zinc-50">
                        <button
                          type="button"
                          disabled={!product.available}
                          onClick={() => setQty(product.id, qty - 1)}
                          aria-label="Decrease quantity"
                          className="p-2 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-mono-tabular font-semibold text-zinc-900">
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={!product.available}
                          onClick={() => setQty(product.id, qty + 1)}
                          aria-label="Increase quantity"
                          className="p-2 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!product.available}
                        onClick={() => handleAdd(product)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed ${
                          justAdded
                            ? 'bg-emerald-700 text-white'
                            : 'bg-violet-900 hover:bg-violet-800 text-white'
                        }`}
                      >
                        {justAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{product.available ? 'Add to Cart' : 'Out of Stock'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Product Details Modal */}
      {detailProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdp-title"
        >
          <div className="bg-white border border-zinc-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <span className="text-xs font-medium text-zinc-500">
                {detailProduct.category} · {detailProduct.unitLabel}
              </span>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                aria-label="Close product details"
                className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto md:min-h-[280px] border-b md:border-b-0 md:border-r border-zinc-200">
                <ProductArtwork
                  imageKey={detailProduct.imageKey}
                  imageUrl={detailProduct.imageUrl}
                  category={detailProduct.category}
                  name={detailProduct.name}
                />
              </div>

              <div className="p-6 flex flex-col justify-between gap-5">
                <div>
                  <h2 id="pdp-title" className="font-display text-xl font-bold text-zinc-950">
                    {detailProduct.name}
                  </h2>
                  <p className="font-mono-tabular text-2xl font-bold text-violet-950 mt-2">
                    {formatINR(detailProduct.price)}
                    <span className="text-xs font-sans font-normal text-zinc-500 ml-2">
                      per {detailProduct.unitLabel}
                    </span>
                  </p>

                  <p className="text-sm text-zinc-600 mt-4 leading-relaxed">
                    {detailProduct.description}
                  </p>

                  <div className="mt-5 pt-4 border-t border-zinc-200 space-y-2 text-xs text-zinc-600">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="w-4 h-4 text-violet-900 shrink-0" />
                      <span className="font-medium text-zinc-900">{detailProduct.storeName}</span>
                    </div>
                    {detailStore && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span>Hours: {detailStore.operatingHours}</span>
                      </div>
                    )}
                    <p className="text-zinc-500">
                      Availability status ({detailProduct.available ? 'Available' : 'Unavailable'}) reflects the retailer&apos;s latest manual update, not automated live inventory tracking.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center border border-zinc-200 rounded-lg bg-zinc-50">
                    <button
                      type="button"
                      disabled={!detailProduct.available}
                      onClick={() => setQty(detailProduct.id, getQty(detailProduct.id) - 1)}
                      className="p-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm font-mono-tabular font-semibold">
                      {getQty(detailProduct.id)}
                    </span>
                    <button
                      type="button"
                      disabled={!detailProduct.available}
                      onClick={() => setQty(detailProduct.id, getQty(detailProduct.id) + 1)}
                      className="p-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!detailProduct.available}
                    onClick={() => {
                      handleAdd(detailProduct);
                      setDetailProduct(null);
                    }}
                    className="flex-1 py-2.5 px-4 bg-violet-900 hover:bg-violet-800 text-white text-sm font-semibold rounded-lg disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors cursor-pointer"
                  >
                    {detailProduct.available ? 'Add to Cart' : 'Currently Unavailable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

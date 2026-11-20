import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  LogIn,
  Package,
  Plus,
  ShieldCheck,
  Store as StoreIcon,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';
import { OrderStatus, Product, ProductCategory } from '../types';
import { formatINR } from '../utils/whatsapp';

const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Groceries',
  'Snacks',
  'Beverages',
  'Stationery',
  'Personal Care',
  'Other Essentials',
];

const IMAGE_KEYS = [
  { value: 'groceries_dairy', label: 'Dairy / Milk' },
  { value: 'groceries_staples', label: 'Groceries / Bread / Oats' },
  { value: 'snacks_noodles', label: 'Noodles / Quick Snacks' },
  { value: 'snacks_biscuits', label: 'Biscuits / Bakery' },
  { value: 'beverages_tea', label: 'Coffee / Tea' },
  { value: 'beverages_water', label: 'Bottled Water / Drinks' },
  { value: 'stationery_notebooks', label: 'Notebooks / Registers' },
  { value: 'stationery_pens', label: 'Pens / Highlighters' },
  { value: 'care_hygiene', label: 'Soap / Personal Care' },
  { value: 'care_laundry', label: 'Detergent / Hostel Wash' },
];

const NEXT_STATUSES: OrderStatus[] = [
  'Accepted',
  'Confirmed',
  'Out for Delivery',
  'Completed',
  'Rejected',
];

export const RetailerDashboard: React.FC = () => {
  const {
    firebaseUser,
    signInWithGoogle,
    myStores,
    isAdmin,
    allStoresForAdmin,
    products,
    retailerOrders,
    allOrdersForAdmin,
    myRetailerApplications,
    submitRetailerApplication,
    updateStoreSettings,
    saveStorePrivateContact,
    getStorePrivateContact,
    saveProduct,
    deleteProduct,
    toggleProductAvailability,
    updateOrderByRetailerOrAdmin,
    serviceAreas,
    setActiveView,
  } = useCampusCart();

  // Admin can also view/manage stores directly in Retailer Workbench if needed
  const accessibleStores = useMemo(
    () => (myStores.length > 0 ? myStores : isAdmin ? allStoresForAdmin : []),
    [myStores, isAdmin, allStoresForAdmin]
  );

  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [tab, setTab] = useState<'orders' | 'products' | 'store'>('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [retailerNotes, setRetailerNotes] = useState<Record<string, string>>({});

  // Product form modal/panel state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('Groceries');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('1 unit');
  const [prodImageKey, setProdImageKey] = useState('groceries_staples');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);
  const [savingProd, setSavingProd] = useState(false);

  // Store settings form
  const [operatingHours, setOperatingHours] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [whatsappNum, setWhatsappNum] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [storeSavedMsg, setStoreSavedMsg] = useState(false);

  // Application form for new partner onboarding
  const [appStoreName, setAppStoreName] = useState('');
  const [appOwnerName, setAppOwnerName] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appWhatsapp, setAppWhatsapp] = useState('');
  const [appAddress, setAppAddress] = useState('');
  const [appCategory, setAppCategory] = useState('Kirana & Groceries');
  const [appArea, setAppArea] = useState(serviceAreas[0]?.name || 'DGU On-Campus Hostels (Boys & Girls)');
  const [appSubmitted, setAppSubmitted] = useState(false);

  useEffect(() => {
    if (accessibleStores.length > 0 && !accessibleStores.some((s) => s.id === selectedStoreId)) {
      setSelectedStoreId(accessibleStores[0].id);
    }
  }, [accessibleStores, selectedStoreId]);

  const activeStore = useMemo(
    () => accessibleStores.find((s) => s.id === selectedStoreId) || accessibleStores[0] || null,
    [accessibleStores, selectedStoreId]
  );

  useEffect(() => {
    if (!activeStore) return;
    setOperatingHours(activeStore.operatingHours || '');
    setDeliveryNote(activeStore.deliveryEstimateNote || '');
    setWhatsappNum(activeStore.whatsappOrderNumber || '');
    setUpiId(activeStore.upiId || '');
    setUpiEnabled(activeStore.upiEnabled);
    setCodEnabled(activeStore.codEnabled);

    getStorePrivateContact(activeStore.id).then((contact) => {
      if (contact) {
        setOwnerName(contact.ownerName || '');
        setRegisteredPhone(contact.registeredPhone || '');
      }
    });
  }, [activeStore?.id]);

  const storeProducts = useMemo(
    () => (activeStore ? products.filter((p) => p.storeId === activeStore.id) : []),
    [products, activeStore]
  );

  const storeOrders = useMemo(() => {
    if (!activeStore) return [];
    const base = isAdmin && myStores.length === 0 ? allOrdersForAdmin : retailerOrders;
    return base.filter((o) => {
      if (o.storeId !== activeStore.id) return false;
      if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) return false;
      return true;
    });
  }, [activeStore, isAdmin, myStores.length, allOrdersForAdmin, retailerOrders, orderStatusFilter]);

  const openNewProductForm = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Groceries');
    setProdDesc('');
    setProdPrice('');
    setProdUnit('1 unit');
    setProdImageKey('groceries_staples');
    setProdImageUrl('');
    setProdAvailable(true);
    setShowProductForm(true);
  };

  const openEditProductForm = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdDesc(p.description);
    setProdPrice(String(p.price));
    setProdUnit(p.unitLabel);
    setProdImageKey(p.imageKey);
    setProdImageUrl(p.imageUrl || '');
    setProdAvailable(p.available);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;
    const priceNum = Number(prodPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) return;
    setSavingProd(true);
    try {
      await saveProduct({
        id: editingProduct?.id,
        storeId: activeStore.id,
        storeName: activeStore.name,
        name: prodName,
        category: prodCategory,
        description: prodDesc,
        price: priceNum,
        unitLabel: prodUnit,
        imageKey: prodImageKey,
        imageUrl: prodImageUrl || undefined,
        available: prodAvailable,
        isDemo: editingProduct ? editingProduct.isDemo : false,
      });
      setShowProductForm(false);
    } finally {
      setSavingProd(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;
    await updateStoreSettings(activeStore.id, {
      operatingHours,
      deliveryEstimateNote: deliveryNote,
      whatsappOrderNumber: whatsappNum,
      upiId,
      upiEnabled,
      codEnabled,
    });
    if (ownerName.trim() && registeredPhone.trim()) {
      await saveStorePrivateContact(activeStore.id, {
        ownerName,
        registeredPhone,
      });
    }
    setStoreSavedMsg(true);
    setTimeout(() => setStoreSavedMsg(false), 2000);
  };

  const handleApplyRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRetailerApplication({
      storeName: appStoreName,
      ownerName: appOwnerName,
      phone: appPhone,
      whatsappNumber: appWhatsapp,
      address: appAddress,
      category: appCategory,
      serviceArea: appArea,
    });
    setAppStoreName('');
    setAppOwnerName('');
    setAppPhone('');
    setAppWhatsapp('');
    setAppAddress('');
    setAppSubmitted(true);
  };

  if (!firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-zinc-200 rounded-xl p-10">
          <StoreIcon className="w-10 h-10 text-violet-900 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-zinc-950">
            Local Retailer Partner Portal
          </h1>
          <p className="text-sm text-zinc-600 mt-2 mb-6 max-w-md mx-auto">
            Sign in with your Google account to access your assigned Selaqui store dashboard or submit a local retailer partnership inquiry.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>
        </div>
      </div>
    );
  }

  // User has no assigned stores yet -> Onboarding Application Flow
  if (accessibleStores.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-950">
              Local Retailer Onboarding
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              Retailer accounts are verified and approved by the CampusCart administrator before store listings go live.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="px-4 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Open Admin Console
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-1">
              Apply as a Selaqui Local Store Partner
            </h2>
            <p className="text-xs text-zinc-500 mb-5">
              Signed in as {firebaseUser.email}. Once approved by the administrator, your store dashboard unlocks automatically.
            </p>

            {appSubmitted && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Application submitted! Status is Pending Admin Verification.</span>
              </div>
            )}

            <form onSubmit={handleApplyRetailer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Store Name *</label>
                  <input
                    type="text"
                    required
                    value={appStoreName}
                    onChange={(e) => setAppStoreName(e.target.value)}
                    placeholder="e.g., Selaqui General Store"
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Owner / Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={appOwnerName}
                    onChange={(e) => setAppOwnerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={appPhone}
                    onChange={(e) => setAppPhone(e.target.value)}
                    placeholder="10-digit phone"
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">WhatsApp Order Number</label>
                  <input
                    type="tel"
                    value={appWhatsapp}
                    onChange={(e) => setAppWhatsapp(e.target.value)}
                    placeholder="10-digit WhatsApp number"
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Store Address in Selaqui *</label>
                <input
                  type="text"
                  required
                  value={appAddress}
                  onChange={(e) => setAppAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Store Category</label>
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    <option value="Kirana & Groceries">Kirana &amp; Groceries</option>
                    <option value="Snacks & Beverages">Snacks &amp; Beverages</option>
                    <option value="Stationery & Print">Stationery &amp; Print</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Multi-Category Essentials">Multi-Category Essentials</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Primary Hostel/PG Cluster</label>
                  <select
                    value={appArea}
                    onChange={(e) => setAppArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    {serviceAreas.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Submit Partnership Application
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-display text-base font-semibold text-zinc-900 mb-3">
              Your Submitted Applications ({myRetailerApplications.length})
            </h3>
            {myRetailerApplications.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No onboarding applications submitted under this account yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {myRetailerApplications.map((app) => (
                  <li key={app.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-zinc-900">{app.storeName}</span>
                      <span className="font-semibold capitalize text-violet-900">{app.status}</span>
                    </div>
                    <p className="text-zinc-600">{app.category} · {app.serviceArea}</p>
                    <p className="text-zinc-500 mt-1">{app.address}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header & Store Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-violet-900">Retailer Partner Workbench</p>
          <h1 className="font-display text-2xl font-bold text-zinc-950">
            {activeStore?.name}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {activeStore?.category} · {activeStore?.address} · Status: {activeStore?.status}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {accessibleStores.length > 1 && (
            <select
              value={activeStore?.id || ''}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              aria-label="Select Store"
              className="px-3 py-2 text-xs font-medium bg-white border border-zinc-300 rounded-lg"
            >
              {accessibleStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="px-3.5 py-2 text-xs font-semibold text-violet-900 bg-violet-50 border border-violet-200 rounded-lg cursor-pointer"
            >
              Back to Admin Console
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit mb-6">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
            tab === 'orders' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600'
          }`}
        >
          Incoming Orders ({storeOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('products')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
            tab === 'products' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600'
          }`}
        >
          Products &amp; Availability ({storeProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('store')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
            tab === 'store' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600'
          }`}
        >
          Store Profile &amp; Payment
        </button>
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-600">
              Verify item availability before accepting. Payment verification is tracked separately from order status.
            </p>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Retailer Confirmation">Pending Confirmation</option>
              <option value="Accepted">Accepted</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {storeOrders.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
              <ClipboardCheck className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
              <p className="font-display text-base font-semibold text-zinc-900">
                No incoming orders in this view
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                New student orders routed to {activeStore?.name} will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {storeOrders.map((order) => {
                const isTerminal =
                  order.status === 'Completed' ||
                  order.status === 'Cancelled' ||
                  order.status === 'Rejected';

                return (
                  <article
                    key={order.id}
                    className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                      <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-2">
                        <span className="font-mono-tabular font-bold text-zinc-900">
                          {order.orderRef}
                        </span>
                        <span>·</span>
                        <span>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                        <span>·</span>
                        <span className="font-medium text-zinc-900">{order.customerName}</span>
                        <span>({order.customerPhone})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 text-zinc-900">
                          {order.status}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 text-zinc-700">
                          {order.paymentMethod}: {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                      <div className="lg:col-span-6 space-y-2">
                        <p className="font-semibold text-zinc-700">Items &amp; Total</p>
                        <ul className="divide-y divide-zinc-100">
                          {order.items.map((it, idx) => (
                            <li key={idx} className="py-1 flex justify-between">
                              <span>{it.productName} × {it.quantity}</span>
                              <span className="font-mono-tabular font-medium">
                                {formatINR(it.lineTotal)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-sm text-zinc-950">
                          <span>Total (incl. {formatINR(order.deliveryFee)} fee)</span>
                          <span className="font-mono-tabular">{formatINR(order.totalAmount)}</span>
                        </div>
                        <p className="text-zinc-600 pt-1">
                          <span className="font-semibold">Deliver to:</span> {order.hostelOrPg}, {order.roomDetails}
                          {order.landmark ? ` (Near ${order.landmark})` : ''}
                        </p>
                        {order.deliveryInstructions && (
                          <p className="text-zinc-500">Note: {order.deliveryInstructions}</p>
                        )}
                      </div>

                      <div className="lg:col-span-6 bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">
                            Retailer Note to Student (Optional)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={240}
                              value={retailerNotes[order.id] ?? order.retailerNote ?? ''}
                              onChange={(e) =>
                                setRetailerNotes((prev) => ({ ...prev, [order.id]: e.target.value }))
                              }
                              placeholder="e.g., All items packed, dispatching at 6 PM"
                              className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-md"
                            />
                            <button
                              type="button"
                              disabled={isTerminal && !isAdmin}
                              onClick={() =>
                                updateOrderByRetailerOrAdmin(order.id, {
                                  retailerNote: retailerNotes[order.id] ?? '',
                                })
                              }
                              className="px-3 py-1.5 bg-zinc-900 text-white font-semibold rounded-md disabled:opacity-40 cursor-pointer"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-zinc-700 mb-1.5">Order Status Controls</p>
                          <div className="flex flex-wrap gap-1.5">
                            {NEXT_STATUSES.map((st) => (
                              <button
                                key={st}
                                type="button"
                                disabled={(isTerminal && !isAdmin) || order.status === st}
                                onClick={() =>
                                  updateOrderByRetailerOrAdmin(order.id, { status: st })
                                }
                                className={`px-2.5 py-1.5 rounded-md font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                                  order.status === st
                                    ? 'bg-violet-900 text-white border-violet-900'
                                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-200 flex items-center justify-between gap-2">
                          <span className="font-semibold text-zinc-700">Payment Verification</span>
                          <button
                            type="button"
                            disabled={(isTerminal && !isAdmin) || order.paymentStatus === 'Manually Verified'}
                            onClick={() =>
                              updateOrderByRetailerOrAdmin(order.id, {
                                paymentStatus: 'Manually Verified',
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md disabled:opacity-40 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {order.paymentStatus === 'Manually Verified'
                                ? 'Payment Verified'
                                : 'Mark Payment Manually Verified'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-600">
              Basic manual availability controls only — toggle items Available or Unavailable as shelf stock changes.
            </p>
            <button
              type="button"
              onClick={openNewProductForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          {showProductForm && (
            <form
              onSubmit={handleSaveProduct}
              className="bg-white border border-violet-300 rounded-xl p-6 space-y-4"
            >
              <h2 className="font-display text-base font-semibold text-zinc-900">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add Store Product'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Price (INR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Pack / Unit Label *</label>
                  <input
                    type="text"
                    required
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    placeholder="e.g., 500 ml / Pack of 5"
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Illustration Preset</label>
                  <select
                    value={prodImageKey}
                    onChange={(e) => setProdImageKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    {IMAGE_KEYS.map((k) => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Custom Image URL (Optional)</label>
                  <input
                    type="url"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodAvailable}
                  onChange={(e) => setProdAvailable(e.target.checked)}
                  className="w-4 h-4 accent-violet-900"
                />
                <span>Currently Available for Ordering</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingProd}
                  className="px-4 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {savingProd ? 'Saving...' : 'Save Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {storeProducts.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
              <Package className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-900">No products in this store yet</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold text-right">Price</th>
                    <th className="px-4 py-3 font-semibold">Availability</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {storeProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-900">{p.name}</p>
                        <p className="text-zinc-500">{p.unitLabel}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{p.category}</td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-zinc-900">
                        {formatINR(p.price)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleProductAvailability(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                            p.available
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {p.available ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Available</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Unavailable</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditProductForm(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-zinc-300 rounded-md hover:bg-zinc-100 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-red-200 text-red-700 rounded-md hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Store Settings Tab */}
      {tab === 'store' && activeStore && (
        <form
          onSubmit={handleSaveStore}
          className="bg-white border border-zinc-200 rounded-xl p-6 max-w-2xl space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              Store Profile &amp; WhatsApp / UPI Settings
            </h2>
            {storeSavedMsg && (
              <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Updated
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Operating Hours *</label>
              <input
                type="text"
                required
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                WhatsApp Order Number
              </label>
              <input
                type="tel"
                value={whatsappNum}
                onChange={(e) => setWhatsappNum(e.target.value)}
                placeholder="10-digit or 91XXXXXXXXXX"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Delivery Information Note
            </label>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Verified Store UPI ID (Optional — shown only when set)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g., storename@upi"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
            />
          </div>

          <div className="flex gap-6">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="w-4 h-4 accent-violet-900"
              />
              <span>Accept Cash on Delivery (COD)</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={upiEnabled}
                onChange={(e) => setUpiEnabled(e.target.checked)}
                className="w-4 h-4 accent-violet-900"
              />
              <span>Accept Manually Coordinated UPI</span>
            </label>
          </div>

          <div className="pt-3 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Private Contact: Owner Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Private Contact: Registered Phone
              </label>
              <input
                type="tel"
                value={registeredPhone}
                onChange={(e) => setRegisteredPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Save Store Settings
          </button>
        </form>
      )}
    </div>
  );
};

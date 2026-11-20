import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Database,
  Lock,
  MapPin,
  Package,
  Plus,
  ShieldAlert,
  Store as StoreIcon,
  Trash2,
  Users,
} from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';
import { VENTURE_PLAN_REFERENCE } from '../data/pilotSeed';
import {
  BundleCategory,
  BundleItem,
  OrderStatus,
  PlatformConfig,
  ServiceArea,
  Store,
  StoreCategory,
  StoreStatus,
  UserRole,
} from '../types';
import { formatINR } from '../utils/whatsapp';

type AdminTab =
  | 'overview'
  | 'economics'
  | 'retailers'
  | 'areas'
  | 'bundles'
  | 'orders';

const STORE_CATEGORIES: StoreCategory[] = [
  'Kirana & Groceries',
  'Snacks & Beverages',
  'Stationery & Print',
  'Personal Care',
  'Multi-Category Essentials',
  'Licensed Pharmacy',
];

const BUNDLE_CATEGORIES: BundleCategory[] = [
  'Hostel Essentials Bundle',
  'Study Essentials Bundle',
  'Late-Night Snacks Bundle',
  'Personal Care Bundle',
  'Monthly Essentials Bundle',
];

export const AdminDashboard: React.FC = () => {
  const {
    firebaseUser,
    isAdmin,
    signInWithGoogle,
    setActiveView,
    platformConfig,
    savePlatformConfig,
    seedDemoDataToFirestore,
    clearDemoDataFromFirestore,
    allStoresForAdmin,
    saveStoreAdmin,
    deleteStoreAdmin,
    allRetailerApplications,
    approveRetailerApplication,
    rejectRetailerApplication,
    allServiceAreasForAdmin,
    saveServiceArea,
    deleteServiceArea,
    products,
    allBundlesForAdmin,
    saveBundle,
    deleteBundle,
    allOrdersForAdmin,
    updateOrderByRetailerOrAdmin,
    allUsersForAdmin,
    updateUserRoleAdmin,
    allFeedbackForAdmin,
  } = useCampusCart();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Economics & Config Form State
  const [cfg, setCfg] = useState<Omit<PlatformConfig, 'updatedAt'>>({
    deliveryServiceFee: platformConfig.deliveryServiceFee,
    variableCostPerTxn: platformConfig.variableCostPerTxn,
    monthlyFixedCost: platformConfig.monthlyFixedCost,
    baseMonthlyCustomers: platformConfig.baseMonthlyCustomers,
    basePurchasesPerCustomer: platformConfig.basePurchasesPerCustomer,
    pilotWhatsappNumber: platformConfig.pilotWhatsappNumber,
    pilotFeeDisclaimer: platformConfig.pilotFeeDisclaimer,
    promoBannerText: platformConfig.promoBannerText || '',
    promoBannerEnabled: platformConfig.promoBannerEnabled,
    upiEnabled: platformConfig.upiEnabled,
    codEnabled: platformConfig.codEnabled,
  });
  const [cfgSaved, setCfgSaved] = useState(false);

  // Add Store Form State
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeCat, setStoreCat] = useState<StoreCategory>('Kirana & Groceries');
  const [storeAddr, setStoreAddr] = useState('');
  const [storeHours, setStoreHours] = useState('8:00 AM – 9:30 PM');
  const [storeWa, setStoreWa] = useState('');
  const [storeUpi, setStoreUpi] = useState('');
  const [storeOwnerUid, setStoreOwnerUid] = useState('');
  const [storePharmacyVerified, setStorePharmacyVerified] = useState(false);

  // Service Area Form State
  const [areaName, setAreaName] = useState('');
  const [areaType, setAreaType] = useState<ServiceArea['clusterType']>('PG Cluster');
  const [areaDesc, setAreaDesc] = useState('');
  const [areaNote, setAreaNote] = useState('');

  // Bundle Form State
  const [bundleName, setBundleName] = useState('');
  const [bundleCat, setBundleCat] = useState<BundleCategory>('Hostel Essentials Bundle');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundleStoreId, setBundleStoreId] = useState('');
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [bundlePriceOverride, setBundlePriceOverride] = useState('');

  useEffect(() => {
    setCfg({
      deliveryServiceFee: platformConfig.deliveryServiceFee,
      variableCostPerTxn: platformConfig.variableCostPerTxn,
      monthlyFixedCost: platformConfig.monthlyFixedCost,
      baseMonthlyCustomers: platformConfig.baseMonthlyCustomers,
      basePurchasesPerCustomer: platformConfig.basePurchasesPerCustomer,
      pilotWhatsappNumber: platformConfig.pilotWhatsappNumber,
      pilotFeeDisclaimer: platformConfig.pilotFeeDisclaimer,
      promoBannerText: platformConfig.promoBannerText || '',
      promoBannerEnabled: platformConfig.promoBannerEnabled,
      upiEnabled: platformConfig.upiEnabled,
      codEnabled: platformConfig.codEnabled,
    });
  }, [platformConfig]);

  useEffect(() => {
    if (firebaseUser && !storeOwnerUid) {
      setStoreOwnerUid(firebaseUser.uid);
    }
  }, [firebaseUser, storeOwnerUid]);

  useEffect(() => {
    if (allStoresForAdmin.length > 0 && !bundleStoreId) {
      setBundleStoreId(allStoresForAdmin[0].id);
    }
  }, [allStoresForAdmin, bundleStoreId]);

  // Unit Economics Calculations (Prompt Section 12)
  const economics = useMemo(() => {
    const fee = Number(cfg.deliveryServiceFee) || 0;
    const variable = Number(cfg.variableCostPerTxn) || 0;
    const fixed = Number(cfg.monthlyFixedCost) || 0;
    const customers = Number(cfg.baseMonthlyCustomers) || 0;
    const purchases = Number(cfg.basePurchasesPerCustomer) || 0;

    const contributionPerTxn = fee - variable;
    const contributionMarginPct = fee > 0 ? (contributionPerTxn / fee) * 100 : 0;
    const monthlyTxns = customers * purchases;
    const monthlyRevenue = monthlyTxns * fee;
    const monthlyContribution = monthlyTxns * contributionPerTxn;
    const operatingSurplus = monthlyContribution - fixed;
    const breakEvenTxns =
      contributionPerTxn > 0 ? Math.ceil(fixed / contributionPerTxn) : Infinity;
    const breakEvenCustomers =
      purchases > 0 && Number.isFinite(breakEvenTxns)
        ? Math.ceil(breakEvenTxns / purchases)
        : Infinity;

    return {
      contributionPerTxn,
      contributionMarginPct,
      monthlyTxns,
      monthlyRevenue,
      monthlyContribution,
      operatingSurplus,
      breakEvenTxns,
      breakEvenCustomers,
    };
  }, [cfg]);

  // Live Pilot Actuals from Firestore
  const pilotActuals = useMemo(() => {
    const completedOrders = allOrdersForAdmin.filter((o) => o.status === 'Completed');
    const uniquePayingCustomers = new Set(completedOrders.map((o) => o.customerUid)).size;
    const customerOrderCounts: Record<string, number> = {};
    completedOrders.forEach((o) => {
      customerOrderCounts[o.customerUid] = (customerOrderCounts[o.customerUid] || 0) + 1;
    });
    const repeatCustomers = Object.values(customerOrderCounts).filter((c) => c >= 2).length;
    const repeatRatePct =
      uniquePayingCustomers > 0 ? (repeatCustomers / uniquePayingCustomers) * 100 : 0;

    const totalFeedback = allFeedbackForAdmin.length;
    const willingCount = allFeedbackForAdmin.filter((f) => f.willingToPayFee).length;
    const willingPct = totalFeedback > 0 ? (willingCount / totalFeedback) * 100 : 0;

    const activeNonDemoStores = allStoresForAdmin.filter(
      (s) => s.status === 'active' && !s.isDemo
    ).length;

    return {
      totalOrders: allOrdersForAdmin.length,
      completedOrders: completedOrders.length,
      uniquePayingCustomers,
      repeatRatePct,
      activeStores: allStoresForAdmin.filter((s) => s.status === 'active').length,
      activeNonDemoStores,
      totalUsers: allUsersForAdmin.length,
      totalFeedback,
      willingPct,
    };
  }, [allOrdersForAdmin, allFeedbackForAdmin, allStoresForAdmin, allUsersForAdmin]);

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-zinc-200 rounded-xl p-10">
          <Lock className="w-9 h-9 text-violet-900 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold text-zinc-950">
            Super Administrator Sign-In Required
          </h1>
          <p className="text-sm text-zinc-600 mt-2 mb-6">
            Sign in with the authorized administrator Google account to manage stores, service areas, unit economics, and pilot orders.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="px-5 py-2.5 bg-violet-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-red-200 rounded-xl p-10">
          <ShieldAlert className="w-9 h-9 text-red-700 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold text-zinc-950">
            Access Restricted — Administrator Role Required
          </h1>
          <p className="text-sm text-zinc-600 mt-2 mb-6">
            Signed in as <span className="font-medium">{firebaseUser.email}</span>. This account does not have Super Administrator permissions in Firestore security rules.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  const handleSeedDemo = async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      await seedDemoDataToFirestore();
      setSeedMessage('Seeded 3 demo stores, 13 demo products, 3 demo bundles, 4 Selaqui service areas, and pilot config into Cloud Firestore.');
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveCfg = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePlatformConfig(cfg);
    setCfgSaved(true);
    setTimeout(() => setCfgSaved(false), 2000);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const defaultAreas =
      allServiceAreasForAdmin.length > 0
        ? allServiceAreasForAdmin.slice(0, 2).map((a) => a.name)
        : ['DGU On-Campus Hostels (Boys & Girls)'];
    await saveStoreAdmin({
      name: storeName,
      category: storeCat,
      address: storeAddr,
      serviceAreas: defaultAreas,
      operatingHours: storeHours,
      deliveryEstimateNote: 'Coordinated via WhatsApp upon confirmation.',
      whatsappOrderNumber: storeWa,
      upiId: storeUpi,
      upiEnabled: true,
      codEnabled: true,
      pharmacyVerified: storeCat === 'Licensed Pharmacy' ? storePharmacyVerified : false,
      status: 'active',
      isDemo: false,
      ownerUid: storeOwnerUid || firebaseUser.uid,
    });
    setStoreName('');
    setStoreAddr('');
    setStoreWa('');
    setStoreUpi('');
    setShowStoreForm(false);
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveServiceArea({
      name: areaName,
      clusterType: areaType,
      description: areaDesc,
      estimatedDeliveryNote: areaNote || 'Coordinated via participating Selaqui retailers.',
      active: true,
    });
    setAreaName('');
    setAreaDesc('');
    setAreaNote('');
  };

  const selectedBundleStoreProducts = products.filter((p) => p.storeId === bundleStoreId);
  const bundleRegularSum = bundleItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const toggleProductInBundle = (prodId: string) => {
    const prod = selectedBundleStoreProducts.find((p) => p.id === prodId);
    if (!prod) return;
    setBundleItems((prev) => {
      const exists = prev.find((i) => i.productId === prodId);
      if (exists) return prev.filter((i) => i.productId !== prodId);
      return [
        ...prev,
        { productId: prod.id, productName: prod.name, quantity: 1, unitPrice: prod.price },
      ];
    });
  };

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    const store = allStoresForAdmin.find((s) => s.id === bundleStoreId);
    if (!store || bundleItems.length === 0) return;
    const finalBundlePrice = bundlePriceOverride
      ? Number(bundlePriceOverride)
      : bundleRegularSum;
    await saveBundle({
      name: bundleName,
      category: bundleCat,
      description: bundleDesc,
      storeId: store.id,
      storeName: store.name,
      items: bundleItems,
      regularPrice: bundleRegularSum,
      bundlePrice: finalBundlePrice,
      enabled: true,
      isDemo: false,
    });
    setBundleName('');
    setBundleDesc('');
    setBundleItems([]);
    setBundlePriceOverride('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-violet-900">
            Super Administrator Console · {firebaseUser.email}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
            CampusCart Venture Operations
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('retailer')}
          className="px-4 py-2 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Open Retailer Workbench
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit mb-6">
        {[
          { id: 'overview', label: 'Overview & Validation' },
          { id: 'economics', label: 'Unit Economics & Config' },
          { id: 'retailers', label: `Retailers (${allStoresForAdmin.length})` },
          { id: 'areas', label: `Service Areas (${allServiceAreasForAdmin.length})` },
          { id: 'bundles', label: `Bundles (${allBundlesForAdmin.length})` },
          { id: 'orders', label: `Orders & Users (${allOrdersForAdmin.length})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as AdminTab)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === item.id ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Overview & Pilot Validation */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Firestore Seed Utility */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-violet-900 mt-0.5 shrink-0" />
              <div>
                <h2 className="font-display text-sm font-semibold text-zinc-900">
                  Cloud Firestore Pilot Database Control
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Seed clearly labelled Demonstration Stores, Products, Bundles, and Selaqui Service Areas into Firestore to test live persistence, or clear demo records once real stores are onboarded.
                </p>
                {seedMessage && (
                  <p className="text-xs font-medium text-emerald-700 mt-2">{seedMessage}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedDemo}
                className="px-3.5 py-2 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                {seeding ? 'Seeding...' : 'Seed Pilot Demo Data'}
              </button>
              <button
                type="button"
                onClick={clearDemoDataFromFirestore}
                className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Clear Demo Data
              </button>
            </div>
          </div>

          {/* Live Pilot Metrics */}
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-900 mb-3">
              Live Pilot Actuals (Real Firestore Records)
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                <p className="text-xs text-zinc-500">Total Submitted Orders</p>
                <p className="font-mono-tabular text-2xl font-bold text-zinc-950 mt-1">
                  {pilotActuals.totalOrders}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  {pilotActuals.completedOrders} Completed
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                <p className="text-xs text-zinc-500">Paying Customers (Target: 20)</p>
                <p className="font-mono-tabular text-2xl font-bold text-zinc-950 mt-1">
                  {pilotActuals.uniquePayingCustomers}
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-mono-tabular">
                  Repeat Rate: {pilotActuals.repeatRatePct.toFixed(1)}% (Goal ≥30%)
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                <p className="text-xs text-zinc-500">Active Stores (Goal ≥3 Real)</p>
                <p className="font-mono-tabular text-2xl font-bold text-zinc-950 mt-1">
                  {pilotActuals.activeStores}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {pilotActuals.activeNonDemoStores} Verified Non-Demo
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                <p className="text-xs text-zinc-500">₹{platformConfig.deliveryServiceFee} Fee Willingness</p>
                <p className="font-mono-tabular text-2xl font-bold text-zinc-950 mt-1">
                  {pilotActuals.totalFeedback > 0 ? `${pilotActuals.willingPct.toFixed(0)}%` : '—'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {pilotActuals.totalFeedback} survey responses
                </p>
              </div>
            </div>
          </div>

          {/* Key Assumptions & 30-Day Launch Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-6">
              <h3 className="font-display text-base font-semibold text-zinc-900 mb-3">
                Key Business Assumptions to Validate
              </h3>
              <div className="space-y-4">
                {VENTURE_PLAN_REFERENCE.keyAssumptions.map((ka) => (
                  <div key={ka.id} className="pb-3 border-b border-zinc-100 last:border-b-0">
                    <p className="text-xs font-semibold text-violet-900">
                      Assumption {ka.id}
                    </p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">{ka.assumption}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Evidence Needed: {ka.evidenceTarget}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
              <div>
                <h3 className="font-display text-base font-semibold text-zinc-900 mb-3">
                  30-Day Launch Plan (Tushar Sharma)
                </h3>
                <div className="space-y-3">
                  {VENTURE_PLAN_REFERENCE.launchPlan.map((lp) => (
                    <div key={lp.phase} className="pb-2.5 border-b border-zinc-100 last:border-b-0">
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="font-semibold text-zinc-900">{lp.phase}</span>
                        <span className="text-violet-900 font-medium">{lp.target}</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5">{lp.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200">
                <h4 className="text-xs font-semibold text-zinc-700 mb-2">
                  Venture Plan Evidence Review Baseline
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {VENTURE_PLAN_REFERENCE.evidenceReview.map((ev) => (
                    <div key={ev.category} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                      <p className="font-mono-tabular font-bold text-zinc-900">{ev.count} claims</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{ev.category}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Unit Economics & Platform Config */}
      {tab === 'economics' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-900">
            <span className="font-semibold">Planning Assumptions Notice:</span> Financial metrics below reflect the DGU Venture Quest business plan hypotheses and configurable simulator parameters—not verified financial performance.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Config Form */}
            <form
              onSubmit={handleSaveCfg}
              className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <h2 className="font-display text-base font-semibold text-zinc-900">
                  Live Pilot Configuration &amp; Financial Assumptions
                </h2>
                {cfgSaved && (
                  <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Delivery / Service Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cfg.deliveryServiceFee}
                    onChange={(e) =>
                      setCfg({ ...cfg, deliveryServiceFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Variable Cost / Txn (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cfg.variableCostPerTxn}
                    onChange={(e) =>
                      setCfg({ ...cfg, variableCostPerTxn: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Monthly Fixed Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cfg.monthlyFixedCost}
                    onChange={(e) =>
                      setCfg({ ...cfg, monthlyFixedCost: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Expected Customers
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cfg.baseMonthlyCustomers}
                    onChange={(e) =>
                      setCfg({ ...cfg, baseMonthlyCustomers: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Orders / Cust / Mo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cfg.basePurchasesPerCustomer}
                    onChange={(e) =>
                      setCfg({ ...cfg, basePurchasesPerCustomer: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Fallback Pilot WhatsApp Business Number
                </label>
                <input
                  type="tel"
                  value={cfg.pilotWhatsappNumber}
                  onChange={(e) => setCfg({ ...cfg, pilotWhatsappNumber: e.target.value })}
                  placeholder="e.g., 9198XXXXXXXX (leave blank if unconfigured)"
                  className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Promotional Top Banner Text
                </label>
                <input
                  type="text"
                  value={cfg.promoBannerText || ''}
                  onChange={(e) => setCfg({ ...cfg, promoBannerText: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-800">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.promoBannerEnabled}
                    onChange={(e) => setCfg({ ...cfg, promoBannerEnabled: e.target.checked })}
                    className="w-4 h-4 accent-violet-900"
                  />
                  <span>Show Top Banner</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.codEnabled}
                    onChange={(e) => setCfg({ ...cfg, codEnabled: e.target.checked })}
                    className="w-4 h-4 accent-violet-900"
                  />
                  <span>Enable COD</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.upiEnabled}
                    onChange={(e) => setCfg({ ...cfg, upiEnabled: e.target.checked })}
                    className="w-4 h-4 accent-violet-900"
                  />
                  <span>Enable Manual UPI</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Save &amp; Publish Platform Config
              </button>
            </form>

            {/* Computed Unit Economics Table */}
            <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
                <BarChart3 className="w-5 h-5 text-violet-900" />
                <h2 className="font-display text-base font-semibold text-zinc-900">
                  Calculated Unit Economics (Planned Assumption)
                </h2>
              </div>

              <table className="w-full text-xs">
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="py-2 text-zinc-600">Contribution per Transaction (Fee − Variable)</td>
                    <td className="py-2 text-right font-mono-tabular font-bold text-zinc-950">
                      {formatINR(economics.contributionPerTxn)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-600">Contribution Margin %</td>
                    <td className="py-2 text-right font-mono-tabular font-bold text-zinc-950">
                      {economics.contributionMarginPct.toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-600">Expected Monthly Transactions</td>
                    <td className="py-2 text-right font-mono-tabular font-semibold text-zinc-900">
                      {economics.monthlyTxns} txns
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-600">Expected Monthly Revenue (Service Fees)</td>
                    <td className="py-2 text-right font-mono-tabular font-semibold text-zinc-900">
                      {formatINR(economics.monthlyRevenue)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-600">Expected Monthly Contribution</td>
                    <td className="py-2 text-right font-mono-tabular font-semibold text-zinc-900">
                      {formatINR(economics.monthlyContribution)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-600">Expected Monthly Operating Surplus / Deficit</td>
                    <td
                      className={`py-2 text-right font-mono-tabular font-bold ${
                        economics.operatingSurplus >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {formatINR(economics.operatingSurplus)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-600">Break-Even Volume (Fixed / Contribution)</td>
                    <td className="py-2 text-right font-mono-tabular font-bold text-violet-950">
                      {Number.isFinite(economics.breakEvenTxns)
                        ? `${economics.breakEvenTxns} txns`
                        : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-600">Estimated Break-Even Customers</td>
                    <td className="py-2 text-right font-mono-tabular font-bold text-violet-950">
                      {Number.isFinite(economics.breakEvenCustomers)
                        ? `${economics.breakEvenCustomers} customers`
                        : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Scenarios & TAM/SAM/SOM */}
              <div className="pt-3 border-t border-zinc-200 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-800">
                  Venture Plan Growth Scenarios &amp; Market Sizing
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {VENTURE_PLAN_REFERENCE.scenarios.map((sc) => {
                    const txns = sc.expectedCustomers * sc.purchasesPerCustomer;
                    const surplus = txns * economics.contributionPerTxn - cfg.monthlyFixedCost;
                    return (
                      <div key={sc.name} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                        <p className="font-semibold text-zinc-900">{sc.name}</p>
                        <p className="font-mono-tabular text-zinc-600 mt-0.5">
                          {sc.expectedCustomers} × {sc.purchasesPerCustomer} = {txns} txns
                        </p>
                        <p
                          className={`font-mono-tabular font-semibold mt-1 ${
                            surplus >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {formatINR(surplus)}/mo
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1.5 text-[11px] text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  {VENTURE_PLAN_REFERENCE.marketSizing.map((m) => (
                    <div key={m.level} className="flex justify-between gap-2">
                      <span className="font-semibold text-zinc-800">{m.level}</span>
                      <span className="font-mono-tabular">{m.customers} · {m.annualValue}/yr</span>
                    </div>
                  ))}
                  <p className="pt-1 border-t border-zinc-200 text-zinc-500">
                    {VENTURE_PLAN_REFERENCE.consistencyNote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Retailers & Applications */}
      {tab === 'retailers' && (
        <div className="space-y-6">
          {/* Pending Applications */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-zinc-900 mb-3">
              Retailer Onboarding Applications ({allRetailerApplications.length})
            </h2>
            {allRetailerApplications.length === 0 ? (
              <p className="text-xs text-zinc-500">No retailer onboarding applications submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {allRetailerApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {app.storeName} · <span className="text-violet-900 capitalize">{app.status}</span>
                      </p>
                      <p className="text-zinc-600 mt-0.5">
                        Owner: {app.ownerName} · Phone: {app.phone} · Area: {app.serviceArea}
                      </p>
                      <p className="text-zinc-500">{app.address}</p>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => approveRetailerApplication(app)}
                          className="px-3 py-1.5 bg-emerald-700 text-white font-semibold rounded-md cursor-pointer"
                        >
                          Approve &amp; Create Store
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectRetailerApplication(app.id)}
                          className="px-3 py-1.5 bg-white border border-red-200 text-red-700 font-semibold rounded-md cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stores Directory */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-zinc-900">
                Participating Local Stores ({allStoresForAdmin.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowStoreForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Store</span>
              </button>
            </div>

            {showStoreForm && (
              <form
                onSubmit={handleCreateStore}
                className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Store Name *"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-lg"
                  />
                  <select
                    value={storeCat}
                    onChange={(e) => setStoreCat(e.target.value as StoreCategory)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-lg"
                  >
                    {STORE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Operating Hours *"
                    value={storeHours}
                    onChange={(e) => setStoreHours(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Selaqui Store Address *"
                    value={storeAddr}
                    onChange={(e) => setStoreAddr(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp Order Number"
                    value={storeWa}
                    onChange={(e) => setStoreWa(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Verified UPI ID (Optional)"
                    value={storeUpi}
                    onChange={(e) => setStoreUpi(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Owner Firebase UID (defaults to your Admin UID)"
                    value={storeOwnerUid}
                    onChange={(e) => setStoreOwnerUid(e.target.value)}
                    className="px-3 py-2 bg-white border border-zinc-200 rounded-lg font-mono-tabular"
                  />
                  {storeCat === 'Licensed Pharmacy' && (
                    <label className="inline-flex items-center gap-2 font-semibold text-zinc-800">
                      <input
                        type="checkbox"
                        checked={storePharmacyVerified}
                        onChange={(e) => setStorePharmacyVerified(e.target.checked)}
                        className="accent-violet-900"
                      />
                      <span>Pharmacy License &amp; Compliance Verified</span>
                    </label>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-900 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Save Store
                </button>
              </form>
            )}

            <div className="space-y-3">
              {allStoresForAdmin.map((s: Store) => (
                <div
                  key={s.id}
                  className="p-4 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <StoreIcon className="w-4 h-4 text-violet-900" />
                      <span className="font-semibold text-sm text-zinc-900">{s.name}</span>
                      {s.isDemo && <span className="text-amber-700 font-semibold">(Demo)</span>}
                    </div>
                    <p className="text-zinc-600 mt-1">
                      {s.category} · {s.address} · Hours: {s.operatingHours}
                    </p>
                    <p className="text-zinc-500 mt-0.5 font-mono-tabular">
                      WhatsApp: {s.whatsappOrderNumber || 'Not set'} · Owner UID: {s.ownerUid}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={s.status}
                      onChange={(e) =>
                        saveStoreAdmin({ ...s, status: e.target.value as StoreStatus })
                      }
                      className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-md font-semibold"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => deleteStoreAdmin(s.id)}
                      className="p-1.5 text-red-700 border border-red-200 rounded-md hover:bg-red-50 cursor-pointer"
                      aria-label={`Delete ${s.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Service Areas */}
      {tab === 'areas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateArea}
            className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 space-y-4 h-fit"
          >
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Add DGU / Selaqui Service Area
            </h2>
            <p className="text-xs text-zinc-500">
              Keep service coverage focused exclusively on validated Selaqui hostel and PG clusters.
            </p>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Cluster Name *</label>
              <input
                type="text"
                required
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g., Selaqui Phase II PGs"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Cluster Type</label>
              <select
                value={areaType}
                onChange={(e) => setAreaType(e.target.value as ServiceArea['clusterType'])}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              >
                <option value="Campus Hostel">Campus Hostel</option>
                <option value="PG Cluster">PG Cluster</option>
                <option value="Campus Gate / Academic">Campus Gate / Academic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Description *</label>
              <input
                type="text"
                required
                value={areaDesc}
                onChange={(e) => setAreaDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Delivery Estimate Note</label>
              <input
                type="text"
                value={areaNote}
                onChange={(e) => setAreaNote(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Add Service Area
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Configured Service Areas ({allServiceAreasForAdmin.length})
            </h2>
            {allServiceAreasForAdmin.map((area) => (
              <div
                key={area.id}
                className="p-4 border border-zinc-200 rounded-lg flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-900" />
                    <span className="font-semibold text-sm text-zinc-900">{area.name}</span>
                  </div>
                  <p className="text-zinc-600 mt-1">{area.clusterType} · {area.description}</p>
                  <p className="text-zinc-500 mt-0.5">{area.estimatedDeliveryNote}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => saveServiceArea({ ...area, active: !area.active })}
                    className={`px-2.5 py-1 rounded-md font-semibold border cursor-pointer ${
                      area.active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {area.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteServiceArea(area.id)}
                    className="p-1.5 text-red-700 border border-red-200 rounded-md hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Student Bundles */}
      {tab === 'bundles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateBundle}
            className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 space-y-4 h-fit"
          >
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Create Student-Friendly Bundle
            </h2>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Bundle Name *</label>
              <input
                type="text"
                required
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                placeholder="e.g., Hostel Starter Hygiene Kit"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Category</label>
              <select
                value={bundleCat}
                onChange={(e) => setBundleCat(e.target.value as BundleCategory)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              >
                {BUNDLE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Store *</label>
              <select
                value={bundleStoreId}
                onChange={(e) => {
                  setBundleStoreId(e.target.value);
                  setBundleItems([]);
                }}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              >
                {allStoresForAdmin.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Select Configured Store Products ({bundleItems.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto border border-zinc-200 rounded-lg divide-y divide-zinc-100 bg-zinc-50">
                {selectedBundleStoreProducts.map((p) => {
                  const checked = bundleItems.some((i) => i.productId === p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-white"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProductInBundle(p.id)}
                          className="accent-violet-900"
                        />
                        <span>{p.name}</span>
                      </span>
                      <span className="font-mono-tabular">{formatINR(p.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                <p className="text-zinc-500">Sum of Items</p>
                <p className="font-mono-tabular font-bold text-zinc-900">{formatINR(bundleRegularSum)}</p>
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Bundle Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder={String(bundleRegularSum)}
                  value={bundlePriceOverride}
                  onChange={(e) => setBundlePriceOverride(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono-tabular bg-zinc-50 border border-zinc-200 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Description *</label>
              <textarea
                rows={2}
                required
                value={bundleDesc}
                onChange={(e) => setBundleDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={bundleItems.length === 0}
              className="px-4 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg disabled:opacity-40 cursor-pointer"
            >
              Create Bundle
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Configured Bundles ({allBundlesForAdmin.length})
            </h2>
            {allBundlesForAdmin.map((b) => (
              <div
                key={b.id}
                className="p-4 border border-zinc-200 rounded-lg flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-violet-900" />
                    <span className="font-semibold text-sm text-zinc-900">{b.name}</span>
                  </div>
                  <p className="text-zinc-600 mt-1">
                    {b.category} · {b.storeName} · <span className="font-mono-tabular font-semibold">{formatINR(b.bundlePrice)}</span>
                  </p>
                  <p className="text-zinc-500 mt-1">
                    {b.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => saveBundle({ ...b, enabled: !b.enabled })}
                    className={`px-2.5 py-1 rounded-md font-semibold border cursor-pointer ${
                      b.enabled
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {b.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBundle(b.id)}
                    className="p-1.5 text-red-700 border border-red-200 rounded-md hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Orders, Customers & Feedback */}
      {tab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-zinc-900 mb-3">
              All Platform Order Requests ({allOrdersForAdmin.length})
            </h2>
            {allOrdersForAdmin.length === 0 ? (
              <p className="text-xs text-zinc-500">No orders stored in Firestore yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Ref</th>
                      <th className="px-3 py-2.5 font-semibold">Customer &amp; Location</th>
                      <th className="px-3 py-2.5 font-semibold">Store</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Total</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-3 py-2.5 font-semibold">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {allOrdersForAdmin.map((o) => (
                      <tr key={o.id}>
                        <td className="px-3 py-2.5 font-mono-tabular font-semibold">{o.orderRef}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-zinc-900">{o.customerName}</p>
                          <p className="text-zinc-500">{o.hostelOrPg}</p>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-700">{o.storeName}</td>
                        <td className="px-3 py-2.5 text-right font-mono-tabular font-semibold">
                          {formatINR(o.totalAmount)}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={o.status}
                            onChange={(e) =>
                              updateOrderByRetailerOrAdmin(o.id, {
                                status: e.target.value as OrderStatus,
                              })
                            }
                            className="px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-md"
                          >
                            {[
                              'Draft',
                              'Pending Retailer Confirmation',
                              'Accepted',
                              'Rejected',
                              'Confirmed',
                              'Out for Delivery',
                              'Completed',
                              'Cancelled',
                            ].map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateOrderByRetailerOrAdmin(o.id, {
                                paymentStatus:
                                  o.paymentStatus === 'Manually Verified'
                                    ? 'Unverified'
                                    : 'Manually Verified',
                              })
                            }
                            className="px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 cursor-pointer"
                          >
                            {o.paymentMethod}: {o.paymentStatus}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-violet-900" />
                <h3 className="font-display text-base font-semibold text-zinc-900">
                  Registered Users ({allUsersForAdmin.length})
                </h3>
              </div>
              <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
                {allUsersForAdmin.map((u) => (
                  <div
                    key={u.uid}
                    className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">{u.displayName}</p>
                      <p className="text-zinc-500 truncate">{u.email}</p>
                      <p className="text-[11px] font-mono-tabular text-zinc-400 truncate">UID: {u.uid}</p>
                    </div>
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRoleAdmin(u.uid, e.target.value as UserRole)}
                      className="px-2 py-1 bg-white border border-zinc-300 rounded-md font-semibold"
                    >
                      <option value="customer">Customer</option>
                      <option value="retailer">Retailer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <h3 className="font-display text-base font-semibold text-zinc-900 mb-3">
                Student Pilot Feedback ({allFeedbackForAdmin.length})
              </h3>
              {allFeedbackForAdmin.length === 0 ? (
                <p className="text-xs text-zinc-500">No feedback responses yet.</p>
              ) : (
                <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto">
                  {allFeedbackForAdmin.map((fb) => (
                    <div key={fb.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                      <div className="flex justify-between text-zinc-500 mb-1">
                        <span className="font-semibold text-zinc-900">{fb.customerName}</span>
                        <span className="font-mono-tabular">
                          {fb.rating}/5 · ₹20 fee: {fb.willingToPayFee ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <p className="text-zinc-700">{fb.comment}</p>
                      <p className="text-zinc-400 mt-1">{fb.hostelCluster}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

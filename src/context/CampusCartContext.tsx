import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isSuperAdminEmail,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  DEFAULT_PLATFORM_CONFIG,
  DEFAULT_SERVICE_AREAS,
  DEMO_BUNDLES,
  DEMO_PRODUCTS,
  DEMO_STORES,
} from '../data/pilotSeed';
import {
  Bundle,
  CartItem,
  Feedback,
  Order,
  OrderLineItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PlatformConfig,
  Product,
  RetailerApplication,
  ServiceArea,
  Store,
  StorePrivateContact,
  UserProfile,
  UserRole,
} from '../types';
import { buildWhatsappOrderMessage, generateOrderRef } from '../utils/whatsapp';

export type AppView =
  | 'home'
  | 'catalog'
  | 'bundles'
  | 'checkout'
  | 'orders'
  | 'retailer'
  | 'admin';

interface StoreConflict {
  existingStoreName: string;
  newStoreName: string;
  pendingItems: CartItem[];
}

interface CampusCartContextValue {
  // Navigation & Cart Drawer
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (cat: string) => void;

  // Auth & Connection
  authReady: boolean;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isRetailer: boolean;
  connectionStatus: { checked: boolean; ok: boolean; offline: boolean };
  isUsingDemoFallback: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authError: string | null;

  // Storefront Data
  stores: Store[];
  allStoresForAdmin: Store[];
  myStores: Store[];
  products: Product[];
  bundles: Bundle[];
  allBundlesForAdmin: Bundle[];
  serviceAreas: ServiceArea[];
  allServiceAreasForAdmin: ServiceArea[];
  platformConfig: PlatformConfig;

  // Operational Data
  customerOrders: Order[];
  retailerOrders: Order[];
  allOrdersForAdmin: Order[];
  customerFeedback: Feedback[];
  allFeedbackForAdmin: Feedback[];
  myRetailerApplications: RetailerApplication[];
  allRetailerApplications: RetailerApplication[];
  allUsersForAdmin: UserProfile[];

  // Cart State & Conflict Handling
  cart: CartItem[];
  cartStore: Store | null;
  cartSubtotal: number;
  cartTotal: number;
  storeConflict: StoreConflict | null;
  resolveStoreConflict: (replaceCart: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  addBundleToCart: (bundle: Bundle) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Actions
  saveUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  submitOrder: (input: {
    customerName: string;
    customerPhone: string;
    hostelOrPg: string;
    roomDetails: string;
    landmark?: string;
    deliveryInstructions?: string;
    paymentMethod: PaymentMethod;
  }) => Promise<{ order: Order; persistedToCloud: boolean }>;
  cancelCustomerOrder: (orderId: string) => Promise<void>;
  submitFeedback: (input: {
    hostelCluster: string;
    willingToPayFee: boolean;
    rating: number;
    comment: string;
    orderId?: string;
  }) => Promise<void>;
  submitRetailerApplication: (input: {
    storeName: string;
    ownerName: string;
    phone: string;
    whatsappNumber?: string;
    address: string;
    category: string;
    serviceArea: string;
  }) => Promise<void>;

  // Retailer Actions
  updateStoreSettings: (
    storeId: string,
    updates: Partial<Pick<Store, 'operatingHours' | 'deliveryEstimateNote' | 'whatsappOrderNumber' | 'upiId' | 'upiEnabled' | 'codEnabled'>>
  ) => Promise<void>;
  saveStorePrivateContact: (storeId: string, contact: Omit<StorePrivateContact, 'updatedAt'>) => Promise<void>;
  getStorePrivateContact: (storeId: string) => Promise<StorePrivateContact | null>;
  saveProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleProductAvailability: (product: Product) => Promise<void>;
  updateOrderByRetailerOrAdmin: (
    orderId: string,
    updates: { status?: OrderStatus; paymentStatus?: PaymentStatus; retailerNote?: string }
  ) => Promise<void>;

  // Admin Actions
  seedDemoDataToFirestore: () => Promise<void>;
  clearDemoDataFromFirestore: () => Promise<void>;
  savePlatformConfig: (config: Omit<PlatformConfig, 'updatedAt'>) => Promise<void>;
  saveStoreAdmin: (store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<string>;
  deleteStoreAdmin: (storeId: string) => Promise<void>;
  approveRetailerApplication: (app: RetailerApplication) => Promise<void>;
  rejectRetailerApplication: (appId: string) => Promise<void>;
  saveServiceArea: (area: Omit<ServiceArea, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteServiceArea: (areaId: string) => Promise<void>;
  saveBundle: (bundle: Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteBundle: (bundleId: string) => Promise<void>;
  updateUserRoleAdmin: (uid: string, role: UserRole) => Promise<void>;
}

const CampusCartContext = createContext<CampusCartContextValue | null>(null);

const CART_STORAGE_KEY = 'campuscart_cart_v1';
const LOCAL_ORDERS_KEY = 'campuscart_local_orders_v1';

function tsToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return String(val);
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

export const CampusCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminDoc, setIsAdminDoc] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    checked: false,
    ok: false,
    offline: false,
  });

  // Firestore collections state
  const [cloudStores, setCloudStores] = useState<Store[]>([]);
  const [allStoresAdmin, setAllStoresAdmin] = useState<Store[]>([]);
  const [myStoresCloud, setMyStoresCloud] = useState<Store[]>([]);
  const [cloudProducts, setCloudProducts] = useState<Product[]>([]);
  const [cloudBundles, setCloudBundles] = useState<Bundle[]>([]);
  const [allBundlesAdmin, setAllBundlesAdmin] = useState<Bundle[]>([]);
  const [cloudServiceAreas, setCloudServiceAreas] = useState<ServiceArea[]>([]);
  const [allServiceAreasAdmin, setAllServiceAreasAdmin] = useState<ServiceArea[]>([]);
  const [cloudConfig, setCloudConfig] = useState<PlatformConfig | null>(null);

  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [retailerOrders, setRetailerOrders] = useState<Order[]>([]);
  const [allOrdersAdmin, setAllOrdersAdmin] = useState<Order[]>([]);
  const [customerFeedback, setCustomerFeedback] = useState<Feedback[]>([]);
  const [allFeedbackAdmin, setAllFeedbackAdmin] = useState<Feedback[]>([]);
  const [myRetailerApps, setMyRetailerApps] = useState<RetailerApplication[]>([]);
  const [allRetailerApps, setAllRetailerApps] = useState<RetailerApplication[]>([]);
  const [allUsersAdmin, setAllUsersAdmin] = useState<UserProfile[]>([]);

  // Local cart + local unauthenticated draft orders
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [localOrders, setLocalOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [storeConflict, setStoreConflict] = useState<StoreConflict | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(localOrders));
    } catch {
      // ignore
    }
  }, [localOrders]);

  // 1. Test Firestore connectivity on boot
  useEffect(() => {
    testFirestoreConnection().then((res) => {
      setConnectionStatus({ checked: true, ok: res.ok, offline: res.offline });
    });
  }, []);

  // 2. Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setUserProfile(null);
        setIsAdminDoc(false);
        return;
      }

      try {
        // Check admin marker doc
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        setIsAdminDoc(adminSnap.exists());

        // Fetch or bootstrap user profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const d = userSnap.data();
          setUserProfile({
            uid: d.uid,
            displayName: d.displayName,
            email: d.email,
            phone: d.phone,
            hostelOrPg: d.hostelOrPg,
            roomDetails: d.roomDetails,
            landmark: d.landmark,
            role: d.role,
            createdAt: tsToIso(d.createdAt),
            updatedAt: tsToIso(d.updatedAt),
          });
        } else {
          const initialRole: UserRole = isSuperAdminEmail(user.email) ? 'admin' : 'customer';
          const payload = {
            uid: user.uid,
            displayName: (user.displayName || user.email?.split('@')[0] || 'Student').slice(0, 100),
            email: (user.email || '').slice(0, 150),
            role: initialRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, payload);
          setUserProfile({
            uid: user.uid,
            displayName: payload.displayName,
            email: payload.email,
            role: initialRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Auth profile sync warning:', err);
      }
    });
    return () => unsub();
  }, []);

  const isAdmin = Boolean(
    firebaseUser?.emailVerified &&
      (isSuperAdminEmail(firebaseUser.email) || isAdminDoc || userProfile?.role === 'admin')
  );

  // 3. Public storefront listeners (stores active, products, bundles enabled, serviceAreas active, platformConfig)
  useEffect(() => {
    const unsubStores = onSnapshot(
      query(collection(db, 'stores'), where('status', '==', 'active')),
      (snap) => {
        const list: Store[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            category: data.category,
            address: data.address,
            serviceAreas: data.serviceAreas || [],
            operatingHours: data.operatingHours,
            deliveryEstimateNote: data.deliveryEstimateNote,
            whatsappOrderNumber: data.whatsappOrderNumber,
            upiId: data.upiId,
            upiEnabled: Boolean(data.upiEnabled),
            codEnabled: Boolean(data.codEnabled),
            pharmacyVerified: Boolean(data.pharmacyVerified),
            status: data.status,
            isDemo: Boolean(data.isDemo),
            ownerUid: data.ownerUid,
            createdAt: tsToIso(data.createdAt),
            updatedAt: tsToIso(data.updatedAt),
          };
        });
        setCloudStores(list);
      },
      (err) => {
        console.warn('Public stores listener error:', err);
      }
    );

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const list: Product[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            storeId: data.storeId,
            storeName: data.storeName,
            name: data.name,
            category: data.category,
            description: data.description || '',
            price: Number(data.price || 0),
            unitLabel: data.unitLabel || '1 unit',
            imageKey: data.imageKey || 'groceries_staples',
            imageUrl: data.imageUrl,
            available: Boolean(data.available),
            isDemo: Boolean(data.isDemo),
            createdAt: tsToIso(data.createdAt),
            updatedAt: tsToIso(data.updatedAt),
          };
        });
        setCloudProducts(list);
      },
      (err) => {
        console.warn('Products listener error:', err);
      }
    );

    const unsubBundles = onSnapshot(
      query(collection(db, 'bundles'), where('enabled', '==', true)),
      (snap) => {
        const list: Bundle[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            category: data.category,
            description: data.description || '',
            storeId: data.storeId,
            storeName: data.storeName,
            items: data.items || [],
            regularPrice: Number(data.regularPrice || 0),
            bundlePrice: Number(data.bundlePrice || 0),
            enabled: Boolean(data.enabled),
            isDemo: Boolean(data.isDemo),
            createdAt: tsToIso(data.createdAt),
            updatedAt: tsToIso(data.updatedAt),
          };
        });
        setCloudBundles(list);
      },
      (err) => {
        console.warn('Bundles listener error:', err);
      }
    );

    const unsubAreas = onSnapshot(
      query(collection(db, 'serviceAreas'), where('active', '==', true)),
      (snap) => {
        const list: ServiceArea[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            clusterType: data.clusterType,
            description: data.description || '',
            estimatedDeliveryNote: data.estimatedDeliveryNote || '',
            active: Boolean(data.active),
            createdAt: tsToIso(data.createdAt),
            updatedAt: tsToIso(data.updatedAt),
          };
        });
        setCloudServiceAreas(list);
      },
      (err) => {
        console.warn('Service areas listener error:', err);
      }
    );

    const unsubConfig = onSnapshot(
      doc(db, 'platformConfig', 'pilot'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCloudConfig({
            deliveryServiceFee: Number(data.deliveryServiceFee ?? 20),
            variableCostPerTxn: Number(data.variableCostPerTxn ?? 12),
            monthlyFixedCost: Number(data.monthlyFixedCost ?? 3000),
            baseMonthlyCustomers: Number(data.baseMonthlyCustomers ?? 100),
            basePurchasesPerCustomer: Number(data.basePurchasesPerCustomer ?? 4),
            pilotWhatsappNumber: data.pilotWhatsappNumber || '',
            pilotFeeDisclaimer: data.pilotFeeDisclaimer || DEFAULT_PLATFORM_CONFIG.pilotFeeDisclaimer,
            promoBannerText: data.promoBannerText || '',
            promoBannerEnabled: Boolean(data.promoBannerEnabled),
            upiEnabled: Boolean(data.upiEnabled ?? true),
            codEnabled: Boolean(data.codEnabled ?? true),
            updatedAt: tsToIso(data.updatedAt),
          });
        } else {
          setCloudConfig(null);
        }
      },
      (err) => {
        console.warn('Platform config listener error:', err);
      }
    );

    return () => {
      unsubStores();
      unsubProducts();
      unsubBundles();
      unsubAreas();
      unsubConfig();
    };
  }, []);

  // 4. Authenticated customer & retailer listeners
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setCustomerOrders([]);
      setRetailerOrders([]);
      setCustomerFeedback([]);
      setMyRetailerApps([]);
      setMyStoresCloud([]);
      return;
    }

    const uid = firebaseUser.uid;

    const unsubMyStores = onSnapshot(
      query(collection(db, 'stores'), where('ownerUid', '==', uid)),
      (snap) => {
        setMyStoresCloud(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              category: data.category,
              address: data.address,
              serviceAreas: data.serviceAreas || [],
              operatingHours: data.operatingHours,
              deliveryEstimateNote: data.deliveryEstimateNote,
              whatsappOrderNumber: data.whatsappOrderNumber,
              upiId: data.upiId,
              upiEnabled: Boolean(data.upiEnabled),
              codEnabled: Boolean(data.codEnabled),
              pharmacyVerified: Boolean(data.pharmacyVerified),
              status: data.status,
              isDemo: Boolean(data.isDemo),
              ownerUid: data.ownerUid,
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stores')
    );

    const mapOrderDoc = (d: { id: string; data: () => Record<string, any> }): Order => {
      const data = d.data();
      return {
        id: d.id,
        orderRef: data.orderRef,
        customerUid: data.customerUid,
        storeId: data.storeId,
        storeName: data.storeName,
        storeOwnerUid: data.storeOwnerUid,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        hostelOrPg: data.hostelOrPg,
        roomDetails: data.roomDetails,
        landmark: data.landmark,
        deliveryInstructions: data.deliveryInstructions,
        items: data.items || [],
        subtotal: Number(data.subtotal || 0),
        deliveryFee: Number(data.deliveryFee || 0),
        totalAmount: Number(data.totalAmount || 0),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        status: data.status,
        whatsappMessage: data.whatsappMessage,
        retailerNote: data.retailerNote,
        createdAt: tsToIso(data.createdAt),
        updatedAt: tsToIso(data.updatedAt),
      };
    };

    const unsubCustOrders = onSnapshot(
      query(collection(db, 'orders'), where('customerUid', '==', uid)),
      (snap) => {
        const list = snap.docs.map(mapOrderDoc).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setCustomerOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubRetOrders = onSnapshot(
      query(collection(db, 'orders'), where('storeOwnerUid', '==', uid)),
      (snap) => {
        const list = snap.docs.map(mapOrderDoc).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setRetailerOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubFeedback = onSnapshot(
      query(collection(db, 'feedback'), where('customerUid', '==', uid)),
      (snap) => {
        setCustomerFeedback(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              customerUid: data.customerUid,
              customerName: data.customerName,
              orderId: data.orderId,
              hostelCluster: data.hostelCluster,
              willingToPayFee: Boolean(data.willingToPayFee),
              rating: Number(data.rating || 5),
              comment: data.comment,
              createdAt: tsToIso(data.createdAt),
            };
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'feedback')
    );

    const unsubApps = onSnapshot(
      query(collection(db, 'retailerApplications'), where('applicantUid', '==', uid)),
      (snap) => {
        setMyRetailerApps(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              applicantUid: data.applicantUid,
              storeName: data.storeName,
              ownerName: data.ownerName,
              phone: data.phone,
              whatsappNumber: data.whatsappNumber,
              address: data.address,
              category: data.category,
              serviceArea: data.serviceArea,
              status: data.status,
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'retailerApplications')
    );

    return () => {
      unsubMyStores();
      unsubCustOrders();
      unsubRetOrders();
      unsubFeedback();
      unsubApps();
    };
  }, [authReady, firebaseUser]);

  // 5. Admin-only listeners
  useEffect(() => {
    if (!authReady || !firebaseUser || !isAdmin) {
      setAllStoresAdmin([]);
      setAllBundlesAdmin([]);
      setAllServiceAreasAdmin([]);
      setAllOrdersAdmin([]);
      setAllFeedbackAdmin([]);
      setAllRetailerApps([]);
      setAllUsersAdmin([]);
      return;
    }

    const unsubAllStores = onSnapshot(
      collection(db, 'stores'),
      (snap) => {
        setAllStoresAdmin(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              category: data.category,
              address: data.address,
              serviceAreas: data.serviceAreas || [],
              operatingHours: data.operatingHours,
              deliveryEstimateNote: data.deliveryEstimateNote,
              whatsappOrderNumber: data.whatsappOrderNumber,
              upiId: data.upiId,
              upiEnabled: Boolean(data.upiEnabled),
              codEnabled: Boolean(data.codEnabled),
              pharmacyVerified: Boolean(data.pharmacyVerified),
              status: data.status,
              isDemo: Boolean(data.isDemo),
              ownerUid: data.ownerUid,
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stores')
    );

    const unsubAllBundles = onSnapshot(
      collection(db, 'bundles'),
      (snap) => {
        setAllBundlesAdmin(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              category: data.category,
              description: data.description || '',
              storeId: data.storeId,
              storeName: data.storeName,
              items: data.items || [],
              regularPrice: Number(data.regularPrice || 0),
              bundlePrice: Number(data.bundlePrice || 0),
              enabled: Boolean(data.enabled),
              isDemo: Boolean(data.isDemo),
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'bundles')
    );

    const unsubAllAreas = onSnapshot(
      collection(db, 'serviceAreas'),
      (snap) => {
        setAllServiceAreasAdmin(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              clusterType: data.clusterType,
              description: data.description || '',
              estimatedDeliveryNote: data.estimatedDeliveryNote || '',
              active: Boolean(data.active),
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'serviceAreas')
    );

    const unsubAllOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        setAllOrdersAdmin(
          snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                orderRef: data.orderRef,
                customerUid: data.customerUid,
                storeId: data.storeId,
                storeName: data.storeName,
                storeOwnerUid: data.storeOwnerUid,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                hostelOrPg: data.hostelOrPg,
                roomDetails: data.roomDetails,
                landmark: data.landmark,
                deliveryInstructions: data.deliveryInstructions,
                items: data.items || [],
                subtotal: Number(data.subtotal || 0),
                deliveryFee: Number(data.deliveryFee || 0),
                totalAmount: Number(data.totalAmount || 0),
                paymentMethod: data.paymentMethod,
                paymentStatus: data.paymentStatus,
                status: data.status,
                whatsappMessage: data.whatsappMessage,
                retailerNote: data.retailerNote,
                createdAt: tsToIso(data.createdAt),
                updatedAt: tsToIso(data.updatedAt),
              };
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubAllFeedback = onSnapshot(
      collection(db, 'feedback'),
      (snap) => {
        setAllFeedbackAdmin(
          snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                customerUid: data.customerUid,
                customerName: data.customerName,
                orderId: data.orderId,
                hostelCluster: data.hostelCluster,
                willingToPayFee: Boolean(data.willingToPayFee),
                rating: Number(data.rating || 5),
                comment: data.comment,
                createdAt: tsToIso(data.createdAt),
              };
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'feedback')
    );

    const unsubAllApps = onSnapshot(
      collection(db, 'retailerApplications'),
      (snap) => {
        setAllRetailerApps(
          snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                applicantUid: data.applicantUid,
                storeName: data.storeName,
                ownerName: data.ownerName,
                phone: data.phone,
                whatsappNumber: data.whatsappNumber,
                address: data.address,
                category: data.category,
                serviceArea: data.serviceArea,
                status: data.status,
                createdAt: tsToIso(data.createdAt),
                updatedAt: tsToIso(data.updatedAt),
              };
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'retailerApplications')
    );

    const unsubAllUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsersAdmin(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              uid: data.uid,
              displayName: data.displayName,
              email: data.email,
              phone: data.phone,
              hostelOrPg: data.hostelOrPg,
              roomDetails: data.roomDetails,
              landmark: data.landmark,
              role: data.role,
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          })
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    return () => {
      unsubAllStores();
      unsubAllBundles();
      unsubAllAreas();
      unsubAllOrders();
      unsubAllFeedback();
      unsubAllApps();
      unsubAllUsers();
    };
  }, [authReady, firebaseUser, isAdmin]);

  // Derived Storefront Data (with transparent fallback to clearly labelled Demo Pilot Catalogue)
  const isUsingDemoFallback = cloudStores.length === 0 && cloudProducts.length === 0;
  const stores = cloudStores.length > 0 ? cloudStores : DEMO_STORES;
  const products = cloudProducts.length > 0 ? cloudProducts : isUsingDemoFallback ? DEMO_PRODUCTS : [];
  const bundles = cloudBundles.length > 0 ? cloudBundles : isUsingDemoFallback ? DEMO_BUNDLES : [];
  const serviceAreas = cloudServiceAreas.length > 0 ? cloudServiceAreas : DEFAULT_SERVICE_AREAS;
  const platformConfig = cloudConfig || DEFAULT_PLATFORM_CONFIG;

  const isRetailer = myStoresCloud.length > 0 || userProfile?.role === 'retailer';

  // Cart calculations
  const cartStore = useMemo<Store | null>(() => {
    if (cart.length === 0) return null;
    const storeId = cart[0].product.storeId;
    return (
      stores.find((s) => s.id === storeId) ||
      allStoresAdmin.find((s) => s.id === storeId) || {
        id: storeId,
        name: cart[0].product.storeName,
        category: 'Multi-Category Essentials',
        address: 'Selaqui, Dehradun',
        serviceAreas: [],
        operatingHours: 'Store Hours',
        upiEnabled: platformConfig.upiEnabled,
        codEnabled: platformConfig.codEnabled,
        pharmacyVerified: false,
        status: 'active',
        isDemo: cart[0].product.isDemo,
        ownerUid: 'demo_owner_placeholder',
        createdAt: '',
        updatedAt: '',
      }
    );
  }, [cart, stores, allStoresAdmin, platformConfig]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => (cart.length > 0 ? cartSubtotal + platformConfig.deliveryServiceFee : 0),
    [cart.length, cartSubtotal, platformConfig.deliveryServiceFee]
  );

  const addItemsWithSingleStoreCheck = (incomingItems: CartItem[]) => {
    if (incomingItems.length === 0) return;
    const targetStoreId = incomingItems[0].product.storeId;
    const targetStoreName = incomingItems[0].product.storeName;

    if (cart.length > 0 && cart[0].product.storeId !== targetStoreId) {
      setStoreConflict({
        existingStoreName: cart[0].product.storeName,
        newStoreName: targetStoreName,
        pendingItems: incomingItems,
      });
      return;
    }

    setCart((prev) => {
      const next = [...prev];
      for (const inc of incomingItems) {
        const idx = next.findIndex((i) => i.product.id === inc.product.id);
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + inc.quantity };
        } else {
          next.push(inc);
        }
      }
      return next;
    });
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (!product.available || quantity <= 0) return;
    addItemsWithSingleStoreCheck([{ product, quantity }]);
  };

  const addBundleToCart = (bundle: Bundle) => {
    const resolved: CartItem[] = [];
    for (const bi of bundle.items) {
      const prod = products.find((p) => p.id === bi.productId);
      if (prod && prod.available) {
        resolved.push({ product: prod, quantity: bi.quantity });
      }
    }
    if (resolved.length > 0) {
      addItemsWithSingleStoreCheck(resolved);
    }
  };

  const resolveStoreConflict = (replaceCart: boolean) => {
    if (replaceCart && storeConflict) {
      setCart(storeConflict.pendingItems);
      setCartDrawerOpen(true);
    }
    setStoreConflict(null);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Auth Actions
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setAuthError(message);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  // User Profile Action
  const saveUserProfile = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser) throw new Error('Please sign in first.');
    const userRef = doc(db, 'users', firebaseUser.uid);
    const sanitized = {
      displayName: (updates.displayName || userProfile?.displayName || 'Student').trim().slice(0, 100),
      phone: (updates.phone || '').trim().slice(0, 20),
      hostelOrPg: (updates.hostelOrPg || '').trim().slice(0, 120),
      roomDetails: (updates.roomDetails || '').trim().slice(0, 80),
      landmark: (updates.landmark || '').trim().slice(0, 120),
      updatedAt: serverTimestamp(),
    };
    try {
      await updateDoc(userRef, sanitized);
      setUserProfile((prev) =>
        prev ? { ...prev, ...sanitized, updatedAt: new Date().toISOString() } : prev
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  // Order Submission
  const submitOrder = async (input: {
    customerName: string;
    customerPhone: string;
    hostelOrPg: string;
    roomDetails: string;
    landmark?: string;
    deliveryInstructions?: string;
    paymentMethod: PaymentMethod;
  }): Promise<{ order: Order; persistedToCloud: boolean }> => {
    if (cart.length === 0 || !cartStore) {
      throw new Error('Your cart is empty.');
    }

    const orderRef = generateOrderRef();
    const items: OrderLineItem[] = cart.slice(0, 30).map((ci) => ({
      productId: ci.product.id,
      productName: ci.product.name.slice(0, 120),
      quantity: ci.quantity,
      unitPrice: ci.product.price,
      lineTotal: ci.product.price * ci.quantity,
    }));

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const deliveryFee = platformConfig.deliveryServiceFee;
    const totalAmount = subtotal + deliveryFee;

    const whatsappMessage = buildWhatsappOrderMessage({
      orderRef,
      storeName: cartStore.name,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      hostelOrPg: input.hostelOrPg,
      roomDetails: input.roomDetails,
      landmark: input.landmark,
      deliveryInstructions: input.deliveryInstructions,
      paymentMethod: input.paymentMethod,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
    }).slice(0, 2000);

    const paymentStatus: PaymentStatus =
      input.paymentMethod === 'UPI' ? 'Unverified' : 'Not Required Yet';

    const orderId = makeDocId('ord');
    const nowIso = new Date().toISOString();

    const cloudStoreExists = cloudStores.some((s) => s.id === cartStore.id);

    if (firebaseUser && cloudStoreExists) {
      const payload: Record<string, unknown> = {
        orderRef,
        customerUid: firebaseUser.uid,
        storeId: cartStore.id,
        storeName: cartStore.name.slice(0, 100),
        storeOwnerUid: cartStore.ownerUid,
        customerName: input.customerName.trim().slice(0, 100),
        customerPhone: input.customerPhone.trim().slice(0, 20),
        hostelOrPg: input.hostelOrPg.trim().slice(0, 120),
        roomDetails: input.roomDetails.trim().slice(0, 80),
        items,
        subtotal,
        deliveryFee,
        totalAmount,
        paymentMethod: input.paymentMethod,
        paymentStatus,
        status: 'Pending Retailer Confirmation',
        whatsappMessage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (input.landmark?.trim()) payload.landmark = input.landmark.trim().slice(0, 120);
      if (input.deliveryInstructions?.trim()) {
        payload.deliveryInstructions = input.deliveryInstructions.trim().slice(0, 240);
      }

      try {
        await setDoc(doc(db, 'orders', orderId), payload);
        const createdOrder: Order = {
          id: orderId,
          orderRef,
          customerUid: firebaseUser.uid,
          storeId: cartStore.id,
          storeName: cartStore.name,
          storeOwnerUid: cartStore.ownerUid,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.trim(),
          hostelOrPg: input.hostelOrPg.trim(),
          roomDetails: input.roomDetails.trim(),
          landmark: input.landmark?.trim(),
          deliveryInstructions: input.deliveryInstructions?.trim(),
          items,
          subtotal,
          deliveryFee,
          totalAmount,
          paymentMethod: input.paymentMethod,
          paymentStatus,
          status: 'Pending Retailer Confirmation',
          whatsappMessage,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        return { order: createdOrder, persistedToCloud: true };
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }
    }

    // Local demonstration fallback when unauthenticated or ordering from unseeded demo store
    const localOrder: Order = {
      id: orderId,
      orderRef,
      customerUid: firebaseUser?.uid || 'local_guest',
      storeId: cartStore.id,
      storeName: cartStore.name,
      storeOwnerUid: cartStore.ownerUid,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      hostelOrPg: input.hostelOrPg.trim(),
      roomDetails: input.roomDetails.trim(),
      landmark: input.landmark?.trim(),
      deliveryInstructions: input.deliveryInstructions?.trim(),
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      status: 'Pending Retailer Confirmation',
      whatsappMessage,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setLocalOrders((prev) => [localOrder, ...prev]);
    return { order: localOrder, persistedToCloud: false };
  };

  const cancelCustomerOrder = async (orderId: string) => {
    const isLocal = localOrders.some((o) => o.id === orderId);
    if (isLocal) {
      setLocalOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'Cancelled', updatedAt: new Date().toISOString() } : o
        )
      );
      return;
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const submitFeedback = async (input: {
    hostelCluster: string;
    willingToPayFee: boolean;
    rating: number;
    comment: string;
    orderId?: string;
  }) => {
    if (!firebaseUser) throw new Error('Sign in with Google to submit pilot feedback.');
    const fbId = makeDocId('fb');
    const payload: Record<string, unknown> = {
      customerUid: firebaseUser.uid,
      customerName: (userProfile?.displayName || firebaseUser.displayName || 'Student').slice(0, 100),
      hostelCluster: input.hostelCluster.trim().slice(0, 100),
      willingToPayFee: input.willingToPayFee,
      rating: Math.max(1, Math.min(5, input.rating)),
      comment: input.comment.trim().slice(0, 500),
      createdAt: serverTimestamp(),
    };
    if (input.orderId) payload.orderId = input.orderId.slice(0, 128);
    try {
      await setDoc(doc(db, 'feedback', fbId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `feedback/${fbId}`);
    }
  };

  const submitRetailerApplication = async (input: {
    storeName: string;
    ownerName: string;
    phone: string;
    whatsappNumber?: string;
    address: string;
    category: string;
    serviceArea: string;
  }) => {
    if (!firebaseUser) throw new Error('Sign in with Google to submit a retailer partnership application.');
    const appId = makeDocId('app');
    const payload: Record<string, unknown> = {
      applicantUid: firebaseUser.uid,
      storeName: input.storeName.trim().slice(0, 100),
      ownerName: input.ownerName.trim().slice(0, 100),
      phone: input.phone.trim().slice(0, 20),
      address: input.address.trim().slice(0, 200),
      category: input.category.trim().slice(0, 60),
      serviceArea: input.serviceArea.trim().slice(0, 100),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.whatsappNumber?.trim()) {
      payload.whatsappNumber = input.whatsappNumber.trim().slice(0, 20);
    }
    try {
      await setDoc(doc(db, 'retailerApplications', appId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `retailerApplications/${appId}`);
    }
  };

  // Retailer Actions
  const updateStoreSettings = async (
    storeId: string,
    updates: Partial<Pick<Store, 'operatingHours' | 'deliveryEstimateNote' | 'whatsappOrderNumber' | 'upiId' | 'upiEnabled' | 'codEnabled'>>
  ) => {
    const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.operatingHours !== undefined) clean.operatingHours = updates.operatingHours.trim().slice(0, 80);
    if (updates.deliveryEstimateNote !== undefined) clean.deliveryEstimateNote = updates.deliveryEstimateNote.trim().slice(0, 140);
    if (updates.whatsappOrderNumber !== undefined) clean.whatsappOrderNumber = updates.whatsappOrderNumber.trim().slice(0, 20);
    if (updates.upiId !== undefined) clean.upiId = updates.upiId.trim().slice(0, 100);
    if (updates.upiEnabled !== undefined) clean.upiEnabled = updates.upiEnabled;
    if (updates.codEnabled !== undefined) clean.codEnabled = updates.codEnabled;
    try {
      await updateDoc(doc(db, 'stores', storeId), clean);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `stores/${storeId}`);
    }
  };

  const saveStorePrivateContact = async (
    storeId: string,
    contact: Omit<StorePrivateContact, 'updatedAt'>
  ) => {
    const payload: Record<string, unknown> = {
      ownerName: contact.ownerName.trim().slice(0, 100),
      registeredPhone: contact.registeredPhone.trim().slice(0, 20),
      updatedAt: serverTimestamp(),
    };
    if (contact.ownerEmail?.trim()) payload.ownerEmail = contact.ownerEmail.trim().slice(0, 150);
    if (contact.notes?.trim()) payload.notes = contact.notes.trim().slice(0, 300);
    try {
      await setDoc(doc(db, 'stores', storeId, 'private', 'contact'), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `stores/${storeId}/private/contact`);
    }
  };

  const getStorePrivateContact = async (storeId: string): Promise<StorePrivateContact | null> => {
    try {
      const snap = await getDoc(doc(db, 'stores', storeId, 'private', 'contact'));
      if (!snap.exists()) return null;
      const d = snap.data();
      return {
        ownerName: d.ownerName,
        registeredPhone: d.registeredPhone,
        ownerEmail: d.ownerEmail,
        notes: d.notes,
        updatedAt: tsToIso(d.updatedAt),
      };
    } catch {
      return null;
    }
  };

  const saveProduct = async (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const prodId = product.id || makeDocId('prod');
    const isEdit = Boolean(product.id);
    const payload: Record<string, unknown> = {
      storeId: product.storeId,
      storeName: product.storeName.slice(0, 100),
      name: product.name.trim().slice(0, 120),
      category: product.category,
      description: product.description.trim().slice(0, 400),
      price: Number(product.price),
      unitLabel: product.unitLabel.trim().slice(0, 40),
      imageKey: product.imageKey.slice(0, 60),
      available: Boolean(product.available),
      isDemo: isAdmin ? Boolean(product.isDemo) : false,
      updatedAt: serverTimestamp(),
    };
    if (product.imageUrl?.trim()) {
      payload.imageUrl = product.imageUrl.trim().slice(0, 500);
    }
    try {
      if (isEdit) {
        if (isAdmin) {
          await updateDoc(doc(db, 'products', prodId), payload);
        } else {
          // Retailer only sends allowed update keys
          const retailerPayload: Record<string, unknown> = {
            name: payload.name,
            category: payload.category,
            description: payload.description,
            price: payload.price,
            unitLabel: payload.unitLabel,
            imageKey: payload.imageKey,
            available: payload.available,
            updatedAt: serverTimestamp(),
          };
          if (payload.imageUrl) retailerPayload.imageUrl = payload.imageUrl;
          await updateDoc(doc(db, 'products', prodId), retailerPayload);
        }
      } else {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(db, 'products', prodId), payload);
      }
    } catch (err) {
      handleFirestoreError(err, isEdit ? OperationType.UPDATE : OperationType.CREATE, `products/${prodId}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const toggleProductAvailability = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        available: !product.available,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const updateOrderByRetailerOrAdmin = async (
    orderId: string,
    updates: { status?: OrderStatus; paymentStatus?: PaymentStatus; retailerNote?: string }
  ) => {
    const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.status) clean.status = updates.status;
    if (updates.paymentStatus) clean.paymentStatus = updates.paymentStatus;
    if (updates.retailerNote !== undefined) clean.retailerNote = updates.retailerNote.trim().slice(0, 240);
    try {
      await updateDoc(doc(db, 'orders', orderId), clean);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Admin Actions
  const seedDemoDataToFirestore = async () => {
    if (!isAdmin || !firebaseUser) throw new Error('Admin authorization required.');
    const batch = writeBatch(db);

    batch.set(doc(db, 'platformConfig', 'pilot'), {
      ...DEFAULT_PLATFORM_CONFIG,
      updatedAt: serverTimestamp(),
    });

    for (const area of DEFAULT_SERVICE_AREAS) {
      batch.set(doc(db, 'serviceAreas', area.id), {
        name: area.name,
        clusterType: area.clusterType,
        description: area.description,
        estimatedDeliveryNote: area.estimatedDeliveryNote,
        active: area.active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const store of DEMO_STORES) {
      batch.set(doc(db, 'stores', store.id), {
        name: store.name,
        category: store.category,
        address: store.address,
        serviceAreas: store.serviceAreas,
        operatingHours: store.operatingHours,
        deliveryEstimateNote: store.deliveryEstimateNote || '',
        whatsappOrderNumber: store.whatsappOrderNumber || '',
        upiId: store.upiId || '',
        upiEnabled: store.upiEnabled,
        codEnabled: store.codEnabled,
        pharmacyVerified: store.pharmacyVerified,
        status: store.status,
        isDemo: true,
        ownerUid: firebaseUser.uid, // Assigned to admin initially so admin can demonstrate retailer acceptance!
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const prod of DEMO_PRODUCTS) {
      batch.set(doc(db, 'products', prod.id), {
        storeId: prod.storeId,
        storeName: prod.storeName,
        name: prod.name,
        category: prod.category,
        description: prod.description,
        price: prod.price,
        unitLabel: prod.unitLabel,
        imageKey: prod.imageKey,
        available: prod.available,
        isDemo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const bundle of DEMO_BUNDLES) {
      batch.set(doc(db, 'bundles', bundle.id), {
        name: bundle.name,
        category: bundle.category,
        description: bundle.description,
        storeId: bundle.storeId,
        storeName: bundle.storeName,
        items: bundle.items,
        regularPrice: bundle.regularPrice,
        bundlePrice: bundle.bundlePrice,
        enabled: bundle.enabled,
        isDemo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seed_demo_batch');
    }
  };

  const clearDemoDataFromFirestore = async () => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const batch = writeBatch(db);
    allStoresAdmin.filter((s) => s.isDemo).forEach((s) => batch.delete(doc(db, 'stores', s.id)));
    products.filter((p) => p.isDemo).forEach((p) => batch.delete(doc(db, 'products', p.id)));
    allBundlesAdmin.filter((b) => b.isDemo).forEach((b) => batch.delete(doc(db, 'bundles', b.id)));
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'clear_demo_batch');
    }
  };

  const savePlatformConfig = async (config: Omit<PlatformConfig, 'updatedAt'>) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await setDoc(doc(db, 'platformConfig', 'pilot'), {
        deliveryServiceFee: Number(config.deliveryServiceFee),
        variableCostPerTxn: Number(config.variableCostPerTxn),
        monthlyFixedCost: Number(config.monthlyFixedCost),
        baseMonthlyCustomers: Number(config.baseMonthlyCustomers),
        basePurchasesPerCustomer: Number(config.basePurchasesPerCustomer),
        pilotWhatsappNumber: config.pilotWhatsappNumber.trim().slice(0, 20),
        pilotFeeDisclaimer: config.pilotFeeDisclaimer.trim().slice(0, 240),
        promoBannerText: (config.promoBannerText || '').trim().slice(0, 160),
        promoBannerEnabled: Boolean(config.promoBannerEnabled),
        upiEnabled: Boolean(config.upiEnabled),
        codEnabled: Boolean(config.codEnabled),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'platformConfig/pilot');
    }
  };

  const saveStoreAdmin = async (
    store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<string> => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const storeId = store.id || makeDocId('store');
    const isEdit = Boolean(store.id);
    const payload: Record<string, unknown> = {
      name: store.name.trim().slice(0, 100),
      category: store.category,
      address: store.address.trim().slice(0, 200),
      serviceAreas: store.serviceAreas.slice(0, 10),
      operatingHours: store.operatingHours.trim().slice(0, 80),
      deliveryEstimateNote: (store.deliveryEstimateNote || '').trim().slice(0, 140),
      whatsappOrderNumber: (store.whatsappOrderNumber || '').trim().slice(0, 20),
      upiId: (store.upiId || '').trim().slice(0, 100),
      upiEnabled: Boolean(store.upiEnabled),
      codEnabled: Boolean(store.codEnabled),
      pharmacyVerified: Boolean(store.pharmacyVerified),
      status: store.status,
      isDemo: Boolean(store.isDemo),
      ownerUid: store.ownerUid.trim().slice(0, 128),
      updatedAt: serverTimestamp(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'stores', storeId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(db, 'stores', storeId), payload);
      }
      return storeId;
    } catch (err) {
      handleFirestoreError(err, isEdit ? OperationType.UPDATE : OperationType.CREATE, `stores/${storeId}`);
    }
  };

  const deleteStoreAdmin = async (storeId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'stores', storeId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `stores/${storeId}`);
    }
  };

  const approveRetailerApplication = async (app: RetailerApplication) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const storeId = makeDocId('store');
    const batch = writeBatch(db);
    batch.update(doc(db, 'retailerApplications', app.id), {
      status: 'approved',
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'stores', storeId), {
      name: app.storeName.slice(0, 100),
      category: 'Multi-Category Essentials',
      address: app.address.slice(0, 200),
      serviceAreas: [app.serviceArea.slice(0, 100)],
      operatingHours: '9:00 AM – 9:00 PM',
      deliveryEstimateNote: 'Coordinated via WhatsApp on order confirmation.',
      whatsappOrderNumber: (app.whatsappNumber || app.phone).slice(0, 20),
      upiId: '',
      upiEnabled: true,
      codEnabled: true,
      pharmacyVerified: false,
      status: 'active',
      isDemo: false,
      ownerUid: app.applicantUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'stores', storeId, 'private', 'contact'), {
      ownerName: app.ownerName.slice(0, 100),
      registeredPhone: app.phone.slice(0, 20),
      notes: 'Onboarded from Retailer Partnership Application.',
      updatedAt: serverTimestamp(),
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `retailerApplications/${app.id}`);
    }
  };

  const rejectRetailerApplication = async (appId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await updateDoc(doc(db, 'retailerApplications', appId), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `retailerApplications/${appId}`);
    }
  };

  const saveServiceArea = async (
    area: Omit<ServiceArea, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const areaId = area.id || makeDocId('area');
    const isEdit = Boolean(area.id);
    const payload: Record<string, unknown> = {
      name: area.name.trim().slice(0, 100),
      clusterType: area.clusterType,
      description: area.description.trim().slice(0, 240),
      estimatedDeliveryNote: area.estimatedDeliveryNote.trim().slice(0, 120),
      active: Boolean(area.active),
      updatedAt: serverTimestamp(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'serviceAreas', areaId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(db, 'serviceAreas', areaId), payload);
      }
    } catch (err) {
      handleFirestoreError(err, isEdit ? OperationType.UPDATE : OperationType.CREATE, `serviceAreas/${areaId}`);
    }
  };

  const deleteServiceArea = async (areaId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'serviceAreas', areaId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `serviceAreas/${areaId}`);
    }
  };

  const saveBundle = async (
    bundle: Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const bundleId = bundle.id || makeDocId('bundle');
    const isEdit = Boolean(bundle.id);
    const payload: Record<string, unknown> = {
      name: bundle.name.trim().slice(0, 100),
      category: bundle.category,
      description: bundle.description.trim().slice(0, 300),
      storeId: bundle.storeId,
      storeName: bundle.storeName.slice(0, 100),
      items: bundle.items.slice(0, 15),
      regularPrice: Number(bundle.regularPrice),
      bundlePrice: Number(bundle.bundlePrice),
      enabled: Boolean(bundle.enabled),
      isDemo: Boolean(bundle.isDemo),
      updatedAt: serverTimestamp(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'bundles', bundleId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(db, 'bundles', bundleId), payload);
      }
    } catch (err) {
      handleFirestoreError(err, isEdit ? OperationType.UPDATE : OperationType.CREATE, `bundles/${bundleId}`);
    }
  };

  const deleteBundle = async (bundleId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'bundles', bundleId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bundles/${bundleId}`);
    }
  };

  const updateUserRoleAdmin = async (uid: string, role: UserRole) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const combinedCustomerOrders = useMemo(() => {
    const cloudIds = new Set(customerOrders.map((o) => o.id));
    const filteredLocal = localOrders.filter((o) => !cloudIds.has(o.id));
    return [...customerOrders, ...filteredLocal].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }, [customerOrders, localOrders]);

  const value: CampusCartContextValue = {
    activeView,
    setActiveView,
    cartDrawerOpen,
    setCartDrawerOpen,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    authReady,
    firebaseUser,
    userProfile,
    isAdmin,
    isRetailer,
    connectionStatus,
    isUsingDemoFallback,
    signInWithGoogle,
    signOutUser,
    authError,
    stores,
    allStoresForAdmin: allStoresAdmin,
    myStores: myStoresCloud,
    products,
    bundles,
    allBundlesForAdmin: allBundlesAdmin,
    serviceAreas,
    allServiceAreasForAdmin: allServiceAreasAdmin,
    platformConfig,
    customerOrders: combinedCustomerOrders,
    retailerOrders,
    allOrdersForAdmin: allOrdersAdmin,
    customerFeedback,
    allFeedbackForAdmin: allFeedbackAdmin,
    myRetailerApplications: myRetailerApps,
    allRetailerApplications: allRetailerApps,
    allUsersForAdmin: allUsersAdmin,
    cart,
    cartStore,
    cartSubtotal,
    cartTotal,
    storeConflict,
    resolveStoreConflict,
    addToCart,
    addBundleToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    saveUserProfile,
    submitOrder,
    cancelCustomerOrder,
    submitFeedback,
    submitRetailerApplication,
    updateStoreSettings,
    saveStorePrivateContact,
    getStorePrivateContact,
    saveProduct,
    deleteProduct,
    toggleProductAvailability,
    updateOrderByRetailerOrAdmin,
    seedDemoDataToFirestore,
    clearDemoDataFromFirestore,
    savePlatformConfig,
    saveStoreAdmin,
    deleteStoreAdmin,
    approveRetailerApplication,
    rejectRetailerApplication,
    saveServiceArea,
    deleteServiceArea,
    saveBundle,
    deleteBundle,
    updateUserRoleAdmin,
  };

  return <CampusCartContext.Provider value={value}>{children}</CampusCartContext.Provider>;
};

export function useCampusCart(): CampusCartContextValue {
  const ctx = useContext(CampusCartContext);
  if (!ctx) throw new Error('useCampusCart must be used within CampusCartProvider');
  return ctx;
}

import React from 'react';
import { WifiOff } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { BundlesView } from './components/BundlesView';
import { CartDrawer } from './components/CartDrawer';
import { CatalogView } from './components/CatalogView';
import { CheckoutView } from './components/CheckoutView';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { RetailerDashboard } from './components/RetailerDashboard';
import { StoreConflictModal } from './components/StoreConflictModal';
import { CampusCartProvider, useCampusCart } from './context/CampusCartContext';

const MainShell: React.FC = () => {
  const { activeView, connectionStatus, authError } = useCampusCart();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-900">
      <Header />

      {connectionStatus.checked && connectionStatus.offline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>
            Cloud Firestore appears offline. Viewing local demonstration mode until connectivity resumes.
          </span>
        </div>
      )}

      {authError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-800 text-center">
          Authentication Notice: {authError}
        </div>
      )}

      <main className="flex-1">
        {activeView === 'home' && <LandingPage />}
        {activeView === 'catalog' && <CatalogView />}
        {activeView === 'bundles' && <BundlesView />}
        {activeView === 'checkout' && <CheckoutView />}
        {activeView === 'orders' && <CustomerOrdersView />}
        {activeView === 'retailer' && <RetailerDashboard />}
        {activeView === 'admin' && <AdminDashboard />}
      </main>

      <CartDrawer />
      <StoreConflictModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <CampusCartProvider>
        <MainShell />
      </CampusCartProvider>
    </ErrorBoundary>
  );
}

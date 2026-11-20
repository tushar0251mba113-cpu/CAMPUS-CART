import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  LogIn,
  MessageCircle,
  ShieldAlert,
  Store as StoreIcon,
} from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';
import { Order, PaymentMethod } from '../types';
import {
  buildWhatsappOrderMessage,
  buildWhatsappUrl,
  formatINR,
  sanitizeWhatsappNumber,
} from '../utils/whatsapp';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartStore,
    cartSubtotal,
    cartTotal,
    platformConfig,
    serviceAreas,
    firebaseUser,
    userProfile,
    signInWithGoogle,
    submitOrder,
    clearCart,
    setActiveView,
  } = useCampusCart();

  const [customerName, setCustomerName] = useState(userProfile?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [hostelOrPg, setHostelOrPg] = useState(
    userProfile?.hostelOrPg || serviceAreas[0]?.name || ''
  );
  const [roomDetails, setRoomDetails] = useState(userProfile?.roomDetails || '');
  const [landmark, setLandmark] = useState(userProfile?.landmark || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    order: Order;
    persistedToCloud: boolean;
    whatsappUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userProfile) {
      if (!customerName) setCustomerName(userProfile.displayName || '');
      if (!customerPhone && userProfile.phone) setCustomerPhone(userProfile.phone);
      if (!hostelOrPg && userProfile.hostelOrPg) setHostelOrPg(userProfile.hostelOrPg);
      if (!roomDetails && userProfile.roomDetails) setRoomDetails(userProfile.roomDetails);
      if (!landmark && userProfile.landmark) setLandmark(userProfile.landmark);
    }
  }, [userProfile]);

  const effectiveWhatsappNumber = useMemo(() => {
    const storeDigits = sanitizeWhatsappNumber(cartStore?.whatsappOrderNumber);
    if (storeDigits) return storeDigits;
    return sanitizeWhatsappNumber(platformConfig.pilotWhatsappNumber);
  }, [cartStore?.whatsappOrderNumber, platformConfig.pilotWhatsappNumber]);

  const upiAllowed =
    platformConfig.upiEnabled && (cartStore ? cartStore.upiEnabled : true);
  const codAllowed =
    platformConfig.codEnabled && (cartStore ? cartStore.codEnabled : true);

  const previewMessage = useMemo(() => {
    if (cart.length === 0 || !cartStore) return '';
    return buildWhatsappOrderMessage({
      storeName: cartStore.name,
      customerName: customerName || '[Customer Name]',
      customerPhone: customerPhone || '[Mobile Number]',
      hostelOrPg: hostelOrPg || '[Hostel / PG Name]',
      roomDetails: roomDetails || '[Room / Gate Details]',
      landmark,
      deliveryInstructions,
      paymentMethod,
      items: cart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        quantity: c.quantity,
        unitPrice: c.product.price,
        lineTotal: c.product.price * c.quantity,
      })),
      subtotal: cartSubtotal,
      deliveryFee: platformConfig.deliveryServiceFee,
      totalAmount: cartTotal,
    });
  }, [
    cart,
    cartStore,
    customerName,
    customerPhone,
    hostelOrPg,
    roomDetails,
    landmark,
    deliveryInstructions,
    paymentMethod,
    cartSubtotal,
    platformConfig.deliveryServiceFee,
    cartTotal,
  ]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number for delivery coordination.');
      return;
    }
    if (!hostelOrPg.trim()) {
      setFormError('Please enter or select your Hostel or PG name in Selaqui.');
      return;
    }
    if (!roomDetails.trim()) {
      setFormError('Please enter your room number, block, or gate delivery details.');
      return;
    }

    setSubmitting(true);
    try {
      const { order, persistedToCloud } = await submitOrder({
        customerName,
        customerPhone,
        hostelOrPg,
        roomDetails,
        landmark,
        deliveryInstructions,
        paymentMethod,
      });

      const waUrl = effectiveWhatsappNumber
        ? buildWhatsappUrl(effectiveWhatsappNumber, order.whatsappMessage)
        : '';

      clearCart();
      setSubmittedResult({ order, persistedToCloud, whatsappUrl: waUrl });

      if (waUrl) {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save order request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    const { order, persistedToCloud, whatsappUrl } = submittedResult;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono-tabular font-semibold text-zinc-500">
                Order Reference: {order.orderRef}
              </p>
              <h1 className="font-display text-2xl font-bold text-zinc-950 mt-0.5">
                Order Request Created — Pending Retailer Confirmation
              </h1>
              <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">
                {persistedToCloud
                  ? 'Your order request is saved in Cloud Firestore. '
                  : 'Your order request is saved in local demonstration mode. '}
                Clicking &ldquo;Continue to WhatsApp&rdquo; does not automatically confirm stock or delivery—please send the WhatsApp message and wait for <span className="font-semibold text-zinc-900">{order.storeName}</span> to confirm.
              </p>
            </div>
          </div>

          {!whatsappUrl ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold">Administrator Setup Notice: WhatsApp Number Not Configured</p>
                <p className="mt-1">
                  No retailer or pilot WhatsApp Business number has been configured yet in the Admin Dashboard. Use the Copy Order Message button below to share this order manually.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-emerald-900">
                <p className="font-semibold">WhatsApp Click-to-Chat Ready</p>
                <p className="mt-0.5">
                  If WhatsApp did not open automatically, click the button to launch your pre-filled order message.
                </p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-zinc-700">Pre-Filled Order Message</p>
              <button
                type="button"
                onClick={() => handleCopy(order.whatsappMessage)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-900 hover:text-violet-700 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Order Details'}</span>
              </button>
            </div>
            <pre className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-xs font-mono-tabular text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {order.whatsappMessage}
            </pre>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveView('orders')}
              className="px-4 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Track Order Status
            </button>
            <button
              type="button"
              onClick={() => setActiveView('catalog')}
              className="px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Return to Catalogue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-zinc-200 rounded-xl p-10">
          <h1 className="font-display text-xl font-bold text-zinc-950">Your Cart Is Empty</h1>
          <p className="text-sm text-zinc-600 mt-2 mb-6">
            Select groceries, snacks, stationery, or student bundles before proceeding to WhatsApp checkout.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className="px-5 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            Browse Catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <button
        type="button"
        onClick={() => setActiveView('catalog')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 mb-5 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalogue</span>
      </button>

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 mb-2">
        Hostel &amp; PG Delivery Checkout
      </h1>
      <p className="text-sm text-zinc-600 mb-6">
        Enter only the details needed by <span className="font-semibold text-zinc-900">{cartStore?.name}</span> to confirm availability and deliver to your doorstep.
      </p>

      {!firebaseUser && (
        <div className="mb-6 bg-violet-50 border border-violet-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-violet-950">
            <p className="font-semibold">Sign in with Google to persist your order to Cloud Firestore</p>
            <p className="text-violet-800 mt-0.5">
              Signed-in orders appear in your Order History and the Retailer Partner dashboard in real time. Unauthenticated checkouts run in local draft mode.
            </p>
          </div>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In with Google</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Delivery Details & Payment Method */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold text-zinc-900 pb-3 border-b border-zinc-200">
            1. Student Delivery Details (DGU / Selaqui)
          </h2>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Customer Name *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Aarav Sharma"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Mobile / WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                maxLength={20}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Hostel or PG Name (Selaqui Service Area) *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {serviceAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setHostelOrPg(area.name)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                    hostelOrPg === area.name
                      ? 'bg-violet-900 text-white border-violet-900'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {area.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              maxLength={120}
              value={hostelOrPg}
              onChange={(e) => setHostelOrPg(e.target.value)}
              placeholder="Or type specific PG / Hostel name in Selaqui"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Room Number / Gate Details *
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={roomDetails}
                onChange={(e) => setRoomDetails(e.target.value)}
                placeholder="e.g., Block B, Room 204"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Nearby Landmark (Optional)
              </label>
              <input
                type="text"
                maxLength={120}
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g., Near Pharma Chowk / DGU Gate 2"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Optional Delivery Instructions
            </label>
            <textarea
              rows={2}
              maxLength={240}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g., Call on arrival after 5:30 PM class"
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-800"
            />
          </div>

          {/* Payment Preference */}
          <div className="pt-4 border-t border-zinc-200 space-y-3">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              2. Payment Preference (Manually Coordinated)
            </h2>
            <p className="text-xs text-zinc-500">
              CampusCart does not process online card/UPI gateways in Version 1 and never asks for your UPI PIN or OTP. Payment is settled directly upon retailer confirmation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {codAllowed && (
                <label
                  className={`p-3.5 rounded-lg border cursor-pointer flex items-start gap-2.5 ${
                    paymentMethod === 'COD'
                      ? 'border-violet-900 bg-violet-50/50'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-0.5 accent-violet-900"
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Cash on Delivery (COD)</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Pay cash at hostel/PG doorstep</p>
                  </div>
                </label>
              )}

              {upiAllowed && (
                <label
                  className={`p-3.5 rounded-lg border cursor-pointer flex items-start gap-2.5 ${
                    paymentMethod === 'UPI'
                      ? 'border-violet-900 bg-violet-50/50'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="mt-0.5 accent-violet-900"
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">UPI (Manually Coordinated)</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Pay via UPI once store confirms stock</p>
                  </div>
                </label>
              )}
            </div>

            {paymentMethod === 'UPI' && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 text-xs text-zinc-700">
                {cartStore?.upiId ? (
                  <p>
                    <span className="font-semibold text-zinc-900">Verified Retailer UPI ID:</span>{' '}
                    <span className="font-mono-tabular">{cartStore.upiId}</span> — Wait for retailer confirmation on WhatsApp before transferring.
                  </p>
                ) : (
                  <p>
                    Retailer UPI payment address is not configured in the directory yet; the store will share their UPI QR/ID on WhatsApp after confirming availability.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary & WhatsApp Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
              <StoreIcon className="w-4 h-4 text-violet-900" />
              <h2 className="font-display text-base font-semibold text-zinc-900">
                Order Summary · {cartStore?.name}
              </h2>
            </div>

            <ul className="space-y-2.5 text-sm">
              {cart.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-start justify-between gap-3">
                  <span className="text-zinc-700">
                    {product.name} × {quantity}
                  </span>
                  <span className="font-mono-tabular font-medium text-zinc-900 shrink-0">
                    {formatINR(product.price * quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-zinc-200 space-y-2 text-sm">
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
              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-base font-bold text-zinc-950">
                <span>Total Payable</span>
                <span className="font-mono-tabular text-violet-950">{formatINR(cartTotal)}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              {platformConfig.pilotFeeDisclaimer}
            </p>

            {!effectiveWhatsappNumber && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <p className="font-semibold">WhatsApp Setup Pending</p>
                <p className="mt-0.5">
                  No WhatsApp order number is configured for this store or pilot yet. Submitting will save your order request and let you copy the message manually.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{submitting ? 'Saving Order Request...' : 'Continue to WhatsApp'}</span>
            </button>
            <p className="text-[11px] text-zinc-500 text-center">
              Your order remains &ldquo;Pending Retailer Confirmation&rdquo; until the store confirms.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-zinc-700">Live WhatsApp Message Preview</p>
              <button
                type="button"
                onClick={() => handleCopy(previewMessage)}
                className="text-xs font-medium text-violet-900 hover:text-violet-700 inline-flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-[11px] font-mono-tabular text-zinc-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {previewMessage}
            </pre>
          </div>
        </div>
      </form>
    </div>
  );
};

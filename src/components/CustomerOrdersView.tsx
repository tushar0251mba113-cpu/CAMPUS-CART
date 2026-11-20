import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  LogIn,
  LogOut,
  MessageCircle,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { useCampusCart } from '../context/CampusCartContext';
import { OrderStatus } from '../types';
import { buildWhatsappUrl, formatINR, sanitizeWhatsappNumber } from '../utils/whatsapp';

function statusTone(status: OrderStatus): string {
  switch (status) {
    case 'Completed':
    case 'Confirmed':
    case 'Accepted':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Out for Delivery':
      return 'bg-violet-50 text-violet-900 border-violet-200';
    case 'Rejected':
    case 'Cancelled':
      return 'bg-red-50 text-red-800 border-red-200';
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

export const CustomerOrdersView: React.FC = () => {
  const {
    firebaseUser,
    userProfile,
    signInWithGoogle,
    signOutUser,
    saveUserProfile,
    customerOrders,
    cancelCustomerOrder,
    stores,
    platformConfig,
    serviceAreas,
    submitFeedback,
    customerFeedback,
    setActiveView,
  } = useCampusCart();

  const [tab, setTab] = useState<'orders' | 'profile' | 'feedback'>('orders');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Profile form state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [hostelOrPg, setHostelOrPg] = useState(userProfile?.hostelOrPg || '');
  const [roomDetails, setRoomDetails] = useState(userProfile?.roomDetails || '');
  const [landmark, setLandmark] = useState(userProfile?.landmark || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Pilot feedback form state
  const [fbCluster, setFbCluster] = useState(serviceAreas[0]?.name || 'DGU On-Campus Hostels');
  const [fbWilling, setFbWilling] = useState(true);
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSuccess, setFbSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setHostelOrPg(userProfile.hostelOrPg || '');
      setRoomDetails(userProfile.roomDetails || '');
      setLandmark(userProfile.landmark || '');
    }
  }, [userProfile]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOrderId(id);
      setTimeout(() => setCopiedOrderId(null), 1600);
    } catch {
      // ignore
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUserProfile({ displayName, phone, hostelOrPg, roomDetails, landmark });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbComment.trim()) return;
    setFbSubmitting(true);
    try {
      await submitFeedback({
        hostelCluster: fbCluster,
        willingToPayFee: fbWilling,
        rating: fbRating,
        comment: fbComment,
      });
      setFbComment('');
      setFbSuccess(true);
      setTimeout(() => setFbSuccess(false), 2500);
    } finally {
      setFbSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
            Student Orders &amp; Profile
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Track submitted order requests, manage saved hostel/PG delivery details, and share pilot feedback.
          </p>
        </div>

        {firebaseUser ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600 truncate max-w-[200px]">
              {firebaseUser.email}
            </span>
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit mb-6">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            tab === 'orders' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Order Requests ({customerOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            tab === 'profile' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Delivery Profile
        </button>
        <button
          type="button"
          onClick={() => setTab('feedback')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            tab === 'feedback' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Pilot Survey
        </button>
      </div>

      {tab === 'orders' && (
        <>
          {customerOrders.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
              <ClipboardList className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
              <h2 className="font-display text-base font-semibold text-zinc-900">
                No orders placed yet
              </h2>
              <p className="text-sm text-zinc-500 mt-1 mb-5">
                Browse groceries, snacks, or stationery from local Selaqui retailers to place your first WhatsApp order.
              </p>
              <button
                type="button"
                onClick={() => setActiveView('catalog')}
                className="px-4 py-2 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => {
                const store = stores.find((s) => s.id === order.storeId);
                const digits = sanitizeWhatsappNumber(
                  store?.whatsappOrderNumber || platformConfig.pilotWhatsappNumber
                );
                const waUrl = digits ? buildWhatsappUrl(digits, order.whatsappMessage) : '';
                const canCancel =
                  order.status === 'Draft' || order.status === 'Pending Retailer Confirmation';

                return (
                  <article
                    key={order.id}
                    className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <span className="font-mono-tabular font-semibold text-zinc-900">
                            {order.orderRef}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-zinc-800">{order.storeName}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-md ${statusTone(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span className="text-xs text-zinc-500 border border-zinc-200 px-2.5 py-1 rounded-md">
                          {order.paymentMethod} · {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      <div className="md:col-span-7 space-y-2">
                        <p className="text-xs font-semibold text-zinc-500">Ordered Items</p>
                        <ul className="divide-y divide-zinc-100 text-sm">
                          {order.items.map((item, idx) => (
                            <li key={`${item.productId}_${idx}`} className="py-1.5 flex justify-between gap-3">
                              <span className="text-zinc-700">
                                {item.productName} × {item.quantity}
                              </span>
                              <span className="font-mono-tabular text-zinc-900">
                                {formatINR(item.lineTotal)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-zinc-200 text-xs space-y-1">
                          <div className="flex justify-between text-zinc-600">
                            <span>Product Subtotal</span>
                            <span className="font-mono-tabular">{formatINR(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-600">
                            <span>Delivery/Service Fee</span>
                            <span className="font-mono-tabular">{formatINR(order.deliveryFee)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-zinc-950 pt-1">
                            <span>Total</span>
                            <span className="font-mono-tabular">{formatINR(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-5 bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex flex-col justify-between gap-3 text-xs">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-zinc-800">Delivery Location</p>
                          <p className="text-zinc-700">{order.customerName} · {order.customerPhone}</p>
                          <p className="text-zinc-600">
                            {order.hostelOrPg}, {order.roomDetails}
                            {order.landmark ? ` (Near ${order.landmark})` : ''}
                          </p>
                          {order.retailerNote && (
                            <p className="mt-2 pt-2 border-t border-zinc-200 text-violet-900">
                              <span className="font-semibold">Retailer Note:</span> {order.retailerNote}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(order.id, order.whatsappMessage)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 font-semibold rounded-md cursor-pointer"
                          >
                            {copiedOrderId === order.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Message</span>
                              </>
                            )}
                          </button>
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => cancelCustomerOrder(order.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-red-700 hover:bg-red-50 border border-red-200 font-semibold rounded-md cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'profile' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 max-w-2xl">
          {!firebaseUser ? (
            <div className="text-center py-8">
              <UserIcon className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 mb-4">
                Sign in with Google to save your hostel/PG room details for faster WhatsApp checkouts.
              </p>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Sign In with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div>
                  <h2 className="font-display text-lg font-semibold text-zinc-900">
                    Saved Delivery Profile
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Role: {userProfile?.role || 'customer'} · {firebaseUser.email}
                  </p>
                </div>
                {profileSaved && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Hostel / PG Name
                </label>
                <input
                  type="text"
                  value={hostelOrPg}
                  onChange={(e) => setHostelOrPg(e.target.value)}
                  placeholder="e.g., DGU Boys Hostel / Selaqui Main Road PG"
                  className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Room / Block Details
                  </label>
                  <input
                    type="text"
                    value={roomDetails}
                    onChange={(e) => setRoomDetails(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Save Delivery Profile
              </button>
            </form>
          )}
        </div>
      )}

      {tab === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              DGU Pilot Feedback &amp; Willingness-to-Pay Validation
            </h2>
            <p className="text-xs text-zinc-600 mt-1 mb-5">
              Helps validate CampusCart&apos;s core pilot assumption: whether hostel &amp; PG students find the ₹{platformConfig.deliveryServiceFee} service fee fair and useful.
            </p>

            {!firebaseUser ? (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-violet-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Sign In with Google to Submit Feedback
              </button>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {fbSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Thank you! Your feedback has been recorded for pilot validation.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Your Hostel / PG Cluster
                  </label>
                  <select
                    value={fbCluster}
                    onChange={(e) => setFbCluster(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  >
                    {serviceAreas.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Are you willing to pay a {formatINR(platformConfig.deliveryServiceFee)} delivery/service fee for doorstep delivery from local shops?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFbWilling(true)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                        fbWilling
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-zinc-700 border-zinc-300'
                      }`}
                    >
                      Yes, willing to pay {formatINR(platformConfig.deliveryServiceFee)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFbWilling(false)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                        !fbWilling
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-700 border-zinc-300'
                      }`}
                    >
                      Prefer lower / free pickup
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Ordering Experience Rating (1–5)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFbRating(n)}
                        className={`p-2 rounded-lg border cursor-pointer ${
                          fbRating >= n
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-white border-zinc-200 text-zinc-400'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Comments or Product Requests
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={500}
                    value={fbComment}
                    onChange={(e) => setFbComment(e.target.value)}
                    placeholder="What daily essentials or bundles would help you most in Selaqui?"
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={fbSubmitting}
                  className="px-5 py-2.5 bg-violet-900 hover:bg-violet-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {fbSubmitting ? 'Submitting...' : 'Submit Pilot Feedback'}
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-display text-base font-semibold text-zinc-900 mb-3">
              Your Submitted Responses ({customerFeedback.length})
            </h3>
            {customerFeedback.length === 0 ? (
              <p className="text-xs text-zinc-500">No feedback submitted yet.</p>
            ) : (
              <ul className="space-y-3">
                {customerFeedback.map((fb) => (
                  <li key={fb.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between text-zinc-500 mb-1">
                      <span>{fb.hostelCluster}</span>
                      <span className="font-mono-tabular font-semibold text-zinc-900">
                        {fb.rating}/5
                      </span>
                    </div>
                    <p className="text-zinc-800">{fb.comment}</p>
                    <p className="text-zinc-500 mt-1">
                      Willing to pay {formatINR(platformConfig.deliveryServiceFee)} fee:{' '}
                      {fb.willingToPayFee ? 'Yes' : 'No'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

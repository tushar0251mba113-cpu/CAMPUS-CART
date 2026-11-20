import { OrderLineItem, PaymentMethod } from '../types';

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateOrderRef(): string {
  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CC-${yymmdd}-${rand}`;
}

export function sanitizeWhatsappNumber(raw?: string | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export interface WhatsappMessageInput {
  orderRef?: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  hostelOrPg: string;
  roomDetails: string;
  landmark?: string;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  items: OrderLineItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
}

export function buildWhatsappOrderMessage(input: WhatsappMessageInput): string {
  const itemLines = input.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} × ${item.quantity} = ₹${item.lineTotal}`
    )
    .join('\n');

  const addressParts = [
    input.hostelOrPg.trim(),
    input.roomDetails.trim(),
    input.landmark?.trim() ? `Near ${input.landmark.trim()}` : '',
  ].filter(Boolean);

  const lines = [
    'Hello CampusCart,',
    '',
    'I would like to place the following order.',
    input.orderRef ? `Order Ref: ${input.orderRef}` : '',
    `Store: ${input.storeName}`,
    '',
    `Customer: ${input.customerName.trim()}`,
    `Mobile: ${input.customerPhone.trim()}`,
    `Hostel/PG: ${addressParts.join(', ')}`,
    input.deliveryInstructions?.trim()
      ? `Delivery Note: ${input.deliveryInstructions.trim()}`
      : '',
    `Preferred Payment: ${input.paymentMethod === 'UPI' ? 'UPI (Manual Coordination)' : 'Cash on Delivery (COD)'}`,
    '',
    'Items:',
    '',
    itemLines,
    '',
    `Product Subtotal: ₹${input.subtotal}`,
    `Delivery/Service Fee: ₹${input.deliveryFee}`,
    `Total: ₹${input.totalAmount}`,
    '',
    'Please confirm product availability and delivery details.',
    '',
    'Thank you.',
  ];

  return lines.filter((line, idx, arr) => {
    if (line !== '') return true;
    return arr[idx - 1] !== '';
  }).join('\n');
}

export function buildWhatsappUrl(phoneDigits: string, message: string): string {
  const cleanDigits = sanitizeWhatsappNumber(phoneDigits);
  if (!cleanDigits) return '';
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}

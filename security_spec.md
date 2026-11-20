# CampusCart Security Specification (Phase 0)

## 1. Data Invariants
1. **Identity & Privilege Isolation**: No user may self-assign `role: 'admin'` or `role: 'retailer'` during `/users/{userId}` creation or update. Only the bootstrapped Super Admin (`tushar.0251mba113@dgu.ac.in`, verified email) or docs in `/admins/{uid}` possess administrative rights.
2. **PII Isolation**: Student PII (`/users/{userId}` and `/orders/{orderId}`) and retailer personal contact PII (`/stores/{storeId}/private/contact`) are strictly readable only by the document owner, associated store owner (`storeOwnerUid`), or admin. Public reads never expose personal emails, phone numbers, or hostel room addresses.
3. **Referential Integrity & Store Ownership**: A product in `/products/{productId}` cannot be created without an existing `/stores/{storeId}` document, and only the store's `ownerUid` or an admin may create/edit its products.
4. **Order Integrity & Terminal State Locking**: An order in `/orders/{orderId}` must reference an existing `/stores/{storeId}`, must match `store.ownerUid == incoming.storeOwnerUid`, and must set `customerUid == request.auth.uid` on creation. Once an order reaches `Completed`, `Cancelled`, or `Rejected`, non-admin updates are blocked.
5. **Temporal Integrity & Bounded Payloads**: `createdAt` and `updatedAt` must equal `request.time` on creation/update; strings and arrays have explicit `.size()` bounds.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Self-Privilege Escalation**: Customer writes `/users/{uid}` with `role: "admin"`.
2. **Ghost Field Shadow Write**: Customer updates `/users/{uid}` adding `isVerifiedPartner: true`.
3. **Cross-User PII Read**: Signed-in student attempts `get` or `list` on `/users/{otherUid}`.
4. **Unverified Email Spoof**: Token with admin email but `email_verified: false` writes `/platformConfig/pilot`.
5. **Orphan Product Injection**: User creates `/products/p1` with non-existent `storeId: "fake_store"`.
6. **Competitor Product Tampering**: Retailer A attempts `update` on `/products/p2` belonging to Retailer B.
7. **Order Spoofing**: Customer creates `/orders/o1` with `customerUid: "other_uid"`.
8. **Order Total / Payment Tampering**: Customer updates `/orders/o1` changing `paymentStatus: "Manually Verified"` or `totalAmount: 1`.
9. **Terminal Order Re-opening**: Retailer updates `/orders/o1` after status is already `"Completed"`.
10. **ID Poisoning**: Attacker creates `/orders/{1500_char_id}` violating `isValidId()`.
11. **Unbounded Array / Denial of Wallet**: Customer creates `/orders/o1` with 100 items in `items` array (> 30 limit) or 50KB `whatsappMessage`.
12. **Blanket Order List Scraping**: Non-admin user calls `list` on `/orders` without `where('customerUid', '==', uid)` or `where('storeOwnerUid', '==', uid)`.

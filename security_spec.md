# Security Specification — Payment References Firestore Rules

## 1. Data Invariants
1. **Default Deny**: Any unmatched collection or document path is unconditionally denied (`read, write: if false`).
2. **Numeric Reference ID Integrity**: Every `/payment_references/{referenceNumber}` document ID must be strictly numeric (`^[0-9]{1,30}$`) and must match `data.referenceNumber` verbatim. `referenceNumber` is immutable after creation.
3. **No Enumeration of Payment References**: Public visitors may only execute `get` on an exact numeric `referenceNumber` ID. `list` queries on `/payment_references` are strictly restricted to verified administrators.
4. **Zero PII in Public Lookup Documents**: `/payment_references/{referenceNumber}` stores only reference metadata (`referenceNumber`, `concept`, `amount`, `status`, `dueDate`, `paymentUrl`, `notes`, `createdAt`, `updatedAt`, `updatedBy`).
5. **Verified Admin-Only Mutations**: Only the verified bootstrap administrator (`email_verified == true`) or an active UID present in `/admins/{uid}` may `list`, `create`, `update`, or `delete` payment references.
6. **Privilege Escalation Prevention**: Only the verified bootstrap administrator may create, update, or delete `/admins/{adminUid}` documents. No user can self-assign admin privileges.
7. **Temporal & Schema Integrity**: Every write enforces strict key allowlists (`hasAll` / `hasOnly` / `affectedKeys().hasOnly()`), strict string size bounds, numeric range checks (`amount >= 0 && amount <= 999999999999`), HTTPS-only `paymentUrl`, and server-enforced timestamps (`request.time`).

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Create**: Anonymous caller tries to create `/payment_references/10001`.
2. **Unauthenticated List (Scraping)**: Anonymous caller runs `getDocs(collection(db, 'payment_references'))`.
3. **Shadow Field Injection (Create)**: Admin includes undeclared field `isVerified: true` on create.
4. **Shadow Field Injection (Update)**: Admin includes undeclared field `overrideRole: 'superadmin'` on update.
5. **Email Spoofing**: Caller with matching email but `email_verified: false` tries to create/list references.
6. **Self-Assigned Admin Escalation**: Non-admin authenticated user tries to create `/admins/{ownUid}` with `{ active: true }`.
7. **ID Poisoning (Non-Numeric / Oversized ID)**: Caller tries to read or write `/payment_references/abc-123` or a 200-char ID.
8. **Reference Number Mismatch / Mutation**: Admin attempts to change `referenceNumber` during update or set `referenceNumber` different from document ID.
9. **Immutable `createdAt` Tampering**: Admin attempts to modify `createdAt` on update or pass a forged client timestamp on create.
10. **Unsafe `paymentUrl` Injection**: Admin attempts to store `javascript:alert(1)` or `http://evil.example` in `paymentUrl`.
11. **Value Poisoning (Oversized String / Invalid Amount)**: Admin attempts to store a 5000-character `concept` or negative `amount: -500`.
12. **Identity Spoofing (`updatedBy`)**: Admin attempts to write `updatedBy: 'another-uid'` not matching `request.auth.uid`.

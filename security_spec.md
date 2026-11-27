# Security Specification – Fundación ULEP Trámites (Pagos y Paz y Salvo)

## 1. Data Invariants

1. **Default-Deny Safety Net**: Every unspecified path in Firestore is denied for read and write.
2. **Exact-Cédula Lookup Only (`payment_queries`)**: Public visitors can only fetch a single payment record by knowing the exact `cedula` document ID (`^[0-9]{5,15}$`). Listing `payment_queries` is strictly restricted to verified admins (`isAdmin()`).
3. **Admin-Only Mutations**: Only verified administrators (`request.auth.token.email_verified == true` and bootstrapped admin email `grupoulep@gmail.com` or `/admins/{uid}`) may create, update, or delete records in `payment_queries` or `paz_y_salvos`.
4. **Strict Payload & Key Integrity**: Every create validates exact required and allowed keys (`hasAll` + `hasOnly`), field types, max string lengths, regex patterns (cédula digits, `YYYY-MM-DD` due date, `https://` download URL), and server timestamps (`request.time`).
5. **Immutability**: `cedula` and `createdAt` in `payment_queries` and `createdBy`/`createdAt` in `paz_y_salvos` cannot be altered on update.
6. **No Client Self-Escalation**: `/admins/{uid}` is strictly `allow write: if false`.
7. **Secure Public List (`paz_y_salvos`)**: Public list queries must explicitly filter `resource.data.isPublished == true`.
8. **Immutable Append-Only Audit Trail (`audit_logs`)**: Only verified administrators may read (`get` / `list`) or append (`create`) records in `/audit_logs/{logId}`. `actorUid` must strictly match `request.auth.uid`, `createdAt` must equal `request.time`, all string bounds and action/module allowlists are enforced, and client `update`/`delete` are strictly forbidden (`if false`).
9. **PII-Isolated Citizen & Company Submissions (`pqrs_submissions`, `empresa_submissions`)**: Public visitors may ONLY `create` strictly schema-validated documents with `createdAt == request.time` (and `status == 'PENDIENTE'`, `completedBy == ''` for PQRS). Reading (`get` / `list`), updating status (`HECHO`), or deleting is strictly restricted to verified administrators so citizen and company PII can never be leaked publicly.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Anonymous Write to `payment_queries`**: Unauthenticated `create` on `/payment_queries/1061700001`.
2. **Unverified Admin Email Spoof**: Authenticated user with `email: "grupoulep@gmail.com"` and `email_verified: false` attempting `create` on `/payment_queries/1061700001`.
3. **Public Collection Enumeration (`list`)**: Unauthenticated `list` on `/payment_queries` to scrape citizen cédulas.
4. **Shadow Ghost Field Injection (`payment_queries`)**: Admin `create` including extra key `isAdminOverride: true`.
5. **Path-ID Poisoning (`payment_queries`)**: Admin `create` with mismatched `cedula` field vs document ID or non-digit ID `../admin`.
6. **Oversized String DoS**: Admin `create` on `/paz_y_salvos/ps-1` with a 5,000-char `description`.
7. **Malicious JavaScript Download URL**: Admin `create` on `/paz_y_salvos/ps-xss` with `downloadUrl: "javascript:alert(1)"`.
8. **HTTP (Non-HTTPS) Download URL**: Admin `create` on `/paz_y_salvos/ps-http` with `downloadUrl: "http://example.com/file.pdf"`.
9. **Client Timestamp Forgery**: Admin `create` with client-provided `createdAt` not matching `request.time`.
10. **Immutable Field Tampering**: Admin `update` attempting to mutate `createdAt` or `cedula` on `/payment_queries/1061700001`.
11. **Unpublished Record Leak**: Unauthenticated `get` on `/paz_y_salvos/draft-1` where `isPublished == false`.
12. **Privilege Escalation on `/admins`**: Signed-in non-admin user attempting `create` on `/admins/{theirUid}` with `{ role: "admin" }`.
13. **Unauthorized Audit Log Read (`audit_logs`)**: Non-admin or unauthenticated `list`/`get` on `/audit_logs` attempting to expose admin IP addresses and emails.
14. **Audit Log Tampering / Deletion (`audit_logs`)**: Even a verified admin attempting `update` or `delete` on `/audit_logs/{logId}` must be denied.
15. **Audit Log Identity Spoofing (`audit_logs`)**: Admin attempting `create` on `/audit_logs/{logId}` with `actorUid` different from `request.auth.uid` or invalid `action` value.
16. **Public PII Scrape on PQRS & Empresa (`pqrs_submissions`, `empresa_submissions`)**: Unauthenticated or non-admin `list`/`get` attempting to read submitted citizen emails/phones or company contacts.
17. **PQRS State Shortcutting on Create (`pqrs_submissions`)**: Public `create` attempting to submit `status: "HECHO"` or forged `createdAt` timestamp to manipulate the 15-day countdown.

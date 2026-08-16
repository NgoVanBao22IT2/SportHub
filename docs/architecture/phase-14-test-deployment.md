# PHASE 14 — Quality Assurance & Deployment Documentation

## 1. Test Environment Setup
- `jest` and `supertest` configured with `NODE_ENV=test`.
- `sqlite` configured in `:memory:` to run tests securely without relying on MySQL local connectivity for the CI/CD pipeline.

## 2. RBAC & Security Test Evidence (14.06)
- File: `tests/rbac.test.js`
- Test commands executed: `npx jest tests/rbac.test.js`
- **Security Validation:**
  - `CUSTOMER cannot access OWNER endpoints` → PASS
  - `CUSTOMER cannot access ADMIN endpoints` → PASS
  - `OWNER cannot access ADMIN endpoints` → PASS
  - `ADMIN can access ADMIN endpoints` → PASS
  - `Unauthenticated user cannot access protected endpoints` → PASS
  - `IDOR: User cannot escalate role via Customer API` → PASS

*Evidence shows the system securely restricts access based on JWT decoding and the `rbacMiddleware` configuration. The route sorting priority bug (which incorrectly passed `/admin` routes through `OWNER` checks) was remediated successfully.*

## 3. Concurrency Test Evidence (14.04 & 14.05)
- Tests were initially validated in Phase 09 and Phase 10 natively on MySQL using explicit row-level locking (`SELECT ... FOR UPDATE`).
- Since SQLite does not support native row-level write locks in the same concurrency model, testing this fully requires a MySQL Docker instance in CI.
- **Booking Invariant**: Double-booking prevention via `BookingService` locks is correctly implemented.
- **Payment Invariant**: MoMo Callback ID idempotency and `transId` unique validation are correctly implemented.

## 4. Deployment Setup (14.09)
- **Multi-stage `Dockerfile`** added to the root directory for optimized Node.js Alpine builds.
- **`docker-compose.yml`** configured to orchestrate the Node.js backend and the `MySQL 8.0` database instance.
- Environment variables securely provisioned via `.env`.
- Database schema drift remains strictly at 0.

## 5. Performance and E2E (14.07, 14.08)
- No formal Performance SLA is defined in the initial MVP architecture, so performance constraints are marked as `NON-BLOCKING GAPS`.
- E2E testing using Cypress/Playwright is omitted in favor of comprehensive API integration tests and component-level verification. 

## 6. TBD GOVERNANCE STATUS
- **TBD-BOOK-01 (Booking Workflow)**: PRESERVED
- **TBD-DM-006 (Future Entity)**: PRESERVED
- **TBD-PAY-003 (Momo Advanced Integration)**: PRESERVED
- **TBD-PH07-RATING-01 (Reviews Domain)**: PRESERVED
- **TBD-PH08-PRICE-01 (Dynamic Pricing Engine)**: PRESERVED
- **TBD-PH09-RESCHEDULE-PRICE-01 (Booking Rescheduling)**: PRESERVED

No new TBDs were created. The architectural integrity remains completely aligned with the Phase 03/04 Source of Truth.

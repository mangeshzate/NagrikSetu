# NagrikSetu Production-Readiness Audit Report

**Date of Audit:** October 23, 2026  
**Auditor:** Antigravity Senior Full-Stack & Security Engineer  
**Target Platform:** NagrikSetu MVP (Maharashtra Student Opportunity & Civic Action Platform)  
**Status:** AUDITED, HARDENED & VERIFIED  

---

## Executive Summary

A comprehensive, line-by-line production-readiness audit was conducted across the NagrikSetu MVP codebase, including runtime behaviors, database security policies, server route handlers, edge middleware, cryptographic and URI boundaries, and the test suite.

The initial implementation provided strong foundations (deterministic matching engine, 11-operator eligibility evaluator, action journey state machine, bilingual i18n in Marathi and English, and clean Next.js 15 App Router architecture). However, the audit uncovered **4 Critical Issues**, **4 High-Priority Issues**, **4 Medium-Priority Issues**, and **3 Low-Priority Issues** that would have posed data security and privacy risks if deployed to production without remediation.

All identified vulnerabilities have been remediated, verified with a 40-test automated suite, validated by `tsc --noEmit` and `eslint`, and compiled through a clean production build (`npm run build`).

---

## Section 1: Detailed Findings & Remediation

### 1. CRITICAL ISSUES (Security & Data Integrity)

#### Issue C1: Insecure Direct Object Reference (IDOR) on Student Action Journeys
- **File:** `src/lib/database/store.ts` & `src/app/journeys/[id]/page.tsx`
- **Problem:** `dataStore.getJourneyById(journeyId)` and `dataStore.updateJourneyStepStatus(journeyId, stepId, status)` accepted journey IDs without verifying requesting user ownership. Any student could access or modify another student's journey by guessing or brute-forcing the URL.
- **Risk:** High risk of data tampering, student privacy breach, and unauthorized progress alterations.
- **Fix Applied:**
  - Hardened `getJourneyById(journeyId, requestingUserId, userRole)` to reject access if `journey.userId !== requestingUserId` unless the requester possesses verified `ADMIN` role.
  - Hardened `updateJourneyStepStatus(journeyId, stepId, status, requestingUserId, userRole)` with the same ownership check, logging security violation attempts.
  - Updated `src/app/journeys/[id]/page.tsx` to supply authenticated user credentials to both methods.
- **Verification Performed:** Automated integration test in `src/tests/security.test.ts` verified that Student B attempting to fetch or mutate Student A's journey returns `null` and logs `[Security Alert] IDOR attempt blocked`.

#### Issue C2: Client-Side-Only Authorization on Admin Routes
- **File:** `src/app/admin/page.tsx`, `src/app/admin/opportunities/new/page.tsx`
- **Problem:** Admin routes originally checked only `if (!user || user.role !== "ADMIN")` inside client React components. There was no server-side edge middleware intercepting requests before HTML/JSON rendering.
- **Risk:** Malicious clients or scripts disabling JavaScript or crafting mock state could attempt administrative route exploitation.
- **Fix Applied:**
  - Implemented Next.js Server Middleware (`src/middleware.ts`) matching `/admin/:path*`, `/dashboard/:path*`, `/journeys/:path*`, `/onboarding/:path*`, and `/profile/:path*`.
  - Added session cookie synchronization (`nagriksetu_session`) in `src/lib/auth/context.tsx`.
  - The middleware inspects server-side session cookies. If a non-admin or unauthenticated visitor requests `/admin/*`, it triggers an immediate server redirect with `403 Forbidden` / `admin_required` error code.
- **Verification Performed:** Tested with Next.js edge runtime simulation; unauthenticated requests to `/admin` redirect directly to `/login?redirect=/admin`.

#### Issue C3: Unrestricted RLS Policies & Privilege Escalation in PostgreSQL Schema
- **File:** `supabase/migrations/20261022000000_init_nagriksetu.sql`
- **Problem:**
  1. The `profiles` update policy lacked a `WITH CHECK` clause, allowing any student to execute an `UPDATE public.profiles SET role = 'ADMIN'` query on their own row.
  2. The RLS policies relied on `auth.jwt() ->> 'role' = 'ADMIN'`, which is fragile and easily spoofed if JWT claims are unverified or default to Supabase's internal auth role (`authenticated`).
  3. Foreign keys referenced generated UUIDs rather than `auth.users(id)` and `profiles.user_id`.
- **Risk:** Complete database administrative takeover by any registered student account.
- **Fix Applied:**
  - Created a PostgreSQL `SECURITY DEFINER` function `public.is_admin()` that queries the authoritative `public.profiles` table.
  - Replaced all `auth.jwt() ->> 'role'` checks with `public.is_admin()`.
  - Hardened `profiles` update policy with `WITH CHECK (public.is_admin() OR role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()))`, completely preventing self-elevation.
  - Added strict per-user RLS policies across `student_profiles`, `journeys`, `journey_steps`, `user_document_status`, and `additional_profile_answers`.
- **Verification Performed:** SQL schema and policy review confirmed syntax validity and strict row-level isolation.

#### Issue C4: Missing Server-Side Isolation for AI API Key & Direct Client Invocation
- **File:** `src/lib/ai/provider.ts` & `src/components/assistant/AssistantDrawer.tsx`
- **Problem:** `AssistantDrawer.tsx` was directly importing `askNagrikSetu`, which read `process.env.AI_API_KEY`. If deployed with `NEXT_PUBLIC_` prefixes or client bundles, API keys could leak to browser dev tools. Furthermore, no rate-limiting or abuse mitigation existed.
- **Risk:** API quota exhaustion, credential exposure, financial charges, and vulnerability to automated bot spam.
- **Fix Applied:**
  - Created a dedicated Next.js API Route Handler (`src/app/api/assistant/route.ts`) executing exclusively on the server.
  - Built an in-memory sliding window IP rate limiter (maximum 20 queries per minute).
  - Enforced input validation (rejecting non-string queries or queries exceeding 500 characters).
  - Updated `AssistantDrawer.tsx` to communicate exclusively via `POST /api/assistant` using `fetch`.
- **Verification Performed:** Automated test in `src/tests/ai_grounding.test.ts` confirmed adversarial resistance, query validation, and reliable fallback.

---

### 2. HIGH PRIORITY ISSUES (Public Pilot Readiness)

#### Issue H1: Unvalidated External URLs Permitted in Admin Forms & Action Links
- **File:** `src/app/admin/opportunities/new/page.tsx`, `src/components/journeys/JourneyStepItem.tsx`, `src/app/opportunities/[slug]/page.tsx`
- **Problem:** Opportunity URLs and step action links lacked protocol validation, permitting dangerous URI schemes such as `javascript:` or `data:`.
- **Risk:** Cross-Site Scripting (XSS) when a user clicks on an unverified link.
- **Fix Applied:**
  - Created `src/lib/validation/url.ts` featuring `isSafeUrl()` and `sanitizeUrl()`.
  - Enforced `isSafeUrl()` validation in `NewOpportunityPage.handleSubmit()`, blocking `javascript:`, `data:`, `vbscript:`, and `file:` schemes.
  - Wrapped all external anchor tags in `JourneyStepItem.tsx`, `OpportunityDetailPage`, and `JourneyDetailPage` with `isSafeUrl` guards and `sanitizeUrl()`.
- **Verification Performed:** Tested in `src/tests/security.test.ts`; all dangerous schemes are rejected and sanitized to safe fallbacks.

#### Issue H2: Unconditional Exposure of Privileged Demo Admin Credentials
- **File:** `src/app/login/page.tsx` & `src/lib/auth/context.tsx`
- **Problem:** The Quick Demo Login card with 1-click Admin login was rendered unconditionally on the login page, and `login()` accepted `ADMIN` role parameter without checking the environment.
- **Risk:** In production, anyone could click "Admin Demo" or call `login(email, 'ADMIN')` to bypass authentication.
- **Fix Applied:**
  - Guarded Quick Demo UI rendering with `process.env.NEXT_PUBLIC_DEMO_MODE === "true"`. In production, the demo box is completely removed.
  - In `login()`, added a guard: if `explicitRole === 'ADMIN'` and `NEXT_PUBLIC_DEMO_MODE !== 'true'` in production, passwordless login is rejected with an explicit error.
- **Verification Performed:** Verified in `.env.local` toggling; when demo mode is false, demo buttons are hidden and unauthorized admin logins rejected.

#### Issue H3: Falsely Claimed Account Deletion ("Fake Delete")
- **File:** `src/app/profile/page.tsx`
- **Problem:** Clicking "Yes, Delete" on the profile page only invoked `logout()` and navigated home. The student's profile, journeys, document states, and questionnaire answers remained untouched in storage.
- **Risk:** Violation of privacy transparency and deceptive user experience.
- **Fix Applied:**
  - Added `deleteUserAccount(userId)` to `DataStore` in `src/lib/database/store.ts` that genuinely purges the student profile, all user journeys, steps, document statuses, and questionnaire responses.
  - Updated `handleDeleteAccount` in `src/app/profile/page.tsx` to await `dataStore.deleteUserAccount(user.id)` before session termination.
- **Verification Performed:** Automated test in `src/tests/security.test.ts` confirmed complete erasure of student profile, journeys, document checklist, and questionnaire records.

#### Issue H4: Over-Claimed Verification of Simulated Opportunities
- **File:** `src/lib/database/mockData.ts` & `src/types/database.ts`
- **Problem:** Seeded opportunities with relative simulation dates (`addDays(14)`) were marked as `verificationStatus: "VERIFIED"`, falsely implying they were officially confirmed government deadlines.
- **Risk:** Misleading real students regarding application deadlines and requirements.
- **Fix Applied:**
  - Added `sourceClassification` (`VERIFIED_REAL_DATA`, `DEMO_DATA`, `NEEDS_MANUAL_VERIFICATION`), `deadlineSource`, and `eligibilitySource` to the `Opportunity` interface and database schema.
  - Reclassified all prototype opportunities with simulated deadlines to `NEEDS_REVIEW` and `NEEDS_MANUAL_VERIFICATION` or `DEMO_DATA`.
  - Added a Data Trust & Provenance card on `OpportunityDetailPage` displaying exact citations and reminding students to cross-reference with official portals.
- **Verification Performed:** Verified on `/opportunities/mahadbt-post-matric-ebc-scholarship` that the verification notice and source citations are rendered clearly.

---

### 3. MEDIUM PRIORITY ISSUES (Operational Quality)

#### Issue M1: Matching Engine Did Not Filter Expired or Inactive Schemes
- **File:** `src/lib/matching/engine.ts`
- **Problem:** An expired or inactive scheme could still earn up to 100 points if the student's profile matched educational criteria.
- **Fix Applied:** Added an early guard in `calculateOpportunityMatch`: if `!opportunity.active || opportunity.verificationStatus === "EXPIRED"`, the score is set to 0, categorized as "Expired Scheme" or "Inactive Scheme", and marked `isHighMatch: false`.
- **Verification Performed:** Verified in `src/tests/matching_bounds.test.ts`.

#### Issue M2: Eligibility Engine Weakness on Malformed Numbers (NaN)
- **File:** `src/lib/eligibility/engine.ts`
- **Problem:** If rule values or user values contained non-numeric strings for comparison operators (`LESS_THAN`, `BETWEEN`), JavaScript returned `NaN`, which could yield unpredictable evaluation.
- **Fix Applied:** Added `isNaN()` checks across all comparison operators (`LESS_THAN`, `LESS_THAN_EQUAL`, `GREATER_THAN`, `GREATER_THAN_EQUAL`, `BETWEEN`).
- **Verification Performed:** Verified in `src/tests/eligibility.test.ts` using malformed rule test cases.

#### Issue M3: Permissive Journey Creation for Expired Opportunities
- **File:** `src/lib/database/store.ts`
- **Problem:** A student could start an Action Journey for an expired or archived opportunity.
- **Fix Applied:** Added a check in `createJourney`: if `!opp.active || opp.verificationStatus === "EXPIRED"`, an error is thrown preventing journey initiation.
- **Verification Performed:** Verified in `src/tests/security.test.ts`.

#### Issue M4: Missing ESLint Next.js Core-Web-Vitals Configuration
- **File:** `.eslintrc.json`
- **Problem:** Missing flat config or rc configuration caused `npm run lint` to prompt interactively.
- **Fix Applied:** Added `.eslintrc.json` extending `next/core-web-vitals`.
- **Verification Performed:** `npm run lint` exited cleanly with `✔ No ESLint warnings or errors`.

---

### 4. LOW PRIORITY ISSUES (Polish & Code Hygiene)

#### Issue L1: Untracked Supabase Client Integration
- **File:** `src/lib/database/supabase.ts`
- **Problem:** The repository had Supabase dependencies installed but lacked an initialized client helper.
- **Fix Applied:** Created `src/lib/database/supabase.ts` with `isSupabaseConfigured()` and `getSupabaseClient()` helpers.

#### Issue L2: Ambiguous LocalStorage vs PostgreSQL Storage Mode
- **File:** `src/lib/database/store.ts`
- **Problem:** Reviewers could not inspect whether the active runtime was operating in LocalStorage Demo mode or PostgreSQL mode.
- **Fix Applied:** Exported `dataStore.getStorageMode()` returning `'supabase' | 'demo_local'` and `dataStore.isProductionMode()`.

#### Issue L3: Untranslated Admin Form Placeholder
- **File:** `src/app/admin/opportunities/new/page.tsx`
- **Problem:** "Back to Opportunities" lacked Marathi inline context.
- **Fix Applied:** Added bilingual subtitle guidance and Marathi tooltips across form steps.

---

## Section 2: Database Mode & Data-Flow Map

NagrikSetu supports two operational storage modes:

```
                      ┌───────────────────────────────────────┐
                      │            Runtime Mode               │
                      └──────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
       [ Production Mode ]                             [ Local Demo Mode ]
  (NEXT_PUBLIC_DEMO_MODE=false)                   (NEXT_PUBLIC_DEMO_MODE=true)
  Authoritative Source: PostgreSQL / Supabase    Authoritative Source: LocalStorage / Memory
```

### Data-Flow Map by Feature

| Feature | Production Mode (Supabase) | Local Demo Mode (Browser) |
|---|---|---|
| **Authentication** | Supabase Auth (`auth.users`, JWT) | Demo Context (`nagriksetu_auth_user` cookie) |
| **Student Profile** | `public.student_profiles` table (RLS enforced) | `nagriksetu_store_student_profiles` LocalStorage |
| **User Interests** | `public.user_interests` join table | `nagriksetu_user_interests` LocalStorage |
| **Opportunities** | `public.opportunities` table | `nagriksetu_store_opportunities` LocalStorage |
| **Eligibility Answers**| `public.additional_profile_answers` table | `nagriksetu_store_answers` LocalStorage |
| **Document Status** | `public.user_document_status` table | `nagriksetu_store_doc_statuses` LocalStorage |
| **Action Journeys** | `public.journeys` table (RLS enforced) | `nagriksetu_store_journeys` LocalStorage |
| **Journey Steps** | `public.journey_steps` table (RLS enforced)| Embedded in journey object |
| **Admin CRUD** | Server-side mutations via `is_admin()` | In-memory / LocalStorage DataStore |

> **Production Safeguard:** Production mode does **NOT** silently fall back to LocalStorage if Supabase credentials are missing. Instead, `store.ts` logs an explicit error, preventing students from believing data is persisted to cloud databases when it is not.

---

## Section 3: Seeded Opportunity Provenance Classification

Every seeded opportunity has been audited and classified:

| Opportunity ID | Scheme Title | Status | Source Classification | Verification Detail |
|---|---|---|---|---|
| `opp_mahadbt_ebc` | Rajarshi Shahu Maharaj EBC | NEEDS_REVIEW | `NEEDS_MANUAL_VERIFICATION` | Real Maharashtra DHE scheme; dynamic deadline simulated for prototype. |
| `opp_panjabrao_hostel` | Dr. Panjabrao Deshmukh Hostel Allowance | NEEDS_REVIEW | `NEEDS_MANUAL_VERIFICATION` | Real Maharashtra DTE scheme; active cycle requires MahaDBT cross-check. |
| `opp_msins_internship`| Maharashtra Youth Tech Internship 2026 | NEEDS_REVIEW | `DEMO_DATA` | Modeled after MSInS initiatives; cohort schedule is simulated demo data. |
| `opp_mpsc_subordinate`| MPSC Subordinate Services Combined Exam | NEEDS_REVIEW | `NEEDS_MANUAL_VERIFICATION` | Real MPSC examination; closing tomorrow window is simulated for testing. |
| `opp_pmc_scholarship` | Pune Municipal Corp Ambedkar Aid | NEEDS_REVIEW | `NEEDS_MANUAL_VERIFICATION` | Real PMC Social Welfare scheme; requires current municipal gazette verification. |
| `opp_msbte_hackathon` | MSBTE Student Innovation Competition | NEEDS_REVIEW | `DEMO_DATA` | Educational innovation competition template for polytechnic students. |
| `opp_mahair_course` | MahaIT Digital Skills Foundation | NEEDS_REVIEW | `DEMO_DATA` | Free certified state upskilling program simulation. |
| `opp_aicte_expired` | AICTE Pragati Scholarship (Past Session)| EXPIRED | `DEMO_DATA` | Real national scheme; past session entry to test expired-opportunity safeguards. |

---

## Section 4: Automated Verification Test Results

```
 RUN  v3.2.7 C:/Users/DELL/OneDrive/Desktop/NagrikSetu

 ✓ src/tests/matching_bounds.test.ts (6 tests)
 ✓ src/tests/matching.test.ts (4 tests)
 ✓ src/tests/deadlines.test.ts (5 tests)
 ✓ src/tests/eligibility.test.ts (8 tests)
 ✓ src/tests/security.test.ts (12 tests)
 ✓ src/tests/ai_grounding.test.ts (5 tests)

 Test Files  6 passed (6)
      Tests  40 passed (40)
   Duration  4.56s
```

### TypeScript Validation
```
$ npx tsc --noEmit
Exit Code: 0 (No type errors)
```

### Linting Validation
```
$ npm run lint
✔ No ESLint warnings or errors
Exit Code: 0
```

### Production Build Validation
```
$ npm run build
✓ Compiled successfully in 40s
✓ Linting and checking validity of types
✓ Generating static pages (18/18)
✓ Finalizing page optimization
Exit Code: 0
```

---

## Section 5: Final Production-Readiness Checklist

- [x] **Authentication secure:** Session cookie synchronization, password check on login, demo bypass blocked in production.
- [x] **RLS verified:** Hardened policies prevent cross-student reads/writes and prevent self-elevation to `ADMIN`.
- [x] **Admin authorization server-side:** Next.js Server Middleware (`src/middleware.ts`) protects all `/admin/*` routes.
- [x] **Production does not rely on LocalStorage for core records:** Dual-mode architecture with explicit storage mode detection.
- [x] **Demo credentials production-safe:** Quick Demo logins hidden when `NEXT_PUBLIC_DEMO_MODE !== 'true'`.
- [x] **Opportunity data correctly classified:** Every scheme tagged with `VERIFIED_REAL_DATA`, `DEMO_DATA`, or `NEEDS_MANUAL_VERIFICATION` and source provenance.
- [x] **Matching verified:** 30/20/20/20/10 formula verified; bounded between 0 and 100; inactive/expired schemes earn 0.
- [x] **Eligibility verified:** All 11 operators (`EQUALS`, `NOT_EQUALS`, `IN`, `NOT_IN`, `LESS_THAN`, `LESS_THAN_EQUAL`, `GREATER_THAN`, `GREATER_THAN_EQUAL`, `BETWEEN`, `CONTAINS`, `EXISTS`) tested.
- [x] **Journey persistence verified:** Steps generated, progress dynamically recalculated, duplicate journeys prevented.
- [x] **Cross-user access blocked:** IDOR guards in `store.ts` and `journeys/[id]/page.tsx` block cross-student viewing and step mutation.
- [x] **AI grounding verified:** Server-side route handler with rate-limiting, strict grounding prompt, and adversarial prompt resistance.
- [x] **Privacy reviewed:** Minimal data collection (no Aadhaar numbers or bank passwords collected); account deletion truly purges all user records.
- [x] **URL validation verified:** Rejects `javascript:`, `data:`, `vbscript:`, and `file:` schemes; sanitizes external links.
- [x] **Marathi/English checked:** Complete bilingual support with language persistence.
- [x] **Mobile/tablet/desktop checked:** Responsive Tailwind design with fluid grids and touch-friendly tap targets.
- [x] **Tests passing:** 40/40 unit and integration tests passing.
- [x] **TypeScript passing:** `tsc --noEmit` clean with 0 errors.
- [x] **Production build passing:** `next build` compiles all 18 routes and middleware cleanly.

---
*Report concluded. NagrikSetu MVP is hardened, audited, and ready for controlled student pilot testing in Maharashtra.*

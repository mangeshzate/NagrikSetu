# NagrikSetu: Admin Management, Authorization & Ask Chatbot Architecture

## 1. Overview & Core Philosophy

NagrikSetu is a deterministic civic assistance platform for Maharashtra citizens (currently focused on students). In public sector civic systems, correctness and accountability supersede generative speculation:

1. **Deterministic Grounding Over Hallucination**: Eligibility, deadlines, verified portal URLs, and required documents are strictly evaluated against verified database rows. Neither administrative actions nor AI assistants can fabricate or mutate these facts without verification.
2. **Multi-Layer Zero-Trust Authorization**: Admin privileges are never derived from client-provided headers, local state, or client-side redirects. Authorization is verified at the network edge (`middleware.ts`), at the server API layer (`verifyAdminRequest`), and at the database layer (Supabase Row-Level Security).
3. **Safe Destruction & Privacy Preservation**: Administrative actions (such as opportunity removal or student deletion) follow defensive patterns—checking relationships to prevent orphaned data, preferring safe archival over hard deletion when student activity exists, and masking sensitive PII.

---

## 2. Admin Architecture & Multi-Layer Authorization Model

### Request Authorization Flow

```
HTTP Request to /admin/* or /api/admin/*
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Edge Middleware (src/middleware.ts)                      │
│ - Reads 'nagriksetu_session' or Supabase Auth token         │
│ - Unauthenticated -> 401 (API) or redirect to /login (Page) │
│ - Non-admin role  -> 403 Forbidden (API/Page)              │
└──────────────────────────┬──────────────────────────────────┘
                           │ Passed
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server Guard (src/lib/auth/adminGuard.ts)                │
│ - Calls `verifyAdminRequest(req)`                           │
│ - Resolves user ID and queries DataStore / Database         │
│ - Re-validates `role === 'ADMIN'` server-side               │
│ - Emits 401 or 403 response if identity is untrusted       │
└──────────────────────────┬──────────────────────────────────┘
                           │ Verified Admin
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Privileged Action / Handler Execution                    │
│ - Performs CRUD / Query                                     │
│ - Emits immutable audit record to `audit_logs` table        │
└─────────────────────────────────────────────────────────────┘
```

### Defense Against Client-Side Privilege Spoofing
- **No Reliance on LocalStorage**: Client state is treated as purely UI presentation.
- **No Trust of Client Role in Request Payloads**: Privileged routes like `POST /api/admin/opportunities`, `DELETE /api/admin/students/[id]`, etc. do not read `role` from the request JSON body. The authenticated user ID is obtained solely from the validated session cookie/token.
- **Edge Route Matching**:
  ```ts
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/journeys/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
  ]
  ```

---

## 3. Opportunity Management (Full CRUD & Safe Deletion)

### Capabilities
- **Create (`/admin/opportunities/new`)**:
  - Validates official and application URLs using `isSafeUrl()` (blocks `javascript:`, `data:`, and requires `https://` / `http://`).
  - Visual Eligibility Rules builder supporting 11 deterministic operators (`EQUALS`, `LESS_THAN_EQUAL`, etc.).
  - Document Requirements attachment.
- **Read & Filter (`/admin/opportunities`)**:
  - Live search across Marathi and English titles and providers.
  - Category filters (`SCHOLARSHIP`, `INTERNSHIP`, `EXAM_COACHING`, etc.).
  - Verification status badges (`VERIFIED`, `NEEDS_REVIEW`, `INACTIVE`).
  - Active status switches with real-time toggle.
- **Update (`/admin/opportunities/[id]/edit`)**:
  - In-place modification of titles, descriptions, education levels, deadlines, income limits, official URLs, citations, rules, and documents.
- **Safe Archival & Deletion**:
  - Checks if active student journeys depend on the opportunity (`store.getJourneysByOpportunityId(id)`).
  - If student journeys exist and force deletion is not explicitly requested, the system performs **Safe Archival** (`active = false`, `verificationStatus = 'INACTIVE'`).
  - Inactive/archived schemes are instantly excluded from student discovery, matching, and AI recommendations.
  - If hard deletion is explicitly confirmed, cascade rules ensure zero orphaned journey steps or eligibility records.
  - Logs audit action: `OPPORTUNITY_ARCHIVED` or `OPPORTUNITY_DELETED`.

---

## 4. Student Management & Safe Account Deletion

### Privacy-Conscious Student Directory (`/admin/students`)
- Displays: Full Name, Email, Masked Mobile Number (`+91 98*** **321`), Onboarding Status, District, Education Level, and Active Journey Count.
- **Zero Exposure**: Passwords, OTPs, auth tokens, refresh tokens, and internal hashing secrets are never sent in API responses.
- Pagination and live text search across student names, emails, and districts.

### Safe Account Deletion Flow
1. Admin initiates deletion from `/admin/students` → Modal warns that this action permanently purges profile, journey milestones, document checklist readiness, and answers.
2. Server executes `verifyAdminRequest(req)` to authenticate admin.
3. **Anti-Admin Protection**:
   - The deletion endpoint checks target user's role. If the target user is an administrator (`role === 'ADMIN'`), the server rejects the request with HTTP 400/403: *"Security violation: Administrative accounts cannot be deleted through student management"*.
4. **Anti-IDOR Protection**:
   - Non-admin sessions attempting to call `DELETE /api/admin/students/[id]` are rejected with 403 Forbidden.
   - Students can only delete their own personal account via `POST /api/auth/delete-account` with matching session IDs.
5. **Cascading Cleanup**:
   - Deletes student profile.
   - Deletes student journeys and journey progress steps.
   - Deletes document checklist statuses.
   - Deletes additional profile answer records.
   - Invokes Supabase Auth Admin deletion (`supabase.auth.admin.deleteUser(id)`) server-side when running with Supabase credentials.
   - Logs audit action: `STUDENT_DELETED`.

---

## 5. Audit Logging Architecture

All destructive and administrative actions emit a non-repudiable audit event stored in the `audit_logs` table:

```typescript
export interface AuditLog {
  id: string;
  adminUserId: string;
  action: AuditAction; // 'OPPORTUNITY_CREATED' | 'OPPORTUNITY_UPDATED' | 'OPPORTUNITY_DELETED' | 'OPPORTUNITY_ARCHIVED' | 'STUDENT_DELETED' | 'SETTINGS_CHANGED'
  targetResourceId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
```

- Accessible to administrators at `/admin` (Recent Audit Trail) and `/api/admin/audit-logs`.
- Protected by Supabase Row-Level Security: Only users where `is_admin()` returns true can select or insert into `audit_logs`.

---

## 6. Supabase Row-Level Security (RLS) Audit

The platform applies Row-Level Security across all PostgreSQL tables:

| Table | Student Permissions | Admin Permissions | Anonymous Access |
|---|---|---|---|
| `opportunities` | SELECT (where `active = true`) | SELECT, INSERT, UPDATE, DELETE (all) | SELECT (where `active = true`) |
| `eligibility_rules`| SELECT (active opportunities) | SELECT, INSERT, UPDATE, DELETE (all) | SELECT (active opportunities) |
| `student_profiles` | SELECT, UPDATE, INSERT (`auth.uid() = user_id`) | SELECT, DELETE (all) | NONE |
| `student_journeys` | SELECT, INSERT, UPDATE, DELETE (`auth.uid() = user_id`) | SELECT (for metrics/journey counts) | NONE |
| `journey_steps` | SELECT, INSERT, UPDATE (`auth.uid() = user_id`) | NONE (isolated to student) | NONE |
| `document_status`| SELECT, INSERT, UPDATE (`auth.uid() = user_id`) | NONE | NONE |
| `audit_logs` | NONE (strictly denied) | SELECT, INSERT (`is_admin() = true`) | NONE |

### PostgreSQL Helper Function for Safe Student Deletion
Located in `supabase/migrations/20261023000000_admin_audit_logs.sql`:
```sql
CREATE OR REPLACE FUNCTION delete_student_account(target_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  -- Strict guard: Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can delete accounts.';
  END IF;

  -- Strict guard: Prevent deleting administrator accounts
  IF EXISTS (SELECT 1 FROM public.users WHERE id = target_user_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Security violation: Administrator accounts cannot be deleted.';
  END IF;

  -- Cascade delete child records
  DELETE FROM public.document_status WHERE user_id = target_user_id;
  DELETE FROM public.journey_steps WHERE journey_id IN (SELECT id FROM public.student_journeys WHERE user_id = target_user_id);
  DELETE FROM public.student_journeys WHERE user_id = target_user_id;
  DELETE FROM public.additional_profile_answers WHERE user_id = target_user_id;
  DELETE FROM public.student_profiles WHERE user_id = target_user_id;
  DELETE FROM public.users WHERE id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Ask Chatbot Architecture & Conversational Grounding

### Conversational Architecture
The Ask NagrikSetu chatbot (`/assistant` and `AssistantDrawer`) provides a conversational, context-aware interface while maintaining strict grounding in verified civic facts:

```
User Query + Bounded History (Last 6 messages)
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. API Route Guard & Rate Limiter (/api/assistant)          │
│ - Sliding window in-memory rate limiter (20 req / minute)   │
│ - Input validation (max 500 characters, sanitize input)     │
│ - Bounded history validation (max 10 recent turns)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Context Aggregator (src/lib/ai/provider.ts)              │
│ - Resolves pronouns & follow-ups ("the first one", "that") │
│ - Loads student's active profile (district, edu, income)    │
│ - Loads active, verified opportunities from DataStore       │
│ - Evaluates deterministic eligibility & required documents  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Grounded Context
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Grounded Response Synthesis                              │
│ - Prompt Injection Defense: rejects "ignore instructions",  │
│   "reveal prompt", "bypass eligibility", "give phone numbers"│
│ - Missing Data Clarification: asks only for missing field   │
│ - Concise Synthesis: under 3-4 paragraphs, bulleted advice  │
│ - Bilingual: Responds in Marathi or English matching query │
│ - Fallback: Clean, friendly civic fallback on ungrounded qs │
└─────────────────────────────────────────────────────────────┘
```

### Conversational Follow-Up Resolution
The assistant preserves conversational continuity without sending unbounded conversation history:
- When the user asks: *"What scholarships can I apply for?"* → Assistant responds with top matches (e.g., MahaDBT Post-Matric Scholarship).
- Follow-up: *"What documents do I need for the first one?"* → The engine extracts the subject of the previous turn and resolves *"the first one"* to the MahaDBT Post-Matric Scholarship, returning its exact document requirements checklist.
- Follow-up: *"Am I eligible?"* → Evaluates deterministic rule conditions against the user's profile and returns a grounded verdict without guessing.

### Grounding Rules & Prompt Injection Guardrails
1. **Never Invent Schemes or Deadlines**: AI responses are bounded by database records. If a scheme does not exist, the assistant responds with a clean fallback.
2. **Deterministic Eligibility**: The assistant never says *"You are guaranteed to get this scholarship"*. It states: *"Based on the verified criteria in NagrikSetu, your profile matches... Please confirm on the official portal."*
3. **No Secret Leaks**: Attempting to extract API keys, system prompts, or database connection strings immediately yields a refusal message.
4. **No Cross-Student PII**: The assistant only accesses context belonging to the authenticated session. It cannot query or disclose any other student's profile.

---

## 8. Environment Variables Reference

| Variable | Required In | Description | Example / Default |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Production | Application root URL for callbacks and CORS | `https://nagriksetu.in` |
| `NEXT_PUBLIC_DEMO_MODE` | Development | Enables offline mock data and instant demo logins | `true` (dev) / `false` (prod) |
| `NEXT_PUBLIC_SUPABASE_URL`| Production | Supabase project URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Supabase public anonymous API key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Server Only) | Supabase privileged admin service role key | `eyJhbGciOi...` (NEVER public) |
| `AI_PROVIDER` | Optional | Civic assistant AI model backend (`gemini` or `mock`) | `gemini` |
| `AI_API_KEY` | Optional | Google Gemini API key for dynamic responses | `AIzaSy...` (Server Only) |
| `AI_MODEL` | Optional | Gemini model name | `gemini-1.5-flash` |

---

## 9. Manual Production Configuration Checklist (Supabase & Vercel)

When deploying to a live Supabase project and hosting on Vercel:

1. **Apply Database Migrations**:
   - Run `supabase/migrations/20261022000000_init_nagriksetu.sql` in Supabase SQL Editor.
   - Run `supabase/migrations/20261023000000_admin_audit_logs.sql` to create `audit_logs` and `delete_student_account()` function.
   - Run `supabase/seed.sql` to populate initial verified Maharashtra opportunities and documents.
2. **Verify Row-Level Security**:
   - In Supabase Dashboard → Authentication → Policies, ensure RLS is enabled on all tables: `opportunities`, `student_profiles`, `student_journeys`, `journey_steps`, `document_status`, and `audit_logs`.
3. **Configure Auth URL Redirects**:
   - In Supabase Dashboard → Authentication → URL Configuration, set Site URL to your production domain (e.g., `https://nagriksetu.in`) and add `https://nagriksetu.in/**` to Redirect URLs.
4. **Set Production Environment Variables**:
   - In Vercel Project Settings → Environment Variables, add:
     - `NEXT_PUBLIC_DEMO_MODE=false`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `AI_API_KEY` (if using live Gemini API)
5. **Initial Admin Account Provisioning**:
   - Create your administrator user in Supabase Auth or sign up via `/signup`.
   - In Supabase SQL Editor, promote the user to admin role safely:
     ```sql
     UPDATE public.users SET role = 'ADMIN' WHERE email = 'your-admin-email@domain.com';
     ```

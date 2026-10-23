# NagrikSetu (नागरिकसेतू)
> **"Tell us your problem. Find the right path forward."**  
> **"तुमची समस्या सांगा. पुढचा योग्य मार्ग शोधा."**

NagrikSetu is a civic assistance and deterministic action platform designed to connect citizens with verified opportunities, government schemes, and actionable next steps. 

Version 1 is focused exclusively on **Students in Maharashtra**, helping them navigate scholarships (MahaDBT, DHE), state internships (MSInS), competitive government exams (MPSC), skill certifications (MahaIT), and technical competitions (MSBTE).

Unlike generic search engines or speculative AI chatbots, NagrikSetu moves users through:  
**Information → Decision → Action → Completion**

---

## 🌟 Key MVP Features

1. **Deterministic Weighted Matching Engine (100 pts)**
   - Education Level Match: **30 points**
   - State Applicability Match: **20 points**
   - Income Range Compatibility: **20 points**
   - Domain Interest Match: **20 points**
   - Current Academic Year Match: **10 points**
   - Categories: *Excellent Match* (90–100%), *Strong Match* (75–89%), *Possible Match* (50–74%), *Low Match* (<50%).

2. **Deterministic Rule-Based Eligibility Engine**
   - Evaluates real rule conditions with operators: `EQUALS`, `NOT_EQUALS`, `IN`, `NOT_IN`, `LESS_THAN`, `LESS_THAN_EQUAL`, `GREATER_THAN`, `GREATER_THAN_EQUAL`, `BETWEEN`, `CONTAINS`, `EXISTS`.
   - Distinct statuses: `ELIGIBLE`, `POSSIBLY_ELIGIBLE`, `NOT_ELIGIBLE`, `MORE_INFORMATION_REQUIRED`.
   - **Dynamic Eligibility Questions**: If a required rule field is missing (e.g. academic percentage, category), the system prompts only for the missing detail and instantly recalculates without failing the student.

3. **Action Journeys (Core Differentiator)**
   - Turns an opportunity into a personalized step-by-step roadmap:
     1. Confirm Eligibility & Documents
     2. Read Official Notification
     3. Prepare Required Documents
     4. Open Official Application Portal
     5. Submit Online Application
     6. Save Application / Acknowledgement Number
     7. Track Status & Merit List
   - Real-time progress tracking (`% completed`, remaining tasks count).

4. **Document Preparation Checklist**
   - Tracks document availability (*Ready / Available*, *Missing / Need to obtain*, *Not Applicable*).
   - **Zero file uploads required for MVP** to protect sensitive student documents.

5. **Deadline Intelligence**
   - Computes `daysRemaining`, displays status badges: *Closing today*, *Application closes tomorrow*, *X days left*, *Deadline passed*.
   - Categorizes urgent deadlines (≤ 7 days).

6. **Ask NagrikSetu (Conversational Civic AI Assistant)**
   - Context-aware conversational memory (bounded history, understands follow-ups like "what documents for the first one?").
   - Strict grounding: answers solely from verified database records and deterministic engines.
   - Guardrails: defends against prompt injections, never invents deadlines, schemes, or eligibility rules.
   - Multi-lingual responses (natural Marathi & English).
   - Server-side sliding-window rate limiting & length checks.
   - Graceful fallback: clean, friendly civic fallback on ungrounded queries or provider outages.

7. **Bilingual Localization (मराठी + English)**
   - Built-in localized dictionary with persistent language preference.

8. **Admin Operations & Management Portal (`/admin`)**
   - Multi-layer authorization: Edge middleware + Server-side `verifyAdminRequest` guard.
   - Comprehensive dashboard: Total students, active opportunities, review queue, expired opportunities, total journeys.
   - **Full Opportunity CRUD**: Create, read/filter, edit in-place, and safe archival/deletion with active journey impact detection.
   - **Privacy-Conscious Student Management**: Directory with masked mobile numbers, search, pagination, and safe account deletion with anti-admin protection.
   - **Immutable Audit Logging**: Destructive actions recorded to `audit_logs` table.
   - **Eligibility Rule Builder GUI**: Visual rule builder supporting 11 deterministic operators.
   - Detailed architecture docs: [ADMIN_AND_ASSISTANT_ARCHITECTURE.md](./ADMIN_AND_ASSISTANT_ARCHITECTURE.md).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7 (Strict mode)
- **Styling**: Tailwind CSS 3.4 (Custom civic color palette)
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Vitest 3.0
- **Database**: PostgreSQL / Supabase
- **Authentication**: Supabase Auth / Local Session Provider

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js `v18.18+` (or `v20+` / `v24+`)
- npm `v9+`

### 2. Clone and Install Dependencies
```bash
cd NagrikSetu
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true

# AI Provider Configuration (Optional)
AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=gemini-1.5-flash

# Supabase (Optional for local test, required for full cloud persistence)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
> **Note**: In Demo Mode (`NEXT_PUBLIC_DEMO_MODE=true`), NagrikSetu is 100% functional out-of-the-box with embedded local persistent storage for opportunities, journeys, rules, and student profiles.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

NagrikSetu includes a unit test suite covering the deterministic matching engine, eligibility rule evaluation, and deadline utilities:

```bash
npm test
```
Or with Vitest directly:
```bash
npx vitest run
```

---

## 🔐 Demo Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Student** | `student@nagriksetu.in` | Any 6+ characters | Prathamesh Kadam (Pune, Diploma Final Year, OBC) |
| **Admin** | `admin@nagriksetu.in` | Any 6+ characters | Dr. Sunita Deshmukh (Platform Administrator) |

*You can also click the "Student Demo" or "Admin Demo" quick buttons on the `/login` page.*

---

## 🗄️ Database Setup (Supabase)

To connect to your own Supabase instance:

1. Create a project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the schema migration file:  
   `supabase/migrations/20261022000000_init_nagriksetu.sql`
4. Run the seed data script:  
   `supabase/seed.sql`
5. Copy your project URL and Anon key into `.env.local`.

---

## 📱 Application Routes

### Public Routes
- `/` — Trustworthy civic landing page with 5-step process and categories.
- `/login` — Student & admin authentication with demo quick-buttons.
- `/signup` — Student registration with password validation.
- `/privacy` — Citizen charter, privacy principles, and data deletion policy.

### Student Authenticated Routes
- `/onboarding` — 4-step wizard: Language, Education, District, Income, Interests.
- `/dashboard` — Personalized student dashboard with recommendations, active journeys, and urgent deadlines.
- `/discover` — Searchable opportunity directory with type, education, and deadline filters.
- `/opportunities/[slug]` — Opportunity detail with Match Score breakdown, EligibilityChecker, and Document checklist.
- `/journeys` — Active and completed student Action Journeys.
- `/journeys/[id]` — Step-by-step action roadmap tracker with external portal links.
- `/assistant` — Dedicated Ask NagrikSetu civic AI assistant.
- `/profile` — Student profile editor, language preference, and account deletion.

### Admin Routes (`role === 'ADMIN'`)
- `/admin` — Operations dashboard with 5 metrics cards, quick navigation, recent opportunities, and immutable audit trail.
- `/admin/opportunities` — Opportunity directory with search, category/verification filters, live toggles, and safe archival/deletion dialogs.
- `/admin/opportunities/new` — Opportunity publisher with URL security validation, visual Eligibility Rule Builder GUI, and Document selector.
- `/admin/opportunities/[id]/edit` — Full in-place scheme editor supporting bilingual descriptions, deadlines, income limits, and eligibility criteria.
- `/admin/students` — Privacy-conscious student directory with masked mobile numbers, search, pagination, and anti-admin-deletion safe account termination.
- `/admin/documents` — Standardized certificate catalog manager.
- `/api/admin/*` — Server-only protected APIs (`/metrics`, `/opportunities`, `/students`, `/audit-logs`) secured via edge middleware and `verifyAdminRequest`.

---

## 🛡️ Security & Privacy Principles

1. **Minimal Data Collection**: Only educational level, district, and broad income ranges are requested for rule matching.
2. **Zero Sensitive Document Uploads in MVP**: Documents are tracked via candidate readiness checklists, avoiding cloud storage of sensitive marksheets, caste certificates, or Aadhaar scans.
3. **Deterministic Rules Over LLM Hallucinations**: Government scheme eligibility and deadlines are never invented by the LLM. They are strictly evaluated by code against verified database rows.
4. **Role-Based Protection**: Admin pages and actions require server and client authorization checks.

---

## 🗺️ Future Roadmap

- Additional citizen modules: Farmers, Workers, Teachers, Senior Citizens, Persons with Disabilities.
- Official API integration with MahaDBT and DigiLocker.
- WhatsApp Action bot for deadline reminders and document alerts.
- Installable PWA and native mobile client (Expo / React Native).

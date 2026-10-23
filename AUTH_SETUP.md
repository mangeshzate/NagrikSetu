# NagrikSetu: Production Authentication Setup & Operations Guide

This document describes the manual steps and external cloud configurations required to operate the Supabase Auth production environment for NagrikSetu.

---

## 1. Google OAuth Setup

NagrikSetu uses Supabase Auth with Google OAuth for single-click, secure authentication for students and administrators.

### Step 1: Google Cloud Console Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `NagrikSetu` (or select an existing one).
3. Navigate to **APIs & Services** → **OAuth consent screen**:
   - User Type: **External**
   - App Name: `NagrikSetu`
   - User support email: Select your administrator email.
   - Developer contact information: Enter administrative email.
   - Authorized domains: Add `supabase.co` and your production domain (e.g. `nagriksetu.in` / `vercel.app`).
   - Scopes: Request `openid`, `.../auth/userinfo.email`, and `.../auth/userinfo.profile`.
4. Navigate to **APIs & Services** → **Credentials**:
   - Click **Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `NagrikSetu Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (Local development)
     - `https://your-production-app.vercel.app` (Vercel deployment)
     - `https://your-custom-domain.in` (Custom domain if applicable)
   - **Authorized redirect URIs**:
     - Copy the callback URL from your Supabase Dashboard (see Step 2 below):
       `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. Click **Create** and securely copy the **Client ID** and **Client Secret**.

### Step 2: Supabase Google Provider Configuration
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your NagrikSetu project → **Authentication** → **Providers** → **Google**:
   - Toggle **Enable Google provider**: `ON`.
   - Paste your **Client ID** from Google Cloud.
   - Paste your **Client Secret** from Google Cloud.
   - Save changes.
3. Open **Authentication** → **URL Configuration**:
   - **Site URL**: `https://your-production-app.vercel.app` (or `http://localhost:3000` for development).
   - **Redirect URLs (Allowed Callbacks)**:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`
     - `https://your-production-app.vercel.app/auth/callback`
     - `https://your-production-app.vercel.app/**`
     - `https://your-custom-domain.in/auth/callback`

---

## 2. Email OTP Setup

Supabase Auth provides passwordless, 6-digit email verification codes out-of-the-box.

### Supabase Email Authentication Settings
1. In Supabase Dashboard, navigate to **Authentication** → **Providers** → **Email**:
   - Toggle **Enable Email provider**: `ON`.
   - Toggle **Confirm email**: `ON`.
   - Toggle **Secure email change**: `ON`.
   - Toggle **Enable sign up**: `ON`.
2. Navigate to **Authentication** → **Email Templates**:
   - Select **Magic Link / OTP**:
   - Subject: `Your NagrikSetu Verification Code: {{ .Token }}`
   - Body template should display the 6-digit verification code token clearly:
     ```html
     <h2>Your NagrikSetu Verification Code</h2>
     <p>Enter the 6-digit code below to complete sign-in:</p>
     <h1 style="letter-spacing: 5px; font-family: monospace;">{{ .Token }}</h1>
     <p>This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
     ```
3. **SMTP Configuration (Production Recommended)**:
   - By default, Supabase provides built-in rate-limited email sending. For production volume across Maharashtra students, configure a dedicated SMTP provider (such as Resend, SendGrid, Amazon SES, or Brevo) under **Project Settings** → **Authentication** → **SMTP Settings**.

---

## 3. Mobile OTP / SMS Provider Setup

*Code integration complete; external provider configuration required.*

Supabase Phone Auth uses standard E.164 phone numbers (NagrikSetu formats Indian numbers as `+91XXXXXXXXXX`). To deliver real SMS messages across telecom networks in India (compliant with DLT regulations), an external SMS provider must be provisioned.

### Supported Supabase SMS Providers
Supabase natively supports:
- **Twilio**
- **MessageBird**
- **Vonage (Nexmo)**
- **Textlocal** (Supported in India)
- **AWS SNS**

### Configuration Steps in Supabase
1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Phone**:
   - Toggle **Enable Phone provider**: `ON`.
   - Select your chosen SMS vendor (e.g., `Twilio` or `MessageBird`).
2. Enter the vendor-specific API credentials:
   - **Twilio**: Account SID, Auth Token, Message Service SID (or Twilio Phone Number).
   - **MessageBird**: Access Key, Originator.
   - **AWS SNS**: Access Key ID, Secret Access Key, Region.
3. Configure the SMS Template under **Authentication** → **SMS Templates**:
   - Template: `Your NagrikSetu verification code is {{ .Code }}. Valid for 10 minutes.`
4. India Telecom (TRAI / DLT) Consideration:
   - For delivery to Indian mobile numbers (+91), ensure your SMS template is registered and approved on the telecom DLT portal (e.g. Jio, Airtel, or Vil DLT) if using Twilio/Textlocal in transactional mode.

---

## 4. Database Migrations

Apply the production migrations to your Supabase PostgreSQL database:

1. Connect via Supabase CLI or SQL Editor in the Dashboard.
2. Execute the migrations in order:
   - `supabase/migrations/20261022000000_init_nagriksetu.sql`
   - `supabase/migrations/20261023000000_admin_audit_logs.sql`
   - `supabase/migrations/20261023000001_auth_phone_and_roles.sql`
3. Verify that the `profiles` table contains:
   - `phone` (TEXT UNIQUE)
   - `phone_verified` (BOOLEAN DEFAULT FALSE)
   - `role` (TEXT CHECK ('STUDENT', 'ADMIN'))
   - Triggers `trg_protect_profile_security` and `on_auth_user_created` active.

### Designating an Administrator Account
To grant an account administrator privileges:
```sql
-- Replace with the trusted administrator's email or UUID
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'admin@nagriksetu.in';
```
*Note: Due to security triggers, roles cannot be modified directly via frontend API requests.*

---

## 5. Vercel Production Environment Variables

Configure the following environment variables in your Vercel Project Dashboard under **Settings** → **Environment Variables**:

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Production, Preview | Canonical URL (e.g., `https://nagriksetu.vercel.app`) |
| `NEXT_PUBLIC_DEMO_MODE` | Production | **Must be set to `false`** for production zero-trust security |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Your Supabase Project URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Public Anon API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Secret) | Server-side Service Role API Key (Never expose to client) |
| `AI_PROVIDER` | Production | Options: `gemini` \| `openai` \| `mock` |
| `AI_API_KEY` | Production (Secret) | API key for selected AI provider |
| `AI_MODEL` | Production | Model identifier (e.g. `gemini-1.5-flash`) |

---

## 6. Security Checklist for Production

- [ ] `NEXT_PUBLIC_DEMO_MODE` is set to `false`.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept server-side only and not prefixed with `NEXT_PUBLIC_`.
- [ ] Google OAuth redirect URI matches the live Supabase callback URL.
- [ ] Supabase Redirect URLs whitelist includes all production subdomains.
- [ ] Database RLS is enabled and active on `public.profiles`, `public.opportunities`, and `public.audit_logs`.
- [ ] SMS provider is provisioned with approved sender ID.

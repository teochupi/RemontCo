# RemontCo - Trusted Construction Services Marketplace
<!-- Updated: 2026-02-10 -->

## 🏗️ About RemontCo

**RemontCo** is a professional B2C marketplace platform that connects consumers with **verified, registered construction and property service companies** in Bulgaria. Unlike typical marketplaces, RemontCo exclusively works with **legal entities (registered companies)** to ensure transparency, accountability, and consumer protection.

### The Problem We Solve

In many countries, including Bulgaria, the construction and renovation industry suffers from:
- Unregistered contractors operating without legal documentation
- Cash-only transactions with no invoices or contracts
- Lack of accountability when projects go wrong
- Tax evasion and undeclared work
- Consumer exploitation and fraud

### Our Solution

RemontCo addresses these issues by:
- **Allowing only registered companies** with valid BULSTAT/EIK
- **Requiring verification** of all business registrations
- **Mandating contracts and invoices** for all work
- **Providing transparency** through verified company profiles
- **Ensuring legal protection** for all parties

This creates a fair, legal, and professional marketplace that benefits:
- **Consumers**: Get reliable contractors with legal accountability
- **Legitimate Companies**: Compete on a level playing field
- **Society**: Promotes tax compliance and economic transparency

---

## 🚀 Technologies Used

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic markup |
| **CSS3** | Custom styling with CSS variables |
| **JavaScript (ES6+)** | Modern vanilla JS with ES Modules |
| **Bootstrap 5.3.2** | Responsive UI framework |
| **Bootstrap Icons 1.11.2** | Icon library |
| **Choices.js** | Enhanced select dropdowns with search |
| **Vite** | Build tool and dev server |
| **Google Fonts** | Montserrat & Noto Sans (Cyrillic support) |

### Backend (Supabase BaaS)
| Service | Purpose |
|---------|---------|
| **PostgreSQL Database** | Data storage with relations |
| **Authentication** | Email/password auth with confirmation |
| **Row Level Security (RLS)** | Database-level access control |
| **Storage** | File uploads (images, documents) |
| **Edge Functions** | Serverless TypeScript functions |
| **Database Webhooks** | Real-time event triggers |

### Email Service
| Service | Purpose |
|---------|---------|
| **Brevo API** | Transactional email delivery |
| **Custom SMTP** | Reliable email sending |

### Internationalization
- Custom i18n system supporting **Bulgarian** (primary) and **English**
- JSON-based translation files with `data-i18n` attribute system
- Full UTF-8/Cyrillic support in all emails and UI

---

## 📋 Features

### Core Functionality

#### For Consumers
- ✅ Register and create profile with email confirmation
- ✅ Post job/ad requests with detailed descriptions and city selection (27 Bulgarian cities)
- ✅ Set price as fixed amount or "По договаряне" (negotiable)
- ✅ Browse verified companies by category
- ✅ Receive competitive quotes from multiple companies
- ✅ Accept, reject, or negotiate offers
- ✅ Manage active projects in dashboard
- ✅ View company profiles and contact information

#### For Companies
- ✅ Register with BULSTAT/EIK business verification
- ✅ Two-step verification: email confirmation + admin approval
- ✅ Verification gate: unverified companies see pending status overlay with 3-step progress indicator
- ✅ Portfolio and profile settings accessible before verification
- ✅ Full access automatically granted after admin approval
- ✅ Create detailed company profile with services
- ✅ Select multiple service categories
- ✅ Browse job postings in selected categories
- ✅ Send quotes with fixed or negotiable pricing
- ✅ Manage active projects and client communications
- ✅ Update company information and visibility

#### For Administrators
- ✅ Verify company registrations with BULSTAT/EIK
- ✅ Approve or reject new company applications
- ✅ Moderate job postings (approve/reject/request changes)
- ✅ Manage service categories
- ✅ View platform statistics and user activity
- ✅ Receive instant notifications for new registrations/jobs

### Access Control System

| Role | Access Level |
|------|--------------|
| **Anonymous** | View landing page, companies list, about/docs |
| **Demo** | Test platform with sample data (no real actions) |
| **Consumer** | Post jobs, receive quotes, manage projects |
| **Company** | Manage profile, browse jobs, send quotes |
| **Admin** | Full platform access, verify companies, moderate content |

#### Demo Mode Features
- Instant access without registration
- Choose between Consumer or Company demo account
- View sample companies and job postings
- Restricted actions (no real data modification)
- Banner notification indicating demo status

---

## 🎨 UI/UX Design System

### Bootstrap Modal System
The platform uses custom Bootstrap modals for improved user experience:

| Modal Type | Usage |
|------------|-------|
| **Success Modal** | Registration/password change confirmation |
| **Confirm Modal** | Replace browser `confirm()` dialogs |
| **Demo Selection Modal** | Choose demo account type |
| **Quote Modal** | Submit offers with price options |
| **Job Details Modal** | View full job information |
| **Password Change Modal** | Change password from profile |

### Toast Notification System
- **Location**: Top-right corner of screen
- **Types**: Success (green), Error (red), Warning (yellow)
- **Behavior**: Auto-dismiss after 4-5 seconds
- **Fallback**: Native `alert()` if Bootstrap unavailable

### Brand Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#4F46E5` (Indigo) | Trust, professionalism |
| **Secondary** | `#10B981` (Emerald) | Growth, success |
| **Accent** | `#F59E0B` (Amber) | Action, attention |
| **Dark** | `#0F172A` (Slate) | Text, headings |

### Typography
- **Primary Font**: Montserrat (headings, UI elements)
- **Secondary Font**: Noto Sans (body text)
- Both fonts include **Cyrillic character support**

---

## 🔔 Email Notification System

### Supabase Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `notify-admin` | New company/job created | Alert admin for approval |
| `notify-company-verification` | Company approved/rejected | Inform company of status |
| `notify-new-quote` | Quote submitted | Notify consumer of new offer |
| `delete-user` | Admin action (button click) | Delete user, all related data, and auth account |

### Email Workflows

#### For Consumers
- 📧 New quote received on job posting
- 📧 Quote status updates (accepted/rejected)
- 📧 Job moderation status (approved/rejected/needs revision)

#### For Companies
- 📧 Registration verification result
- 📧 New job postings in selected categories
- 📧 Quote accepted/rejected by consumer

#### For Administrators
- 📧 New company registration pending approval
- 📧 New job posting pending moderation

### Technical Implementation
- **Asynchronous Processing**: Edge Functions triggered by Database Webhooks
- **Multilingual Support**: Emails match user's preferred language (BG/EN)
- **Brevo Integration**: Professional email delivery with tracking
- **Null Price Handling**: Displays "По договаряне" for negotiable prices

---

## 🔐 Security Features

### Authentication
- ✅ Email/password authentication via Supabase Auth
- ✅ Email confirmation required for all registrations
- ✅ Session management with auto-refresh
- ✅ Logout from all devices support

### Password Management
- ✅ Secure password reset flow via email link
- ✅ Modern password reset page with form validation
- ✅ Change password from user profile (consumers & companies)
- ✅ Current password verification before change
- ✅ Password strength validation (minimum 6 characters)
- ✅ Success modal with redirect after password update

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Route guards (`requireAuth()`, `requireRole()`)
- ✅ Row Level Security (RLS) on all database tables
- ✅ Client-side and server-side validation
- ✅ Company verification gate — unverified companies cannot view job listings, send offers, or add favorites
- ✅ Automatic unlock on admin approval — no re-login required

### Admin Role Protection
- ✅ Registration only allows `consumer` and `company` roles
- ✅ Database trigger `handle_new_user()` rejects any other role (including `admin`) and defaults to `consumer`
- ✅ Admin accounts can only be created directly in the database by an existing administrator
- ✅ Prevents privilege escalation via API metadata manipulation

### Data Protection
- ✅ Environment variables for sensitive data
- ✅ No secrets exposed in client code
- ✅ HTTPS enforcement in production
- ✅ SQL injection prevention via parameterized queries

---

## 🗂️ Project Structure

```
RemontCo/
├── assets/
│   ├── css/
│   │   └── styles.css              # Custom CSS with brand colors
│   ├── images/                     # Image assets
│   └── attributions.md             # Image licenses
│
├── auth/
│   ├── login.html                  # Login page
│   ├── register.html               # Registration (consumer/company)
│   ├── forgot-password.html        # Password reset request
│   └── reset-password.html         # Password reset form
│
├── dashboard/
│   ├── consumer.html               # Consumer dashboard
│   ├── company.html                # Company dashboard
│   └── admin.html                  # Admin dashboard
│
├── database/
│   ├── schema.sql                  # Complete database schema
│   ├── rls_policies.sql            # Row Level Security policies
│   ├── seed_data.sql               # Initial categories data
│   ├── seed_demo_companies.sql     # Demo company data
│   ├── triggers/                   # Database triggers
│   │   └── create_company_on_register.sql
│   ├── webhooks/                   # Webhook configurations
│   └── README.md                   # Database setup guide
│
├── public/
│   └── i18n/
│       ├── bg.json                 # Bulgarian translations
│       └── en.json                 # English translations
│
├── src/
│   ├── components/
│   │   ├── navbar.js               # Dynamic navigation with demo modal
│   │   ├── footer.js               # Site footer
│   │   └── shared.js               # Shared utilities
│   │
│   ├── services/
│   │   ├── supabase.js             # Supabase client initialization
│   │   └── auth.js                 # Authentication service
│   │
│   ├── utils/
│   │   ├── i18n.js                 # Internationalization utility
│   │   ├── guards.js               # Route protection guards
│   │   ├── toast.js                # Toast notifications
│   │   └── confirmModal.js         # Confirm dialog replacement
│   │
│   └── pages/
│       ├── index.js                # Landing page logic
│       ├── login.js                # Login handling
│       ├── register.js             # Registration (with success modal)
│       ├── companies.js            # Company listing
│       ├── company_profile.js      # Company profile view
│       ├── consumer_dashboard.js   # Consumer dashboard logic
│       ├── company_dashboard.js    # Company dashboard logic
│       ├── admin_dashboard.js      # Admin dashboard logic
│       ├── forgot-password.js      # Password reset request
│       ├── reset-password.js       # Password reset handler
│       ├── about.js                # About page
│       └── docs.js                 # Documentation page
│
├── supabase/
│   └── functions/
│       ├── notify-admin/           # Admin notification function
│       ├── notify-company-verification/  # Company status emails
│       └── notify-new-quote/       # New quote notifications
│
├── index.html                      # Landing page
├── companies.html                  # Company listing page
├── company.html                    # Company profile page
├── about.html                      # About page
├── docs.html                       # Documentation & legal
│
├── vite.config.js                  # Vite MPA configuration
├── package.json                    # NPM dependencies
├── vercel.json                     # Vercel deployment config
├── .env.example                    # Environment template
└── README.md                       # This file
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm
- **Supabase account** (free tier is sufficient)
- **Brevo account** (for transactional emails)

### Step 1: Clone Repository
```bash
git clone https://github.com/teochupi/RemontCo.git
cd RemontCo
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### Step 4: Set Up Supabase

#### Database Setup
1. Create a new Supabase project
2. Run SQL files in order:
   - `database/schema.sql` - Tables and relations
   - `database/rls_policies.sql` - Security policies
   - `database/seed_data.sql` - Categories
   - `database/triggers/create_company_on_register.sql` - Company creation trigger

#### Edge Functions (Manual Deployment Required)
Deploy each function via Supabase Dashboard:
1. Go to Edge Functions
2. Create function with same name as folder
3. Copy code from `supabase/functions/[name]/index.ts`
4. Add secrets: `BREVO_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

#### Database Webhooks
Create webhooks in Supabase Dashboard:
- `on_company_created`: INSERT on `companies` table → `notify-admin`
- `on_job_created`: INSERT on `jobs` table → `notify-admin`

#### Email Configuration
1. Go to Authentication → SMTP Settings
2. Enable Custom SMTP
3. Configure Brevo SMTP:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: Your Brevo email
   - Password: Your Brevo SMTP key

#### Site URL Configuration
1. Go to Authentication → URL Configuration
2. Set Site URL to your production domain (e.g., `https://remontco.vercel.app`)

### Step 5: Run Development Server
```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

---

## 🌐 Deployment (Vercel)

### Configuration
The project is pre-configured for Vercel:
- ✅ Multi-page app (MPA) structure
- ✅ All pages defined in `vite.config.js`
- ✅ Root-relative URLs throughout
- ✅ No SPA rewrites needed
- ✅ `vercel.json` included

### Deploy Steps

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy via Vercel CLI**:
   ```bash
   npx vercel
   ```

3. **Configure environment variables** in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. **Update Supabase Settings**:
   - Site URL → Your Vercel domain
   - Redirect URLs → Add Vercel domain

---

## 📚 Service Categories

The platform supports 15 main categories with subcategories:

| Category | Bulgarian |
|----------|-----------|
| Interior Renovation | Вътрешен ремонт |
| Plumbing (ViK) | ВиК услуги |
| Electrical Services | Електрически услуги |
| Locksmith Services | Ключарски услуги |
| Painting & Finishing | Бояджийски услуги |
| Roofing & Drainage | Покриви и водоотвеждане |
| Construction | Строителство |
| Moving Services | Хамалски услуги |
| Interior Design | Интериорен дизайн |
| Landscaping | Озеленяване |
| Furniture | Мебели |
| Building Maintenance | Поддръжка на сгради |
| Cleaning Services | Почистване |
| Smart Home & Security | Умен дом и сигурност |
| Specialized Works | Специализирани дейности |

---

## 🧪 Demo Mode

Access demo mode directly from the navigation bar:

### Consumer Demo
- View sample job postings
- See how quotes are received
- Explore consumer dashboard features
- Cannot post real jobs

### Company Demo
- Browse sample job listings
- View company dashboard
- See quote submission process
- Cannot send real quotes

*Demo accounts use restricted functionality and sample data only.*

---

## 📄 License

MIT License - see LICENSE file for details

---

## 📞 Contact

- **Email**: support@remontco.bg
- **Website**: [remontco.bg](https://remontco.bg)
- **GitHub**: [github.com/teochupi/RemontCo](https://github.com/teochupi/RemontCo)

---

## 🙏 Acknowledgments

- Bootstrap team for excellent UI framework
- Supabase for powerful BaaS platform
- Brevo for reliable email delivery
- Unsplash & Pexels for royalty-free images

---

**Built with ❤️ by [Teodor Chupetlov](https://teodor-chupetlov.eu)**

*RemontCo - Making construction services transparent, legal, and trustworthy.*

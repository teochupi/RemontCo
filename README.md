# RemontCo - Trusted Construction Services Marketplace

## 🏗️ About RemontCo

**RemontCo** is a professional B2C marketplace platform that connects consumers with **verified, registered construction and property service companies**. Unlike typical marketplaces, RemontCo exclusively works with **legal entities (registered companies)** to ensure transparency, accountability, and consumer protection.

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
- **Providing transparency** through reviews and ratings
- **Ensuring legal protection** for all parties

This creates a fair, legal, and professional marketplace that benefits:
- **Consumers**: Get reliable contractors with legal accountability
- **Legitimate Companies**: Compete on a level playing field
- **Society**: Promotes tax compliance and economic transparency

---

## 🚀 Technologies Used

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **JavaScript (ES6+)** - Modern vanilla JS with ES Modules
- **Bootstrap 5.3** - Responsive UI framework
- **Bootstrap Icons** - Icon library
- **Vite** - Build tool and dev server

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS)
  - Storage (for images/documents)
  - **Edge Functions** - Serverless TypeScript functions for logic
  - **Database Webhooks** - Real-time triggers for events
- **Brevo API** - Professional transactional email delivery

### Internationalization
- Custom i18n system supporting **Bulgarian** and **English**
- JSON-based translation files

---

## 📋 Features

### Core Functionality

#### For Consumers
- ✅ Register and create profile
- ✅ Post job/ad requests
- ✅ Browse verified companies
- ✅ Receive competitive quotes
- ✅ Accept offers and manage projects
- ✅ Leave reviews for completed work

#### For Companies
- ✅ Register with BULSTAT/EIK verification
- ✅ Create company profile
- ✅ Specify services offered
- ✅ Browse approved job postings
- ✅ Send quotes to consumers
- ✅ Manage active projects

#### For Administrators
- ✅ Verify company registrations
- ✅ Moderate job postings
- ✅ Manage service categories
- ✅ Review disputes
- ✅ Platform analytics

### Security Features
- ✅ Email/password authentication
- ✅ Role-based access control (RBAC)
- ✅ Row Level Security (RLS) on all database tables
- ✅ Client-side route guards
- ✅ Company verification workflow

### 🔔 Automated Notifications
The platform includes a robust notification system powered by **Supabase Edge Functions** and **Brevo API**:
- 📧 **For Consumers**:
  - Instant email alerts for new messages.
  - Notifications when a new quote/offer is received.
  - Alerts if an ad/job needs modification (rejection reasons).
- 📧 **For Companies**:
  - Notifications for new messages from clients.
- 📧 **For Administrators**:
  - Alerts for new job postings requiring approval.
  - Notifications for new company registrations awaiting verification.
- 🌍 **Internationalization**: All emails are professionally designed and support **Bulgarian (Cyrillic)** without encoding issues.

---

## 🗂️ Project Structure

```
RemontCo/
├── assets/
│   ├── css/
│   │   └── styles.css          # Custom CSS with brand colors
│   ├── images/                 # Image assets
│   └── attributions.md         # Image licenses
│
├── auth/
│   ├── login.html              # Login page
│   └── register.html           # Registration page
│
├── dashboard/
│   ├── consumer.html           # Consumer dashboard
│   ├── company.html            # Company dashboard
│   └── admin.html              # Admin dashboard
│
├── ads/                        # Job/ad management pages
├── offers/                     # Quote/offer management
├── company/                    # Company profile pages
├── admin/                      # Admin tools
│
├── database/
│   ├── schema.sql              # Complete database schema
│   ├── rls_policies.sql        # Security policies
│   ├── seed_data.sql           # Initial data (categories)
│   └── README.md               # Database setup guide
│
├── i18n/
│   ├── bg.json                 # Bulgarian translations
│   └── en.json                 # English translations
│
├── src/
│   ├── components/
│   │   ├── navbar.js           # Dynamic navigation
│   │   └── footer.js           # Site footer
│   ├── services/
│   │   ├── supabase.js         # Supabase client
│   │   └── auth.js             # Authentication service
│   ├── utils/
│   │   ├── i18n.js             # Internationalization
│   │   └── guards.js           # Route protection
│   └── pages/                  # Page-specific scripts
│
├── index.html                  # Landing page
├── companies.html              # Company listing
├── about.html                  # About page
├── docs.html                   # Documentation & legal
│
├── vite.config.js              # Vite configuration (MPA)
├── package.json                # Dependencies
├── .env.example                # Environment template
└── README.md                   # This file
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm
- **Supabase account** (free tier is sufficient)

git clone https://github.com/teochupi/RemontCo.git
cd RemontCo

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project credentials:
   - Project URL
   - Anon/Public API Key
3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Fill in your credentials in `.env`:
   ```env
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
    ```

### Step 4: Set Up Database

Follow the detailed guide in [`database/README.md`](database/README.md):

1. Run `database/schema.sql` in Supabase SQL Editor
2. Run `database/rls_policies.sql`
3. Run `database/seed_data.sql`
4. Create admin user (see database README)

### Step 5: Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment (Vercel)

### Prerequisites
- Vercel account
- GitHub repository (optional but recommended)

### Deploy Steps

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Configure environment variables** in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. **Update Supabase Auth URLs**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel domain to allowed URLs

### Deployment Configuration

The project is already configured for Vercel deployment:
- ✅ Multi-page app (MPA) structure
- ✅ All pages defined in `vite.config.js`
- ✅ Root-relative URLs throughout
- ✅ No SPA rewrites needed

---

## 🔐 User Roles & Access Control

| Role | Access |
|------|--------|
| **Anonymous** | View landing page, companies list, about/docs |
| **Consumer** | Post jobs, receive quotes, manage projects, leave reviews |
| **Company Admin** | Manage company profile, browse jobs, send quotes, manage team |
| **Company Member** | Browse jobs, send quotes (limited company management) |
| **Admin** | Full platform access, verify companies, moderate content |

### Route Protection

All protected routes use authentication guards:
- `requireAuth()` - User must be logged in
- `requireRole(['role'])` - User must have specific role
- `requireCompanyAccess()` - User must be verified company member

---

## 🎨 Brand Identity

### Colors
- **Primary**: `#4F46E5` (Indigo) - Trust, professionalism
- **Secondary**: `#10B981` (Emerald) - Growth, success
- **Accent**: `#F59E0B` (Amber) - Action, attention
- **Dark**: `#0F172A` (Slate) - Text, headings

### Typography
- **Primary Font**: Montserrat (headings, UI)
- **Secondary Font**: Noto Sans (body text)
- Both fonts support **Cyrillic characters**

---

## 📚 Service Categories

The platform supports a comprehensive range of services:

- Interior Renovation
- Plumbing (ViK)
- Electrical Services
- Locksmith Services
- Painting & Finishing
- Roofing & Drainage
- Construction & House Building
- Moving Services
- Interior & Exterior Design
- Landscaping & Gardening
- Furniture & Custom Interiors
- Building Maintenance
- Cleaning Services
- Smart Home & Security
- Specialized Construction Works

Each category supports unlimited subcategories via hierarchical structure.

---

## 🧪 Demo Credentials

After setting up the database, create a demo admin user:

**Admin**
- Username: `admin`
- Password: `admin123`

Create test accounts via registration pages for other roles.

---

## 🤝 Contributing

This is a university capstone project. Contributions welcome for:
- Bug fixes
- Feature enhancements
- Translations
- Documentation improvements

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
- Unsplash & Pexels for royalty-free images

---

**Built by ❤️ [Teodor Chupetlov](https://teodor-chupetlov.eu)**

*RemontCo - Making construction services transparent, legal, and trustworthy.*

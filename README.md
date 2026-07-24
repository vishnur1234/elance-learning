# Elance Learning — Astro SSR + EmDash CMS

Production-ready backend for **Elance Learning**, built with **Astro 7 (Server Output)**, **EmDash CMS**, and **Supabase PostgreSQL** (or local **SQLite** for development).

---

## 📌 Architecture & Overview

- **Frontend**: Astro 7 SSR (`output: 'server'`), styled with Vanilla CSS.
- **CMS Engine**: [EmDash CMS](https://docs.emdashcms.com/) integrated via `emdash/astro`.
- **Live Content Collections**: Astro 7 `src/live.config.js` powered by `defineLiveCollection({ loader: emdashLoader() })`.
- **Middleware**: `src/middleware.js` executing `setup -> auth -> redirect`.
- **Admin Panel**: React-based admin dashboard at `/_emdash/admin`.
- **Visual Editing**: Inline edit mode toolbar enabled via `entry.edit` field proxies.

---

## 💾 Data Storage Strategy

EmDash supports dual-database architecture:

| Environment | Database | Storage Location | Connection Details |
|---|---|---|---|
| **Development** (`npm run dev`) | Local SQLite | `./data.db` | Fast, zero-setup WAL-mode SQLite database. Seeding & migrations run locally via `npx emdash seed`. |
| **Production** (`astro build` / Vercel) | Supabase PostgreSQL | Supabase Cloud | Configured via `DATABASE_URL` env variable using connection pooler (port `6543`). |

### Database Tables (Schema)
When collections are created, EmDash automatically generates and manages database tables prefixed with `ec_`:

- `ec_pages` — Page titles, hero headings, subtext, CTAs, SEO meta tags
- `ec_courses` — Course details, fees, duration, level, curriculum
- `ec_trainers` — Faculty bios, photos, social media links
- `ec_testimonials` — Student reviews, ratings, photos
- `ec_faq` — Categorized FAQ items (ACCA, CMA, General)
- `ec_blog` — Dynamic blog posts, excerpts, authors, featured images
- `ec_menus` — Navigation menus (header, footer, sidebar)
- `ec_settings` — Global site settings, logo, contact info, social links

---

## 📂 Project Structure

```text
elance-learning/
├── .emdash/
│   └── seed.json          # Master CMS collections & initial data seed file
├── public/
│   └── uploads/           # Media uploads placeholder directory
├── src/
│   ├── components/        # Reusable Astro components (Nav, Footer, etc.)
│   ├── lib/
│   │   └── cms.js         # Centralized EmDash query exports (getEmDashCollection, getEmDashEntry)
│   ├── utils/
│   │   ├── media.js       # Media URL & image prop extractors
│   │   └── seo.js         # SEO metadata generator helper
│   ├── pages/
│   │   ├── index.astro    # Homepage (bound to CMS 'home' page entry)
│   │   ├── blog.astro     # Dynamic blog post listing
│   │   ├── blog/[slug].astro # Dynamic blog post detail page with PortableText
│   │   ├── courses.astro  # Courses listing page
│   │   ├── acca.astro     # ACCA course page (bound to ACCA FAQs & trainers)
│   │   ├── cma.astro      # CMA course page (bound to CMA FAQs & trainers)
│   │   ├── about.astro    # About Us page (bound to trainers list)
│   │   ├── contact.astro  # Contact Us page (bound to global settings)
│   │   └── gallery.astro  # Gallery page
│   ├── live.config.js     # Astro 7 Live Content Collections configuration
│   └── middleware.js      # Official EmDash middleware chain
├── .env                   # Local environment variables (gitignored)
├── .env.example           # Environment variables template for team
├── astro.config.mjs       # Astro configuration (SSR, Node adapter, React, EmDash)
├── vercel.json            # Vercel deployment configuration
├── package.json           # Package dependencies
└── README.md              # Project documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# Supabase PostgreSQL — Production connection string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.uvsypcermzvgktrufhcw.supabase.co:5432/postgres

# Supabase Pooler (Recommended for Vercel Serverless)
# DATABASE_URL=postgresql://postgres.uvsypcermzvgktrufhcw:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# EmDash Secrets (Generated via: npx emdash secrets generate)
EMDASH_ENCRYPTION_KEY=emdash_enc_v1_SxfVispT5YyN98jwMtoxFVzBwvY1rwXOXcoG9PWz8QA

# Public Site URL
PUBLIC_SITE_URL=http://localhost:4321
```

---

## 🛠️ Commands & Workflow

All commands are executed from the terminal in the root directory:

| Command | Description |
|---|---|
| `npm install` | Installs all project dependencies |
| `npm run dev` | Starts the Astro development server at `http://localhost:4321` |
| `npx emdash seed .emdash/seed.json` | Seeds database schema, 8 collections, 50 fields & default content into `data.db` |
| `npx emdash secrets generate` | Generates a new 32-character encryption key for `.env` |
| `npx astro build` | Compiles the production SSR server bundle into `./dist/` |
| `npm run preview` | Runs the compiled server build locally to test production behavior |

---

## ✏️ How Content Editing Works

Content editors can manage site content using two complementary methods:

### Method 1: EmDash Admin Dashboard
1. Run `npm run dev` and navigate to **`http://localhost:4321/_emdash/admin`**.
2. Log in to the admin panel.
3. Access any collection (**Pages**, **Courses**, **Trainers**, **Testimonials**, **FAQ**, **Blog**, **Menus**, **Settings**) under **Content** in the sidebar.
4. Edit fields and click **Save** or **Publish**.

### Method 2: Visual Inline Editing (On Page)
1. Open the website at `http://localhost:4321/`.
2. Toggle the **Edit** switch on the floating EmDash toolbar at the bottom of the screen (`EmDash | Edit`).
3. Hover over annotated elements (such as hero headings or subtext) and click directly on the element to edit it inline on the page!

---

## 🚀 Deploying to Vercel

1. **Push your code to GitHub / GitLab**.
2. **Connect Project to Vercel**:
   - Import repository into Vercel Dashboard.
   - Framework Preset: `Astro`.
   - Output Directory: `.vercel/output`.
3. **Configure Environment Variables in Vercel**:
   - `DATABASE_URL`: Set your Supabase connection string (using port `6543` pooler).
   - `EMDASH_ENCRYPTION_KEY`: Set your generated encryption key.
   - `PUBLIC_SITE_URL`: Set your custom domain or Vercel URL.
4. **Deploy**: Click **Deploy**. Vercel will build the Astro Node server bundle and serve EmDash CMS seamlessly.

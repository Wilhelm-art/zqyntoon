# Product Requirements Document (PRD)
## Project: ZynqToon — Manga Reading Platform

**Version:** 1.0
**Status:** Draft
**Owner:** [Your name]
**Last updated:** [Date]

---

## 1. Overview

ZynqToon is a web-based manga reading platform designed for high organic discoverability (SEO), fast global performance (geo-optimization), and a clean, distraction-free reading experience across devices. The site will be prototyped using Google AI Studio's Build mode and moved into a production-grade stack for launch.

**Important scope note:** ZynqToon will only host content the operator has the legal right to distribute (licensed titles, official API partnerships, or original/creator-submitted work). **Licensing has been confirmed by the operator** as in place; the specific source/agreement details are tracked outside this PRD as a separate legal record.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Organic discoverability | Organic search traffic | Steady month-over-month growth post-launch |
| Fast global load times | Largest Contentful Paint (LCP) | < 2.5s on 4G, all target regions |
| Mobile-first usability | Mobile traffic share / bounce rate | Bounce rate < 40% on reader pages |
| Reader retention | Return visit rate / chapters read per session | Increasing week-over-week |
| Content freshness (SEO signal) | New chapters published per day | Daily updates on active series |

---

## 3. Target Audience

- Manga readers aged 15–35, primarily mobile-first.
- **Launch languages/regions: Indonesian (ID) and English (EN).** Site must support both from v1, not added later.
- Casual browsers (discover via search/genre) and dedicated readers (bookmark, follow series, notifications).

---

## 4. Platform & Tooling

| Layer | Choice | Notes |
|---|---|---|
| Prototyping | Google AI Studio (Build mode) | Used to scaffold UI/UX and basic logic via natural-language prompting; export code (ZIP/GitHub) once structure is validated |
| Frontend framework | Next.js (React) | Required for SSR/SSG — critical for SEO on content-heavy sites |
| Styling | Tailwind CSS | Fast, consistent responsive design system |
| Backend | Next.js API routes / Node.js (Express) | Compatible with AI Studio exports |
| Database | PostgreSQL (Supabase or Neon) | Relational structure fits series → chapters → pages |
| Image storage/CDN | Cloudflare R2 or Bunny CDN | Manga pages are storage- and bandwidth-heavy; CDN required for geo performance |
| Auth | NextAuth.js / Clerk / Supabase Auth | User accounts, bookmarks, history |
| Search | Meilisearch or Algolia | Title/genre/author search |
| Hosting | Vercel (frontend) + Cloud Run/Railway (backend) | Edge network improves geo performance automatically |

---

## 5. Site Map / Information Architecture

```
/                          Homepage — trending, latest updates, genres
/manga/[slug]              Series page — synopsis, cover, chapter list, status
/manga/[slug]/chapter-[n]  Reader page — image viewer
/genre/[genre]             Genre browse page
/search                    Search results
/latest                    Latest chapter updates feed
/bookmarks                 User's saved series (auth required)
/user/[username]           Public profile (optional, v2)
/sitemap.xml, /robots.txt  SEO infrastructure
/admin                     CMS for content management (internal only)
```

---

## 6. Functional Requirements

### 6.1 Reader Experience (P0)
- Vertical scroll AND paged reading modes, user-toggleable.
- Preload next 2–3 pages while reading.
- Lazy-load all below-the-fold images.
- Dark mode as default theme.
- "Next chapter" prompt at end of chapter.
- Pinch-to-zoom on mobile.
- Minimal reader UI chrome (full-bleed images, floating nav).

### 6.2 Content Browsing (P0)
- Homepage with trending, latest updates, and genre sections.
- Series detail page: synopsis, cover art, author/artist, status (ongoing/completed), chapter list.
- Genre browse pages with filtering.
- Search by title, author, genre.

### 6.3 User Accounts (P1)
- Sign up / login (email + OAuth).
- Bookmark series, track last-read chapter per series.
- Reading history.
- Comments per chapter/series, with **automatic moderation**: profanity/spam filtering, rate limiting per user, and auto-flagging of reported content for removal without requiring manual review for standard cases. Manual escalation path reserved for edge cases only.

### 6.4 Admin / CMS (P0)
- Bulk chapter upload with automatic page ordering.
- Series metadata editor (title, synopsis, tags, genres, status).
- Scheduled/staged releases.
- All series synopses, tags, and alt text must be **human-written**, not AI-generated (see Section 9).

---

## 7. Data Model (Core Entities)

```
users      (id, username, email, password_hash, country, created_at)
series     (id, title, slug, synopsis, cover_url, status, author, artist, genres[], created_at, updated_at)
chapters   (id, series_id, chapter_number, title, release_date, view_count)
pages      (id, chapter_id, page_number, image_url, width, height)
bookmarks  (user_id, series_id, last_read_chapter_id)
comments   (id, user_id, chapter_id/series_id, body, created_at)
genres     (id, name, slug)
```

---

## 8. SEO Requirements (P0)

- **Rendering:** Server-side rendering / incremental static regeneration for all series and chapter pages — no client-only JS shells.
- **Structured data:** Schema.org `Book`/`CreativeWorkSeries` + `Chapter` markup; `BreadcrumbList` on navigation.
- **URLs:** Clean, keyword-rich slugs (`/manga/title-name/chapter-179`) — no query-string chapter IDs.
- **Metadata:** Unique, human-written title/description per page (no templated AI filler).
- **Images:** Descriptive `alt` text on every page/cover image; WebP/AVIF format; explicit `width`/`height` to prevent layout shift.
- **Internal linking:** Related series, genre cross-links, "you may also like" modules.
- **Sitemaps:** Auto-generated, split by type (series sitemap, chapter sitemap) given expected chapter volume.
- **Freshness signal:** Daily-updating "latest updates" feed.
- **Core Web Vitals:** LCP, CLS, and INP must pass "Good" thresholds in Search Console.

---

## 9. Content Policy

- No AI-generated text content (synopses, descriptions, meta text, articles) — all such content must be human-authored. This is both a stated product requirement and an SEO safeguard, since search engines penalize low-quality AI-generated content at scale.
- All hosted manga content must be properly licensed or rights-cleared before publication (see Section 1 scope note).
- AI tooling (e.g., Google AI Studio) may be used for **code/UI scaffolding only** — not for generating reader-facing text content.

---

## 10. Geographic Optimization (P0)

- **Launch languages: Indonesian and English**, served via subdirectories — `/id/` and `/en/` (with `/en/` as default/root or a clear redirect based on browser locale + IP geolocation).
- `hreflang="id"` / `hreflang="en"` / `hreflang="x-default"` tags on every localized page pair.
- Series and chapter metadata (synopsis, titles) require separate human-written copy per language — not machine-translated duplicates, to avoid thin/duplicate-content SEO issues.
- CDN edge caching (Cloudflare/Vercel Edge) for consistent load times across Indonesia and English-speaking regions.
- Google Search Console configured with two properties/geo-targets: `/id/` targeted to Indonesia, `/en/` left ungeo-targeted (international).
- Localized content modules (regional trending lists) shown per language, not just UI translation.

---

## 11. Responsive Design Requirements (P0)

- Mobile-first build; majority of traffic expected on mobile.
- Breakpoints: mobile (default) → tablet (768px) → desktop (1024px+).
- Reader view adapts image sizing to viewport without forced pinch-zoom on mobile.
- Touch-friendly navigation (optional swipe-between-pages).
- Validated against Core Web Vitals on real mobile devices, not emulators only.

---

## 12. Non-Functional Requirements

- **Performance:** LCP < 2.5s on 4G across target regions.
- **Scalability:** Architecture must handle high image-serving volume without origin overload (CDN-first).
- **Security:** Standard auth hardening, rate limiting on admin/API routes, signed upload URLs for CMS.
- **Availability:** Target 99.9% uptime post-launch.

---

## 13. Monetization (P1)

Confirmed monetization model for v1: **advertising + donations**.

- **Ads: Adsterra** ([adsterra.com](https://adsterra.com)) — display/popunder/banner units on series pages and between reader pages. Must not block LCP or degrade Core Web Vitals — lazy-load ad units below the fold, reserve fixed ad slot dimensions to avoid layout shift (CLS). Popunder/interstitial formats (if used) must be capped in frequency and never trigger mid-chapter, to avoid breaking reading immersion and harming Core Web Vitals/UX-based SEO signals.
- **Donations: Saweria** ([saweria.co](https://saweria.co)) — linked from user profile/footer and optionally per-series. Note Saweria is Indonesia-focused (local payment methods: QRIS, e-wallets, bank transfer); since the EN audience is also in scope, evaluate whether an additional international-friendly donation option is needed in a later phase.
- No paywalled/subscription content in v1 (see Out of Scope).
- Ad density and placement should be balanced against reader experience — avoid interstitials that break immersion mid-chapter.

## 14. Roadmap / Milestones

| Phase | Deliverable |
|---|---|
| Phase 1 | Prototype homepage, series page, reader UI in Google AI Studio; export code |
| Phase 2 | Production setup: Next.js repo, PostgreSQL, CDN, admin CMS |
| Phase 3 | Core features: auth, bookmarks, search, reader preloading |
| Phase 4 | SEO hardening: structured data, sitemaps, human-written metadata, Core Web Vitals pass |
| Phase 5 | Launch: Search Console/Analytics setup, sitemap submission, daily content cadence begins |

---

## 15. Out of Scope (v1)

- Native mobile apps (Android/iOS).
- Paid subscriptions / premium tiers.
- User-generated fan translations/uploads.
- Multi-language UI beyond Indonesian and English.

---

## 16. Open Questions

- Specific licensing source/agreement documentation (tracked outside this PRD — confirm where it's stored).
- Escalation criteria for comment moderation edge cases not caught by automatic filtering.
- Whether an international-friendly donation option is needed alongside Saweria for the English/non-Indonesia audience.

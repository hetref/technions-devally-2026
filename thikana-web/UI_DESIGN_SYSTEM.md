# Thikana — UI/UX Design System

> **Purpose**: This document is the single source of truth for all design decisions made in the Thikana web app. Reference this before building any new page, component, or section to ensure consistency.

---

## 1. Typography

### Font Stack

| Role | Font | Weights Used | CSS Variable |
|------|------|-------------|--------------|
| **Headings** (h1–h6) | **Bricolage Grotesque** | 400, 500, 600, 700, 800 | `--font-heading` |
| **Body / UI** | **Manrope** | 400, 500, 600, 700, 800 | `--font-body` |

Both fonts are loaded via `next/font/google` in `app/layout.js` and self-hosted (no external requests at runtime).

### How to Apply

```jsx
// Headings — always use the CSS variable
style={{ fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif" }}

// Body — set on the root <div> of every page
style={{ fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif" }}
```

### Heading Scale

| Tag | Size | Weight | Tracking | Usage |
|-----|------|--------|----------|-------|
| `h1` (hero) | `56–80px` | 800 extrabold | `-0.03em` | Page hero titles |
| `h1` (auth) | `38–48px` | 800 extrabold | `-0.02em` | Login/signup headings |
| `h2` (section) | `28–44px` | 700–800 | `-0.02em` | Section titles |
| `h3` (card) | `17–26px` | 700–800 | `-0.01em` | Card headings |
| `h4` (label) | `13–16px` | 700 | `0` | Sub-labels |

### Body Text Scale

| Usage | Size | Weight | Color |
|-------|------|--------|-------|
| Primary body | `14–15px` | 400–500 | `#1A1A1A` |
| Secondary / descriptions | `13px` | 400 | `#888` |
| Small labels / captions | `11–12px` | 600–700 | `#888` or `#C8B99A` |
| Section eyebrows | `11px` | 700, UPPERCASE, `tracking-widest` | `#C8B99A` |

### Eyebrow Labels (Section Tags)
Every section or card should have a small eyebrow label above the heading:
```jsx
<p className="text-[#C8B99A] text-xs font-bold tracking-widest uppercase mb-6">
  Our Story
</p>
```

---

## 2. Color Palette

### Core Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Warm White** | `#F7F6F3` | Page background, left auth panels |
| **Charcoal** | `#2B2B2B` | Hero / dark sections background |
| **Near Black** | `#1A1A1A` | Primary text, buttons, footer body |
| **Footer Black** | `#1E1E1E` | Footer background |
| **Caramel Accent** | `#C8B99A` | Primary accent — CTAs, highlights, eyebrows, icons |
| **Caramel Dark** | `#B8A88A` | Caramel hover state |
| **Section Gray** | `#EEEAE4` | Alternate section backgrounds |
| **Card Background** | `#E8DDD0` | Hero image panel, warm tones |
| **White** | `#FFFFFF` | Cards, form inputs |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary text | `#1A1A1A` | All body headings and main text |
| Secondary text | `#888` | Descriptions, captions, placeholders |
| Muted text | `#555` | Nav links (default state) |
| On-dark text | `white / white/60 / white/40` | Text on `#2B2B2B` backgrounds |

### Accent Colors (Icons & Badges Only)

These are used **only** for icons, tag backgrounds, and dot indicators — never for large blocks:

| Color | Hex | Context |
|-------|-----|---------|
| Teal | `#4A7C6F` | Discovery / geo features |
| Earth Brown | `#8B6F4E` | Commerce / marketplace |
| Indigo | `#5B5EA6` | Tech / web builder |
| Muted Red | `#B85C57` | Analytics / backend |

Icon background pattern:
```jsx
style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}30` }}
```

---

## 3. Spacing & Layout

### Container

```jsx
// Max width container — use on every page's <main>
className="max-w-[1280px] mx-auto px-4 sm:px-6"
```

### Section Spacing

```
Between sections:        space-y-8 (on <main>)
Inside sections:         p-8 md:p-12 or p-8 md:p-16
Top padding (below nav): pt-32 (home), pt-36–pt-40 (sub-pages)
```

### Border Radius System

| Size | Value | Usage |
|------|-------|-------|
| Page sections | `rounded-[32px]` | All major section containers |
| Cards | `rounded-[24px]` | Standard content cards |
| Small / tech cards | `rounded-[20px]` | Compact cards |
| Icon containers | `rounded-2xl` (16px) | Icon badge backgrounds |
| Buttons | `rounded-full` | All CTA and pill buttons |
| Image thumbnails | `rounded-[16px]` | Images inside cards |
| Auth panels | `rounded-[28px]` | Right-side branded panel |

---

## 4. Component Patterns

### Buttons

```jsx
// Primary (dark)
<button className="bg-[#1A1A1A] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#333] transition flex items-center gap-2">
  Get Started <ArrowRight className="w-4 h-4" />
</button>

// Primary (caramel accent)
<button className="bg-[#C8B99A] text-[#1A1A1A] px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#b8a88a] transition">
  Get Started
</button>

// Secondary (outlined)
<button className="border border-[#DDD8CF] text-[#1A1A1A] px-7 py-3.5 rounded-full text-sm font-semibold hover:bg-[#F0ECE6] transition">
  Learn More
</button>

// Ghost (on dark backgrounds)
<button className="border border-white/20 text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-white/8 transition">
  Learn More
</button>
```

### Cards

```jsx
// Standard white card
<div className="bg-white rounded-[24px] p-8 flex flex-col border border-[#E8E4DC] shadow-sm">

// Dark card (value proposition)
<div className="bg-[#1A1A1A] text-white rounded-[32px] p-10 flex flex-col min-h-[380px] shadow-sm relative overflow-hidden">

// Section container (gray bg)
<section className="bg-[#EEEAE4] rounded-[32px] p-8 md:p-12">
```

### Icon Badges

```jsx
<div
  className="w-12 h-12 rounded-2xl flex items-center justify-center"
  style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}30` }}
>
  <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} />
</div>
```

### Eyebrow + Heading Pattern (All Sections)

```jsx
<p className="text-[#C8B99A] text-xs font-bold tracking-widest uppercase mb-6">Section Label</p>
<h2
  className="text-[36px] font-black mb-4 tracking-tight"
  style={{ fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif" }}
>
  Section Heading
</h2>
```

### Section Dividers

```jsx
<div className="h-px bg-[#E5E5E5] w-full" />    // light sections
<div className="h-px bg-white/10 w-full" />       // dark sections
```

---

## 5. Navbar (`components/Navbar.js`)

The navbar is a **shared component** — import `<Navbar />` on every page. Never recreate it inline.

### Behavior

| State | Width | Background | Radius | Padding |
|-------|-------|-----------|--------|---------|
| Top (not scrolled) | 100%, max 1280px | transparent | 0 | 20px 32px |
| Scrolled (>50px) | 85%, max 900px, top 16px | white/96 + blur | 999px (pill) | 10px 24px |

- Smooth framer-motion `transition: 0.4s easeInOut`
- `usePathname()` auto-bolds the active nav link

### Nav Links

```
Home    →  /
About   →  /about
Pricing →  /pricing
Contact →  /contact
```

### Usage

```jsx
import Navbar from "@/components/Navbar";
// In every page:
<Navbar />
```

---

## 6. Animation System

All animations use **Framer Motion**. Smooth scrolling uses **Lenis** (homepage only).

### `<FadeSection>` — Scroll fade-in wrapper

```jsx
// Fades + slides up 40px when scrolled into view (once)
<FadeSection className="bg-[#EEEAE4] rounded-[32px] p-12" delay={0.1}>
  ...content...
</FadeSection>
```

### `<AnimatedHeadline>` — Word-by-word reveal

```jsx
// Splits heading string into words, each pops in sequentially
<AnimatedHeadline className="text-[36px] font-black">
  Simple scalable pricing
</AnimatedHeadline>
```

### Standard Animation Props

```jsx
// Fade up on scroll
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: 0.12 }}
transition={{ duration: 0.75, ease: "easeOut" }}

// Staggered cards
transition={{ delay: idx * 0.1, duration: 0.6 }}

// Hover lift
whileHover={{ y: -4 }}    // standard cards
whileHover={{ y: -6 }}    // tech/feature cards

// Page entry
initial={{ opacity: 0, x: -40 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.9, ease: "easeOut" }}
```

---

## 7. Page Layouts

### Marketing Pages (Home, About, Pricing, Contact)

```
<div bg-[#F7F6F3]>
  <Navbar />                           ← fixed, shared
  <main max-w-[1280px] pt-32>
    <FadeSection rounded-[32px]>       ← every section
    ...
  </main>
  <footer bg-[#1E1E1E] rounded-t-[40px]>
    <div bg-[#C8B99A]> CTA strip </div>
    <div> links + copyright </div>
  </footer>
</div>
```

### Section Background Rotation

Alternate these backgrounds as you go down the page:

```
1. bg-[#2B2B2B]   ← Hero (dark charcoal)
2. bg-[#F7F6F3]   ← Features row (page bg, no container)
3. bg-[#EEEAE4]   ← Key modules (warm gray)
4. bg-white        ← Problems / text-heavy
5. bg-[#EEEAE4]   ← Testimonials
6. bg-white        ← Pricing
7. bg-[#2B2B2B]   ← Stats / vision (dark)
8. bg-[#EEEAE4]   ← Technology
9. bg-[#EEEAE4]   ← Value proposition
```

### Auth Pages (Login, Register, Business Registration)

```
<div bg-[#F7F6F3] flex-row min-h-[100svh]>

  <section flex-1>            ← Left: form
    <Link ArrowLeft "Back">   ← absolute top-left
    <Image logo>
    <h1 Bricolage 48px>
    <p description>
    <FormComponent />
    <p link to login/register>
  </section>

  <section w-[45%] sticky>    ← Right: branded panel
    <div rounded-[28px] bg-cover>
      <div overlay bg-[#1A1A1A]/65>
      <span badge top-left>
      <div bottom>
        <h2 white Bricolage>
        <perks with caramel icons>
      </div>
    </div>
  </section>

</div>
```

---

## 8. Footer Pattern

```jsx
<footer className="bg-[#1E1E1E] text-white rounded-t-[40px] overflow-hidden">
  {/* Always include caramel CTA strip */}
  <div className="bg-[#C8B99A] px-8 md:px-20 py-12 flex justify-between">
    <h3>Ready to grow your local business?</h3>
    <Link href="/signup">Get Started Free</Link>
  </div>
  {/* 5-col grid: Brand(2) + Platform + Company + Legal */}
  <div className="px-8 md:px-20 pt-16 pb-10">
    <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
      ...
    </div>
    {/* Bottom: logo | copyright | quick links */}
  </div>
</footer>
```

---

## 9. Forms

```jsx
// Label
<label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2">
  Field Name
</label>

// Input
<input className="w-full bg-white border border-[#E8E4DC] rounded-[12px] px-4 py-3.5 text-[14px] text-[#1A1A1A] placeholder-[#BDBDBD] focus:outline-none focus:border-[#C8B99A] transition" />

// Textarea
<textarea className="w-full bg-white border border-[#E8E4DC] rounded-[12px] px-4 py-3.5 text-[14px] text-[#1A1A1A] placeholder-[#BDBDBD] focus:outline-none focus:border-[#C8B99A] transition resize-none" />

// Select
<select className="w-full bg-white border border-[#E8E4DC] rounded-[12px] px-4 py-3.5 text-[14px] text-[#1A1A1A] focus:outline-none focus:border-[#C8B99A] transition appearance-none" />
```

**Focus state**: border turns `#C8B99A` (caramel accent)

---

## 10. Images

All images from **Unsplash**: `?auto=format&fit=crop&q=80&w={width}`

### Unsplash Photo IDs Used

| Context | Photo ID |
|---------|----------|
| Hero dashboard / analytics | `photo-1551288049-bebda4e38f71` |
| Franchise / business | `photo-1542744094-3a31f272c490` |
| Marketplace / services | `photo-1556742049-0cfed4f6a45d` |
| Website builder / tech | `photo-1460925895917-afdab827c52f` |
| Team / office | `photo-1542744173-8e7e53415bb0` |
| Business owner | `photo-1556740738-b6a63e27c4df` |
| Storefront | `photo-1516321318423-f06f85e504b3` |
| Avatar (female) | `photo-1573496359142-b8d87734a5a2` |

### Image Rules

- **No `mix-blend-multiply`** — show images in full color
- **Hover zoom**: `hover:scale-105 transition-transform duration-700`
- **Hero subtle overlay**: `<div className="absolute inset-0 bg-[#2B2B2B]/10 pointer-events-none" />`
- **Auth right panel**: `bg-[#1A1A1A]/65` to `/70` overlay on top of image

---

## 11. Pages Built

| Route | File | Status |
|-------|------|--------|
| `/` | `app/page.js` | ✅ Complete |
| `/about` | `app/about/page.js` | ✅ Complete |
| `/pricing` | `app/pricing/page.js` | ✅ Complete |
| `/contact` | `app/contact/page.js` | ✅ Complete |
| `/login` | `app/(auth)/login/page.jsx` | ✅ Complete |
| `/register` | `app/(auth)/register/page.jsx` | ✅ Complete |
| `/register/business` | `app/(auth)/register/business/page.jsx` | ✅ Complete |

---

## 12. Shared Components

| Component | Path | Notes |
|-----------|------|-------|
| `Navbar` | `components/Navbar.js` | Animated pill navbar — use on every marketing page |
| `LoginForm` | `components/auth/LoginForm` | Keep logic untouched |
| `SignUpForm` | `components/auth/SignUpForm` | Keep logic untouched |
| `BusinessRegistration` | `components/auth/BusinessRegistration` | Keep logic untouched |

---

## 13. Rules for Every New Page

1. **Page background** → `bg-[#F7F6F3]`
2. **Import `<Navbar />`** — never recreate inline
3. **Main padding** → `pt-32` to clear fixed navbar
4. **Wrap every section** in `<FadeSection>` for scroll animations
5. **Section containers** → `rounded-[32px]` always
6. **Alternate section backgrounds** (see section 7 rotation list above)
7. **All headings** → `fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif"`
8. **Every section** → caramel eyebrow label before the heading
9. **End marketing pages** → standard footer with caramel CTA strip + dark body
10. **Buttons** → always `rounded-full` pill — never square or rectangular
11. **Icons** → `lucide-react` only, `strokeWidth={1.8}`, `w-5 h-5`
12. **Card hover** → `whileHover={{ y: -4 }}` or `{ y: -6 }`
13. **No gradients, neon, glassmorphism, or emojis** — editorial and clean only

---

## 14. Tech Stack

```
Framework:    Next.js (App Router)
Styling:      Tailwind CSS v4
Animations:   Framer Motion
Scroll:       Lenis smooth scroll
Icons:        Lucide React
Fonts:        next/font/google — Bricolage Grotesque + Manrope
Images:       Unsplash (static CDN URLs)
Payments:     Razorpay
Backend:      Firebase (Auth, Firestore, Realtime DB)
Hosting:      AWS S3 + CloudFront
Search:       Algolia
```

---

*Thikana UI Design System v1.0 — March 2026*

# 🏠 Thikana — Empower Your Local Business

> **One platform. Every local business.**  
> Thikana is an all-in-one SaaS platform combining geo-based business discovery, no-code website building, inventory & order management, payments (Razorpay), and an AI-powered recommendation engine — all in one place.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Monorepo Structure](#-monorepo-structure)
3. [thikana-api — FastAPI Recommendation Engine](#-thikana-api--fastapi-recommendation-engine)
   - [Architecture](#api-architecture)
   - [Directory Structure](#api-directory-structure)
   - [API Endpoints](#api-endpoints)
   - [Scoring Algorithm — Post Feed](#scoring-algorithm--post-feed)
   - [Scoring Algorithm — Who to Follow](#scoring-algorithm--who-to-follow)
   - [Analytics Engine](#analytics-engine)
   - [Data Flow Flowcharts](#api-data-flow-flowcharts)
   - [Setup & Running Locally](#api-setup--running-locally)
4. [thikana-web — Next.js Frontend](#-thikana-web--nextjs-frontend)
   - [Architecture](#web-architecture)
   - [Directory Structure](#web-directory-structure)
   - [Pages & Routes](#pages--routes)
   - [Key Features](#key-features)
   - [Component Map](#component-map)
   - [State Management](#state-management)
   - [Data Flow Flowcharts](#web-data-flow-flowcharts)
   - [Setup & Running Locally](#web-setup--running-locally)
5. [Full System Architecture](#-full-system-architecture)
6. [Tech Stack](#-tech-stack)
7. [Environment Variables](#-environment-variables)
8. [Pricing Plans](#-pricing-plans)

---

## 🌐 Project Overview

**Thikana** solves a real problem: local businesses have no single digital home on the internet. Thikana gives any shop owner — a neighbourhood gym, family restaurant, or corner pharmacy — a complete digital presence with:

- 📍 **Geo-based Discovery** — hyperlocal search via geohash indexing
- 🌐 **No-Code Website Builder** — drag-and-drop GrapesJS powered builder
- 💳 **Payments** — Razorpay integration for products, bookings & subscriptions
- 📊 **Analytics** — spending anomaly detection, predictions, and insights
- 🤝 **Social Graph** — follow businesses, curated post feed, "Who to Follow"
- 🏢 **Franchise Management** — multi-outlet dashboards and delegated access
- 📦 **Inventory & Orders** — full product catalog with order email notifications

---

## 🗂 Monorepo Structure

```
technions-devally-2026/
├── thikana-api/         # FastAPI recommendation & analytics backend (Python)
└── thikana-web/         # Next.js 16 full-stack frontend (JavaScript/React 19)
```

---

## 🐍 thikana-api — FastAPI Recommendation Engine

### API Architecture

The API is a **pure Python** FastAPI microservice responsible for:
- Computing personalised post feeds
- Building "Who to Follow" business discovery lists
- Running financial analytics (anomaly detection, spending insights, predictions, recommendations)

It follows a strict **layered architecture** — routes only route, all logic is in `engine/` and `models/`.

```mermaid
flowchart TB
    Client([Client / Next.js])
    
    subgraph FastAPI["FastAPI App (main.py)"]
        direction TB
        MW[CORS Middleware]
        RF["/feed Router"]
        RD["/discovery Router"]
        RA["/analytics Router"]
    end
    
    subgraph Engine["engine/"]
        AS[assembler.py\nCoordinates data + scoring]
        FE[fetcher.py\nDB reads only]
        SC[scorer.py\nPure scoring logic]
    end
    
    subgraph Models["models/"]
        AD[anomaly_detector.py]
        SI[spending_insights.py]
        ER[expense_recommender.py]
        SP[spending_predictor.py]
    end
    
    subgraph DB["db/"]
        FB[firebase.py\nLive Firestore]
        MK[mock.py\nMock JSON data]
    end

    subgraph Config["config.py"]
        CFG[USE_MOCK · MAX_RADIUS_KM\nSCORING WEIGHTS · GEOHASH_PRECISION]
    end

    Client --> MW --> RF & RD & RA
    RF --> AS
    RD --> AS
    AS --> FE --> FB & MK
    AS --> SC
    RA --> AD & SI & ER & SP
    Config -.-> AS & FE & SC
```

### API Directory Structure

```
thikana-api/
├── main.py                    # FastAPI app entry point, registers routers
├── config.py                  # Single source of truth for ALL settings
├── requirements.txt           # Python dependencies
├── conftest.py                # Pytest configuration
│
├── routes/                    # HTTP layer ONLY — no business logic
│   ├── feed.py                # GET /feed/{user_id}
│   ├── discovery.py           # GET /discovery/who-to-follow/{user_id}
│   └── analytics.py           # GET /analytics/* (4 endpoints)
│
├── engine/                    # Recommendation engine (Feed + Discovery)
│   ├── assembler.py           # Orchestrates fetcher + scorer
│   ├── fetcher.py             # All DB reads go here
│   ├── geohash_utils.py       # Geohash cell computation helpers
│   └── scorer.py              # Pure stateless scoring (no I/O)
│
├── core/                      # Legacy engine (v1, kept for reference)
│   ├── assembler.py
│   ├── geohash_utils.py
│   └── scorer.py
│
├── models/                    # Financial analytics models
│   ├── anomaly_detector.py    # Statistical anomaly detection
│   ├── spending_insights.py   # Category + behavioral analysis
│   ├── expense_recommender.py # Budget + saving recommendations
│   └── spending_predictor.py  # Next-month WMA forecast
│
├── db/                        # Data access layer
│   ├── base.py                # Abstract DB interface
│   ├── firebase.py            # Live Firestore implementation
│   └── mock.py                # Mock JSON implementation
│
├── data/
│   └── mock_db.json           # Local mock data for dev/tests
│
└── tests/                     # Pytest test suite
```

### API Endpoints

| Method | Path | Tag | Description |
|--------|------|-----|-------------|
| `GET` | `/` | Health | Health check — returns `{status: "ok", version: "2.0.0"}` |
| `GET` | `/feed/{user_id}` | Feed | Personalised ranked post feed |
| `GET` | `/discovery/who-to-follow/{user_id}` | Discovery | Nearby businesses to follow |
| `GET` | `/analytics/anomalies/{user_id}` | Analytics | Detect unusual transactions |
| `GET` | `/analytics/insights/{user_id}` | Analytics | Spending habits & actionable insights |
| `GET` | `/analytics/recommendations/{user_id}` | Analytics | Budget & saving strategies |
| `GET` | `/analytics/predictions/{user_id}` | Analytics | Next-month spending forecast |

**Query Parameters for `/feed/{user_id}`:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `lat` | float | ✅ | — | User's latitude (-90 to 90) |
| `lon` | float | ✅ | — | User's longitude (-180 to 180) |
| `limit` | int | ❌ | 20 | Max posts returned (1–50) |

---

### Scoring Algorithm — Post Feed

Each post is scored using a **weighted sum of three signals**:

| Signal | Weight | Logic |
|--------|--------|-------|
| Following | **55%** | `1.0` if user follows the business, else `0.0` |
| Location | **35%** | Linear decay from `1.0` at 0km to `0.0` at 10km (Haversine) |
| Recency | **10%** | Linear decay from `1.0` (now) to `0.0` at 168 hours (7 days) |

```
score = (following × 0.55) + (location × 0.35) + (recency × 0.10)
```

```mermaid
flowchart LR
    Post([Post candidate])
    F{"Is business\nfollowed?"}
    L[Distance\nHaversine km]
    R[Hours old\nsince createdAt]
    
    FS["following_signal\n1.0 or 0.0"]
    LS["location_signal\nmax(0, 1 - dist/10)"]
    RS["recency_signal\nmax(0, 1 - hrs/168)"]
    
    SUM["score =\n0.55×F + 0.35×L + 0.10×R"]
    OUT([Score ∈ 0.0–1.0])
    
    Post --> F --> FS
    Post --> L --> LS
    Post --> R --> RS
    FS & LS & RS --> SUM --> OUT
```

---

### Scoring Algorithm — Who to Follow

Businesses are scored for the discovery list using two signals:

| Signal | Weight | Logic |
|--------|--------|-------|
| Location | **70%** | Linear decay `1.0` at 0km → `0.0` at 10km |
| Activity | **30%** | `postCount / 20` (normalised, capped at 1.0) |

```mermaid
flowchart LR
    Biz([Business candidate])
    D[Distance km\npre-computed]
    P[postCount]

    LS["location_signal\nmax(0, 1 - dist/10)"]
    AS["activity_signal\nmin(postCount,20)/20"]

    SUM["score =\n0.70×L + 0.30×A"]
    OUT([Score ∈ 0.0–1.0])

    Biz --> D --> LS
    Biz --> P --> AS
    LS & AS --> SUM --> OUT
```

---

### Analytics Engine

Four independent, stateless models in `models/`:

```mermaid
flowchart TD
    TXN[(Transaction data\nFirestore / mock_db.json)]
    
    subgraph Analytics["models/"]
        AD["anomaly_detector.py\n• category_spike\n• rolling_spike\n• rapid_succession\nSeverity: medium / high"]
        SI["spending_insights.py\n• spending_patterns\n• category_analysis\n• saving_opportunities\n• behavioral_insights\n• recommendations"]
        ER["expense_recommender.py\n• budget_suggestions\n• timing_optimization\n• saving_opportunities\n• category_tips"]
        SP["spending_predictor.py\n• WMA forecast\n• trend: increasing/stable/decreasing\n• confidence: high/medium/low\n• lower/upper bounds"]
    end
    
    TXN --> AD & SI & ER & SP
```

---

### API Data Flow Flowcharts

#### `/feed/{user_id}` — Build Post Feed

```mermaid
sequenceDiagram
    participant Client
    participant Route as routes/feed.py
    participant Asm as engine/assembler.py
    participant Fetch as engine/fetcher.py
    participant Score as engine/scorer.py
    participant DB as Firebase/Mock

    Client->>Route: GET /feed/{user_id}?lat=&lon=&limit=
    Route->>Asm: build_feed(user_id, lat, lon, limit)
    Asm->>Fetch: get_following_ids(user_id)
    Fetch->>DB: users/{user_id}/following
    DB-->>Fetch: [biz_id, ...]
    Asm->>Fetch: get_nearby_businesses(lat, lon)
    Fetch->>DB: location_index (9 geohash cells)
    DB-->>Fetch: {biz_id: distance_km}
    Note over Asm: Union: followed ∪ nearby − self
    Asm->>Fetch: get_posts_for_businesses(candidates)
    Fetch->>DB: posts WHERE uid IN [...]
    DB-->>Fetch: raw posts []
    Asm->>Fetch: get_businesses_batch(candidates)
    Fetch->>DB: businesses/{biz_id} batch
    DB-->>Fetch: business metadata {}
    loop For each post
        Asm->>Score: score_post(post, following_set, lat, lon, biz_locations)
        Score-->>Asm: float score ∈ [0.0, 1.0]
    end
    Note over Asm: Sort DESC, deduplicate, slice top N
    Asm-->>Route: posts[]
    Route-->>Client: {user_id, count, posts[]}
```

#### `/discovery/who-to-follow/{user_id}`

```mermaid
sequenceDiagram
    participant Client
    participant Route as routes/discovery.py
    participant Asm as engine/assembler.py
    participant Fetch as engine/fetcher.py
    participant Score as engine/scorer.py
    participant DB as Firebase/Mock

    Client->>Route: GET /discovery/who-to-follow/{user_id}?lat=&lon=
    Route->>Asm: build_who_to_follow(user_id, lat, lon, limit)
    Asm->>Fetch: get_following_ids(user_id)
    Fetch->>DB: users/{user_id}/following
    DB-->>Fetch: already-followed set
    Asm->>Fetch: get_nearby_businesses(lat, lon)
    Fetch->>DB: location_index (geohash cells)
    DB-->>Fetch: {biz_id: distance_km}
    Note over Asm: Filter out already-followed + self
    Asm->>Fetch: get_businesses_batch(candidates)
    Fetch->>DB: businesses metadata
    DB-->>Fetch: business docs
    loop For each candidate business
        Asm->>Score: score_business_to_follow(biz, distance_km)
        Score-->>Asm: float score
    end
    Note over Asm: Sort DESC, slice top N
    Asm-->>Route: suggestions[]
    Route-->>Client: {user_id, count, suggestions[]}
```

### API Setup & Running Locally

```bash
# 1. Navigate to the API directory
cd thikana-api

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
# Copy .env.example to .env and fill in Firebase credentials (if USE_MOCK=False)
# For local dev, USE_MOCK=True in config.py uses data/mock_db.json

# 5. Run the server
uvicorn main:app --reload --port 8000

# 6. Interactive API docs
# http://localhost:8000/docs
```

**Configuration knobs in `config.py`:**

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_MOCK` | `True` | `True` = local mock JSON, `False` = live Firestore |
| `MAX_RADIUS_KM` | `10.0` | Businesses beyond this radius are ignored |
| `GEOHASH_PRECISION` | `5` | Precision-5 ≈ 5×5 km cell |
| `RECENCY_WINDOW_HOURS` | `168.0` | 7 days — posts older than this score 0 on recency |
| `POST_WEIGHT_FOLLOWING` | `0.55` | Weight of following signal for post feed |
| `POST_WEIGHT_LOCATION` | `0.35` | Weight of location signal for post feed |
| `POST_WEIGHT_RECENCY` | `0.10` | Weight of recency signal for post feed |
| `FOLLOW_WEIGHT_LOCATION` | `0.70` | Weight of location signal for "Who to Follow" |
| `FOLLOW_WEIGHT_ACTIVITY` | `0.30` | Weight of activity signal for "Who to Follow" |

---

## ⚛️ thikana-web — Next.js Frontend

### Web Architecture

The frontend is a **Next.js 16** (App Router) full-stack application with React 19. It uses:
- **Firebase** for auth, Firestore, and Storage
- **Algolia** for search indexing
- **Razorpay** for payments
- **Zustand** for client-side state management
- **Framer Motion** for animations
- **TailwindCSS v4** for styling
- A **client-side recommendation engine** in `hooks/useRecommendations.js` that mirrors the Python scoring logic entirely in the browser (no server round-trip needed for feed)

```mermaid
flowchart TB
    Browser([Browser / User])
    
    subgraph Next["Next.js 16 App (thikana-web)"]
        direction TB
        PUB[Public Pages\n/ About / Pricing / Contact]
        AUTH[Auth Pages\n/login · /register]
        
        subgraph Dashboard["(dashboard) Route Group"]
            DASH[/dashboard]
            FEED[/feed]
            PROFILE[/profile]
            SEARCH[/search]
            NOTIF[/notifications]
            MAP[/map]
            GST[/gst-reports]
            WEB[/websites]
            CREATE[/posts · /add-product\n/add-bulk-products]
            CART[/cart]
        end
        
        subgraph API["app/api/ (Route Handlers)"]
            APIFEED[/api/feed]
            APIDISC[/api/discovery]
            APIAI[/api/ai]
            RAZORPAY[/api/razorpay]
            MAPS[/api/maps-key]
            EMAIL[/api/send-order-email]
            CONTENT[/api/generate-content]
        end
    end

    subgraph Services["External Services"]
        FB[(Firebase\nAuth + Firestore\n+ Storage)]
        ALG[Algolia\nSearch]
        RZ[Razorpay\nPayments]
        GMAPS[Google Maps\nAPI]
        GEM[Google Gemini\nAI]
        THAPI[thikana-api\nPython FastAPI]
    end

    Browser --> PUB & AUTH & Dashboard
    API --> FB & ALG & RZ & GMAPS & GEM & THAPI
    Dashboard --> API
```

### Web Directory Structure

```
thikana-web/
│
├── app/                            # Next.js App Router
│   ├── layout.js                   # Root layout (fonts, theme, auth, toaster)
│   ├── page.js                     # Landing / Marketing homepage
│   ├── globals.css                 # Global CSS variables & base styles
│   │
│   ├── (auth)/                     # Unauthenticated route group
│   │   ├── login/page.jsx
│   │   └── register/
│   │       ├── page.jsx            # Step-based business registration
│   │       └── user/page.jsx       # User registration
│   │
│   ├── (dashboard)/                # Authenticated route group
│   │   ├── layout.jsx              # Dashboard shell layout
│   │   │
│   │   ├── (with-recommendations)/ # Layout with Sidebar + WhoToFollow
│   │   │   ├── layout.jsx          # 3-col feed / 2-col default / 1-col profile
│   │   │   ├── feed/               # Personalised post feed
│   │   │   ├── map/                # Nearby businesses map view
│   │   │   ├── notifications/      # Real-time notification centre
│   │   │   ├── gst-reports/        # GST report generation
│   │   │   ├── post/               # Individual post view
│   │   │   ├── [username]/         # Public business profile by username
│   │   │   └── profile/            # My profile + sub-routes
│   │   │       ├── page.jsx        # Profile overview (176 KB — heavily featured)
│   │   │       ├── analytics/      # Spending analytics dashboard
│   │   │       ├── inventory/      # Product inventory management
│   │   │       ├── services/       # Service listings
│   │   │       └── settings/       # Account & business settings
│   │   │
│   │   ├── (create)/               # Content creation
│   │   │   ├── posts/              # Create new post
│   │   │   ├── add-product/        # Add single product
│   │   │   └── add-bulk-products/  # CSV bulk product import
│   │   │
│   │   ├── cart/                   # Shopping cart & checkout
│   │   ├── dashboard/              # Business dashboard home
│   │   ├── search/                 # Algolia-powered search
│   │   └── websites/               # Website builder
│   │       └── [websiteId]/        # Builder canvas for specific site
│   │
│   ├── about/page.js               # About page (animated)
│   ├── pricing/page.js             # Pricing plans
│   ├── contact/page.js             # Contact form
│   │
│   └── api/                        # Next.js Route Handlers
│       ├── feed/                   # Proxy to thikana-api /feed
│       ├── discovery/              # Proxy to thikana-api /discovery
│       ├── ai/                     # Google Gemini AI endpoints
│       ├── generate-content/       # AI content generation
│       ├── razorpay/               # Payment order creation
│       ├── create-product-order/   # Product checkout
│       ├── send-order-email/       # Nodemailer order emails
│       ├── send-order-status-email/# Order status update emails
│       ├── update-order-status/    # Order lifecycle management
│       └── maps-key/               # Secure Google Maps key proxy
│
├── components/                     # React components
│   ├── Navbar.js                   # Public marketing navbar (mobile-responsive)
│   ├── MainNavbar.jsx              # Dashboard top navbar
│   ├── Sidebar.jsx                 # Left sidebar (profile + nav links)
│   ├── WhoToFollow.jsx             # Right sidebar (business suggestions)
│   ├── PostCard.jsx                # Post card with likes/comments
│   ├── BasicInfoForm.jsx           # Business registration step 1
│   ├── BusinessInfoForm.jsx        # Business registration step 2
│   ├── UserBasicInfoForm.jsx       # User registration
│   ├── MapComponent.jsx            # Leaflet map component
│   ├── ProfilePage.jsx             # Business public profile
│   ├── PhotosGrid.jsx              # Photo gallery grid
│   ├── CartContext.jsx             # Shopping cart state & logic
│   ├── PaymentForm.jsx             # Razorpay payment UI
│   ├── ConnectRazorpay.jsx         # Razorpay account connection
│   ├── ImageUpload.jsx             # S3 image upload component
│   ├── ThemeSwitcher.jsx           # Dark/light mode toggle
│   │
│   ├── auth/                       # Auth-related components
│   ├── builder/                    # Website builder components (GrapesJS)
│   ├── canvas/                     # Builder canvas wrapper
│   ├── form-builder/               # Drag-and-drop form builder
│   ├── inventory/                  # Inventory management components
│   ├── product/                    # Product display components
│   ├── profile/                    # Profile sub-components
│   │   └── NearbyBusinessMap.jsx   # Leaflet map for nearby businesses
│   ├── registry/                   # Business registry components
│   ├── search/                     # Algolia search UI components
│   └── ui/                         # Radix UI primitive wrappers
│
├── hooks/                          # Custom React hooks
│   ├── useAuth.js                  # Firebase auth context
│   ├── useRecommendations.js       # useFeed + useWhoToFollow (client-side engine)
│   ├── useGetPosts.js              # Firestore posts fetching
│   ├── useGetUser.js               # Current user data
│   ├── useGetUserPosts.js          # User's own posts
│   ├── useLikePosts.js             # Like/unlike actions
│   ├── useAutosave.js              # Builder auto-save
│   └── useBusinessIdForMember.js   # Business ID resolving for team members
│
├── lib/                            # Utility libraries
│   ├── firebase.js                 # Firebase client SDK init
│   ├── firebase-admin.js           # Firebase Admin SDK (server-side)
│   ├── notifications.js            # Full notification system
│   ├── inventory-operations.js     # Inventory CRUD with Firebase
│   ├── website-operations.js       # Website builder save/publish
│   ├── followeringAction.js        # Follow/unfollow business logic
│   ├── firestoreWrites.js          # Batch write helpers
│   ├── geohash.js                  # Geohash encoding
│   ├── date-utils.js               # Date formatting utilities
│   ├── business-utils.js           # Business data helpers
│   ├── business-user.js            # Business-user relationship
│   ├── userStatus.js               # Online/offline presence
│   ├── ai/                         # AI-related libs
│   ├── data/                       # Static data / seed data
│   ├── payment/                    # Razorpay helpers
│   ├── publish/                    # Website publish logic
│   └── stores/                     # Zustand stores
│       ├── builderStore.js         # Website builder state (23 KB)
│       ├── formBuilderStore.js     # Form builder state
│       ├── chatStore.js            # Chat state
│       ├── historyStore.js         # Builder undo/redo history
│       └── uiStore.js              # Global UI state
│
├── context/                        # React context providers
│   └── ThemeContext.js             # Dark/Light theme provider
│
├── constants/                      # App-wide constants
├── utils/                          # Pure utility functions
├── public/                         # Static assets
├── next.config.mjs                 # Next.js configuration
├── package.json                    # Dependencies & scripts
└── biome.json                      # Biome linter/formatter config
```

### Pages & Routes

```mermaid
flowchart LR
    Root(["/"])
    About["/about"]
    Pricing["/pricing"]
    Contact["/contact"]

    Login["/login"]
    Register["/register"]
    RegUser["/register/user"]

    Dashboard["/dashboard"]
    Feed["/feed"]
    Profile["/profile"]
    Analytics["/profile/analytics"]
    Inventory["/profile/inventory"]
    Services["/profile/services"]
    Settings["/profile/settings"]
    PubProfile["/:username"]
    Notif["/notifications"]
    Map["/map"]
    GST["/gst-reports"]
    Search["/search"]
    Cart["/cart"]

    Posts["/posts"]
    AddProd["/add-product"]
    BulkProd["/add-bulk-products"]

    Websites["/websites"]
    Builder["/websites/:id"]

    Root --- About
    Root --- Pricing
    Root --- Contact
    Root --- Login
    Root --- Register
    Register --- RegUser
    Root --- Dashboard
    Dashboard --- Feed
    Dashboard --- Profile
    Profile --- Analytics
    Profile --- Inventory
    Profile --- Services
    Profile --- Settings
    Dashboard --- PubProfile
    Dashboard --- Notif
    Dashboard --- Map
    Dashboard --- GST
    Dashboard --- Search
    Dashboard --- Cart
    Dashboard --- Posts
    Dashboard --- AddProd
    Dashboard --- BulkProd
    Dashboard --- Websites
    Websites --- Builder
```

### Key Features

| Feature | Description | Tech |
|---------|-------------|------|
| **Business Registration** | Multi-step form with MSME/GST/PAN verification | Firebase, React Hook Form, Zod |
| **Feed** | Ranked posts from followed + nearby businesses | `useRecommendations.js`, Firestore, Geohash |
| **Who to Follow** | Nearby businesses user doesn't follow yet | Haversine scoring, Firestore |
| **Map Discovery** | Interactive map of businesses within 10 km | Leaflet, React-Leaflet, Google Maps |
| **Website Builder** | No-code drag-and-drop site builder | GrapesJS, Zustand, Immer |
| **Form Builder** | Drag-and-drop form creation | dnd-kit, Zustand |
| **Inventory Management** | Product catalog with CRUD + bulk CSV upload | Papa Parse, Firestore |
| **Order Management** | Full lifecycle — pending → confirmed → delivered | Nodemailer (email), Razorpay |
| **Payments** | Razorpay checkout with signature verification | Razorpay SDK |
| **Notifications** | Real-time in-app + WhatsApp + Email notifications | Firestore onSnapshot, Nodemailer |
| **Analytics Dashboard** | Spending anomalies, insights, predictions | Recharts, thikana-api |
| **GST Reports** | Auto-generated GST compliance reports | jsPDF, jspdf-autotable |
| **Algolia Search** | Instant indexed search across businesses | Algolia InstantSearch |
| **AI Content Generation** | Auto-generate post captions / descriptions | Google Gemini AI |
| **QR Codes** | Business QR code generation | react-qr-code |
| **Dark Mode** | Full dark/light theme switch | next-themes, CSS variables |
| **Mobile Responsive** | Hamburger nav, responsive layouts | TailwindCSS v4 |

### Component Map

```mermaid
flowchart TD
    Root["RootLayout (layout.js)\nThemeProvider · AuthProvider · Toaster"]

    PRE["Public Routes\nNavbar + Footer"]
    HOME["page.js\nLanding Page"]
    ABT["about/page.js"]
    PRC["pricing/page.js"]

    DLAY["\(dashboard\)/layout.jsx\nMainNavbar"]
    RLAY["\(with-recommendations\)/layout.jsx\n3-col | 2-col | 1-col"]

    FEED_PAGE["/feed/page.jsx\nPostCard list"]
    PROF["/profile/page.jsx\nFull business dashboard\nInventory · Analytics · Services · Settings"]
    NOTIF["/notifications/page.jsx"]
    MAP["/map/page.jsx"]
    SRCH["/search/page.jsx"]

    SB["Sidebar.jsx\nUser info + nav links"]
    WTF["WhoToFollow.jsx\nuseWhoToFollow hook"]
    NBM["NearbyBusinessMap.jsx\nLeaflet + Google Maps"]

    BUILDER["/websites/\[id\]/page.jsx\nWebsite Builder Canvas"]
    BST["builderStore.js\nZustand"]

    Root --> PRE & DLAY
    PRE --> HOME & ABT & PRC
    DLAY --> RLAY
    RLAY --> SB & FEED_PAGE & WTF
    RLAY --> PROF & NOTIF & MAP & SRCH
    SB --- NBM
    DLAY --> BUILDER
    BUILDER --- BST
```

### State Management

```mermaid
flowchart LR
    subgraph Zustand["Zustand Stores (lib/stores/)"]
        BS[builderStore\nCanvas elements\nSelected el · Undo history\nPublish state]
        FS[formBuilderStore\nForm fields\nDrag state]
        HS[historyStore\nUndo / Redo stack]
        USS[uiStore\nSidebar open state\nModal state]
        CS[chatStore\nChat messages\nSocket]
    end

    subgraph Context["React Context"]
        AUTH[AuthProvider\nuseAuth hook\nFirebase user state]
        THEME[ThemeProvider\ndark/light mode]
        CART[CartContext\nCart items\nTotal · Checkout]
    end

    subgraph LocalHooks["Custom Hooks"]
        UF[useFeed\nPosts + scores]
        UW[useWhoToFollow\nBusiness suggestions]
        UP[useGetPosts\nFirestore pagination]
        UL[useLikePosts\nOptimistic likes]
        UAS[useAutosave\nBuilder debounced save]
    end
```

### Web Data Flow Flowcharts

#### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Login/Register Page
    participant Auth as useAuth Hook
    participant FB as Firebase Auth
    participant FS as Firestore

    User->>UI: Enter credentials
    UI->>Auth: signIn(email, password)
    Auth->>FB: signInWithEmailAndPassword()
    FB-->>Auth: UserCredential
    Auth->>FS: getDoc(users/{uid})
    FS-->>Auth: User profile data
    Auth-->>UI: Authenticated user
    UI->>UI: Redirect to /dashboard
```

#### Post Feed Data Flow (Client-Side Recommendation Engine)

```mermaid
flowchart TD
    A([User opens /feed]) --> B[useAuth → get userId]
    B --> C[navigator.geolocation\nget lat / lon]
    C --> D[Firestore: users/{uid}/following\nGet following IDs]
    D --> E[Encode geohash, compute 9 neighbor cells]
    E --> F[Firestore: location_index/{cell}\nGet nearby business IDs]
    F --> G{nearbyIds.size == 0?}
    G -- Yes --> H[Fallback: scan all businesses\nHaversine filter ≤ 10 km]
    G -- No --> I
    H --> I[Union: following ∪ nearby − self]
    I --> J[Batch fetch business metadata\nfrom Firestore in groups of 10]
    J --> K[Batch fetch posts WHERE uid IN candidates\norderedBy createdAt DESC]
    K --> L[Score each post:\n0.55×following + 0.35×location + 0.10×recency]
    L --> M[Deduplicate, sort DESC, slice top N]
    M --> N([Render PostCard list])
```

#### Payment / Order Flow

```mermaid
sequenceDiagram
    participant User
    participant Cart as CartContext
    participant API as /api/razorpay
    participant RZ as Razorpay
    participant FB as Firestore
    participant Email as /api/send-order-email

    User->>Cart: Add product → Checkout
    Cart->>API: POST /api/razorpay {amount, currency}
    API->>RZ: Create Order (server-side)
    RZ-->>API: {order_id, amount}
    API-->>Cart: Razorpay order details
    Cart->>RZ: Open Razorpay Checkout (client)
    User->>RZ: Complete payment
    RZ-->>Cart: payment_id, signature
    Cart->>API: POST /api/razorpay (verify signature)
    API-->>Cart: Payment verified ✅
    Cart->>FB: Write order document
    Cart->>Email: Send order confirmation email (Nodemailer)
    Email-->>User: Order confirmation 📧
```

#### Notification System Flow

```mermaid
flowchart LR
    TRIG([Trigger: Order / Follow / System])
    ADD[addNotification / sendNotificationToUser]
    FS[(Firestore\nusers/uid/notifications/)]
    SNAP[onSnapshot listener\nin notification page]
    UI([Notification Bell + List])
    WA[sendWhatsAppNotification\n→ /api/notification-whatsapp]
    EM[sendEmailNotification\n→ /api/notification-email]

    TRIG --> ADD
    ADD --> FS
    ADD --> WA
    ADD --> EM
    FS --> SNAP --> UI
```

### Web Setup & Running Locally

```bash
# 1. Navigate to the web directory
cd thikana-web

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create .env.local (see Environment Variables section below)

# 4. Run the development server
npm run dev
# → http://localhost:3000

# 5. (Optional) Seed sample posts to Firestore
node seed-posts.mjs

# 6. Lint and format
npm run lint       # Biome check
npm run format     # Biome format --write
```

---

## 🏗 Full System Architecture

```mermaid
flowchart TB
    subgraph Client["Browser (User)"]
        NC[Next.js Client Components\nReact 19]
    end

    subgraph NextServer["Next.js Server (thikana-web)"]
        SC[Server Components\nSSR / RSC]
        RH[Route Handlers\napp/api/*]
    end

    subgraph PyAPI["thikana-api (FastAPI)"]
        FP[Feed + Discovery\nRecommendation Engine]
        AP[Analytics Engine\nSpending Models]
    end

    subgraph Firebase["Firebase (Google Cloud)"]
        AUTH[Firebase Auth\nJWT / Email+Password]
        FS_DB[(Firestore\nPrimary DB)]
        ST[Firebase Storage\nImages / Assets]
    end

    subgraph Algolia["Algolia"]
        IDX[Business + Post\nSearch Index]
    end

    subgraph Razorpay["Razorpay"]
        PAY[Payments API\nOrders + Webhooks]
    end

    subgraph Google["Google APIs"]
        MAPS[Maps JS API\nGeolocation]
        GEM[Gemini AI\nContent Generation]
    end

    subgraph Email["Email (Nodemailer)"]
        SMTP[SMTP Server\nOrder Emails]
    end

    NC <-->|REST / WS| NextServer
    NC -->|Client SDK| Firebase
    SC -->|Admin SDK| Firebase
    RH -->|HTTP| PyAPI
    RH -->|SDK| Razorpay
    RH -->|API Key| Google
    RH -->|SMTP| Email
    NC -->|InstantSearch| Algolia
```

---

## 🛠 Tech Stack

### thikana-api

| Layer | Technology |
|-------|------------|
| Runtime | Python 3.11+ |
| Web Framework | FastAPI 0.100+ |
| ASGI Server | Uvicorn |
| Validation | Pydantic v2 |
| Database | Firebase Firestore (via `firebase-admin`) |
| Spatial | pygeohash (geohash encoding) |
| Analytics | pandas, numpy, scipy, scikit-learn |
| Testing | pytest |
| Config | python-dotenv |

### thikana-web

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | TailwindCSS v4 + Custom CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| UI Primitives | Radix UI (via shadcn) |
| State | Zustand + Immer |
| Forms | React Hook Form + Zod |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| Storage | Firebase Storage |
| Search | Algolia InstantSearch |
| Payments | Razorpay |
| Maps | Leaflet / React-Leaflet + Google Maps |
| AI | Google Gemini (`@google/generative-ai`) |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Email | Nodemailer |
| DnD | dnd-kit |
| Linter | Biome |
| Fonts | Bricolage Grotesque (headings) + Manrope (body) |

---

## 🔐 Environment Variables

### thikana-api `.env`

```env
# Only needed if USE_MOCK=False in config.py
GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json
```

### thikana-web `.env`

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-side)
FIREBASE_SERVICE_ACCOUNT_KEY=   # JSON string or path

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Google Maps
GOOGLE_MAPS_API_KEY=

# Google Gemini AI
GEMINI_API_KEY=

# Email (Nodemailer)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=

# thikana-api URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 💰 Pricing Plans

| Plan | Price | Key Features |
|------|-------|-------------|
| **Starter** | Free forever | Geo-discovery profile, No-code website builder, Razorpay payments, Up to 50 products, Basic order management, Notifications |
| **Pro** | $29/month | Everything in Starter + Custom domain & SSL, Unlimited products, Recurring subscriptions, Invoice management, Advanced analytics, Algolia priority search |
| **Franchise** | $99/month | Everything in Pro + Unlimited outlets, Delegated owner logins, Centralized franchise dashboard, Cross-outlet analytics, Webhook + API access, Dedicated onboarding |
| **Enterprise** | Custom | Contact Sales — white-labelling, B2B supplier integrations, custom SLA |

---

## 📄 Additional Documentation

| File | Description |
|------|-------------|
| [`thikana-api/API_DOCUMENTATION.md`](./thikana-api/API_DOCUMENTATION.md) | Full REST API reference with request/response examples |
| [`thikana-api/FRONTEND_INTEGRATION.md`](./thikana-api/FRONTEND_INTEGRATION.md) | Guide for frontend engineers integrating the recommendation API |
| [`thikana-api/ANALYTICS_API_FRONTED_INTEG.md`](./thikana-api/ANALYTICS_API_FRONTED_INTEG.md) | Analytics API frontend integration guide |
| [`thikana-web/UI_DESIGN_SYSTEM.md`](./thikana-web/UI_DESIGN_SYSTEM.md) | Thikana's design tokens, typography, colour palette |
| [`thikana-web/FRONTEND_INTEGRATION.md`](./thikana-web/FRONTEND_INTEGRATION.md) | Frontend-specific API integration notes |

---

*© 2026 Thikana Technologies Pvt. Ltd. — Built with ❤️ for local businesses.*

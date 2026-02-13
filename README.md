# AR01 - Warehouse AR Navigation SaaS

A Progressive Web App providing **AR-powered warehouse navigation**. Map your warehouse, manage inventory with precise 3D positioning, and navigate to any product using augmented reality on your phone or tablet.

## Core Workflow

```
1. Draw Boundary    → Adjustable polygon editor to match warehouse shape
2. Scan Space       → Multi-angle photos analyzed by Gemini AI to build 3D map
3. Add Inventory    → Register products with images, SKU, quantities, and 3D positions
4. AR Navigate      → Open camera, search a product, follow AR arrows to find it
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | PWA with mobile-first responsive UI |
| **3D/AR** | Three.js + WebXR | AR rendering, 3D scene, navigation arrows |
| **Styling** | Tailwind CSS | Mobile-first responsive design |
| **State** | Zustand | Client state management |
| **Backend** | Express + TypeScript | REST API server |
| **Database** | Supabase (PostgreSQL) | Data, Auth, Storage, Realtime |
| **AI** | Gemini API | Photo analysis, spatial mapping, product recognition |
| **Search** | Pinecone | Vector-based product search |
| **Frontend Hosting** | Vercel | PWA deployment |
| **Backend Hosting** | Railway | API server deployment |

## Getting Started

### Prerequisites
- Node.js >= 18
- Supabase project (free tier works)
- Gemini API key
- Pinecone account (optional, for vector search)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd AR01
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run Supabase schema
# Copy supabase/schema.sql content to Supabase SQL Editor and run

# Start development
npm run dev
```

### Environment Variables

```env
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Features
GEMINI_API_KEY=your-gemini-key

# Vector Search (optional)
PINECONE_API_KEY=your-pinecone-key
PINECONE_HOST=https://xxx.pinecone.io
```

## Project Structure

```
AR01/
├── client/                          # Frontend (React PWA)
│   └── src/
│       ├── components/
│       │   ├── warehouse/           # Warehouse management
│       │   │   ├── PolygonEditor    # Boundary shape editor (drag vertices)
│       │   │   ├── SpatialMapper    # Multi-photo scanning UI
│       │   │   ├── WarehouseView    # Warehouse dashboard
│       │   │   └── WarehouseSetup   # Setup wizard (boundary → scan → done)
│       │   ├── inventory/           # Product management
│       │   │   ├── ProductList      # Search & list products
│       │   │   └── InventoryPage    # CRUD + spatial positioning
│       │   ├── navigation/          # AR navigation
│       │   │   ├── ARNavigator      # 3D AR view with path + product marker
│       │   │   └── ARNavigationPage # Search → navigate flow
│       │   ├── ar/                  # AR core (WebXR, Three.js)
│       │   ├── auth/                # Login / Register
│       │   ├── dashboard/           # Warehouse list + subscription
│       │   └── layout/              # Layout + Landing page
│       ├── hooks/                   # useWebXR, useDeviceOrientation
│       ├── services/                # API client + Supabase client
│       └── stores/                  # Zustand stores
├── server/                          # Backend (Express API)
│   └── src/
│       ├── routes/
│       │   ├── warehouses.ts        # CRUD + zones
│       │   ├── products.ts          # CRUD + search + AI recognition
│       │   ├── navigation.ts        # A* pathfinding
│       │   └── spatial.ts           # Photo analysis + map generation
│       ├── services/
│       │   ├── gemini.ts            # Gemini API integration
│       │   ├── pinecone.ts          # Vector search integration
│       │   └── navigation.ts        # A* algorithm + path smoothing
│       ├── middleware/auth.ts       # JWT authentication
│       └── config/supabase.ts       # Supabase admin client
├── shared/types/                    # Shared TypeScript types
├── supabase/schema.sql              # Database schema (run in Supabase)
└── docker-compose.yml               # Docker deployment
```

## SaaS Pricing

| Feature | Free | Pro ($49/mo) | Enterprise ($199/mo) |
|---------|------|-------------|---------------------|
| Warehouses | 1 | 10 | Unlimited |
| Products/warehouse | 50 | 5,000 | Unlimited |
| AI Scanning | Basic | Full | Full |
| Vector Search | No | Yes | Yes |
| Multi-target Nav | No | Yes | Yes |
| Analytics | Basic | Advanced | Full |
| API Access | No | No | Yes |

## Deployment

### Vercel (Frontend)
```bash
cd client && vercel
```

### Railway (Backend)
```bash
railway up
```

### Docker
```bash
docker-compose up --build
```

## License

Proprietary - All rights reserved.

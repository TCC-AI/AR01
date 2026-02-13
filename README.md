# AR01 - AR Mobile/Tablet SaaS Platform

A Progressive Web App (PWA) providing Augmented Reality experiences on mobile and tablet devices, delivered as a SaaS platform.

## Tech Stack

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Three.js** + **@react-three/fiber** - 3D rendering
- **WebXR API** - Augmented Reality
- **Tailwind CSS** - Mobile-first responsive styling
- **Vite** - Build tool with PWA plugin
- **Zustand** - State management

### Backend
- **Node.js** + **Express** - API server
- **TypeScript** - Type safety
- **JWT** - Authentication
- **Prisma** - ORM (SQLite for dev, PostgreSQL for prod)
- **Stripe** - Subscription billing

### Infrastructure
- **Docker** + **Docker Compose** - Containerization
- **PWA** - Offline support, installable app

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Development

```bash
# Install dependencies
npm install

# Start development (both client and server)
npm run dev

# Start client only
npm run dev:client

# Start server only
npm run dev:server
```

### Production Build

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Project Structure

```
AR01/
├── client/                 # Frontend PWA
│   └── src/
│       ├── components/     # React components
│       │   ├── ar/         # AR-specific components
│       │   ├── ui/         # Reusable UI components
│       │   ├── auth/       # Authentication components
│       │   ├── dashboard/  # Dashboard components
│       │   └── layout/     # Layout components
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API services
│       ├── stores/         # Zustand stores
│       ├── types/          # TypeScript types
│       └── styles/         # Global styles
├── server/                 # Backend API
│   └── src/
│       ├── routes/         # API routes
│       ├── controllers/    # Request handlers
│       ├── middleware/      # Express middleware
│       ├── models/         # Database models
│       ├── services/       # Business logic
│       └── config/         # Configuration
├── shared/                 # Shared types/utilities
│   └── types/
└── public/                 # Static assets
```

## SaaS Subscription Tiers

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| AR Scenes | 3 | Unlimited | Unlimited |
| 3D Models | 5 | 50 | Unlimited |
| Custom Markers | No | Yes | Yes |
| Analytics | Basic | Advanced | Full |
| API Access | No | Yes | Yes |
| Support | Community | Email | Priority |

## License

Proprietary - All rights reserved.

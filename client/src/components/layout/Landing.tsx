import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function Landing() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="safe-area-top">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-gradient">AR01</h1>
          <div className="flex gap-3">
            {user ? (
              <Link to="/app" className="btn-primary text-sm px-4 py-2">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm px-4 py-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 md:py-24 text-center">
        <div className="text-sm font-medium text-primary-400 mb-4">
          Warehouse Management Reimagined
        </div>
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="text-gradient">AR-Powered</span>
          <br />
          Warehouse Navigation
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Map your warehouse in minutes, track every item in 3D space,
          and navigate to any product with augmented reality on your phone.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-lg px-8 py-4">
            Start Free Trial
          </Link>
          <a href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
            See How It Works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-16 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {i + 1}
              </div>
              <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
              <p className="text-slate-400 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-12">Key Features</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-12">Simple Pricing</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card text-center ${plan.highlighted ? 'border-primary-500 ring-1 ring-primary-500/50' : ''}`}
            >
              {plan.highlighted && (
                <div className="text-xs font-medium text-primary-400 mb-2">MOST POPULAR</div>
              )}
              <h4 className="text-xl font-bold">{plan.name}</h4>
              <div className="my-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                {plan.price > 0 && <span className="text-slate-400">/month</span>}
              </div>
              <ul className="text-sm text-slate-400 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`w-full inline-block ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.price === 0 ? 'Start Free' : 'Subscribe'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        <p>AR01 - Warehouse AR Navigation SaaS Platform</p>
      </footer>
    </div>
  );
}

const steps = [
  {
    title: 'Draw Boundary',
    description: 'Define your warehouse shape with an adjustable polygon editor.',
  },
  {
    title: 'Scan Space',
    description: 'Take photos from multiple angles. AI builds your 3D spatial map.',
  },
  {
    title: 'Add Inventory',
    description: 'Register products with photos, quantities, and exact 3D positions.',
  },
  {
    title: 'AR Navigate',
    description: 'Open camera, search any product, and follow AR arrows to find it.',
  },
];

const features = [
  {
    icon: '\u{1F4F1}',
    title: 'Mobile AR Navigation',
    description: 'Open your phone camera and get AR arrows guiding you to any product in the warehouse.',
  },
  {
    icon: '\u{1F5FA}\uFE0F',
    title: '3D Spatial Database',
    description: 'Every product mapped to a precise 3D location. A living digital twin of your warehouse.',
  },
  {
    icon: '\u{1F916}',
    title: 'AI-Powered Scanning',
    description: 'Gemini AI analyzes photos to auto-detect walls, shelves, and obstacles.',
  },
  {
    icon: '\u{1F50D}',
    title: 'Smart Search',
    description: 'Natural language search powered by Pinecone vectors. Find products by description.',
  },
  {
    icon: '\u{1F4E6}',
    title: 'Inventory Management',
    description: 'Track quantities, SKUs, images, and locations. AI can auto-identify products from photos.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Analytics & Insights',
    description: 'Track navigation patterns, popular items, and optimize warehouse layout.',
  },
];

const plans = [
  {
    name: 'Free',
    price: 0,
    highlighted: false,
    features: ['1 Warehouse', '50 Products', 'Basic AR Navigation', 'Community Support'],
  },
  {
    name: 'Pro',
    price: 49,
    highlighted: true,
    features: [
      '10 Warehouses',
      '5,000 Products each',
      'AI Scanning & Search',
      'Multi-target Navigation',
      'Advanced Analytics',
      'Email Support',
    ],
  },
  {
    name: 'Enterprise',
    price: 199,
    highlighted: false,
    features: [
      'Unlimited Warehouses',
      'Unlimited Products',
      'All Pro features',
      'Custom Branding',
      'API Access',
      'Priority Support & SSO',
    ],
  },
];

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
                <Link
                  to="/login"
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm px-4 py-2"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="text-gradient">Augmented Reality</span>
          <br />
          for Everyone
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Create, manage, and share immersive AR experiences directly from your
          mobile device or tablet. No app download required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-lg px-8 py-4">
            Start Free
          </Link>
          <a href="#features" className="btn-secondary text-lg px-8 py-4">
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-12">
          Why AR01?
        </h3>
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
        <h3 className="text-2xl font-bold text-center mb-12">
          Simple Pricing
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card text-center ${
                plan.highlighted
                  ? 'border-primary-500 ring-1 ring-primary-500/50'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs font-medium text-primary-400 mb-2">
                  MOST POPULAR
                </div>
              )}
              <h4 className="text-xl font-bold">{plan.name}</h4>
              <div className="my-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                {plan.price > 0 && (
                  <span className="text-slate-400">/month</span>
                )}
              </div>
              <ul className="text-sm text-slate-400 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`w-full inline-block ${
                  plan.highlighted ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {plan.price === 0 ? 'Start Free' : 'Subscribe'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        <p>AR01 - Augmented Reality SaaS Platform</p>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '\u{1F4F1}',
    title: 'Mobile First',
    description:
      'Designed for phones and tablets. Works directly in the browser with no download needed.',
  },
  {
    icon: '\u{1F30D}',
    title: 'WebXR Powered',
    description:
      'Built on WebXR for native AR experiences. Surface detection, hit testing, and more.',
  },
  {
    icon: '\u{2601}\u{FE0F}',
    title: 'Cloud SaaS',
    description:
      'Manage your AR scenes from anywhere. Share via QR code or direct link.',
  },
  {
    icon: '\u{1F528}',
    title: 'Scene Editor',
    description:
      'Visual editor to position, rotate, and scale 3D models in your AR scenes.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Analytics',
    description:
      'Track views, interactions, and engagement across all your AR experiences.',
  },
  {
    icon: '\u{1F512}',
    title: 'Enterprise Ready',
    description:
      'Role-based access, API keys, and custom branding for teams and businesses.',
  },
];

const plans = [
  {
    name: 'Free',
    price: 0,
    highlighted: false,
    features: ['3 AR Scenes', '5 3D Models', 'Basic Analytics', 'Community Support'],
  },
  {
    name: 'Pro',
    price: 29,
    highlighted: true,
    features: [
      'Unlimited Scenes',
      '50 3D Models',
      'Custom Markers',
      'Advanced Analytics',
      'API Access',
      'Email Support',
    ],
  },
  {
    name: 'Enterprise',
    price: 99,
    highlighted: false,
    features: [
      'Everything in Pro',
      'Unlimited Models',
      'Custom Branding',
      'Full Analytics',
      'Priority Support',
      'SSO / SAML',
    ],
  },
];

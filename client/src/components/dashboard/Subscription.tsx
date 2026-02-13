import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscriptionApi } from '../../services/api';

export default function Subscription() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planId: string) {
    setLoading(planId);
    try {
      const response = await subscriptionApi.createCheckout(planId);
      if (response.success && response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch {
      // Handle error
    } finally {
      setLoading(null);
    }
  }

  async function handleManage() {
    try {
      const response = await subscriptionApi.manage();
      if (response.success && response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch {
      // Handle error
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Subscription</h1>
      <p className="text-slate-400 mb-8">
        Current plan:{' '}
        <span className="text-primary-400 font-medium capitalize">
          {user?.subscription}
        </span>
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = user?.subscription === plan.tier;
          return (
            <div
              key={plan.tier}
              className={`card ${
                plan.highlighted
                  ? 'border-primary-500 ring-1 ring-primary-500/50'
                  : ''
              } ${isCurrent ? 'bg-primary-950/30' : ''}`}
            >
              {isCurrent && (
                <div className="text-xs font-medium text-green-400 mb-2">
                  CURRENT PLAN
                </div>
              )}
              {plan.highlighted && !isCurrent && (
                <div className="text-xs font-medium text-primary-400 mb-2">
                  RECOMMENDED
                </div>
              )}

              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="my-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.price > 0 && (
                  <span className="text-slate-400">/month</span>
                )}
              </div>

              <ul className="text-sm text-slate-300 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-green-400 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                user?.subscription !== 'free' ? (
                  <button
                    onClick={handleManage}
                    className="btn-secondary w-full text-sm"
                  >
                    Manage Subscription
                  </button>
                ) : (
                  <div className="text-center text-sm text-slate-500 py-3">
                    Current Plan
                  </div>
                )
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={loading === plan.tier}
                  className={`w-full text-sm ${
                    plan.highlighted ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {loading === plan.tier ? 'Loading...' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const plans = [
  {
    tier: 'free' as const,
    name: 'Free',
    price: 0,
    highlighted: false,
    features: [
      '3 AR Scenes',
      '5 3D Models',
      'Basic Analytics',
      'Community Support',
    ],
  },
  {
    tier: 'pro' as const,
    name: 'Pro',
    price: 29,
    highlighted: true,
    features: [
      'Unlimited AR Scenes',
      '50 3D Models',
      'Custom Markers',
      'Advanced Analytics',
      'API Access',
      'Email Support',
    ],
  },
  {
    tier: 'enterprise' as const,
    name: 'Enterprise',
    price: 99,
    highlighted: false,
    features: [
      'Everything in Pro',
      'Unlimited 3D Models',
      'Custom Branding',
      'Full Analytics Dashboard',
      'Priority Support',
      'SSO / SAML Integration',
    ],
  },
];

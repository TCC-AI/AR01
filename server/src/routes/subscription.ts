import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { getDb } from '../config/database.js';

export const subscriptionRouter = Router();

const PLANS = [
  {
    id: 'free',
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month' as const,
    features: ['3 AR Scenes', '5 3D Models', 'Basic Analytics', 'Community Support'],
    limits: {
      maxScenes: 3,
      maxModels: 5,
      maxFileSize: 10,
      customMarkers: false,
      analytics: 'basic' as const,
      apiAccess: false,
    },
  },
  {
    id: 'pro',
    tier: 'pro',
    name: 'Pro',
    price: 2900, // cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Unlimited AR Scenes',
      '50 3D Models',
      'Custom Markers',
      'Advanced Analytics',
      'API Access',
      'Email Support',
    ],
    limits: {
      maxScenes: 999999,
      maxModels: 50,
      maxFileSize: 100,
      customMarkers: true,
      analytics: 'advanced' as const,
      apiAccess: true,
    },
  },
  {
    id: 'enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    price: 9900, // cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Everything in Pro',
      'Unlimited 3D Models',
      'Custom Branding',
      'Full Analytics',
      'Priority Support',
      'SSO / SAML',
    ],
    limits: {
      maxScenes: 999999,
      maxModels: 999999,
      maxFileSize: 500,
      customMarkers: true,
      analytics: 'full' as const,
      apiAccess: true,
    },
  },
];

// GET /api/subscription/plans
subscriptionRouter.get('/plans', (_req, res) => {
  res.json({ success: true, data: PLANS });
});

// POST /api/subscription/checkout
subscriptionRouter.post('/checkout', authenticate, (req: AuthRequest, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS.find((p) => p.id === planId);

    if (!plan) {
      res.status(404).json({ success: false, error: 'Plan not found' });
      return;
    }

    // In production, this would create a Stripe Checkout session
    // For now, simulate the subscription upgrade
    const db = getDb();
    db.prepare('UPDATE users SET subscription = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
      plan.tier,
      req.userId!,
    );

    // Return a mock checkout URL (in production, this would be a Stripe URL)
    res.json({
      success: true,
      data: { url: `/app?upgraded=${plan.tier}` },
      message: `Upgraded to ${plan.name} plan`,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/subscription/manage
subscriptionRouter.post('/manage', authenticate, (_req: AuthRequest, res) => {
  // In production, this would return a Stripe Customer Portal URL
  res.json({
    success: true,
    data: { url: '/app/subscription' },
  });
});

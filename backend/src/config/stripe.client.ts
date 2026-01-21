import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.warn("[StripeConfig] Missing STRIPE_SECRET_KEY. Subscription features will fail.");
}

export const stripeClient = new Stripe(STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2025-01-27.acacia' as any, // Use latest stable
    typescript: true,
});

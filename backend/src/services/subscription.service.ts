import Stripe from 'stripe';
import { DBClient } from '../config/db.client';
import { stripeClient } from '../config/stripe.client';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Adjust as needed

const PRICE_ID_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1Qj_placeholder_monthly';
const PRICE_ID_PRO_YEARLY = process.env.STRIPE_PRICE_PRO_YEARLY || 'price_1Qj_placeholder_yearly';

export class SubscriptionService {
    private stripe: Stripe;
    private docClient: DynamoDBDocumentClient;

    constructor() {
        this.stripe = stripeClient;
        this.docClient = DBClient.getInstance();
    }

    async createCheckoutSession(userId: string, planType: 'monthly' | 'yearly') {
        const priceId = planType === 'yearly' ? PRICE_ID_PRO_YEARLY : PRICE_ID_PRO_MONTHLY;

        // 1. Get user from DB to find stripeCustomerId if exists
        const user = await this.getUser(userId);
        if (!user) {
            throw new Error("User not found");
        }
        let customerId = user?.stripeCustomerId;

        // 2. If no customer ID, create one (or let checkout create it, but better to create upfront to link)
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: user.email,
                metadata: { userId }
            });
            customerId = customer.id;
            // Save to DB
            await this.updateUserStripeId(userId, customerId);
        }

        // 3. Create Session
        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${FRONTEND_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/settings`,
        });

        return { url: session.url };
    }

    async createCustomerPortalSession(userId: string) {
        const user = await this.getUser(userId);
        if (!user?.stripeCustomerId) {
            throw new Error("No billing account found for this user.");
        }

        const session = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${FRONTEND_URL}/settings`,
        });

        return { url: session.url };
    }

    async handleWebhook(signature: string, payload: Buffer) {
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
        } catch (err: any) {
            throw new Error(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object as Stripe.Subscription;
                await this.updateUserSubscriptionStatus(subscription.customer as string, subscription.status, subscription.items.data[0]?.price.id);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    }

    // --- DB Helpers ---

    private async getUser(userId: string) {
        const result = await this.docClient.send(new GetCommand({
            TableName: process.env.USERS_TABLE || 'Users',
            Key: { id: userId }
        }));
        return result.Item;
    }

    private async updateUserStripeId(userId: string, customerId: string) {
        await this.docClient.send(new UpdateCommand({
            TableName: process.env.USERS_TABLE || 'Users',
            Key: { id: userId },
            UpdateExpression: 'set stripeCustomerId = :cid',
            ExpressionAttributeValues: { ':cid': customerId }
        }));
    }

    private async updateUserSubscriptionStatus(customerId: string, status: string, priceId?: string) {
        // We need to find user by stripeCustomerId. 
        // Since we don't have a GSI on stripeCustomerId in standard setup, we might need to query or scan.
        // ideally we add GSI. For now, let's assume we can scan or the metadata has userId.
        // Actually, fetching from Stripe Customer metadata is safer if we stored it there.

        const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = customer.metadata?.userId;

        if (userId) {
            let plan = 'free';
            if (status === 'active' || status === 'trialing') {
                plan = 'pro'; // Simplify logic for now
            }

            await this.docClient.send(new UpdateCommand({
                TableName: process.env.USERS_TABLE || 'Users',
                Key: { id: userId },
                UpdateExpression: 'set subscriptionStatus = :status, plan = :plan',
                ExpressionAttributeValues: {
                    ':status': status,
                    ':plan': plan
                }
            }));
        }
    }
}

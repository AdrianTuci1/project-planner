import { Subscription } from '../models/types';

const subscriptionsDB: Subscription[] = [];

export class SubscriptionService {

    public async upgradeToPro(userId: string, frequency: 'monthly' | 'yearly' = 'monthly'): Promise<Subscription> {
        const existingSub = subscriptionsDB.find(s => s.userId === userId);
        const durationMs = frequency === 'yearly'
            ? 365 * 24 * 60 * 60 * 1000
            : 30 * 24 * 60 * 60 * 1000;

        if (existingSub) {
            existingSub.plan = 'pro';
            existingSub.status = 'active';
            existingSub.frequency = frequency;
            existingSub.expirationDate = Date.now() + durationMs;
            return existingSub;
        } else {
            const newSub: Subscription = {
                userId,
                plan: 'pro',
                frequency,
                status: 'active',
                startDate: Date.now(),
                expirationDate: Date.now() + durationMs,
                autoRenew: true
            };
            subscriptionsDB.push(newSub);
            return newSub;
        }
    }

    public async getStatus(userId: string): Promise<Subscription | { plan: string, status: string }> {
        const sub = subscriptionsDB.find(s => s.userId === userId);

        if (!sub) {
            return { plan: 'free', status: 'active' };
        }

        // Check expiration
        if (sub.expirationDate < Date.now()) {
            sub.status = 'expired';
            sub.plan = 'free';
        }

        return sub;
    }
}

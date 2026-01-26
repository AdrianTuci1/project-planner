import { BaseApiService } from './BaseApiService';

export class SubscriptionModule extends BaseApiService {
    async createCheckoutSession(planType: 'monthly' | 'yearly'): Promise<{ url: string }> {
        return this.post<{ url: string }>('/subscription/checkout', { planType });
    }

    async createCustomerPortalSession(): Promise<{ url: string }> {
        return this.post<{ url: string }>('/subscription/portal', {});
    }
}

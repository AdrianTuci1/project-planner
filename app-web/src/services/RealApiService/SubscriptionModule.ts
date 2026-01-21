import { BaseApiService } from './BaseApiService';

export class SubscriptionModule extends BaseApiService {
    async createCheckoutSession(priceId: string): Promise<{ url: string }> {
        return this.post<{ url: string }>('/subscription/checkout', { priceId });
    }

    async createCustomerPortalSession(): Promise<{ url: string }> {
        return this.post<{ url: string }>('/subscription/portal', {});
    }
}

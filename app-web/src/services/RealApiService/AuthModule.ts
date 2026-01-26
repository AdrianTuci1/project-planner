import { BaseApiService } from './BaseApiService';

export class AuthModule extends BaseApiService {
    async syncUser(onboardingData: any): Promise<any> {
        return this.post<{ data: any }>('/users/sync', { onboarding: onboardingData }).then(res => res.data);
    }
}

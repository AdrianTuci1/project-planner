import { SubscriptionService } from './subscription.service';

// Since the service uses a module-level variable for storage, 
// we rely on unique userIds to isolate tests.

describe('SubscriptionService', () => {
    let service: SubscriptionService;

    beforeEach(() => {
        service = new SubscriptionService();
    });

    describe('upgradeToPro', () => {
        it('should create a new subscription', async () => {
            const userId = 'u-' + Date.now();
            const sub = await service.upgradeToPro(userId, 'monthly');
            expect(sub.plan).toBe('pro');
            expect(sub.status).toBe('active');
            expect(sub.userId).toBe(userId);
        });

        it('should update existing subscription', async () => {
            const userId = 'u-exist-' + Date.now();
            await service.upgradeToPro(userId, 'monthly');
            const sub = await service.upgradeToPro(userId, 'yearly');

            expect(sub.frequency).toBe('yearly');
            // Expiration should be roughly 1 year from now
            const duration = sub.expirationDate - Date.now();
            expect(duration).toBeGreaterThan(300 * 24 * 60 * 60 * 1000);
        });
    });

    describe('getStatus', () => {
        it('should return free status for unknown user', async () => {
            const status = await service.getStatus('u-none');
            expect(status.plan).toBe('free');
        });

        it('should return active pro status', async () => {
            const userId = 'u-pro-' + Date.now();
            await service.upgradeToPro(userId);
            const status = await service.getStatus(userId);
            expect(status.plan).toBe('pro');
        });

        // Hard to test expiration without mocking Date.now() or modifying the private array.
        // We can mock Date.now()
        it('should return expired status if lapsed', async () => {
            const userId = 'u-exp-' + Date.now();

            const realDateNow = Date.now;
            // Mock Date.now to return past
            // Wait, we need to create it, then move time forward.

            // 1. Create sub
            await service.upgradeToPro(userId, 'monthly');

            // 2. Move time forward 40 days
            jest.spyOn(Date, 'now').mockReturnValue(realDateNow() + 40 * 24 * 60 * 60 * 1000);

            const status = await service.getStatus(userId);
            expect(status.status).toBe('expired');
            expect(status.plan).toBe('free');

            // Restore
            jest.spyOn(Date, 'now').mockRestore();
        });
    });
});

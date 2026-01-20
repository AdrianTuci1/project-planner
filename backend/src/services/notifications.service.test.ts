import { NotificationsService } from './notifications.service';
import { DBClient } from '../config/db.client';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('../config/db.client');
jest.mock('@aws-sdk/lib-dynamodb');

describe('NotificationsService', () => {
    let service: NotificationsService;
    let mockDocClient: any;

    beforeEach(() => {
        mockDocClient = {
            send: jest.fn(),
        };
        (DBClient.getInstance as jest.Mock).mockReturnValue(mockDocClient);

        jest.clearAllMocks();
        service = new NotificationsService();
    });

    describe('createNotification', () => {
        it('should create a notification', async () => {
            const result = await service.createNotification('user-1', 'info', 'Title', 'Msg');
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
            expect(result.userId).toBe('user-1');
            expect(result.title).toBe('Title');
        });
    });

    describe('getUserNotifications', () => {
        it('should return user notifications', async () => {
            const mockNotifs = [{ id: 'n1', userId: 'user-1' }];
            mockDocClient.send.mockResolvedValueOnce({ Items: mockNotifs });

            const result = await service.getUserNotifications('user-1');
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
            expect(result).toHaveLength(1);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            await service.markAsRead('n1', 'user-1');
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
        });
    });

    describe('sendGlobalNotification', () => {
        it('should send notification to all users', async () => {
            const mockUsers = [{ id: 'u1' }, { id: 'u2' }];
            // Mock Scan users
            mockDocClient.send.mockResolvedValueOnce({ Items: mockUsers });

            // Mock Put for each user
            mockDocClient.send.mockResolvedValue({});

            const result = await service.sendGlobalNotification('Global', 'Msg');

            expect(mockDocClient.send).toHaveBeenCalledTimes(3); // 1 Scan + 2 Puts
            expect(result.sentCount).toBe(2);
        });
    });

    describe('sendWelcomeNotification', () => {
        it('should send welcome notification', async () => {
            await service.sendWelcomeNotification('u1', 'test@test.com');
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
        });
    });
});

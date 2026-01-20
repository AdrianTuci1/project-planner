import { SettingsService } from './settings.service';
import { DBClient } from '../config/db.client';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('../config/db.client');
jest.mock('@aws-sdk/lib-dynamodb');

describe('SettingsService', () => {
    let service: SettingsService;
    let mockDocClient: any;

    beforeEach(() => {
        mockDocClient = {
            send: jest.fn(),
        };
        (DBClient.getInstance as jest.Mock).mockReturnValue(mockDocClient);

        jest.clearAllMocks();
        service = new SettingsService();
    });

    describe('getGeneralSettings', () => {
        it('should return default settings if not found', async () => {
            mockDocClient.send.mockResolvedValueOnce({ Item: undefined });
            const result = await service.getGeneralSettings('u1');
            expect(result.moveTasksBottom).toBe(false); // default
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(GetCommand));
        });

        it('should return stored settings', async () => {
            const mockSettings = { moveTasksBottom: true };
            mockDocClient.send.mockResolvedValueOnce({ Item: mockSettings });
            const result = await service.getGeneralSettings('u1');
            expect(result.moveTasksBottom).toBe(true);
        });
    });

    describe('updateGeneralSettings', () => {
        it('should update settings', async () => {
            // Mock get
            mockDocClient.send.mockResolvedValueOnce({ Item: { autoSetActualTime: false } });
            // Mock put
            mockDocClient.send.mockResolvedValueOnce({});

            await service.updateGeneralSettings({ autoSetActualTime: true }, 'u1');

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));

            // Verify put content if needed (optional since we trust the call happened)
        });
    });
});

import { CalendarService } from './calendar.service';
import { DBClient } from '../config/db.client';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('../config/db.client');
// Don't mock lib-dynamodb so we can use real Commands and inspect them
// jest.mock('@aws-sdk/lib-dynamodb');

describe('CalendarService', () => {
    let service: CalendarService;
    let mockDocClient: any;

    beforeEach(() => {
        mockDocClient = {
            send: jest.fn(),
        };
        (DBClient.getInstance as jest.Mock).mockReturnValue(mockDocClient);

        jest.clearAllMocks();
        service = new CalendarService();
    });

    describe('getCalendars', () => {
        it('should return default data if not found', async () => {
            mockDocClient.send.mockResolvedValueOnce({ Item: undefined });
            const result = await service.getCalendars('u1');
            expect(result.accounts).toHaveLength(0);
        });

        it('should return stored data', async () => {
            const mockData = { accounts: [{ id: 'a1' }] };
            mockDocClient.send.mockResolvedValueOnce({ Item: mockData });
            const result = await service.getCalendars('u1');
            expect(result.accounts).toHaveLength(1);
        });
    });

    describe('addAccount', () => {
        it('should add account and save', async () => {
            // Mock get
            mockDocClient.send.mockResolvedValueOnce({ Item: { accounts: [] } });
            // Mock put
            mockDocClient.send.mockResolvedValueOnce({});

            await service.addAccount({ id: 'a1', email: 'e@e.com', provider: 'google', accessToken: 't', refreshToken: 'r' } as any, 'u1');

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
        });
    });

    describe('removeAccount', () => {
        it('should remove account and save', async () => {
            // Mock get
            mockDocClient.send.mockResolvedValueOnce({ Item: { accounts: [{ id: 'a1' }] } });
            // Mock put
            mockDocClient.send.mockResolvedValueOnce({});

            await service.removeAccount('a1', 'u1');

            // Verify the put call had empty accounts
            const putCall = mockDocClient.send.mock.calls[1][0];
            // putCall[0] is the command. command.input is the input params.
            expect(putCall.input.Item.accounts).toHaveLength(0);
        });
    });

    describe('updateAccount', () => {
        it('should update account details', async () => {
            // Mock get
            mockDocClient.send.mockResolvedValueOnce({ Item: { accounts: [{ id: 'a1', subCalendars: [] }] } });
            // Mock put
            mockDocClient.send.mockResolvedValueOnce({});

            await service.updateAccount('a1', { guestUpdateStrategy: 'all' } as any, 'u1');

            const putCall = mockDocClient.send.mock.calls[1][0];
            expect(putCall.input.Item.accounts[0].guestUpdateStrategy).toBe('all');
        });
    });

    describe('fetchSubCalendars', () => {
        it('should merge subcalendars', async () => {
            // Mock get (fetchSubCalendars)
            mockDocClient.send.mockResolvedValueOnce({ Item: { accounts: [{ id: 'a1', color: 'red' }] } });

            // Mock get (updateAccount - called internally)
            mockDocClient.send.mockResolvedValueOnce({ Item: { accounts: [{ id: 'a1', color: 'red' }] } });

            // Mock put (updateCalendars)
            mockDocClient.send.mockResolvedValueOnce({});


            await service.fetchSubCalendars('a1', 'u1');

            expect(mockDocClient.send).toHaveBeenCalledTimes(3);
        });
    });
});

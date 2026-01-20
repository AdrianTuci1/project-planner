import { InvitationsService } from './invitations.service';
import { DBClient } from '../config/db.client';
import { WorkspacesService } from './workspaces.service';
import { NotificationsService } from './notifications.service';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('../config/db.client');
jest.mock('./workspaces.service');
jest.mock('./notifications.service');
jest.mock('@aws-sdk/lib-dynamodb');

describe('InvitationsService', () => {
    let service: InvitationsService;
    let mockDocClient: any;
    let mockWorkspacesService: any;
    let mockNotificationsService: any;

    beforeEach(() => {
        mockDocClient = {
            send: jest.fn(),
        };
        (DBClient.getInstance as jest.Mock).mockReturnValue(mockDocClient);

        // Mock dependencies
        mockWorkspacesService = {
            addMember: jest.fn(),
        };
        (WorkspacesService as jest.Mock).mockImplementation(() => mockWorkspacesService);

        mockNotificationsService = {
            createNotification: jest.fn(),
        };
        (NotificationsService as jest.Mock).mockImplementation(() => mockNotificationsService);

        jest.clearAllMocks();
        service = new InvitationsService();
        // Since constructor calls new(), we rely on module mocking.
    });

    describe('createInvitation', () => {
        it('should create an invitation and send notification if user exists', async () => {
            const email = 'test@example.com';
            const workspaceId = 'ws-1';
            const inviterId = 'user-inviter';
            const inviterName = 'Inviter';
            const foundUserId = 'user-found';

            // Mock findUserIdByEmail (ScanCommand)
            mockDocClient.send.mockResolvedValueOnce({ Items: [{ id: foundUserId, email }] });

            // Mock PutCommand
            mockDocClient.send.mockResolvedValueOnce({});

            const result = await service.createInvitation(email, workspaceId, inviterId, inviterName);

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
            expect(mockNotificationsService.createNotification).toHaveBeenCalled();
            expect(result.email).toBe(email);
        });

        it('should throw error if user not found', async () => {
            mockDocClient.send.mockResolvedValueOnce({ Items: [] }); // No user found
            await expect(service.createInvitation('unknown@example.com', 'ws-1', 'u1', 'name'))
                .rejects.toThrow("User not found");
        });
    });

    describe('acceptInvitation', () => {
        const inviteId = 'inv-1';
        const userId = 'user-1';
        const workspaceId = 'ws-1';
        const email = 'test@example.com';

        it('should accept invitation and add member', async () => {
            // Mock getInvitation
            mockDocClient.send.mockResolvedValueOnce({
                Item: { id: inviteId, workspaceId, email, status: 'pending' }
            });

            // Mock getUserById
            mockDocClient.send.mockResolvedValueOnce({
                Item: { id: userId, email }
            });

            // Mock WorkspacesService.addMember
            mockWorkspacesService.addMember.mockResolvedValue({});

            // Mock DeleteInvite
            mockDocClient.send.mockResolvedValueOnce({});

            await service.acceptInvitation(inviteId, userId);

            expect(mockWorkspacesService.addMember).toHaveBeenCalledWith(workspaceId, userId);
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
        });

        it('should throw if invitation not found', async () => {
            mockDocClient.send.mockResolvedValueOnce({ Item: undefined });
            await expect(service.acceptInvitation(inviteId, userId)).rejects.toThrow("Invitation not found");
        });

        it('should throw if email mismatch', async () => {
            // Mock getInvitation
            mockDocClient.send.mockResolvedValueOnce({
                Item: { id: inviteId, workspaceId, email, status: 'pending' }
            });

            // Mock getUserById
            mockDocClient.send.mockResolvedValueOnce({
                Item: { id: userId, email: 'other@example.com' }
            });

            await expect(service.acceptInvitation(inviteId, userId)).rejects.toThrow("not sent to your email");
        });
    });

    describe('declineInvitation', () => {
        it('should delete the invitation', async () => {
            mockDocClient.send.mockResolvedValueOnce({});
            await service.declineInvitation('inv-1');
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
        });
    });
});

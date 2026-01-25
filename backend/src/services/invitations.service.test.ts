import { InvitationsService } from './invitations.service';
import { DBClient } from '../config/db.client';
import { WorkspacesService } from './workspaces.service';
import { NotificationsService } from './notifications.service';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
            getWorkspaceById: jest.fn(),
        };
        (WorkspacesService as jest.Mock).mockImplementation(() => mockWorkspacesService);

        mockNotificationsService = {
            createNotification: jest.fn(),
        };
        (NotificationsService as jest.Mock).mockImplementation(() => mockNotificationsService);

        jest.clearAllMocks();
        service = new InvitationsService();
    });

    describe('createInvitation', () => {
        it('should create an invitation and send notification if user exists', async () => {
            const email = 'test@example.com';
            const workspaceId = 'ws-1';
            const inviterId = 'user-inviter';
            const foundUserId = 'user-found';

            // Mock getWorkspace
            mockWorkspacesService.getWorkspaceById.mockResolvedValue({ id: workspaceId, name: 'Test WS' });

            // Mock PutCommand (invitation)
            mockDocClient.send.mockResolvedValueOnce({});

            // Mock findUserIdByEmail (ScanCommand)
            mockDocClient.send.mockResolvedValueOnce({ Items: [{ id: foundUserId }] });

            const result = await service.createInvitation(email, workspaceId, inviterId);

            expect(mockWorkspacesService.getWorkspaceById).toHaveBeenCalledWith(workspaceId);
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(ScanCommand)); // check user email
            expect(mockNotificationsService.createNotification).toHaveBeenCalled(); // to invitee
            expect(result.email).toBe(email);
        });

        it('should throw error if workspace not found', async () => {
            mockWorkspacesService.getWorkspaceById.mockResolvedValue(undefined);
            await expect(service.createInvitation('test@example.com', 'ws-none', 'u1'))
                .rejects.toThrow("Workspace not found");
        });
    });

    describe('respondToInvitation', () => {
        const inviteId = 'inv-1';
        const responderId = 'user-1';
        const workspaceId = 'ws-1';

        it('should accept invitation and add member', async () => {
            // Mock getInvitation
            mockDocClient.send.mockResolvedValueOnce({
                Item: { id: inviteId, workspaceId, email: 'e@mail.com', inviterId: 'u2', status: 'pending' }
            });

            // Mock UpdateCommand (Invite status)
            mockDocClient.send.mockResolvedValueOnce({});

            await service.respondToInvitation(inviteId, true, responderId);

            // Verified updated to accepted
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
            // Verified workspace addMember called
            expect(mockWorkspacesService.addMember).toHaveBeenCalledWith(workspaceId, responderId);
            // Verified inviter notified
            expect(mockNotificationsService.createNotification).toHaveBeenCalledWith('u2', 'info', expect.stringContaining('Accepted'), expect.any(String));
        });

        it('should decline invitation', async () => {
            // Mock getInvitation
            mockDocClient.send.mockResolvedValueOnce({
                Item: { id: inviteId, workspaceId, email: 'e@mail.com', inviterId: 'u2', status: 'pending' }
            });

            // Mock UpdateCommand (Invite status)
            mockDocClient.send.mockResolvedValueOnce({});

            await service.respondToInvitation(inviteId, false, responderId);

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
            // Ensure NO addMember
            expect(mockWorkspacesService.addMember).not.toHaveBeenCalled();
            // Ensure NO notification to inviter (logic says only check if accept?)
            // Actually checking logic: "if (accept) { ... Notify Inviter }"
            expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
        });

        it('should throw if invitation not pending', async () => {
            // Mock getInvitation
            mockDocClient.send.mockResolvedValueOnce({
                Item: { id: inviteId, status: 'accepted' }
            });

            await expect(service.respondToInvitation(inviteId, true, responderId)).rejects.toThrow("already responded");
        });
    });
});

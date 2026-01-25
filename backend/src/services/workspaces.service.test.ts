import { WorkspacesService } from './workspaces.service';
import { DBClient } from '../config/db.client';
import { NotificationsService } from './notifications.service';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('../config/db.client');
jest.mock('./notifications.service');
jest.mock('@aws-sdk/lib-dynamodb');

describe('WorkspacesService', () => {
    let service: WorkspacesService;
    let mockDocClient: any;
    let mockNotificationsService: any;

    beforeEach(() => {
        mockDocClient = {
            send: jest.fn(),
        };
        (DBClient.getInstance as jest.Mock).mockReturnValue(mockDocClient);

        // Clear all mocks
        jest.clearAllMocks();

        service = new WorkspacesService();
        mockNotificationsService = (NotificationsService as any).mock.instances[0];
    });

    describe('getAllWorkspaces', () => {
        it('should return workspaces for the user', async () => {
            const userId = 'user-123';
            const mockWorkspaces = [
                { id: 'ws-1', name: 'Team WS', type: 'team', ownerId: 'user-123', members: ['user-123'] },
                { id: 'ws-2', name: 'Other WS', type: 'team', ownerId: 'other-user', members: ['other-user'] }
            ];

            // Mock that personal workspace already exists
            const mockWorkspacesWithPersonal = [
                { id: 'ws-personal', name: 'Personal', type: 'personal', ownerId: 'user-123', members: ['user-123'] },
                ...mockWorkspaces
            ];

            mockDocClient.send.mockResolvedValueOnce({ Items: mockWorkspacesWithPersonal });

            const result = await service.getAllWorkspaces(userId);

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
            expect(result).toHaveLength(2); // Personal + Team WS
            expect(result[0].id).toBe('ws-personal');
            expect(result[1].id).toBe('ws-1');
        });

        it('should create a personal workspace if one does not exist', async () => {
            const userId = 'user-new';
            const email = 'test@example.com';
            mockDocClient.send.mockResolvedValueOnce({ Items: [] }); // No workspaces

            await service.getAllWorkspaces(userId, email);

            // specific check for PutCommand (creation)
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));

            // Check if notification was sent
            expect(mockNotificationsService.sendWelcomeNotification).toHaveBeenCalledWith(userId, email);
        });
    });

    describe('createWorkspace', () => {
        it('should create a new workspace', async () => {
            const name = 'New Workspace';
            const type = 'team';
            const ownerId = 'user-123';

            // Mock getWorkspaceById returns undefined (no conflict)
            mockDocClient.send.mockResolvedValueOnce({ Item: undefined });

            // Mock Put
            mockDocClient.send.mockResolvedValueOnce({});

            const result = await service.createWorkspace(name, type, ownerId);

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
            expect(result.name).toBe(name);
            expect(result.type).toBe(type);
            expect(result.ownerId).toBe(ownerId);
            expect(result.members).toContain(ownerId);
        });
    });

    describe('getWorkspaceById', () => {
        it('should return a workspace by ID', async () => {
            const mockWorkspace = { id: 'ws-1', name: 'Test' };
            mockDocClient.send.mockResolvedValueOnce({ Item: mockWorkspace });

            const result = await service.getWorkspaceById('ws-1');

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(GetCommand));
            expect(result).toEqual(mockWorkspace);
        });

        it('should return undefined if not found', async () => {
            mockDocClient.send.mockResolvedValueOnce({ Item: undefined });
            const result = await service.getWorkspaceById('ws-none');
            expect(result).toBeUndefined();
        });
    });

    describe('addMember', () => {
        it('should add a member if not already present', async () => {
            const workspaceId = 'ws-1';
            const newUserId = 'user-add';
            const mockWorkspace = { id: workspaceId, members: ['owner'] };

            // Mock getWorkspaceById
            mockDocClient.send.mockResolvedValueOnce({ Item: mockWorkspace });

            // Mock UpdateCommand
            mockDocClient.send.mockResolvedValueOnce({});

            await service.addMember(workspaceId, newUserId);

            expect(mockDocClient.send).toHaveBeenCalledTimes(2); // Get + Update
            expect(mockDocClient.send).toHaveBeenNthCalledWith(2, expect.any(UpdateCommand));
        });

        it('should not add member if already present', async () => {
            const workspaceId = 'ws-1';
            const userId = 'user-exists';
            const mockWorkspace = { id: workspaceId, members: ['owner', userId] };

            // Mock getWorkspaceById
            mockDocClient.send.mockResolvedValueOnce({ Item: mockWorkspace });

            await service.addMember(workspaceId, userId);

            expect(mockDocClient.send).toHaveBeenCalledTimes(1); // Only Get
        });
    });

    describe('removeMember', () => {
        it('should remove member if present', async () => {
            const workspaceId = 'ws-1';
            const userId = 'user-remove';
            const mockWorkspace = { id: workspaceId, members: ['owner', userId] };

            mockDocClient.send.mockResolvedValueOnce({ Item: mockWorkspace });
            mockDocClient.send.mockResolvedValueOnce({});

            await service.removeMember(workspaceId, userId);

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
        });
    });

    describe('assignOwner', () => {
        it('should update owner if member exists', async () => {
            const workspaceId = 'ws-1';
            const newOwner = 'user-2';
            const mockWorkspace = { id: workspaceId, members: ['user-1', newOwner], ownerId: 'user-1' };

            mockDocClient.send.mockResolvedValueOnce({ Item: mockWorkspace });
            mockDocClient.send.mockResolvedValueOnce({});

            await service.assignOwner(workspaceId, newOwner);

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
        });

        it('should throw if new owner is not a member', async () => {
            const workspaceId = 'ws-1';
            const newOwner = 'user-external';
            const mockWorkspace = { id: workspaceId, members: ['user-1'], ownerId: 'user-1' };

            mockDocClient.send.mockResolvedValueOnce({ Item: mockWorkspace });

            await expect(service.assignOwner(workspaceId, newOwner)).rejects.toThrow("New owner must be a member");
        });
    });

    describe('deleteWorkspace', () => {
        it('should delete workspace and cascading resources', async () => {
            const workspaceId = 'ws-1';
            const mockWorkspace = { id: workspaceId, members: ['user-1'] };

            // Mock getWorkspace
            mockDocClient.send.mockResolvedValueOnce({ Item: mockWorkspace });

            // Mock Delete Workspace
            mockDocClient.send.mockResolvedValueOnce({});

            // Mock Cascade: Tasks (Scan returns 2, then BatchDelete)
            // Tasks Scan
            mockDocClient.send.mockResolvedValueOnce({ Items: [{ id: 't1' }, { id: 't2' }] });
            // Task 1 Delete
            mockDocClient.send.mockResolvedValueOnce({});
            // Task 2 Delete
            mockDocClient.send.mockResolvedValueOnce({});

            // Groups Scan (empty)
            mockDocClient.send.mockResolvedValueOnce({ Items: [] });

            // Labels Scan (empty)
            mockDocClient.send.mockResolvedValueOnce({ Items: [] });

            await service.deleteWorkspace(workspaceId);

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
        });
    });
});

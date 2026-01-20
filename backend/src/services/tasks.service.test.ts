import { TasksService } from './tasks.service';
import { DBClient } from '../config/db.client';
import { WorkspacesService } from './workspaces.service';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('../config/db.client');
jest.mock('./workspaces.service');
jest.mock('@aws-sdk/lib-dynamodb');

describe('TasksService', () => {
    let service: TasksService;
    let mockDocClient: any;
    let mockWorkspacesService: any;

    beforeEach(() => {
        mockDocClient = {
            send: jest.fn(),
        };
        (DBClient.getInstance as jest.Mock).mockReturnValue(mockDocClient);

        // Mock WorkspacesService instance
        mockWorkspacesService = {
            getWorkspaceById: jest.fn(),
        };
        (WorkspacesService as jest.Mock).mockImplementation(() => mockWorkspacesService);

        jest.clearAllMocks();
        service = new TasksService();
        // Manually replace the internal service if constructor mock didn't catch it (it should have)
        // But since we are mocking the module, `new WorkspacesService()` returns our mock.
        // However, `service.workspacesService` is public, so we can also override it directly if needed.
        service.workspacesService = mockWorkspacesService;
    });

    describe('getTasks', () => {
        const userId = 'user-123';
        const workspaceId = 'ws-1';

        it('should filter tasks by workspace and user access', async () => {
            const mockTasks = [
                { id: 't1', workspaceId: 'ws-1', title: 'Task 1' },
                { id: 't2', workspaceId: 'ws-2', title: 'Task 2' }
            ];
            mockDocClient.send.mockResolvedValueOnce({ Items: mockTasks });

            mockWorkspacesService.getWorkspaceById.mockResolvedValue({
                id: 'ws-1',
                members: ['user-123']
            });

            const result = await service.getTasks('', '', workspaceId, userId);

            expect(mockWorkspacesService.getWorkspaceById).toHaveBeenCalledWith(workspaceId);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('t1');
        });

        it('should throw error if workspace not found', async () => {
            mockDocClient.send.mockResolvedValueOnce({ Items: [] });
            mockWorkspacesService.getWorkspaceById.mockResolvedValue(undefined);

            await expect(service.getTasks('', '', 'ws-none', userId))
                .rejects.toThrow("Workspace not found");
        });

        it('should throw error if user not member of workspace', async () => {
            mockDocClient.send.mockResolvedValueOnce({ Items: [] });
            mockWorkspacesService.getWorkspaceById.mockResolvedValue({
                id: 'ws-1',
                members: ['other-user']
            });

            await expect(service.getTasks('', '', workspaceId, userId))
                .rejects.toThrow("Access denied to this workspace");
        });

        it('should return non-workspace tasks if no workspaceId provided', async () => {
            const mockTasks = [
                { id: 't1', workspaceId: 'ws-1' },
                { id: 't3', title: 'Personal Task' }
            ];
            mockDocClient.send.mockResolvedValueOnce({ Items: mockTasks });

            const result = await service.getTasks('', '', '', userId);

            // Should filter t -> !t.workspaceId
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('t3');
        });

        it('should filter by date range', async () => {
            const mockTasks = [
                { id: 't1', workspaceId: 'ws-1', scheduledDate: '2023-01-01' },
                { id: 't2', workspaceId: 'ws-1', scheduledDate: '2023-01-10' },
                { id: 't3', workspaceId: 'ws-1' } // Backlog task
            ];
            mockDocClient.send.mockResolvedValueOnce({ Items: mockTasks });
            mockWorkspacesService.getWorkspaceById.mockResolvedValue({
                id: 'ws-1',
                members: [userId]
            });

            const startDate = '2023-01-01';
            const endDate = '2023-01-05';

            const result = await service.getTasks(startDate, endDate, workspaceId, userId);

            expect(result).toHaveLength(2); // t1 (in range) + t3 (no date)
            const ids = result.map((t: any) => t.id);
            expect(ids).toContain('t1');
            expect(ids).toContain('t3');
            expect(ids).not.toContain('t2');
        });
    });

    describe('createTask', () => {
        it('should create a task', async () => {
            const task = { title: 'New Task' };
            await service.createTask(task);
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
        });
    });

    describe('updateTask', () => {
        it('should update a task', async () => {
            const task = { title: 'Updated' };
            const id = 't-1';
            const result = await service.updateTask(id, task);

            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
            expect(result.id).toBe(id);
            expect(result.title).toBe('Updated');
        });
    });

    describe('deleteTask', () => {
        it('should delete a task', async () => {
            const id = 't-1';
            await service.deleteTask(id);
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
        });
    });
});

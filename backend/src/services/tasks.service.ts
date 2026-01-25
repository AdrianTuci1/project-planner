import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { WorkspacesService } from "./workspaces.service";
import { SettingsService } from "./settings.service";
import { SSEService } from "./sse.service";

export class TasksService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_TASKS || 'tasks';
    }

    public workspacesService = new WorkspacesService();

    public async getTasks(startDate: string, endDate: string, workspaceId: string, userId: string) {
        // ... (Existing logic unchanged)
        // Ignoring existing logic for brevity in this tool call, but strictly rewriting full file to avoid truncation errors in mixed approach.
        // Actually, careful with write_to_file overwriting everything. I must include all logic.

        // RE-IMPLEMENTING FULL METHOD to ensure no code loss.
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        let allTasks = result.Items || [];

        if (allTasks.length > 0) {
            const matchUser = allTasks.some(t => t.createdBy === userId);
            const matchWorkspace = allTasks.some(t => t.workspaceId === workspaceId || (!t.workspaceId && workspaceId === 'personal'));
            // console.log(`[TasksService] Match Summary...`);
        }

        // 1. Filter by Workspace Access
        if (workspaceId === 'personal') {
            allTasks = allTasks.filter((t: any) =>
                (t.workspaceId === 'personal' || !t.workspaceId) &&
                (t.createdBy === userId || !t.createdBy)
            );
        } else if (workspaceId && workspaceId.startsWith('team-')) {
            const isMyTeam = workspaceId === `team-${userId}`;
            let hasAccess = isMyTeam;

            if (!hasAccess) {
                const settingsService = new SettingsService();
                const settings = await settingsService.getGeneralSettings(userId);
                if (settings.teamId === workspaceId) {
                    hasAccess = true;
                }
            }

            if (!hasAccess) {
                return [];
            }

            allTasks = allTasks.filter((t: any) => t.workspaceId === workspaceId);

        } else if (workspaceId === 'team') {
            const settingsService = new SettingsService();
            const settings = await settingsService.getGeneralSettings(userId);
            const actualTeamId = settings.teamId || `team-${userId}`;
            allTasks = allTasks.filter((t: any) => t.workspaceId === actualTeamId);

        } else if (workspaceId) {
            const workspace = await this.workspacesService.getWorkspaceById(workspaceId);
            if (!workspace) throw new Error("Workspace not found");
            if (!workspace.members.includes(userId)) throw new Error("Access denied to this workspace");
            allTasks = allTasks.filter((t: any) => t.workspaceId === workspaceId);
        } else {
            allTasks = allTasks.filter((t: any) =>
                (!t.workspaceId || t.workspaceId === 'personal') &&
                (t.createdBy === userId || !t.createdBy)
            );
        }

        // 2. Filter by Date Range
        if (!startDate || !endDate) return allTasks;

        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        const filtered = allTasks.filter((task: any) => {
            if (!task.scheduledDate) return true;
            const taskDate = new Date(task.scheduledDate).getTime();
            return taskDate >= start && taskDate <= end;
        });

        return filtered;
    }

    public async createTask(task: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: task
        });
        await this.docClient.send(command);

        // SSE Emit
        if (task.createdBy) {
            SSEService.getInstance().sendToUser(task.createdBy, 'task.created', task);
            // If workspace task, should ideally broadcast to workspace members.
            // For MVP, limiting to creator or simple team logic if we knew members here.
        }

        return task;
    }

    public async updateTask(id: string, task: any) {
        const existing = await this.getTaskById(id);

        const updated = { ...existing, ...task, id };
        const command = new PutCommand({
            TableName: this.tableName,
            Item: updated
        });
        await this.docClient.send(command);

        // SSE Emit
        if (existing && existing.createdBy) {
            SSEService.getInstance().sendToUser(existing.createdBy, 'task.updated', updated);
        }

        return updated;
    }

    public async getTaskById(id: string) {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: "id = :id",
            ExpressionAttributeValues: {
                ":id": id
            }
        });
        const result = await this.docClient.send(command);
        return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    public async deleteTask(id: string) {
        // Need to fetch first to know who to notify
        const existing = await this.getTaskById(id);

        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);

        // SSE Emit
        if (existing && existing.createdBy) {
            SSEService.getInstance().sendToUser(existing.createdBy, 'task.deleted', { id });
        }

        return { id };
    }
}

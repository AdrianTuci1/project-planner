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
        if (task.workspaceId && task.workspaceId !== 'personal') {
            try {
                const workspace = await this.workspacesService.getWorkspaceById(task.workspaceId);
                if (workspace && workspace.members) {
                    SSEService.getInstance().sendToUsers(workspace.members, 'task.created', task);
                } else if (task.createdBy) {
                    SSEService.getInstance().sendToUser(task.createdBy, 'task.created', task);
                }
            } catch (err) {
                console.error("Failed to broadcast task creation", err);
                // Fallback to creator
                if (task.createdBy) SSEService.getInstance().sendToUser(task.createdBy, 'task.created', task);
            }
        } else if (task.createdBy) {
            SSEService.getInstance().sendToUser(task.createdBy, 'task.created', task);
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
        if (existing) {
            const targetWorkspaceId = updated.workspaceId || existing.workspaceId;
            if (targetWorkspaceId && targetWorkspaceId !== 'personal') {
                try {
                    const workspace = await this.workspacesService.getWorkspaceById(targetWorkspaceId);
                    if (workspace && workspace.members) {
                        SSEService.getInstance().sendToUsers(workspace.members, 'task.updated', updated);
                    } else if (existing.createdBy) {
                        SSEService.getInstance().sendToUser(existing.createdBy, 'task.updated', updated);
                    }
                } catch (err) {
                    console.error("Failed to broadcast task update", err);
                    if (existing.createdBy) SSEService.getInstance().sendToUser(existing.createdBy, 'task.updated', updated);
                }
            } else if (existing.createdBy) {
                SSEService.getInstance().sendToUser(existing.createdBy, 'task.updated', updated);
            }
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
        // ... existing implementation ...
        // Need to fetch first to know who to notify
        const existing = await this.getTaskById(id);

        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);

        // SSE Emit
        if (existing) {
            const targetWorkspaceId = existing.workspaceId;
            if (targetWorkspaceId && targetWorkspaceId !== 'personal') {
                try {
                    const workspace = await this.workspacesService.getWorkspaceById(targetWorkspaceId);
                    if (workspace && workspace.members) {
                        SSEService.getInstance().sendToUsers(workspace.members, 'task.deleted', { id });
                    } else if (existing.createdBy) {
                        SSEService.getInstance().sendToUser(existing.createdBy, 'task.deleted', { id });
                    }
                } catch (err) {
                    console.error("Failed to broadcast task deletion", err);
                    if (existing.createdBy) SSEService.getInstance().sendToUser(existing.createdBy, 'task.deleted', { id });
                }
            } else if (existing.createdBy) {
                SSEService.getInstance().sendToUser(existing.createdBy, 'task.deleted', { id });
            }
        }

        return { id };
    }

    public async deleteUserPersonalTasks(userId: string) {
        // Scan for tasks created by user AND (workspaceId is missing OR workspaceId = 'personal')
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: "(createdBy = :u) AND (attribute_not_exists(workspaceId) OR workspaceId = :p)",
            ExpressionAttributeValues: {
                ":u": userId,
                ":p": "personal"
            }
        });

        const result = await this.docClient.send(command);
        const tasks = result.Items || [];

        // Delete in batches of 25 (DynamoDB limit for BatchWrite is 25, but we can just loop deletes or use BatchWriteItem)
        // For simplicity and considering we might need SSE, we can loop or use basic batching without SSE for account deletion 
        // (the user is being deleted, no need to update their UI).

        const chunks = [];
        for (let i = 0; i < tasks.length; i += 25) {
            chunks.push(tasks.slice(i, i + 25));
        }

        for (const chunk of chunks) {
            await Promise.all(chunk.map(task =>
                this.docClient.send(new DeleteCommand({
                    TableName: this.tableName,
                    Key: { id: task.id }
                }))
            ));
        }

        return tasks.length;
    }
}

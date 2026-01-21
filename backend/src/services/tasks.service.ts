import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { WorkspacesService } from "./workspaces.service";
import { SettingsService } from "./settings.service";

export class TasksService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_TASKS || 'tasks';
    }

    public workspacesService = new WorkspacesService();

    public async getTasks(startDate: string, endDate: string, workspaceId: string, userId: string) {
        // TODO: Scan is expensive. In production, use Query on GSI.
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        let allTasks = result.Items || [];

        console.log(`[TasksService] Total DB Items: ${allTasks.length}`);
        if (allTasks.length > 0) {
            console.log(`[TasksService] Sample Item [0]:`, JSON.stringify(allTasks[0], null, 2));
            const matchUser = allTasks[0].createdBy === userId;
            const matchWorkspace = (allTasks[0].workspaceId === 'personal' || !allTasks[0].workspaceId);
            console.log(`[TasksService] Sample Match Check - User: ${matchUser} (Item: ${allTasks[0].createdBy} vs Req: ${userId}), Workspace: ${matchWorkspace}`);
        }

        // 1. Filter by Workspace Access
        if (workspaceId === 'personal') {
            // For Personal: Only return tasks created by this user that are marked as 'personal' OR have no workspaceId
            allTasks = allTasks.filter((t: any) =>
                (t.workspaceId === 'personal' || !t.workspaceId) &&
                t.createdBy === userId
            );
        } else if (workspaceId && workspaceId.startsWith('team-')) {
            // New Strict Team Logic: specific ID requested (e.g., team-u123)
            const isMyTeam = workspaceId === `team-${userId}`;
            let hasAccess = isMyTeam;

            if (!hasAccess) {
                // Check if I joined getting settings
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
            // Legacy / Fallback 'team' placeholder logic
            const settingsService = new SettingsService();
            const settings = await settingsService.getGeneralSettings(userId);
            const actualTeamId = settings.teamId || `team-${userId}`;
            allTasks = allTasks.filter((t: any) => t.workspaceId === actualTeamId);

        } else if (workspaceId) {
            // Legacy/Specific UUID Logic
            const workspace = await this.workspacesService.getWorkspaceById(workspaceId);
            if (!workspace) throw new Error("Workspace not found");
            if (!workspace.members.includes(userId)) throw new Error("Access denied to this workspace");
            allTasks = allTasks.filter((t: any) => t.workspaceId === workspaceId);
        } else {
            // No workspaceId provided: Return personal tasks as default
            allTasks = allTasks.filter((t: any) =>
                (!t.workspaceId || t.workspaceId === 'personal') &&
                t.createdBy === userId
            );
        }

        console.log(`[TasksService] After Workspace Filter: ${allTasks.length} items`);

        // 2. Filter by Date Range
        if (!startDate || !endDate) return allTasks;

        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        const filtered = allTasks.filter((task: any) => {
            // Include if no scheduledDate (Backlog/Dump task)
            if (!task.scheduledDate) return true;

            // Include if scheduledDate is within range
            const taskDate = new Date(task.scheduledDate).getTime();
            return taskDate >= start && taskDate <= end;
        });

        console.log(`[TasksService] Final Result: ${filtered.length} items`);
        return filtered;
    }

    public async createTask(task: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: task
        });
        await this.docClient.send(command);
        return task;
    }

    public async updateTask(id: string, task: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: { ...task, id }
        });
        await this.docClient.send(command);
        return { ...task, id };
    }

    public async deleteTask(id: string) {
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);
        return { id };
    }
}

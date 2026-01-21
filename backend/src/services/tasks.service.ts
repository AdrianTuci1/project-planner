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

        if (allTasks.length > 0) {
            const matchUser = allTasks.some(t => t.createdBy === userId);
            const matchWorkspace = allTasks.some(t => t.workspaceId === workspaceId || (!t.workspaceId && workspaceId === 'personal'));
            console.log(`[TasksService] Match Summary - Found Any User Match: ${matchUser}, Found Any Workspace Match: ${matchWorkspace} (Search: ${workspaceId}, User: ${userId})`);
        }

        // 1. Filter by Workspace Access
        if (workspaceId === 'personal') {
            // For Personal: Only return tasks created by this user OR tasks with no creator if they belong to personal space
            allTasks = allTasks.filter((t: any) =>
                (t.workspaceId === 'personal' || !t.workspaceId) &&
                (t.createdBy === userId || !t.createdBy)
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
                (t.createdBy === userId || !t.createdBy)
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
        // Fetch existing to preserve fields like createdBy
        const existing = await this.getTaskById(id);

        const command = new PutCommand({
            TableName: this.tableName,
            Item: { ...existing, ...task, id }
        });
        await this.docClient.send(command);
        return { ...existing, ...task, id };
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
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);
        return { id };
    }
}

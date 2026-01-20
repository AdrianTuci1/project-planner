import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { WorkspacesService } from "./workspaces.service";

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

        // 1. Filter by Workspace Access
        if (workspaceId) {
            const workspace = await this.workspacesService.getWorkspaceById(workspaceId);

            if (!workspace) {
                throw new Error("Workspace not found");
            }

            if (!workspace.members.includes(userId)) {
                throw new Error("Access denied to this workspace");
            }

            allTasks = allTasks.filter((t: any) => t.workspaceId === workspaceId);
        } else {
            // No workspaceId provided: Return tasks that explicitly have NO workspaceId (Personal/Legacy)
            allTasks = allTasks.filter((t: any) => !t.workspaceId);
        }

        // 2. Filter by Date Range
        // If no range provided, return the workspace tasks (filtered above)
        if (!startDate || !endDate) return allTasks;

        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return allTasks.filter((task: any) => {
            // Include if no scheduledDate (Backlog/Dump task)
            if (!task.scheduledDate) return true;

            // Include if scheduledDate is within range
            const taskDate = new Date(task.scheduledDate).getTime();
            return taskDate >= start && taskDate <= end;
        });
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

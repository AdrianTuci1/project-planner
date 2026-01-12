import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";

export class TasksService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_TASKS || 'tasks';
    }

    public async getDump(startDate: string, endDate: string) {
        // Warning: Scan is expensive. In production, use Query on GSI.
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        return result.Items || [];
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

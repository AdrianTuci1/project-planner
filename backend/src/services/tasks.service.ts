import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";

export class TasksService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_TASKS || 'tasks';
    }

    public async getDump(startDate: string, endDate: string) {
        // Warning: Scan is expensive. In production, use Query on GSI (e.g., specific to User or Date range).
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        return result.Items || [];
    }
}

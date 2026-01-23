import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";

export class LabelsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_LABELS || 'labels';
    }

    public async getLabels(workspaceId?: string, userId?: string) {
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        let labels = result.Items || [];

        // Filter by creator (privacy)
        if (userId) {
            labels = labels.filter((l: any) => l.createdBy === userId || !l.createdBy);
        }

        // Filter by Workspace
        if (workspaceId) {
            labels = labels.filter((l: any) => l.workspaceId === workspaceId || (!l.workspaceId && workspaceId === 'personal'));
        } else {
            // Default to personal if no workspace provided
            labels = labels.filter((l: any) => !l.workspaceId || l.workspaceId === 'personal');
        }

        return labels;
    }

    public async createLabel(label: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: label
        });
        await this.docClient.send(command);
        return label;
    }

    public async updateLabel(id: string, label: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: { ...label, id }
        });
        await this.docClient.send(command);
        return { ...label, id };
    }

    public async deleteLabel(id: string) {
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);
        return { id };
    }
}

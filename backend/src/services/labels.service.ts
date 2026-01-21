import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";

export class LabelsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_LABELS || 'labels';
    }

    public async getLabels(workspaceId?: string) {
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        let labels = result.Items || [];

        if (workspaceId) {
            labels = labels.filter((l: any) => l.workspaceId === workspaceId || !l.workspaceId); // Allow global labels? Or strict? 
            // "Strict separation" implies strict. But standard labels might be global.
            // Let's allow global (no workspaceId) + specific workspaceId.
            // If workspaceId is 'personal', we might want only personal labels.
        } else {
            // If no workspaceId, maybe return only globals?
            // Or defaults?
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

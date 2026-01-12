import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";

export class GroupsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_GROUPS || 'groups';
    }

    public async getGroups(startDate: string, endDate: string) {
        // In a real scenario, you might filter by user or date here.
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        return result.Items || [];
    }

    public async createGroup(group: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: group
        });
        await this.docClient.send(command);
        return group;
    }

    public async updateGroup(id: string, group: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: { ...group, id }
        });
        await this.docClient.send(command);
        return { ...group, id };
    }

    public async deleteGroup(id: string) {
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);
        return { id };
    }
}

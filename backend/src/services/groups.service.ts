import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";

export class GroupsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_GROUPS || 'sm-groups';
    }

    public async getGroups(workspaceId?: string) {
        // In production, query by GSI on workspaceId
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        let groups = result.Items || [];

        if (workspaceId) {
            groups = groups.filter((g: any) => g.workspaceId === workspaceId || (!g.workspaceId && workspaceId === 'personal'));
        } else {
            // Default to personal if no workspace provided
            groups = groups.filter((g: any) => !g.workspaceId || g.workspaceId === 'personal');
        }

        return groups;
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

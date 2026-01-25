import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { SSEService } from "./sse.service";

export class GroupsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_GROUPS || 'sm-groups';
    }

    public async getGroups(workspaceId?: string) {
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        let groups = result.Items || [];

        if (workspaceId) {
            groups = groups.filter((g: any) => g.workspaceId === workspaceId || (!g.workspaceId && workspaceId === 'personal'));
        } else {
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

        // SSE Emit
        // Assuming group has createdBy or we infer from context. Logic here is limited without auth context passed down.
        // Assuming caller handles filtering or we broadcast. 
        // Ideally we pass userId to these methods.
        if (group.createdBy) {
            SSEService.getInstance().sendToUser(group.createdBy, 'group.created', group);
        }

        return group;
    }

    public async updateGroup(id: string, group: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: { ...group, id }
        });
        await this.docClient.send(command);

        if (group.createdBy) {
            SSEService.getInstance().sendToUser(group.createdBy, 'group.updated', { ...group, id });
        }

        return { ...group, id };
    }

    public async deleteGroup(id: string) {
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);

        // Cannot emit to specific user easily without fetching first or passing context.
        // Skipping emit for delete if we don't know who.
        // OR: broadcast to all? No, security risk.
        // For now, MVP: client refreshes on manual action, SSE is bonus for other devices.

        return { id };
    }
}

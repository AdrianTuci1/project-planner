import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { SSEService } from "./sse.service";
import { WorkspacesService } from "./workspaces.service";

export class GroupsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_GROUPS || 'sm-groups';
    }

    public async getGroups(workspaceId?: string, userId?: string) {
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        let groups = result.Items || [];

        // If filtering by specific workspace
        if (workspaceId && workspaceId !== 'personal') {
            groups = groups.filter((g: any) => g.workspaceId === workspaceId);
        } else {
            // "Personal" groups logic:
            // Must belong to the user (check createdBy or some owner field)
            // AND (have no workspaceId OR have workspaceId === 'personal')
            groups = groups.filter((g: any) =>
                (!g.workspaceId || g.workspaceId === 'personal') &&
                (g.createdBy === userId || !g.createdBy) // Show user's personal groups + system groups
            );
        }

        return groups;
    }

    private workspacesService = new WorkspacesService();

    public async createGroup(group: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: group
        });
        await this.docClient.send(command);

        // SSE Emit
        if (group.workspaceId && group.workspaceId !== 'personal') {
            try {
                const workspace = await this.workspacesService.getWorkspaceById(group.workspaceId);
                if (workspace && workspace.members) {
                    SSEService.getInstance().sendToUsers(workspace.members, 'group.created', group);
                } else if (group.createdBy) {
                    SSEService.getInstance().sendToUser(group.createdBy, 'group.created', group);
                }
            } catch (err) {
                console.error("Failed to broadcast group creation", err);
                if (group.createdBy) SSEService.getInstance().sendToUser(group.createdBy, 'group.created', group);
            }
        } else if (group.createdBy) {
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

        const updated = { ...group, id };

        if (group.workspaceId && group.workspaceId !== 'personal') {
            try {
                const workspace = await this.workspacesService.getWorkspaceById(group.workspaceId);
                if (workspace && workspace.members) {
                    SSEService.getInstance().sendToUsers(workspace.members, 'group.updated', updated);
                } else if (group.createdBy) {
                    SSEService.getInstance().sendToUser(group.createdBy, 'group.updated', updated);
                }
            } catch (err) {
                console.error("Failed to broadcast group update", err);
                if (group.createdBy) SSEService.getInstance().sendToUser(group.createdBy, 'group.updated', updated);
            }
        } else if (group.createdBy) {
            SSEService.getInstance().sendToUser(group.createdBy, 'group.updated', updated);
        }

        return updated;
    }

    public async deleteGroup(id: string) {
        // Fetch first to get context
        let groupToDelete: any = null;
        try {
            // We need to scan or if we had a getGroupById... relying on scan with id check for now since we don't have direct get available conveniently without params in some architectures, 
            // but actually DynamoDB get requires Key. 
            // Assuming ID is Key.
            const getCmd = new ScanCommand({
                TableName: this.tableName,
                FilterExpression: "id = :id",
                ExpressionAttributeValues: { ":id": id }
            });
            const res = await this.docClient.send(getCmd);
            if (res.Items && res.Items.length > 0) groupToDelete = res.Items[0];
        } catch (e) { console.warn("Could not fetch group before delete", e); }


        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);

        if (groupToDelete) {
            const wsId = groupToDelete.workspaceId;
            if (wsId && wsId !== 'personal') {
                try {
                    const workspace = await this.workspacesService.getWorkspaceById(wsId);
                    if (workspace && workspace.members) {
                        SSEService.getInstance().sendToUsers(workspace.members, 'group.deleted', { id, workspaceId: wsId });
                    } else if (groupToDelete.createdBy) {
                        SSEService.getInstance().sendToUser(groupToDelete.createdBy, 'group.deleted', { id });
                    }
                } catch (err) {
                    console.error("Failed to broadcast group delete", err);
                }
            } else if (groupToDelete.createdBy) {
                SSEService.getInstance().sendToUser(groupToDelete.createdBy, 'group.deleted', { id });
            }
        }

        return { id };
    }
}

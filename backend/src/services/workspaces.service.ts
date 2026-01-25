import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { Workspace } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { SSEService } from "./sse.service";
import { NotificationsService } from "./notifications.service";

export class WorkspacesService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    private notificationsService: NotificationsService;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_WORKSPACES || 'workspaces';
        this.notificationsService = new NotificationsService();
    }

    public async getAllWorkspaces(userId: string, email?: string): Promise<Workspace[]> {
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        const all = (result.Items || []) as Workspace[];

        const userWorkspaces = all.filter(w => w.members.includes(userId));

        // Ensure Personal Workspace Exists
        const hasPersonal = userWorkspaces.some(w => w.type === 'personal' && w.ownerId === userId);
        if (!hasPersonal) {
            const personal = await this.createWorkspace("Personal", 'personal', userId);
            userWorkspaces.unshift(personal);

            if (email) {
                await this.notificationsService.sendWelcomeNotification(userId, email);
            }
        }

        return userWorkspaces;
    }

    public async createWorkspace(name: string, type: 'personal' | 'team', ownerId: string): Promise<Workspace> {
        let workspaceId = uuidv4();

        if (type === 'team') {
            workspaceId = `team-${ownerId}`;
            const existing = await this.getWorkspaceById(workspaceId);
            if (existing) {
                if (existing.ownerId === ownerId) return existing;
                workspaceId = uuidv4();
            }
        }

        const newWorkspace: Workspace = {
            id: workspaceId,
            name,
            type: type,
            ownerId,
            members: [ownerId],
            createdAt: Date.now()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: newWorkspace
        });

        await this.docClient.send(command);

        // SSE Emit
        SSEService.getInstance().sendToUser(ownerId, 'workspace.created', newWorkspace);

        return newWorkspace;
    }

    public async getWorkspaceById(id: string): Promise<Workspace | undefined> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { id }
        });
        const result = await this.docClient.send(command);
        return result.Item as Workspace | undefined;
    }

    public async updateWorkspace(id: string, updates: Partial<Workspace>, userId?: string): Promise<Workspace | undefined> {
        let targetId = id;

        if (id === 'personal' && userId) {
            const all = await this.getAllWorkspaces(userId);
            const personal = all.find(w => w.type === 'personal' && w.ownerId === userId);
            if (!personal) throw new Error("Personal workspace not found");
            targetId = personal.id;
        }

        const workspace = await this.getWorkspaceById(targetId);
        if (!workspace) throw new Error("Workspace not found");

        const updateExpressionParts: string[] = [];
        const expressionAttributeNames: { [key: string]: string } = {};
        const expressionAttributeValues: { [key: string]: any } = {};

        if (updates.name) {
            updateExpressionParts.push("#name = :name");
            expressionAttributeNames["#name"] = "name";
            expressionAttributeValues[":name"] = updates.name;
        }

        if (updates.avatarUrl) {
            updateExpressionParts.push("#avatarUrl = :avatarUrl");
            expressionAttributeNames["#avatarUrl"] = "avatarUrl";
            expressionAttributeValues[":avatarUrl"] = updates.avatarUrl;
        }

        if (updateExpressionParts.length === 0) return workspace;

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { id: targetId },
            UpdateExpression: "SET " + updateExpressionParts.join(", "),
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const result = await this.docClient.send(command);
        const updated = result.Attributes as Workspace;

        // SSE Emit to all members
        if (workspace.members) {
            workspace.members.forEach(mId => {
                SSEService.getInstance().sendToUser(mId, 'workspace.updated', updated);
            });
        }

        return updated;
    }

    public async addMember(workspaceId: string, userId: string) {
        const workspace = await this.getWorkspaceById(workspaceId);
        if (!workspace) throw new Error("Workspace not found");

        if (workspace.members.includes(userId)) return;

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { id: workspaceId },
            UpdateExpression: "SET members = list_append(members, :u)",
            ExpressionAttributeValues: {
                ":u": [userId]
            }
        });

        await this.docClient.send(command);

        // Notify new member
        SSEService.getInstance().sendToUser(userId, 'workspace.member_added', { workspaceId, userId });
        // Notify others
        workspace.members.forEach(mId => {
            SSEService.getInstance().sendToUser(mId, 'workspace.member_added', { workspaceId, userId });
        });
    }

    public async removeMember(workspaceId: string, userId: string) {
        const workspace = await this.getWorkspaceById(workspaceId);
        if (!workspace) throw new Error("Workspace not found");

        const idx = workspace.members.indexOf(userId);
        if (idx === -1) return;

        const newMembers = workspace.members.filter(m => m !== userId);

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { id: workspaceId },
            UpdateExpression: "SET members = :m",
            ExpressionAttributeValues: {
                ":m": newMembers
            }
        });

        await this.docClient.send(command);

        // Notify removed member (so they can update list)
        SSEService.getInstance().sendToUser(userId, 'workspace.member_removed', { workspaceId, userId });
        // Notify others
        newMembers.forEach(mId => {
            SSEService.getInstance().sendToUser(mId, 'workspace.member_removed', { workspaceId, userId });
        });
    }

    public async assignOwner(workspaceId: string, newOwnerId: string) {
        const workspace = await this.getWorkspaceById(workspaceId);
        if (!workspace) throw new Error("Workspace not found");

        if (!workspace.members.includes(newOwnerId)) {
            throw new Error("New owner must be a member of the workspace");
        }

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { id: workspaceId },
            UpdateExpression: "SET ownerId = :o",
            ExpressionAttributeValues: {
                ":o": newOwnerId
            }
        });

        await this.docClient.send(command);

        // Notify all
        workspace.members.forEach(mId => {
            SSEService.getInstance().sendToUser(mId, 'workspace.owner_updated', { workspaceId, newOwnerId });
        });
    }

    public async deleteWorkspace(workspaceId: string) {
        const workspace = await this.getWorkspaceById(workspaceId);
        if (!workspace) throw new Error("Workspace not found");

        await this.docClient.send(new DeleteCommand({
            TableName: this.tableName,
            Key: { id: workspaceId }
        }));

        await this.cascadeDeleteResources(workspaceId);

        // Notify all members
        workspace.members.forEach(mId => {
            SSEService.getInstance().sendToUser(mId, 'workspace.deleted', { id: workspaceId });
        });
    }

    private async cascadeDeleteResources(workspaceId: string) {
        await this.deleteByWorkspaceId(process.env.TABLE_TASKS || 'tasks', workspaceId);
        await this.deleteByWorkspaceId(process.env.TABLE_GROUPS || 'groups', workspaceId);
        await this.deleteByWorkspaceId(process.env.TABLE_LABELS || 'labels', workspaceId);
    }

    private async deleteByWorkspaceId(tableName: string, workspaceId: string) {
        let items: any[] = [];
        try {
            const command = new QueryCommand({
                TableName: tableName,
                IndexName: 'WorkspaceIndex',
                KeyConditionExpression: "workspaceId = :w",
                ExpressionAttributeValues: { ":w": workspaceId }
            });
            const result = await this.docClient.send(command);
            items = result.Items || [];
        } catch (e) {
            const command = new ScanCommand({
                TableName: tableName,
                FilterExpression: "workspaceId = :w",
                ExpressionAttributeValues: { ":w": workspaceId }
            });
            const result = await this.docClient.send(command);
            items = result.Items || [];
        }

        if (items.length === 0) return;

        const chunked = [];
        for (let i = 0; i < items.length; i += 25) {
            chunked.push(items.slice(i, i + 25));
        }

        for (const chunk of chunked) {
            await Promise.all(chunk.map(item =>
                this.docClient.send(new DeleteCommand({
                    TableName: tableName,
                    Key: { id: item.id }
                }))
            ));
        }
    }
}

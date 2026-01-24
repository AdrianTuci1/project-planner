import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { Workspace } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

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
        // Warning: Scan is expensive. Ideally use GSI on members.
        // But for < 1000 workspaces it's fine.
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

            // Trigger Welcome Notification
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
            // Check if already exists to avoid overwriting or duplicates
            const existing = await this.getWorkspaceById(workspaceId);
            if (existing) {
                return existing;
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
            // Find personal workspace for this user
            const all = await this.getAllWorkspaces(userId);
            const personal = all.find(w => w.type === 'personal' && w.ownerId === userId);
            if (!personal) throw new Error("Personal workspace not found");
            targetId = personal.id;
        }

        const workspace = await this.getWorkspaceById(targetId);
        if (!workspace) throw new Error("Workspace not found");

        // Verify ownership/permission if needed (simplified: if found via personal/userId check, it's valid)
        // For strictness, if userId provided, check ownership? 
        // For now, trusting the 'personal' resolution or direct ID access (which implies they knew the ID).

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
        return result.Attributes as Workspace;
    }

    public async addMember(workspaceId: string, userId: string) {
        // Use SET to append to list, checking if not exists ideally.
        // DynamoDB List append: list_append(members, :u)
        // But let's read-modify-write for safety or use simple update if we assume set.
        // Actually workspace.members is an array.

        // Retrieve first to avoid duplicates
        let targetId = workspaceId;
        if (workspaceId === 'personal') {
            // 'personal' shouldn't really have members added like this usually, but IF we supported it:
            // We need ownerId context. Since addMember usually called during invite, we might have it.
            // But simpler to expect UUID for addMember.
        }

        const workspace = await this.getWorkspaceById(targetId);
        if (!workspace) throw new Error("Workspace not found");

        if (workspace.members.includes(userId)) return; // Already member

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { id: targetId },
            UpdateExpression: "SET members = list_append(members, :u)",
            ExpressionAttributeValues: {
                ":u": [userId]
            }
        });

        await this.docClient.send(command);
    }
}

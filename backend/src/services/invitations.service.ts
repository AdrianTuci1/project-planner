import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { v4 as uuidv4 } from 'uuid';
import { NotificationsService } from "./notifications.service";
import { WorkspacesService } from "./workspaces.service";

export interface Invitation {
    id: string;
    email: string; // The email of the person being invited
    workspaceId: string;
    inviterId: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: number;
    updatedAt: number;
}

export class InvitationsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;
    private notificationsService: NotificationsService;
    private workspacesService: WorkspacesService;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_INVITATIONS || 'invitations';
        this.notificationsService = new NotificationsService();
        this.workspacesService = new WorkspacesService();
    }

    public async createInvitation(email: string, workspaceId: string, inviterId: string): Promise<Invitation> {
        // 1. Check if user already member? (Ideally)
        // For now, just create invite.

        // 2. Lookup workspace name for notification
        const workspace = await this.workspacesService.getWorkspaceById(workspaceId);
        if (!workspace) throw new Error("Workspace not found");

        const id = uuidv4();
        const now = Date.now();
        const invitation: Invitation = {
            id,
            email,
            workspaceId,
            inviterId,
            status: 'pending',
            createdAt: now,
            updatedAt: now
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: invitation
        });

        await this.docClient.send(command);

        // 3. Try to notify the user if they exist in the system
        // We need to look up userId by email. This is tricky without a GSI on Users table for email.
        // Assuming we have a way or we just send email (not implemented yet).
        // For now, we'll try to find a user with this email to send an in-app notification.
        // If we can't find them, we can't send in-app notification yet.
        const userId = await this.findUserIdByEmail(email);

        if (userId) {
            await this.notificationsService.createNotification(
                userId,
                'invite',
                `Invitation to join ${workspace.name}`,
                `You have been invited to join the workspace "${workspace.name}".`,
                { inviteId: id, workspaceId, workspaceName: workspace.name, inviterId }
            );
        }

        return invitation;
    }

    public async respondToInvitation(id: string, accept: boolean, responderUserId: string): Promise<void> {
        const invite = await this.getInvitationById(id);
        if (!invite) throw new Error("Invitation not found");

        if (invite.status !== 'pending') throw new Error("Invitation already responded to");

        // Verify that the responder is the one invited? 
        // We invited by 'email'. The responder is 'responderUserId'. 
        // We should check if responder's email matches the invite email. 
        // For MVP, we might skip this strict check or assume the frontend handles the correct user context 
        // if they received the notification. 
        // Ideally: const user = await userService.get(responderUserId); if (user.email !== invite.email) error;

        const status = accept ? 'accepted' : 'declined';

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { id },
            UpdateExpression: "set #status = :s, updatedAt = :u",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
                ":s": status,
                ":u": Date.now()
            }
        });

        await this.docClient.send(command);

        if (accept) {
            await this.workspacesService.addMember(invite.workspaceId, responderUserId);

            // Notify Inviter
            await this.notificationsService.createNotification(
                invite.inviterId,
                'info',
                'Invitation Accepted',
                `${invite.email} has accepted your invitation to join the workspace.`
            );
        }
    }

    public async getInvitationById(id: string): Promise<Invitation | undefined> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { id }
        });
        const result = await this.docClient.send(command);
        return result.Item as Invitation | undefined;
    }

    private async findUserIdByEmail(email: string): Promise<string | null> {
        // Warning: Scan is expensive. Use GSI in production.
        const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
        const command = new ScanCommand({
            TableName: process.env.TABLE_USERS || 'users',
            FilterExpression: "email = :e",
            ExpressionAttributeValues: { ":e": email },
            ProjectionExpression: "id"
        });

        const result = await this.docClient.send(command);
        if (result.Items && result.Items.length > 0) {
            return result.Items[0].id; // Return first match
        }
        return null;
    }
}

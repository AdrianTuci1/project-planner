import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { v4 as uuidv4 } from 'uuid';
import { WorkspacesService } from "./workspaces.service";
import { NotificationsService } from "./notifications.service";

export class InvitationsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;
    private workspacesService: WorkspacesService;
    private notificationsService: NotificationsService;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_INVITATIONS || 'invitations';
        this.workspacesService = new WorkspacesService();
        this.notificationsService = new NotificationsService();
    }

    public async createInvitation(email: string, workspaceId: string, inviterId: string, inviterName: string) {
        const inviteId = uuidv4();

        // Find the user to notify
        const userId = await this.findUserIdByEmail(email);

        if (!userId) {
            throw new Error("User not found");
        }

        const invite = {
            id: inviteId,
            email,
            workspaceId,
            inviterId,
            status: 'pending',
            createdAt: Date.now()
        };

        await this.docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: invite
        }));

        // Send Notification
        await this.notificationsService.createNotification(
            userId,
            'invite',
            'Team Invitation',
            `${inviterName} invited you to join their workspace.`,
            { inviteId, workspaceId, email }
        );

        return invite;
    }

    private async findUserIdByEmail(email: string): Promise<string | null> {
        try {
            const command = new ScanCommand({
                TableName: process.env.TABLE_USERS || 'users',
                FilterExpression: "email = :e",
                ExpressionAttributeValues: { ":e": email }
            });
            const res = await this.docClient.send(command);
            if (res.Items && res.Items.length > 0) return res.Items[0].id;
        } catch (e) {
            console.warn("Could not query users table", e);
        }
        return null;
    }

    public async acceptInvitation(inviteId: string, userId: string) {
        const invite = await this.getInvitation(inviteId);
        if (!invite) throw new Error("Invitation not found");
        if (invite.status !== 'pending') throw new Error("Invitation no longer valid");

        // Verify the accepting user matches the invited email
        const user = await this.getUserById(userId);
        if (!user || user.email !== invite.email) {
            throw new Error("This invitation was not sent to your email address.");
        }

        await this.workspacesService.addMember(invite.workspaceId, userId);

        // Update Invite Status
        await this.docClient.send(new DeleteCommand({
            TableName: this.tableName,
            Key: { id: inviteId }
        }));

        return { success: true, workspaceId: invite.workspaceId };
    }

    public async declineInvitation(inviteId: string) {
        await this.docClient.send(new DeleteCommand({
            TableName: this.tableName,
            Key: { id: inviteId }
        }));
        return { success: true };
    }

    private async getInvitation(id: string) {
        const res = await this.docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: { id }
        }));
        return res.Item;
    }

    private async getUserById(userId: string) {
        try {
            const res = await this.docClient.send(new GetCommand({
                TableName: process.env.TABLE_USERS || 'users',
                Key: { id: userId }
            }));
            return res.Item;
        } catch (e) {
            console.error("Error fetching user:", e);
            return null;
        }
    }
}

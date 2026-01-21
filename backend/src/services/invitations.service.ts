import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

        // --- SINGLE TEAM RULE ENFORCEMENT ---
        // Fetch User Settings to check if they are already in a team
        const userSettings = await this.getUserSettings(userId); // Helper needed
        if (userSettings && userSettings.teamId) {
            throw new Error("You are already part of a Team Workspace. You must leave it before joining another.");
        }

        await this.workspacesService.addMember(invite.workspaceId, userId);

        // Update User Settings with new teamId
        await this.updateUserTeamId(userId, invite.workspaceId);

        // Update Invite Status
        await this.docClient.send(new DeleteCommand({
            TableName: this.tableName,
            Key: { id: inviteId }
        }));

        return { success: true, workspaceId: invite.workspaceId };
    }

    private async getUserSettings(userId: string) {
        // Using SettingsService logic or direct DB access? 
        // Direct DB for internal service logic is cleaner/faster if we know the table.
        // Table: 'settings' (usually)
        try {
            const res = await this.docClient.send(new GetCommand({
                TableName: process.env.TABLE_SETTINGS || 'settings',
                Key: { userId }
            }));
            return res.Item;
        } catch (e) { return null; }
    }

    private async updateUserTeamId(userId: string, teamId: string) {
        // Upsert teamId
        const command = new PutCommand({
            TableName: process.env.TABLE_SETTINGS || 'settings',
            Item: {
                userId,
                teamId,
                // We might overwrite other settings if we Put, but usually settings are merged.
                // Better to use UpdateCommand.
            }
        });

        // Let's use Update to be safe and not wipe other settings
        const updateCmd = new UpdateCommand({
            TableName: process.env.TABLE_SETTINGS || 'settings',
            Key: { userId },
            UpdateExpression: "SET teamId = :t",
            ExpressionAttributeValues: { ":t": teamId }
        });
        await this.docClient.send(updateCmd);
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

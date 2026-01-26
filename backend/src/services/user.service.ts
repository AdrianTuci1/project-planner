import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { EmailService } from "./email.service";
import { NotificationsService } from "./notifications.service";

export class UserService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;
    private emailService: EmailService;
    private notificationsService: NotificationsService;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_USERS || 'Users';
        this.emailService = new EmailService();
        this.notificationsService = new NotificationsService();
    }

    async syncUser(userId: string, email: string, name: string, onboardingData: any) {
        // 1. Check if user exists
        const existingUser = await this.getUser(userId);

        if (existingUser) {
            // Update onboarding data if provided, but DO NOT reset subscription/trial
            if (onboardingData) {
                const updateCommand = new UpdateCommand({
                    TableName: this.tableName,
                    Key: { id: userId },
                    UpdateExpression: 'set onboarding = :o, updatedAt = :u',
                    ExpressionAttributeValues: {
                        ':o': onboardingData,
                        ':u': new Date().toISOString()
                    },
                    ReturnValues: 'ALL_NEW'
                });
                const result = await this.docClient.send(updateCommand);
                return this.maskToken(result.Attributes);
            }
            return this.maskToken(existingUser);
        }

        // 2. Create new user with Trial
        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 days trial

        const newUser = {
            id: userId,
            email,
            name,
            onboarding: onboardingData,
            subscriptionStatus: 'trialing',
            plan: 'pro',
            trialStartDate: now.toISOString(),
            trialEndDate: trialEndDate.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: newUser
        });

        await this.docClient.send(command);

        // Send Welcome Email
        this.emailService.sendWelcomeEmail(email, name);

        // Send Welcome Notification
        await this.notificationsService.sendWelcomeNotification(userId, email);

        return this.maskToken(newUser);
    }

    // Helper to mask token in existing user if needed, or we handle it in syncUser logic below
    private maskToken(user: any) {
        if (!user) return user;
        const { apiToken, ...rest } = user;
        // Optionally return a flag indicating if token exists
        return {
            ...rest,
            hasApiToken: !!apiToken
        };
    }


    async getUserProfile(userId: string) {
        const user = await this.getUser(userId);
        return this.maskToken(user);
    }

    private async getUser(userId: string) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { id: userId }
        });
        const result = await this.docClient.send(command);
        return result.Item;
    }

    async generateApiToken(userId: string) {
        const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const token = `sk_${userId}_${randomPart}`;

        const updateCommand = new UpdateCommand({
            TableName: this.tableName,
            Key: { id: userId },
            UpdateExpression: 'set apiToken = :t, updatedAt = :u',
            ExpressionAttributeValues: {
                ':t': token,
                ':u': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        });

        await this.docClient.send(updateCommand);
        return token;
    }

    async getApiToken(userId: string) {
        const user = await this.getUser(userId);
        return user?.apiToken || null;
    }

    async revokeApiToken(userId: string) {
        const updateCommand = new UpdateCommand({
            TableName: this.tableName,
            Key: { id: userId },
            UpdateExpression: 'remove apiToken set updatedAt = :u',
            ExpressionAttributeValues: {
                ':u': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        });

        await this.docClient.send(updateCommand);
        return true;
    }

    async validateApiToken(token: string) {
        // Format: sk_USERID_RANDOM
        if (!token.startsWith('sk_')) return null;

        const parts = token.split('_');
        if (parts.length < 3) return null;

        const userId = parts[1];
        const user = await this.getUser(userId);

        if (user && user.apiToken === token) {
            return user;
        }
        return null;
    }

    async getUsersByIds(ids: string[]) {
        if (!ids || ids.length === 0) return [];

        // Dedup ids
        const uniqueIds = [...new Set(ids)];

        // DynamoDB BatchGetItem has a limit of 100 items per request
        // For simplicity, we will split into chunks if needed, but assuming small teams for now.
        // If > 100, we should loop.

        const chunks = [];
        for (let i = 0; i < uniqueIds.length; i += 100) {
            chunks.push(uniqueIds.slice(i, i + 100));
        }

        let allUsers: any[] = [];

        for (const chunk of chunks) {
            const keys = chunk.map(id => ({ id }));
            const command = new BatchGetCommand({
                RequestItems: {
                    [this.tableName]: {
                        Keys: keys
                    }
                }
            });

            const result = await this.docClient.send(command);
            if (result.Responses && result.Responses[this.tableName]) {
                allUsers = [...allUsers, ...result.Responses[this.tableName]];
            }
        }

        // Return only public info
        return allUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatarUrl: u.avatarUrl
        }));
    }

    async updateUser(userId: string, data: { name?: string, avatarUrl?: string }) {
        const updateExpressionParts: string[] = [];
        const expressionAttributeValues: any = {
            ':u': new Date().toISOString()
        };
        const expressionAttributeNames: any = {};

        // Strictly allow only name and avatarUrl
        if (data.name !== undefined && typeof data.name === 'string') {
            updateExpressionParts.push('#n = :n');
            expressionAttributeValues[':n'] = data.name;
            expressionAttributeNames['#n'] = 'name';
        }

        if (data.avatarUrl !== undefined && typeof data.avatarUrl === 'string') {
            updateExpressionParts.push('avatarUrl = :a');
            expressionAttributeValues[':a'] = data.avatarUrl;
        }

        if (updateExpressionParts.length === 0) {
            return this.getUser(userId);
        }

        const updateExpression = `set ${updateExpressionParts.join(', ')}, updatedAt = :u`;

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { id: userId },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ReturnValues: 'ALL_NEW'
        });

        const result = await this.docClient.send(command);
        return this.maskToken(result.Attributes);
    }
}

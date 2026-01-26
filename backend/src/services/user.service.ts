import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
                return result.Attributes;
            }
            return existingUser;
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

        return newUser;
    }


    private async getUser(userId: string) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { id: userId }
        });
        const result = await this.docClient.send(command);
        return result.Item;
    }
}

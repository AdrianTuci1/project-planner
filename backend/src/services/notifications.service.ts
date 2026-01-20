import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { v4 as uuidv4 } from 'uuid';

export class NotificationsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_NOTIFICATIONS || 'notifications';
    }

    public async createNotification(userId: string, type: string, title: string, message: string, data?: any) {
        const id = uuidv4();
        const notification = {
            id,
            userId,
            type, // 'invite' | 'info' | 'alert'
            title,
            message,
            data,
            isRead: false,
            createdAt: Date.now()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: notification
        });

        await this.docClient.send(command);
        return notification;
    }

    public async getUserNotifications(userId: string) {
        // Assuming GSI on userId
        const command = new QueryCommand({
            TableName: this.tableName,
            IndexName: 'UserIdIndex', // Ensure this GSI exists or assume Primary Key is userId? usually PK=userId, SK=createdAt
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": userId
            },
            ScanIndexForward: false // Newest first
        });

        const result = await this.docClient.send(command);
        return result.Items || [];
    }

    public async markAsRead(id: string, userId: string) {
        const updateCmd = new UpdateCommand({
            TableName: this.tableName,
            Key: { id },
            UpdateExpression: "set isRead = :r",
            ExpressionAttributeValues: {
                ":r": true
            }
        });

        await this.docClient.send(updateCmd);
        return { id, isRead: true };
    }

    public async sendGlobalNotification(title: string, message: string, type: string = 'info') {
        const command = new ScanCommand({
            TableName: process.env.TABLE_USERS || 'users',
            ProjectionExpression: 'id'
        });

        const result = await this.docClient.send(command);
        const users = result.Items || [];

        const promises = users.map((u: any) =>
            this.createNotification(u.id, type, title, message)
        );

        await Promise.all(promises);
        return { sentCount: users.length };
    }

    public async sendWelcomeNotification(userId: string, email: string) {
        return this.createNotification(
            userId,
            'info',
            'Welcome to Simplu!',
            `Hi ${email}, we are glad to have you on board. Start by creating your first task!`,
        );
    }
}

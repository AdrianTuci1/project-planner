import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { CalendarAccount, CalendarData } from '../models/types';

export class CalendarService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;
    private defaultData: CalendarData = {
        accounts: []
    };

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_CALENDARS || 'calendars';
    }

    public async getCalendars(userId: string = 'default-user'): Promise<CalendarData> {
        // Fallback for missing table during dev if needed, or just standard try/catch in controller
        try {
            const command = new GetCommand({
                TableName: this.tableName,
                Key: { userId }
            });

            const result = await this.docClient.send(command);

            if (result.Item) {
                return result.Item as CalendarData;
            }
        } catch (error) {
            console.warn("Error fetching calendars (table might not exist yet):", error);
        }

        return this.defaultData;
    }

    public async updateCalendars(data: CalendarData, userId: string = 'default-user'): Promise<void> {
        // Ensure atomic updates or simple overwrite for this use case
        const item = { ...data, userId };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.docClient.send(command);
    }

    public async addAccount(account: CalendarAccount, userId: string = 'default-user'): Promise<CalendarData> {
        const current = await this.getCalendars(userId);
        current.accounts.push(account);
        await this.updateCalendars(current, userId);
        return current;
    }

    public async removeAccount(accountId: string, userId: string = 'default-user'): Promise<CalendarData> {
        const current = await this.getCalendars(userId);
        current.accounts = current.accounts.filter(a => a.id !== accountId);
        await this.updateCalendars(current, userId);
        return current;
    }

    public async updateAccount(accountId: string, updates: Partial<CalendarAccount>, userId: string = 'default-user'): Promise<CalendarData> {
        const current = await this.getCalendars(userId);
        const index = current.accounts.findIndex(a => a.id === accountId);
        if (index !== -1) {
            current.accounts[index] = { ...current.accounts[index], ...updates };
            await this.updateCalendars(current, userId);
        }
        return current;
    }
}

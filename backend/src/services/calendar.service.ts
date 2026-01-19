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

    // --- Google Calendar Integration Methods (Simulated) ---

    // In a real app, this would use googleapis with the stored refresh_token for the account
    public async fetchSubCalendars(accountId: string, userId: string = 'default-user'): Promise<CalendarData> {
        const current = await this.getCalendars(userId);
        const account = current.accounts.find(a => a.id === accountId);

        if (!account) return current;

        // Simulated fetch from Google
        // const calendarList = await google.calendar.calendarList.list(...)

        const mockSubCalendars = [
            { id: 'primary', name: 'Primary', color: account.color, isVisible: true, canEdit: true },
            { id: 'work', name: 'Work', color: '#ff5722', isVisible: true, canEdit: true },
            { id: 'family', name: 'Family', isVisible: false, color: '#9c27b0', canEdit: true }
        ];

        // Merge with existing preference if exists, or overwrite
        const mergedSubs = mockSubCalendars.map(mock => {
            const existing = account.subCalendars?.find(s => s.id === mock.id);
            return existing ? { ...mock, isVisible: existing.isVisible } : mock;
        });

        // Update local storage
        return this.updateAccount(accountId, { subCalendars: mergedSubs }, userId);
    }

    public async updateEventTime(accountId: string, eventId: string, newStart: string, newEnd: string, userId: string = 'default-user'): Promise<boolean> {
        const current = await this.getCalendars(userId);
        const account = current.accounts.find(a => a.id === accountId);
        if (!account) return false;

        // Determine guest update notification strategy
        const sendUpdates = account.guestUpdateStrategy === 'all' ? 'all' : 'none';

        try {
            // await google.calendar.events.patch({
            //   calendarId: 'primary', // or find which subcalendar event belongs to
            //   eventId: eventId,
            //   requestBody: { start: { dateTime: newStart }, end: { dateTime: newEnd } },
            //   sendUpdates: sendUpdates
            // });
            console.log(`[GoogleSync] Moved event ${eventId} on ${account.email}. SendUpdates: ${sendUpdates}`);
            return true;
        } catch (e) {
            console.error("Failed to update remote event", e);
            return false;
        }
    }
}

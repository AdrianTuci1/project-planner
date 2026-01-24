import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { getGoogleAuthClient } from "../config/google.client";
import { CalendarAccount, CalendarData } from '../models/types';
import { google } from 'googleapis';

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

    // --- Google Calendar Integration Methods ---

    // Uses googleapis with the stored refresh_token for the account
    public async fetchSubCalendars(accountId: string, userId: string = 'default-user'): Promise<CalendarData> {
        const current = await this.getCalendars(userId);
        const account = current.accounts.find(a => a.id === accountId);

        if (!account || !account.refreshToken) return current;

        const auth = getGoogleAuthClient(account.refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            const res = await calendar.calendarList.list();
            const items = res.data.items || [];

            const fetchedSubs = items.map(item => ({
                id: item.id || '',
                name: item.summary || 'Unknown',
                color: item.backgroundColor || account.color,
                isVisible: true,
                canEdit: item.accessRole === 'owner' || item.accessRole === 'writer'
            }));

            // Merge with existing preference if exists
            const mergedSubs = fetchedSubs.map(fetched => {
                const existing = account.subCalendars?.find(s => s.id === fetched.id);
                return existing ? { ...fetched, isVisible: existing.isVisible } : fetched;
            });

            // Update local storage
            return this.updateAccount(accountId, { subCalendars: mergedSubs }, userId);

        } catch (error) {
            console.error("Error fetching sub-calendars:", error);
            return current;
        }
    }

    public async updateEventTime(accountId: string, calendarId: string, eventId: string, newStart?: string, newEnd?: string, userId: string = 'default-user'): Promise<boolean> {
        const current = await this.getCalendars(userId);
        const account = current.accounts.find(a => a.id === accountId);
        if (!account || !account.refreshToken) return false;

        // Determine guest update notification strategy
        const sendUpdates = account.guestUpdateStrategy === 'all' ? 'all' : 'none';

        const auth = getGoogleAuthClient(account.refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            const requestBody: any = {};
            if (newStart) requestBody.start = { dateTime: newStart };
            if (newEnd) requestBody.end = { dateTime: newEnd };

            await calendar.events.patch({
                calendarId: calendarId,
                eventId: eventId,
                requestBody,
                sendUpdates: sendUpdates
            });
            console.log(`[GoogleSync] Moved event ${eventId} on ${account.email}. SendUpdates: ${sendUpdates}`);
            return true;
        } catch (e) {
            console.error("Failed to update remote event", e);
            return false;
        }
    }

    public async deleteEvent(accountId: string, calendarId: string, eventId: string, userId: string = 'default-user'): Promise<boolean> {
        const current = await this.getCalendars(userId);
        const account = current.accounts.find(a => a.id === accountId);
        if (!account || !account.refreshToken) return false;

        const sendUpdates = account.guestUpdateStrategy === 'all' ? 'all' : 'none';
        const auth = getGoogleAuthClient(account.refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            await calendar.events.delete({
                calendarId: calendarId,
                eventId: eventId,
                sendUpdates: sendUpdates
            });
            console.log(`[GoogleSync] Deleted event ${eventId} on ${account.email}`);
            return true;
        } catch (e) {
            console.error("Failed to delete remote event", e);
            return false;
        }
    }

    public async fetchEvents(startDate: string, endDate: string, userId: string = 'default-user'): Promise<any[]> {
        const current = await this.getCalendars(userId);
        const allEvents: any[] = [];

        for (const account of current.accounts) {
            if (!account.isVisible) continue;
            if (!account.refreshToken) continue;

            const auth = getGoogleAuthClient(account.refreshToken);
            const calendar = google.calendar({ version: 'v3', auth });

            // Allow syncing multiple sub-calendars
            const updateTargets = (account.subCalendars && account.subCalendars.length > 0)
                ? account.subCalendars.filter(c => c.isVisible)
                : [{ id: 'primary', color: account.color }];

            for (const target of updateTargets) {
                try {
                    const response = await calendar.events.list({
                        calendarId: target.id,
                        timeMin: startDate,
                        timeMax: endDate,
                        singleEvents: true,
                        orderBy: 'startTime'
                    });

                    const items = response.data.items || [];
                    const mapped = items.map(ev => {
                        const isAllDay = !ev.start?.dateTime;
                        const mappedEvent: any = {
                            id: `evt_${ev.id}`, // Prefix to distinguish from tasks
                            title: ev.summary || '(No Title)',
                            status: 'todo', // Dummy status for TaskCard compatibility
                            isCalendarEvent: true,

                            // Times
                            scheduledDate: ev.start?.dateTime || ev.start?.date, // ISO string
                            duration: 60, // approximate, or calculate real duration

                            // Metadata
                            accountId: account.id,
                            calendarId: target.id,
                            color: target.color || account.color || '#4285F4',
                            provider: account.provider,
                            htmlLink: ev.htmlLink,
                            allDay: isAllDay,
                            description: ev.description,

                            // Raw data if needed
                            start: ev.start,
                            end: ev.end
                        };

                        // Calculate duration
                        if (mappedEvent.scheduledDate && mappedEvent.end?.dateTime) {
                            const start = new Date(mappedEvent.scheduledDate);
                            const end = new Date(mappedEvent.end.dateTime);
                            const diffMs = end.getTime() - start.getTime();
                            mappedEvent.duration = Math.floor(diffMs / 60000);
                        }

                        return mappedEvent;
                    });

                    allEvents.push(...mapped);

                } catch (err) {
                    console.error(`[CalendarService] Failed to fetch events for ${target.id}`, err);
                }
            }
        }
        return allEvents;
    }

    // --- OAuth Flow Methods ---

    public generateGoogleAuthUrl(): string {
        const oAuth2Client = getGoogleAuthClient();
        return oAuth2Client.generateAuthUrl({
            access_type: 'offline', // Crucial for receiving refresh_token
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            prompt: 'consent', // Force consent to ensure we usually get a refresh token
            state: 'settings_calendar'
        });
    }

    public async handleGoogleCallback(code: string, userId: string = 'default-user'): Promise<CalendarAccount> {
        const oAuth2Client = getGoogleAuthClient();
        const { tokens } = await oAuth2Client.getToken(code);

        oAuth2Client.setCredentials(tokens);

        // Get user info to identify the account
        const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
        const userInfo = await oauth2.userinfo.get();

        const email = userInfo.data.email || 'unknown@example.com';
        const name = userInfo.data.name || 'Google Calendar';

        // Create or Update Account
        // Check if account already exists for this user to avoid duplicates
        const currentData = await this.getCalendars(userId);
        const existingAccountIndex = currentData.accounts.findIndex(a => a.email === email && a.provider === 'google');

        const newAccount: CalendarAccount = {
            id: existingAccountIndex !== -1 ? currentData.accounts[existingAccountIndex].id : require('uuid').v4(), // Use existing ID or new UUID
            email: email,
            name: name,
            provider: 'google',
            color: '#4285F4', // Default Google Blue
            isVisible: true,
            refreshToken: tokens.refresh_token || undefined, // MIGHT be undefined if re-authed without prompt: consent
            tokenExpiry: tokens.expiry_date || undefined
        };

        // If we didn't get a refresh token but had one before, preserve it!
        if (!newAccount.refreshToken && existingAccountIndex !== -1) {
            newAccount.refreshToken = currentData.accounts[existingAccountIndex].refreshToken;
        }

        if (existingAccountIndex !== -1) {
            // Update
            // Preserve existing settings like guestUpdateStrategy and subCalendars if not explicitly handled here
            const existing = currentData.accounts[existingAccountIndex];
            currentData.accounts[existingAccountIndex] = { ...existing, ...newAccount, subCalendars: existing.subCalendars };
        } else {
            // Add New
            currentData.accounts.push(newAccount);
        }

        await this.updateCalendars(currentData, userId);

        return newAccount;
    }
}

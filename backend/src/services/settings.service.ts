import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { GeneralSettings } from '../models/types';

export class SettingsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;
    // START: Default settings to return if none exist
    private defaultSettings: GeneralSettings = {
        moveTasksBottom: false,
        markCompleteSubtasks: false,
        autoSetActualTime: false,
        deepLinkDetection: false,
        startWeekOn: 'monday',
        showWeekends: true,
        workdayThreshold: false,
        workloadThreshold: '0',
        showDeclinedEvents: false,
        startDayAt: '09:00',
        calendarIncrements: '15',
        timeFormat: '24h',
        darkMode: 'system',
        autoStartNextTask: false,
        sidebarLayout: 'default',
        addNewTasksTo: 'bottom',
        detectLabel: false,
        defaultEstimatedTime: '30',
        rolloverNextDay: false,
        rolloverRecurring: false,
        rolloverTo: 'today',

        // Power Features Defaults
        dueDatesEnabled: false,
        templatesEnabled: false,
        taskPriorityEnabled: false,
        attachmentsEnabled: false,

        // Due Dates Defaults
        thresholdDays: 7,

        // Account Defaults
        displayName: ''
    };
    // END: Default settings

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_SETTINGS || 'settings';
    }

    public async getGeneralSettings(userId: string = 'default-user'): Promise<GeneralSettings> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { userId }
        });

        const result = await this.docClient.send(command);

        if (result.Item) {
            return result.Item as GeneralSettings;
        }

        // If no settings found, return defaults (and maybe save them?)
        return this.defaultSettings;
    }

    public async updateGeneralSettings(settings: Partial<GeneralSettings>, userId: string = 'default-user'): Promise<void> {
        // Fetch current to merge, or just simple put if we trust partial updates are handled by frontend sending full object?
        // The interface says "Partial", so we should ideally merge. 
        // DynamoDB UpdateItem can be complex for many fields.
        // Simplified approach: Get existing -> Merge -> Put.
        // OR: Since the requirement is "modular", let's do a smart Update or simple Put if frontend sends all.
        // Let's assume we do a merge.

        const current = await this.getGeneralSettings(userId);
        const updated = { ...current, ...settings, userId }; // Ensure PK is there

        const command = new PutCommand({
            TableName: this.tableName,
            Item: updated
        });

        await this.docClient.send(command);
    }
}

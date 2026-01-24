import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { GeneralSettings } from '../models/types';

export class SettingsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;
    // START: Default settings to return if none exist
    private defaultSettings: GeneralSettings = {
        generalSettings: {
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
            calendarViewDays: 7,
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
        },
        featuresSettings: {
            dueDatesEnabled: false,
            templatesEnabled: false,
            taskPriorityEnabled: false,
            attachmentsEnabled: false,
        },
        // Due Dates Defaults
        thresholdDays: 7,

        // Account Defaults
        displayName: '',
        avatarUrl: ''
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

        // If no settings found, return defaults
        return this.defaultSettings;
    }

    public async updateGeneralSettings(settings: Partial<GeneralSettings>, userId: string = 'default-user'): Promise<void> {
        const current = await this.getGeneralSettings(userId);

        // Deep merge for nested objects to avoid overwriting with partials
        const updated: GeneralSettings = {
            ...current,
            ...settings, // Top level props
            generalSettings: {
                ...(current.generalSettings || this.defaultSettings.generalSettings),
                ...(settings.generalSettings || {})
            } as any,
            featuresSettings: {
                ...(current.featuresSettings || this.defaultSettings.featuresSettings),
                ...(settings.featuresSettings || {})
            } as any,
            userId // Ensure PK is there
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: updated
        });

        await this.docClient.send(command);
    }
}

import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";

export class GroupsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_GROUPS || 'groups';
    }

    public async getGroups(startDate: string, endDate: string) {
        // In a real scenario, you might filter by user or date here.
        // For now, we return all groups as per the prompt requirements for a simple modular server.
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        return result.Items || [];
    }
}

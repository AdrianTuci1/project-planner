import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DBClient } from "../config/db.client";
import { SSEService } from "./sse.service";
import { WorkspacesService } from "./workspaces.service";

export class LabelsService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;
    public workspacesService = new WorkspacesService();

    constructor() {
        this.docClient = DBClient.getInstance();
        this.tableName = process.env.TABLE_LABELS || 'labels';
    }

    public async getLabels(workspaceId?: string, userId?: string) {
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        const result = await this.docClient.send(command);
        let labels = result.Items || [];

        // 1. Filter by Workspace Access
        if (workspaceId === 'personal') {
            labels = labels.filter((l: any) =>
                (l.workspaceId === 'personal' || !l.workspaceId) &&
                (l.createdBy === userId || !l.createdBy)
            );
        } else if (workspaceId) {
            const workspace = await this.workspacesService.getWorkspaceById(workspaceId);
            if (!workspace) throw new Error("Workspace not found");

            // Check membership if user is provided
            if (userId && !workspace.members.includes(userId)) {
                throw new Error("Access denied to this workspace");
            }

            labels = labels.filter((l: any) => l.workspaceId === workspaceId);
        } else {
            // Default to personal if no workspace provided
            labels = labels.filter((l: any) =>
                (!l.workspaceId || l.workspaceId === 'personal') &&
                (l.createdBy === userId || !l.createdBy)
            );
        }

        return labels;
    }

    public async createLabel(label: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: label
        });
        await this.docClient.send(command);

        if (label.workspaceId && label.workspaceId !== 'personal') {
            try {
                const workspace = await this.workspacesService.getWorkspaceById(label.workspaceId);
                if (workspace && workspace.members) {
                    SSEService.getInstance().sendToUsers(workspace.members, 'label.created', label);
                } else if (label.createdBy) {
                    SSEService.getInstance().sendToUser(label.createdBy, 'label.created', label);
                }
            } catch (err) {
                if (label.createdBy) SSEService.getInstance().sendToUser(label.createdBy, 'label.created', label);
            }
        } else if (label.createdBy) {
            SSEService.getInstance().sendToUser(label.createdBy, 'label.created', label);
        }

        return label;
    }

    public async updateLabel(id: string, label: any) {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: { ...label, id }
        });
        await this.docClient.send(command);

        const updated = { ...label, id };

        if (label.workspaceId && label.workspaceId !== 'personal') {
            try {
                const workspace = await this.workspacesService.getWorkspaceById(label.workspaceId);
                if (workspace && workspace.members) {
                    SSEService.getInstance().sendToUsers(workspace.members, 'label.updated', updated);
                } else if (label.createdBy) {
                    SSEService.getInstance().sendToUser(label.createdBy, 'label.updated', updated);
                }
            } catch (err) {
                if (label.createdBy) SSEService.getInstance().sendToUser(label.createdBy, 'label.updated', updated);
            }
        } else if (label.createdBy) {
            SSEService.getInstance().sendToUser(label.createdBy, 'label.updated', updated);
        }

        return updated;
    }

    public async deleteLabel(id: string) {
        // ...
        // Fetch context
        let label: any = null;
        try {
            const getCmd = new ScanCommand({
                TableName: this.tableName,
                FilterExpression: "id = :id",
                ExpressionAttributeValues: { ":id": id }
            });
            const res = await this.docClient.send(getCmd);
            if (res.Items && res.Items.length > 0) label = res.Items[0];
        } catch (e) { }

        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { id }
        });
        await this.docClient.send(command);

        if (label) {
            if (label.workspaceId && label.workspaceId !== 'personal') {
                try {
                    const workspace = await this.workspacesService.getWorkspaceById(label.workspaceId);
                    if (workspace && workspace.members) {
                        SSEService.getInstance().sendToUsers(workspace.members, 'label.deleted', { id, workspaceId: label.workspaceId });
                    } else if (label.createdBy) {
                        SSEService.getInstance().sendToUser(label.createdBy, 'label.deleted', { id });
                    }
                } catch (err) { }
            } else if (label.createdBy) {
                SSEService.getInstance().sendToUser(label.createdBy, 'label.deleted', { id });
            }
        }

        return { id };
    }

    public async deleteUserPersonalLabels(userId: string) {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: "(createdBy = :u) AND (attribute_not_exists(workspaceId) OR workspaceId = :p)",
            ExpressionAttributeValues: {
                ":u": userId,
                ":p": "personal"
            }
        });

        const result = await this.docClient.send(command);
        const labels = result.Items || [];

        const chunks = [];
        for (let i = 0; i < labels.length; i += 25) {
            chunks.push(labels.slice(i, i + 25));
        }

        for (const chunk of chunks) {
            await Promise.all(chunk.map(label =>
                this.docClient.send(new DeleteCommand({
                    TableName: this.tableName,
                    Key: { id: label.id }
                }))
            ));
        }

        return labels.length;
    }
}

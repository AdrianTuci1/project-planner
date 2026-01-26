import { Response } from 'express';

interface SSEClient {
    id: string;
    userId: string;
    res: Response;
}

export class SSEService {
    private static instance: SSEService;
    private clients: SSEClient[] = [];

    // Singleton pattern to ensure single registry
    public static getInstance(): SSEService {
        if (!SSEService.instance) {
            SSEService.instance = new SSEService();
        }
        return SSEService.instance;
    }

    public addClient(userId: string, res: Response) {
        const clientId = Date.now().toString();

        const client: SSEClient = {
            id: clientId,
            userId,
            res
        };

        this.clients.push(client);

        // Remove client on close
        res.on('close', () => {
            this.clients = this.clients.filter(c => c.id !== clientId);
        });
    }

    public sendToUser(userId: string, type: string, data: any) {
        const targetClients = this.clients.filter(c => c.userId === userId);
        console.log(`[SSEService] Found ${targetClients.length} clients for user ${userId}`);
        targetClients.forEach(client => {
            client.res.write(`event: ${type}\n`);
            client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        });
    }

    public broadcastToWorkspace(workspaceId: string, type: string, data: any, excludeUserId?: string) {
        // TODO: Filter by workspace membership. 
        // For MVP, if we don't have easy access to "who is in workspace X" in memory, 
        // we might broadcast to all or rely on client filtering (bad security).
        // Better: Pass list of userIds to sendToUser.

        // For now, assuming we iterate active clients and might need to look up their workspaces?
        // Or simpler: Services calling this method typically know the members.
        // Let's change signature to broadcast(userIds: string[], ...) in future refinement.
        // For now, retaining placeholder logic or relying on single user push for simple actions.
    }

    // Helper to send to multiple users
    public sendToUsers(userIds: string[], type: string, data: any) {
        // Dedup userIds just in case
        const uniqueIds = [...new Set(userIds)];
        uniqueIds.forEach(uid => this.sendToUser(uid, type, data));
    }
}

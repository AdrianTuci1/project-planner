import { Request, Response, NextFunction } from 'express';
import { SSEService } from '../services/sse.service';

export class SSEController {
    public stream = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.sub;

            // Headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            // Register client
            SSEService.getInstance().addClient(userId, res);

            // Keep alive heartbeat
            const headersTimeout = 60 * 1000;
            const heartbeat = setInterval(() => {
                res.write(': heartbeat\n\n');
            }, 30000);

            res.on('close', () => {
                clearInterval(heartbeat);
            });

        } catch (error) {
            next(error);
        }
    };
}

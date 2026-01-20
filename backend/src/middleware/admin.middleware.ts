import { Request, Response, NextFunction } from 'express';

export class AdminMiddleware {
    public verifyAdminKey = (req: Request, res: Response, next: NextFunction) => {
        const apiKey = req.headers['x-admin-key'];
        const validKey = process.env.ADMIN_API_KEY;

        if (!validKey) {
            console.warn("ADMIN_API_KEY not set in environment variables. Admin access disabled.");
            return res.status(500).json({ message: "Server configuration error" });
        }

        if (!apiKey || apiKey !== validKey) {
            return res.status(403).json({ message: "Forbidden: Invalid Admin Key" });
        }

        next();
    };
}

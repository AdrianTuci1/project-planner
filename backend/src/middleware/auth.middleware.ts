import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from "aws-jwt-verify";

export class AuthMiddleware {
    private verifier: any;

    constructor() {
        if (process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID) {
            this.verifier = CognitoJwtVerifier.create({
                userPoolId: process.env.COGNITO_USER_POOL_ID,
                tokenUse: "access",
                clientId: process.env.COGNITO_CLIENT_ID,
            });
        }
    }

    public verifyToken = async (req: Request, res: Response, next: NextFunction) => {
        // If credentials are NOT provided in env, we skip verification slightly (UNSAFE DEV MODE)
        // or we fail. Given the request is "Vom folosi aws cognito", let's be strict if configured,
        // but robust if not to prevent crashing if user hasn't added .env yet.
        if (!this.verifier) {
            console.error("Cognito configuration missing.");
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({ message: "Server misconfiguration" });
            }
            return next();
        }

        const authHeader = req.headers.authorization;
        const apiTokenHeader = req.headers['x-api-token'] as string;

        // 1. Check for API Token (x-api-token)
        if (apiTokenHeader && apiTokenHeader.startsWith('sk_')) {
            // We need to lazily instantiate UserService to avoid circular dependencies if any
            // But here we can just import it. However, notice AuthMiddleware is used in Routes.
            // Best to instantiate inside or inject. For now, let's instantiate.
            const { UserService } = require('../services/user.service');
            const userService = new UserService();

            try {
                const user = await userService.validateApiToken(apiTokenHeader);
                if (user) {
                    (req as any).user = { sub: user.id, ...user }; // Mock cognito-like payload or attach full user
                    return next();
                } else {
                    return res.status(401).json({ message: "Invalid API Token" });
                }
            } catch (error) {
                console.error("API Token validation error:", error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
        }

        // 2. Fallback to Cognito Token
        if (!authHeader && !req.query.token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader ? authHeader.split(' ')[1] : (req.query.token as string);

        try {
            const payload = await this.verifier.verify(token);
            console.log(`[AuthMiddleware] Verified token for sub: ${payload.sub}`);
            (req as any).user = payload; // Attach user to request
            next();
        } catch (err) {
            console.error("Token verification failed:", err);
            return res.status(401).json({ message: "Invalid token" });
        }
    };
}

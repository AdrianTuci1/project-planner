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
            console.warn("Cognito configuration missing. Auth skipped (UNSAFE).");
            return next();
        }

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>

        try {
            const payload = await this.verifier.verify(token);
            (req as any).user = payload; // Attach user to request
            next();
        } catch (err) {
            console.error("Token verification failed:", err);
            return res.status(401).json({ message: "Invalid token" });
        }
    };
}

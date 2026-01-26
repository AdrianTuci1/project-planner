import helmet from 'helmet';
import { CorsOptions } from 'cors';

export const helmetConfig = {
    crossOriginResourcePolicy: { policy: "cross-origin" as const },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            "img-src": ["'self'", "data:", "https://cdn.jsdelivr.net"],
            "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        },
    },
};

export const corsConfig: CorsOptions = {
    origin: ['http://localhost:5173', 'https://app.simplu.io'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-token'],
};

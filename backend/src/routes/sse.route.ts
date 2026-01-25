import { Router } from 'express';
import { Routes } from './routes.interface';
import { SSEController } from '../controllers/sse.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class SSERoute implements Routes {
    public path = '/stream';
    public router = Router();
    public sseController = new SSEController();
    public authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.authMiddleware.verifyToken, this.sseController.stream);
    }
}

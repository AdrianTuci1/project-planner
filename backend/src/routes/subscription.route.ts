import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { Routes } from './routes.interface';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class SubscriptionRoute implements Routes {
    public path = '/subscription';
    public router = Router();
    public subscriptionController = new SubscriptionController();
    private authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/checkout`, this.authMiddleware.verifyToken, this.subscriptionController.createCheckoutSession);
        this.router.post(`${this.path}/portal`, this.authMiddleware.verifyToken, this.subscriptionController.createPortalSession);

        // Webhook does not use authMiddleware and needs raw body often, but handled in controller via req.body 
        // assuming express generic setup or specific route config in app.ts if needed.
        this.router.post(`${this.path}/webhook`, this.subscriptionController.handleWebhook);
    }
}

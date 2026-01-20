import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

export class SubscriptionRoute {
    public path = '/subscription';
    public router = Router();
    public subscriptionController = new SubscriptionController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.use(`${this.path}`, this.subscriptionController.router);
    }
}

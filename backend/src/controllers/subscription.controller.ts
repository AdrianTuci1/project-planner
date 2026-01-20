import { Controller } from './controller.interface';
import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';

export class SubscriptionController implements Controller {
    public path = '/subscription';
    public router = require('express').Router();
    private subscriptionService = new SubscriptionService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/upgrade`, this.upgradeToPro);
        this.router.get(`${this.path}/status`, this.checkStatus);
    }

    private upgradeToPro = async (req: Request, res: Response) => {
        const userId = 'default-user'; // Mock user
        const { frequency } = req.body; // 'monthly' | 'yearly'
        const result = await this.subscriptionService.upgradeToPro(userId, frequency);
        res.status(200).json(result);
    };

    private checkStatus = async (req: Request, res: Response) => {
        const userId = 'default-user';
        const status = await this.subscriptionService.getStatus(userId);
        res.status(200).json(status);
    };
}

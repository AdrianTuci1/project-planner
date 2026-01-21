import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';

export class SubscriptionController {
    private subscriptionService = new SubscriptionService();

    public createCheckoutSession = async (req: Request, res: Response) => {
        try {
            const { priceId } = req.body;
            // @ts-ignore - Assuming auth middleware instills user
            const userId = req.user.id;
            const session = await this.subscriptionService.createCheckoutSession(userId, priceId);
            res.status(200).json(session);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    public createPortalSession = async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const session = await this.subscriptionService.createCustomerPortalSession(userId);
            res.status(200).json(session);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    public handleWebhook = async (req: Request, res: Response) => {
        const sig = req.headers['stripe-signature'];

        if (!sig) {
            res.status(400).send('Webhook Error: Missing stripe-signature');
            return;
        }

        try {
            // Use req.rawBody if available (set by custom middleware), else try req.body
            // @ts-ignore
            const payload = req.rawBody || req.body;

            await this.subscriptionService.handleWebhook(sig as string, payload);
            res.json({ received: true });
        } catch (error: any) {
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }
}

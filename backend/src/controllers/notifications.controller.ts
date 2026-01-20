import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from '../services/notifications.service';

export class NotificationsController {
    public notificationsService = new NotificationsService();

    public getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.sub;
            const notifications = await this.notificationsService.getUserNotifications(userId);
            res.status(200).json(notifications);
        } catch (error) {
            next(error);
        }
    }

    public markAsRead = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user.sub;
            await this.notificationsService.markAsRead(id, userId);
            res.status(200).json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    public broadcastNotification = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, message, type } = req.body;
            if (!title || !message) {
                return res.status(400).json({ message: "Title and message are required" });
            }
            const result = await this.notificationsService.sendGlobalNotification(title, message, type);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public welcomeUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.sub;
            const email = (req as any).user.email; // Assuming email is in token
            await this.notificationsService.sendWelcomeNotification(userId, email || 'User');
            res.status(200).json({ success: true, message: "Welcome notification sent" });
        } catch (error) {
            next(error);
        }
    }
}

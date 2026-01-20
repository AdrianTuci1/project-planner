import { Router } from 'express';
import { Routes } from './routes.interface';
import { NotificationsController } from '../controllers/notifications.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { AdminMiddleware } from '../middleware/admin.middleware';

export class NotificationsRoute implements Routes {
    public path = '/notifications';
    public router = Router();
    public notificationsController = new NotificationsController();
    public authMiddleware = new AuthMiddleware();
    public adminMiddleware = new AdminMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.authMiddleware.verifyToken, this.notificationsController.getUserNotifications);
        this.router.put(`${this.path}/:id/read`, this.authMiddleware.verifyToken, this.notificationsController.markAsRead);

        // Admin Route
        this.router.post(`${this.path}/broadcast`, this.adminMiddleware.verifyAdminKey, this.notificationsController.broadcastNotification);

        // User Triggered Welcome (e.g. after registration)
        this.router.post(`${this.path}/welcome`, this.authMiddleware.verifyToken, this.notificationsController.welcomeUser);
    }
}

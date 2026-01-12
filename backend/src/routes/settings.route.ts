import { Router } from 'express';
import { Routes } from './routes.interface';
import { SettingsController } from '../controllers/settings.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class SettingsRoute implements Routes {
    public path = '/settings';
    public router = Router();
    public settingsController = new SettingsController();
    public authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/general`, this.authMiddleware.verifyToken, this.settingsController.getGeneralSettings);
        this.router.put(`${this.path}/general`, this.authMiddleware.verifyToken, this.settingsController.updateGeneralSettings);
    }
}

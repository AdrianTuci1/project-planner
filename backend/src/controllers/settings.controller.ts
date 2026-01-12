import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from './controller.interface';
import { SettingsService } from '../services/settings.service';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class SettingsController implements Controller {
    public path = '/settings';
    public router = Router();
    private settingsService = new SettingsService();
    private authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/general`, this.authMiddleware.verifyToken, this.getGeneralSettings);
        this.router.put(`${this.path}/general`, this.authMiddleware.verifyToken, this.updateGeneralSettings);
    }

    private getGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const settings = await this.settingsService.getGeneralSettings();
            res.status(200).json(settings);
        } catch (error) {
            next(error);
        }
    }

    private updateGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.body;
            await this.settingsService.updateGeneralSettings(body);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }
}

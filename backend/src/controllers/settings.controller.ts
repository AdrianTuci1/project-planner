import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service';

export class SettingsController {
    public settingsService = new SettingsService();

    public getGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const settings = await this.settingsService.getGeneralSettings();
            res.status(200).json(settings);
        } catch (error) {
            next(error);
        }
    }

    public updateGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.body;
            await this.settingsService.updateGeneralSettings(body);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }
}

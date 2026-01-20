import { Request, Response, NextFunction } from 'express';
import { CalendarService } from '../services/calendar.service';

export class CalendarController {
    public calendarService = new CalendarService();

    public getCalendars = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.calendarService.getCalendars();
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }

    public addCalendar = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const account = req.body;
            const updated = await this.calendarService.addAccount(account);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    }

    public updateCalendar = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const updated = await this.calendarService.updateAccount(id, updates);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    }

    public deleteCalendar = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const updated = await this.calendarService.removeAccount(id);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    }

    public getGoogleAuthUrl = (req: Request, res: Response, next: NextFunction) => {
        try {
            const url = this.calendarService.generateGoogleAuthUrl();
            res.status(200).json({ url });
        } catch (error) {
            next(error);
        }
    }

    public googleCallback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { code } = req.query;
            if (!code || typeof code !== 'string') {
                throw new Error("Missing code query param");
            }

            await this.calendarService.handleGoogleCallback(code);

            // Redirect back to frontend
            // Assuming frontend is at process.env.FRONTEND_URL or hardcoded for now
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}?googleAuthSuccess=true`);
        } catch (error) {
            // Redirect with error
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}?googleAuthError=true`);
        }
    }
}

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
}

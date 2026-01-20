import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { Routes } from './routes.interface';

export class CalendarRoute implements Routes {
    public path = '/calendars';
    public router = Router();
    public calendarController = new CalendarController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.calendarController.getCalendars);
        this.router.post(`${this.path}`, this.calendarController.addCalendar);
        this.router.put(`${this.path}/:id`, this.calendarController.updateCalendar);
        this.router.delete(`${this.path}/:id`, this.calendarController.deleteCalendar);

        // OAuth Routes
        this.router.get(`${this.path}/auth/google`, this.calendarController.getGoogleAuthUrl);
        this.router.get(`${this.path}/auth/google/callback`, this.calendarController.googleCallback);
    }
}

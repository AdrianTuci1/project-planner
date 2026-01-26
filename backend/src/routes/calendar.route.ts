import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { Routes } from './routes.interface';

import { AuthMiddleware } from '../middleware/auth.middleware';

export class CalendarRoute implements Routes {
    public path = '/calendars';
    public router = Router();
    public calendarController = new CalendarController();
    private authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.authMiddleware.verifyToken, this.calendarController.getCalendars);
        this.router.get(`${this.path}/events`, this.authMiddleware.verifyToken, this.calendarController.getEvents);
        this.router.post(`${this.path}`, this.authMiddleware.verifyToken, this.calendarController.addCalendar);
        this.router.put(`${this.path}/:id`, this.authMiddleware.verifyToken, this.calendarController.updateCalendar);
        this.router.post(`${this.path}/:id/sync`, this.authMiddleware.verifyToken, this.calendarController.syncSubCalendars);
        this.router.delete(`${this.path}/:id`, this.authMiddleware.verifyToken, this.calendarController.deleteCalendar);

        // Event Routes
        // PATCH /calendars/:accountId/calendars/:calendarId/events/:eventId
        this.router.patch(`${this.path}/:accountId/calendars/:calendarId/events/:eventId`, this.authMiddleware.verifyToken, this.calendarController.updateEvent);
        // DELETE /calendars/:accountId/calendars/:calendarId/events/:eventId
        this.router.delete(`${this.path}/:accountId/calendars/:calendarId/events/:eventId`, this.authMiddleware.verifyToken, this.calendarController.deleteEvent);

        // OAuth Routes
        this.router.get(`${this.path}/auth/google`, this.authMiddleware.verifyToken, this.calendarController.getGoogleAuthUrl);
        this.router.post(`${this.path}/auth/google/callback`, this.authMiddleware.verifyToken, this.calendarController.googleCallback);
    }
}

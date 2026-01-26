import { Request, Response, NextFunction } from 'express';
import { CalendarService } from '../services/calendar.service';

export class CalendarController {
    public calendarService = new CalendarService();

    public getCalendars = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId) throw new Error("Unauthorized");
            const data = await this.calendarService.getCalendars(userId);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }

    public addCalendar = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const account = req.body;
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId) throw new Error("Unauthorized");
            const updated = await this.calendarService.addAccount(account, userId);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    }

    public updateCalendar = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId) throw new Error("Unauthorized");
            const updated = await this.calendarService.updateAccount(id, updates, userId);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    }

    public deleteCalendar = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId) throw new Error("Unauthorized");
            const updated = await this.calendarService.removeAccount(id, userId);
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

    public syncSubCalendars = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            // @ts-ignore
            const userId = req.user?.id || 'default-user';

            const updated = await this.calendarService.fetchSubCalendars(id, userId);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    }

    public getEvents = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { start, end } = req.query;
            // @ts-ignore
            const userId = req.user?.id || 'default-user';

            if (!start || !end) {
                throw new Error("Missing start/end date params");
            }

            const events = await this.calendarService.fetchEvents(start as string, end as string, userId);
            res.status(200).json(events);
        } catch (error) {
            next(error);
        }
    }

    public googleCallback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Support both GET (query) and POST (body) for transition, or switch strictly to POST
            const code = req.body.code || req.query.code;

            if (!code || typeof code !== 'string') {
                throw new Error("Missing code param");
            }

            // We pass 'default-user' or the authenticated user ID if available
            // In a real flow, we should ensure we know WHO is connecting.
            // If the user calls this from Frontend, they should be Authenticated via JWT.
            // So we can get userId from req.user
            // @ts-ignore
            const userId = req.user?.id || 'default-user';

            const account = await this.calendarService.handleGoogleCallback(code, userId);

            // Respond with JSON
            res.status(200).json(account);
        } catch (error) {
            next(error);
        }
    }

    public updateEvent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { accountId, calendarId, eventId } = req.params;
            const eventUpdates = req.body;
            const start = eventUpdates.start?.dateTime;
            const end = eventUpdates.end?.dateTime;

            // @ts-ignore
            const userId = req.user?.id;

            if (start || end) {
                const success = await this.calendarService.updateEventTime(accountId, calendarId, eventId, start, end, userId);
                if (success) {
                    res.status(200).json({ success: true });
                } else {
                    res.status(500).json({ error: "Failed to update event" });
                }
            } else {
                res.status(400).json({ error: "Missing start or end time" });
            }
        } catch (error) {
            next(error);
        }
    }

    public deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { accountId, calendarId, eventId } = req.params;
            // @ts-ignore
            const userId = req.user?.id;

            const success = await this.calendarService.deleteEvent(accountId, calendarId, eventId, userId);
            if (success) {
                res.status(200).json({ success: true });
            } else {
                res.status(500).json({ error: "Failed to delete event" });
            }
        } catch (error) {
            next(error);
        }
    }
}

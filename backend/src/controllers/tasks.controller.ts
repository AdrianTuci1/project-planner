import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from './controller.interface';
import { TasksService } from '../services/tasks.service';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class TasksController implements Controller {
    public path = '/tasks';
    public router = Router();
    private tasksService = new TasksService();
    private authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/dump`, this.authMiddleware.verifyToken, this.getDump);
    }

    private getDump = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate } = req.query;
            const tasks = await this.tasksService.getDump(startDate as string, endDate as string);
            res.status(200).json(tasks);
        } catch (error) {
            next(error);
        }
    }
}

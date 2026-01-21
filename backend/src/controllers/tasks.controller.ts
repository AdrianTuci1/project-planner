import { Request, Response, NextFunction } from 'express';
import { TasksService } from '../services/tasks.service';

export class TasksController {
    public tasksService = new TasksService();

    public getTasks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate, workspaceId } = req.query;
            const userId = (req as any).user?.sub || 'dev-user'; // Fallback for dev mode
            const tasks = await this.tasksService.getTasks(startDate as string, endDate as string, workspaceId as string, userId);
            res.status(200).json(tasks);
        } catch (error) {
            next(error);
        }
    }

    public createTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const task = req.body;
            // Inject createdBy from the authenticated user
            task.createdBy = (req as any).user?.sub || 'dev-user';
            const result = await this.tasksService.createTask(task);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    public updateTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const task = req.body;
            const result = await this.tasksService.updateTask(id, task);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public deleteTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.tasksService.deleteTask(id);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }
}


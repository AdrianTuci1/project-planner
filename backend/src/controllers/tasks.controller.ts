import { Request, Response, NextFunction } from 'express';
import { TasksService } from '../services/tasks.service';

export class TasksController {
    public tasksService = new TasksService();

    public getDump = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate } = req.query;
            const tasks = await this.tasksService.getDump(startDate as string, endDate as string);
            res.status(200).json(tasks);
        } catch (error) {
            next(error);
        }
    }

    public createTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const task = req.body;
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


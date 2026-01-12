import { Router } from 'express';
import { Routes } from './routes.interface';
import { TasksController } from '../controllers/tasks.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class TasksRoute implements Routes {
    public path = '/tasks';
    public router = Router();
    public tasksController = new TasksController();
    public authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/dump`, this.authMiddleware.verifyToken, this.tasksController.getDump);
        this.router.post(`${this.path}`, this.authMiddleware.verifyToken, this.tasksController.createTask);
        this.router.put(`${this.path}/:id`, this.authMiddleware.verifyToken, this.tasksController.updateTask);
        this.router.delete(`${this.path}/:id`, this.authMiddleware.verifyToken, this.tasksController.deleteTask);
    }
}

import { Router } from 'express';
import { Routes } from './routes.interface';
import { LabelsController } from '../controllers/labels.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class LabelsRoute implements Routes {
    public path = '/labels';
    public router = Router();
    public labelsController = new LabelsController();
    public authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.authMiddleware.verifyToken, this.labelsController.getLabels);
        this.router.post(`${this.path}`, this.authMiddleware.verifyToken, this.labelsController.createLabel);
        this.router.put(`${this.path}/:id`, this.authMiddleware.verifyToken, this.labelsController.updateLabel);
        this.router.delete(`${this.path}/:id`, this.authMiddleware.verifyToken, this.labelsController.deleteLabel);
    }
}

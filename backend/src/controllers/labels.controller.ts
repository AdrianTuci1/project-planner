import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from './controller.interface';
import { LabelsService } from '../services/labels.service';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class LabelsController implements Controller {
    public path = '/labels';
    public router = Router();
    private labelsService = new LabelsService();
    private authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.authMiddleware.verifyToken, this.getLabels);
    }

    private getLabels = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const labels = await this.labelsService.getLabels();
            res.status(200).json(labels);
        } catch (error) {
            next(error);
        }
    }
}

import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from './controller.interface';
import { GroupsService } from '../services/groups.service';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class GroupsController implements Controller {
    public path = '/groups';
    public router = Router();
    private groupsService = new GroupsService();
    private authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.authMiddleware.verifyToken, this.getGroups);
    }

    private getGroups = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate } = req.query;
            const groups = await this.groupsService.getGroups(
                startDate as string,
                endDate as string
            );
            res.status(200).json(groups);
        } catch (error) {
            next(error);
        }
    };
}

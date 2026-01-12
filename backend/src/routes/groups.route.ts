import { Router } from 'express';
import { Routes } from './routes.interface';
import { GroupsController } from '../controllers/groups.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class GroupsRoute implements Routes {
    public path = '/groups';
    public router = Router();
    public groupsController = new GroupsController();
    public authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.authMiddleware.verifyToken, this.groupsController.getGroups);
        this.router.post(`${this.path}`, this.authMiddleware.verifyToken, this.groupsController.createGroup);
        this.router.put(`${this.path}/:id`, this.authMiddleware.verifyToken, this.groupsController.updateGroup);
        this.router.delete(`${this.path}/:id`, this.authMiddleware.verifyToken, this.groupsController.deleteGroup);
    }
}

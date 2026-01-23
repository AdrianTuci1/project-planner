import { Router } from 'express';
import { WorkspacesController } from '../controllers/workspaces.controller';
import { Routes } from './routes.interface';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class WorkspacesRoute implements Routes {
    public path = '/workspaces';
    public router = Router();
    public workspacesController = new WorkspacesController();
    public authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.authMiddleware.verifyToken, this.workspacesController.getAllWorkspaces);
        this.router.post(`${this.path}`, this.authMiddleware.verifyToken, this.workspacesController.createWorkspace);
        this.router.get(`${this.path}/:id`, this.authMiddleware.verifyToken, this.workspacesController.getWorkspaceById);
        this.router.put(`${this.path}/:id`, this.authMiddleware.verifyToken, this.workspacesController.updateWorkspace);
    }
}



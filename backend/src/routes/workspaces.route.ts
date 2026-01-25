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
        this.router.delete(`${this.path}/:id`, this.authMiddleware.verifyToken, this.workspacesController.deleteWorkspace);

        // Member management
        this.router.delete(`${this.path}/:id/members/:userId`, this.authMiddleware.verifyToken, this.workspacesController.removeMember);
        this.router.put(`${this.path}/:id/owner`, this.authMiddleware.verifyToken, this.workspacesController.assignOwner);
        this.router.post(`${this.path}/:id/leave`, this.authMiddleware.verifyToken, this.workspacesController.leaveWorkspace);
    }
}

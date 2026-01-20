import { Router } from 'express';
import { WorkspacesController } from '../controllers/workspaces.controller';

export class WorkspacesRoute {
    public path = '/workspaces';
    public router = Router();
    public workspacesController = new WorkspacesController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}`, this.workspacesController.router);
        this.router.post(`${this.path}`, this.workspacesController.router);
        this.router.get(`${this.path}/:id`, this.workspacesController.router);
    }
}

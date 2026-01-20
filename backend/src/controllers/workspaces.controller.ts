import { Controller } from './controller.interface';
import { Request, Response } from 'express';
import { WorkspacesService } from '../services/workspaces.service';

export class WorkspacesController implements Controller {
    public path = '/workspaces';
    public router = require('express').Router();
    private workspacesService = new WorkspacesService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, this.getAllWorkspaces);
        this.router.post(this.path, this.createWorkspace);
        this.router.get(`${this.path}/:id`, this.getWorkspaceById);
    }

    private getAllWorkspaces = async (req: Request, res: Response, next: import('express').NextFunction) => {
        try {
            const userId = (req as any).user.sub;
            const email = (req as any).user.email;
            const workspaces = await this.workspacesService.getAllWorkspaces(userId, email);
            res.status(200).json(workspaces);
        } catch (error) {
            next(error);
        }
    };

    private createWorkspace = async (req: Request, res: Response, next: import('express').NextFunction) => {
        try {
            const { name, type } = req.body;
            const ownerId = (req as any).user.sub;
            const newWorkspace = await this.workspacesService.createWorkspace(name, type, ownerId);
            res.status(201).json(newWorkspace);
        } catch (error) {
            next(error);
        }
    };

    private getWorkspaceById = async (req: Request, res: Response) => {
        const id = req.params.id;
        const workspace = await this.workspacesService.getWorkspaceById(id);
        if (workspace) {
            res.status(200).json(workspace);
        } else {
            res.status(404).json({ message: 'Workspace not found' });
        }
    };
}

import { Controller } from './controller.interface';
import { Request, Response, NextFunction } from 'express';
import { WorkspacesService } from '../services/workspaces.service';

export class WorkspacesController implements Controller {
    public path = '/workspaces'; // Kept for now if needed by App, but logic moved to route
    public router = require('express').Router(); // Kept for interface compliance if needed, but unused for internal routing
    private workspacesService = new WorkspacesService();


    public getAllWorkspaces = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.sub;
            const email = (req as any).user.email;
            const workspaces = await this.workspacesService.getAllWorkspaces(userId, email);
            res.status(200).json(workspaces);
        } catch (error) {
            next(error);
        }
    };

    public createWorkspace = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, type } = req.body;
            const ownerId = (req as any).user.sub;
            const newWorkspace = await this.workspacesService.createWorkspace(name, type, ownerId);
            res.status(201).json(newWorkspace);
        } catch (error) {
            next(error);
        }
    };

    public getWorkspaceById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            const workspace = await this.workspacesService.getWorkspaceById(id);
            if (workspace) {
                res.status(200).json(workspace);
            } else {
                res.status(404).json({ message: 'Workspace not found' });
            }
        } catch (error) {
            next(error);
        }
    };
}


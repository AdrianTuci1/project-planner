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

    public updateWorkspace = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            const updates = req.body;
            // Security check: Verify owner or permissions? For now simple ownership check could be added in service
            // but for simplicity we rely on token. Ideally service should check permissions.

            // Fetch workspace to check ownership or fallback
            // const ownerId = (req as any).user.sub;
            // ... logic to verify owner ...

            const updated = await this.workspacesService.updateWorkspace(id, updates);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    };
}


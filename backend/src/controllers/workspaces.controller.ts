import { Controller } from './controller.interface';
import { Request, Response, NextFunction } from 'express';
import { WorkspacesService } from '../services/workspaces.service';

export class WorkspacesController implements Controller {
    public path = '/workspaces';
    public router = require('express').Router();
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
            const updated = await this.workspacesService.updateWorkspace(id, updates);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    };

    public deleteWorkspace = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            // TODO: check owner permissions here or in service
            await this.workspacesService.deleteWorkspace(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    public removeMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id, userId } = req.params;
            // Check permissions?
            await this.workspacesService.removeMember(id, userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    public assignOwner = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { ownerId } = req.body;
            await this.workspacesService.assignOwner(id, ownerId);
            res.status(200).json({ message: "Owner updated" });
        } catch (error) {
            next(error);
        }
    };

    public leaveWorkspace = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user.sub;
            await this.workspacesService.removeMember(id, userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}

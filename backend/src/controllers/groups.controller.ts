import { Request, Response, NextFunction } from 'express';
import { GroupsService } from '../services/groups.service';

export class GroupsController {
    public groupsService = new GroupsService();

    public getGroups = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const workspaceId = req.query.workspaceId as string;
            // @ts-ignore
            const userId = req.user?.id;

            const groups = await this.groupsService.getGroups(workspaceId, userId);
            res.status(200).json(groups);
        } catch (error) {
            next(error);
        }
    }

    public createGroup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const group = req.body;

            // @ts-ignore
            const userId = req.user?.id;
            if (userId) {
                group.createdBy = userId;
            }

            const result = await this.groupsService.createGroup(group);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    public updateGroup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const group = req.body;
            const result = await this.groupsService.updateGroup(id, group);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.groupsService.deleteGroup(id);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }
}

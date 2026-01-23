import { Request, Response, NextFunction } from 'express';
import { LabelsService } from '../services/labels.service';

export class LabelsController {
    public labelsService = new LabelsService();

    public getLabels = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const workspaceId = req.query.workspaceId as string;
            const user = (req as any).user;
            const userId = user?.sub || user?.username;
            const labels = await this.labelsService.getLabels(workspaceId, userId);
            res.status(200).json(labels);
        } catch (error) {
            next(error);
        }
    }

    public createLabel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const label = req.body;
            const user = (req as any).user;
            if (user) {
                label.createdBy = user.sub || user.username;
            }
            const result = await this.labelsService.createLabel(label);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    public updateLabel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const label = req.body;
            const result = await this.labelsService.updateLabel(id, label);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public deleteLabel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.labelsService.deleteLabel(id);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }
}


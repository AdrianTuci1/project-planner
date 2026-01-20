import { Request, Response, NextFunction } from 'express';
import { InvitationsService } from '../services/invitations.service';

export class InvitationsController {
    public invitationsService = new InvitationsService();

    public createInvitation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, workspaceId } = req.body;
            const inviterId = (req as any).user.sub;
            // Assuming we can get name from token claims or DB, for now use "Someone" or email if missing
            const inviterName = (req as any).user.name || (req as any).user.email || "A Colleague";

            const invite = await this.invitationsService.createInvitation(email, workspaceId, inviterId, inviterName);
            res.status(201).json(invite);
        } catch (error) {
            next(error);
        }
    }

    public acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user.sub;
            const result = await this.invitationsService.acceptInvitation(id, userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    public declineInvitation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.invitationsService.declineInvitation(id);
            res.status(200).json({ success: true });
        } catch (error) {
            next(error);
        }
    }
}

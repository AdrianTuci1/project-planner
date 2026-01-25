import { Request, Response, NextFunction } from 'express';
import { InvitationsService } from '../services/invitations.service';

export class InvitationsController {
    public invitationsService = new InvitationsService();

    public createInvitation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, workspaceId } = req.body;
            const inviterId = (req as any).user.sub;
            // Assuming we can get name from token claims or DB, for now use "Someone" or email if missing
            // My service expects inviterId, not name (Step 59).
            // Helper method for name logic if needed by notification service internally?
            // Actually createInvitation signature in Step 59 is: (email, workspaceId, inviterId). 
            // It fetches workspace name internally. Notification text uses workspace name.

            const invite = await this.invitationsService.createInvitation(email, workspaceId, inviterId);
            res.status(201).json(invite);
        } catch (error) {
            next(error);
        }
    }

    public acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user.sub;
            // respondToInvitation takes (id, accept, responderUserId)
            await this.invitationsService.respondToInvitation(id, true, userId);
            res.status(200).json({ message: "Accepted" });
        } catch (error) {
            next(error);
        }
    }

    public declineInvitation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user.sub;
            await this.invitationsService.respondToInvitation(id, false, userId);
            res.status(200).json({ message: "Declined" });
        } catch (error) {
            next(error);
        }
    }
}

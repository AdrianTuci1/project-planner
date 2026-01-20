import { Router } from 'express';
import { Routes } from './routes.interface';
import { InvitationsController } from '../controllers/invitations.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class InvitationsRoute implements Routes {
    public path = '/invitations';
    public router = Router();
    public invitationsController = new InvitationsController();
    public authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}`, this.authMiddleware.verifyToken, this.invitationsController.createInvitation);
        this.router.post(`${this.path}/:id/accept`, this.authMiddleware.verifyToken, this.invitationsController.acceptInvitation);
        this.router.post(`${this.path}/:id/decline`, this.authMiddleware.verifyToken, this.invitationsController.declineInvitation);
    }
}

import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';

class UserController {
    public userService = new UserService();

    public syncUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub, email, name } = (req as any).user; // From Auth Middleware
            const { onboarding } = req.body;

            const user = await this.userService.syncUser(sub, email, name, onboarding);

            res.status(200).json({ data: user, message: 'User synced successfully' });
        } catch (error) {
            next(error);
        }
    };

    public generateApiToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub } = (req as any).user;
            const token = await this.userService.generateApiToken(sub);
            res.status(200).json({ data: { token }, message: 'API Token generated successfully' });
        } catch (error) {
            next(error);
        }
    };

    public revokeApiToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub } = (req as any).user;
            await this.userService.revokeApiToken(sub);
            res.status(200).json({ message: 'API Token revoked successfully' });
        } catch (error) {
            next(error);
        }
    };
}

export default UserController;

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
}

export default UserController;

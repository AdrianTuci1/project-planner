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

    public getMe = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub } = (req as any).user;
            const user = await this.userService.getUserProfile(sub);
            res.status(200).json({ data: user });
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

    public getApiToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub } = (req as any).user;
            const token = await this.userService.getApiToken(sub);
            res.status(200).json({ data: { token } });
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

    public getBatchUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids)) {
                return res.status(400).json({ message: 'ids must be an array' });
            }
            const users = await this.userService.getUsersByIds(ids);
            res.status(200).json({ data: users });
        } catch (error) {
            next(error);
        }
    };

    public updateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub } = (req as any).user;
            const userData = req.body;

            // Security Check: Ensure user is only updating themselves
            if (userData.id && userData.id !== sub) {
                console.warn(`[Security Warning] User ${sub} attempted to update user ${userData.id}`);
                return res.status(403).json({ message: 'Forbidden: You can only update your own profile' });
            }

            const updatedUser = await this.userService.updateUser(sub, userData);
            res.status(200).json({ data: updatedUser, message: 'User updated successfully' });
        } catch (error) {
            next(error);
        }
    };
}

export default UserController;

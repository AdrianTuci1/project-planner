import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

class AuthController {
    public authService = new AuthService();

    public register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name, onboarding } = req.body;
            const result = await this.authService.register(email, password, name, onboarding);
            res.status(201).json({ data: result, message: 'User registered successfully' });
        } catch (error) {
            next(error);
        }
    };

    public resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            const result = await this.authService.resetPassword(email);
            res.status(200).json({ data: result, message: 'Password reset initiated' });
        } catch (error) {
            next(error);
        }
    };
}

export default AuthController;

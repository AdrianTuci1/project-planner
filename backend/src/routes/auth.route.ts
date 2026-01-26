import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { Routes } from './routes.interface';

class AuthRoute implements Routes {
    public path = '/auth';
    public router = Router();
    public authController = new AuthController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/register`, this.authController.register);
        this.router.post(`${this.path}/reset-password`, this.authController.resetPassword);
    }
}

export default AuthRoute;

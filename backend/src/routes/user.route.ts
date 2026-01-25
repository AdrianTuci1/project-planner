import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { Routes } from './routes.interface';
import { AuthMiddleware } from '../middleware/auth.middleware';

class UserRoute implements Routes {
    public path = '/users';
    public router = Router();
    public userController = new UserController();
    public authMiddleware = new AuthMiddleware();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Sync user data after registration
        this.router.post(`${this.path}/sync`, this.authMiddleware.verifyToken, this.userController.syncUser);
    }
}

export default UserRoute;

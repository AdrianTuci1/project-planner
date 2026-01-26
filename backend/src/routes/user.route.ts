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

        // Get current user profile
        this.router.get(`${this.path}/me`, this.authMiddleware.verifyToken, this.userController.getMe);

        // API Token Routes
        this.router.get(`${this.path}/api-token`, this.authMiddleware.verifyToken, this.userController.getApiToken);
        this.router.post(`${this.path}/api-token`, this.authMiddleware.verifyToken, this.userController.generateApiToken);
        this.router.delete(`${this.path}/api-token`, this.authMiddleware.verifyToken, this.userController.revokeApiToken);

        // Batch User Fetch
        this.router.post(`${this.path}/batch`, this.authMiddleware.verifyToken, this.userController.getBatchUsers);

        // Update User Profile
        this.router.post(`${this.path}/update`, this.authMiddleware.verifyToken, this.userController.updateUser);
    }
}

export default UserRoute;

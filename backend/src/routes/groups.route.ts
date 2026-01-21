import { Router } from 'express';
import { GroupsController } from '../controllers/groups.controller';

export class GroupsRoute {
    public path = '/groups';
    public router = Router();
    public groupsController = new GroupsController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Add auth middleware here if needed, consistent with other routes
        // Assuming global auth or adding middleware in controller logic? 
        // Other routes use AuthMiddleware. Let's add it for consistency if we have it easily available, 
        // but for now following LabelsRoute pattern which seemed to pass simple strings.
        // Actually, TasksRoute uses AuthMiddleware. LabelsRoute didn't show it in my view.
        // Let's stick to simple implementation first to match the Controller structure.

        this.router.get(`${this.path}`, this.groupsController.getGroups);
        this.router.post(`${this.path}`, this.groupsController.createGroup);
        this.router.put(`${this.path}/:id`, this.groupsController.updateGroup);
        this.router.delete(`${this.path}/:id`, this.groupsController.deleteGroup);
    }
}

import { App } from './app';
import { GroupsController } from './controllers/groups.controller';
import { TasksController } from './controllers/tasks.controller';
import { LabelsController } from './controllers/labels.controller';
import { SettingsController } from './controllers/settings.controller';
import dotenv from 'dotenv';

dotenv.config();

const port = parseInt(process.env.PORT || '3001'); // Default to 3001 to avoid React conflict

const app = new App(
    [
        new GroupsController(),
        new TasksController(),
        new LabelsController(),
        new SettingsController(),
    ],
    port,
);

app.listen();

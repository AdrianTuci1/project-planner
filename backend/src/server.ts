import { App } from './app';
import { GroupsRoute } from './routes/groups.route';
import { TasksRoute } from './routes/tasks.route';
import { LabelsRoute } from './routes/labels.route';
import { SettingsRoute } from './routes/settings.route';
import { CalendarRoute } from './routes/calendar.route';
import dotenv from 'dotenv';

dotenv.config();

const port = parseInt(process.env.PORT || '3001'); // Default to 3001 to avoid React conflict

const app = new App(
    [
        new GroupsRoute(),
        new TasksRoute(),
        new LabelsRoute(),
        new SettingsRoute(),
        new CalendarRoute(),
    ],
    port,
);

app.listen();

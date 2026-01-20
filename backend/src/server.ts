import { App } from './app';

import { TasksRoute } from './routes/tasks.route';
import { LabelsRoute } from './routes/labels.route';
import { SettingsRoute } from './routes/settings.route';
import { CalendarRoute } from './routes/calendar.route';
import { WorkspacesRoute } from './routes/workspaces.route';
import { SubscriptionRoute } from './routes/subscription.route';
import { InvitationsRoute } from './routes/invitations.route';
import { NotificationsRoute } from './routes/notifications.route';
import dotenv from 'dotenv';

dotenv.config();

const port = parseInt(process.env.PORT || '3000'); // Default to 3001 to avoid React conflict

const app = new App(
    [
        new TasksRoute(),
        new LabelsRoute(),
        new SettingsRoute(),
        new WorkspacesRoute(),
        new SubscriptionRoute(),
        new CalendarRoute(),
        new InvitationsRoute(),
        new NotificationsRoute(),
    ],
    port,
);

app.listen();

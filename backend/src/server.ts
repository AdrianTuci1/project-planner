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
import path from 'path';

import { SSERoute } from './routes/sse.route';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { GroupsRoute } from './routes/groups.route';
import { StorageRoute } from './routes/storage.route';
import UserRoute from './routes/user.route';

const port = parseInt(process.env.PORT || '3000'); // Default to 3001 to avoid React conflict

const app = new App(
    [
        new TasksRoute(),
        new LabelsRoute(),
        new GroupsRoute(),
        new SettingsRoute(),
        new WorkspacesRoute(),
        new SubscriptionRoute(),
        new CalendarRoute(),
        new InvitationsRoute(),
        new NotificationsRoute(),
        new SSERoute(),
        new StorageRoute(),
        new UserRoute(),
    ],
    port,
);

app.listen();

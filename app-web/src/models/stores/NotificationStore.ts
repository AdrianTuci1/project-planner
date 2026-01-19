import { makeAutoObservable } from "mobx";
import { ProjectStore } from "../store";

export type NotificationType = 'announcement' | 'invite';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    date: Date;
    isRead: boolean;
    // For invite
    inviterName?: string;
    workspaceName?: string;
}

export class NotificationStore {
    rootStore: ProjectStore;
    notifications: Notification[] = [];

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);

        // Add some dummy data for testing
        this.addNotification({
            id: '1',
            type: 'announcement',
            title: 'New Feature Available',
            message: 'Check out the new dark mode!',
            date: new Date(),
            isRead: false
        });
        this.addNotification({
            id: '2',
            type: 'invite',
            title: 'Workspace Invite',
            message: 'John Doe invited you to join "Marketing Team"',
            inviterName: 'John Doe',
            workspaceName: 'Marketing Team',
            date: new Date(Date.now() - 3600000), // 1 hour ago
            isRead: false
        });
    }

    get hasUnread() {
        return this.notifications.some(n => !n.isRead);
    }

    addNotification(notification: Notification) {
        this.notifications.unshift(notification);
    }

    markAsRead(id: string) {
        const note = this.notifications.find(n => n.id === id);
        if (note) {
            note.isRead = true;
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.isRead = true);
    }

    deleteNotification(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    // Mock invite handling
    handleInvite(id: string, accept: boolean) {
        console.log(`Invite ${id} ${accept ? 'accepted' : 'declined'}`);
        // In a real app, this would make an API call
        this.deleteNotification(id);
    }
}

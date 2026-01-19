import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Notification } from '../../models/stores/NotificationStore';
import { Check, X, Megaphone, UserPlus } from 'lucide-react';
import './NotificationContext.css';

interface NotificationContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
}

export const NotificationContext = observer(({ isOpen, onClose, position }: NotificationContextProps) => {
    const notifications = store.notificationStore.notifications;
    const [activeTab, setActiveTab] = useState<'new' | 'read'>('new');

    const handleInviteAction = (e: React.MouseEvent, id: string, accept: boolean) => {
        e.stopPropagation();
        store.notificationStore.handleInvite(id, accept);
    };

    const handleNotificationClick = (id: string) => {
        store.notificationStore.markAsRead(id);
    };

    const filteredNotifications = notifications.filter(n => {
        return activeTab === 'new' ? !n.isRead : n.isRead;
    });

    const renderNotificationItem = (notification: Notification) => {
        const isUnread = !notification.isRead;
        const cardClass = `notification-card ${isUnread ? 'unread' : 'read'}`;

        if (notification.type === 'invite') {
            return (
                <div
                    key={notification.id}
                    className={cardClass}
                    onClick={() => handleNotificationClick(notification.id)}
                >
                    <div className="notification-card-icon">
                        <UserPlus size={16} />
                    </div>
                    <div className="notification-card-content">
                        <span className="notification-title">{notification.title}</span>
                        <span className="notification-message">{notification.message}</span>

                        <div className="notification-actions">
                            <button
                                className="btn-notification-action btn-accept"
                                onClick={(e) => handleInviteAction(e, notification.id, true)}
                            >
                                <Check size={14} /> Accept
                            </button>
                            <button
                                className="btn-notification-action btn-decline"
                                onClick={(e) => handleInviteAction(e, notification.id, false)}
                            >
                                <X size={14} /> Decline
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Announcement / Default
        return (
            <div
                key={notification.id}
                className={cardClass}
                onClick={() => handleNotificationClick(notification.id)}
            >
                <div className="notification-card-icon">
                    <Megaphone size={16} />
                </div>
                <div className="notification-card-content">
                    <span className="notification-title">{notification.title}</span>
                    <span className="notification-message">{notification.message}</span>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            <div className="notification-backdrop" onClick={onClose} />
            <div
                className="notification-popover"
                style={{
                    left: position?.x || 0,
                    top: position?.y || 0
                }}
            >
                <div className="notification-context-container">
                    {/* Header: Tabs */}
                    <div className="notification-header">
                        <button
                            className={`notification-tab ${activeTab === 'new' ? 'active' : ''}`}
                            onClick={() => setActiveTab('new')}
                        >
                            New
                        </button>
                        <button
                            className={`notification-tab ${activeTab === 'read' ? 'active' : ''}`}
                            onClick={() => setActiveTab('read')}
                        >
                            Read
                        </button>
                    </div>

                    {/* Body: List */}
                    <div className="notification-list">
                        {filteredNotifications.length === 0 ? (
                            <div className="notification-empty">
                                <Megaphone size={24} style={{ opacity: 0.2 }} />
                                <span>No {activeTab} notifications</span>
                            </div>
                        ) : (
                            filteredNotifications.map(renderNotificationItem)
                        )}
                    </div>

                    {/* Footer: Actions */}
                    <div className="notification-footer">
                        <button
                            className="btn-footer close"
                            onClick={onClose}
                        >
                            Close
                        </button>
                        <button
                            className="btn-footer primary"
                            onClick={() => store.notificationStore.markAllAsRead()}
                        >
                            <Check size={12} /> Mark all as read
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
});

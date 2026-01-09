import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../models/store';
import { GroupView } from './Group/GroupView';
import './MainView.css';

export const MainView = observer(() => {
    // Ensure there's always an active group
    if (!store.activeGroupId && store.groups.length > 0) {
        store.activeGroupId = store.groups[0].id;
    }

    return (
        <div className="main-view-container">
            {store.activeGroupId ? (
                <GroupView groupId={store.activeGroupId} />
            ) : (
                <div style={{ padding: 20 }}>No groups available. Create a group to get started.</div>
            )}
        </div>
    );
});

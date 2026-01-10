import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../models/store';
import { GroupView } from './Group/GroupView';
import './MainView.css';

export const MainView = observer(() => {
    const mainGroupId = store.groups.length > 0 ? store.groups[0].id : null;

    return (
        <div className="main-view-container">
            {mainGroupId ? (
                <GroupView groupId={mainGroupId} />
            ) : (
                <div style={{ padding: 20 }}>No groups available. Create a group to get started.</div>
            )}
        </div>
    );
});

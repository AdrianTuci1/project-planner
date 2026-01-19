import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../models/store';
import { GroupView } from './Group/GroupView';
import './MainView.css';

export const MainView = observer(() => {
    const mainGroupId = store.activeGroupId;

    // Ensure activeGroupId is set if not already
    // Ensure activeGroupId is valid. If not found in current groups, reset to null (Brain Dump).
    React.useEffect(() => {
        if (store.activeGroupId) {
            const group = store.groups.find(g => g.id === store.activeGroupId);
            if (!group) {
                store.activeGroupId = null;
            }
        }
    }, [store.groups, store.activeGroupId]);

    return (
        <div className="main-view-container">
            <GroupView groupId={mainGroupId || ''} />
        </div>
    );
});

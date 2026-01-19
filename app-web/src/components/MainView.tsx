import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../models/store';
import { GroupView } from './Group/GroupView';
import './MainView.css';

export const MainView = observer(() => {
    const mainGroupId = store.activeGroupId || (store.groups.length > 0 ? store.groups[0].id : null);

    // Ensure activeGroupId is set if not already
    React.useEffect(() => {
        if (!store.activeGroupId && store.groups.length > 0) {
            store.activeGroupId = store.groups[0].id;
        }
    }, [store.groups]);

    return (
        <div className="main-view-container">
            {mainGroupId && (
                <GroupView groupId={mainGroupId} />
            )}
        </div>
    );
});

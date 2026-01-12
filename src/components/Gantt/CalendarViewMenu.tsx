import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { ContextMenu, MenuItem, MenuSeparator, MenuSectionLabel } from '../ContextMenu/ContextMenu';

interface CalendarViewMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number };
}

export const CalendarViewMenu = observer(({ isOpen, onClose, position }: CalendarViewMenuProps) => {
    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            <MenuSectionLabel>View Mode</MenuSectionLabel>
            <MenuItem
                label="Day"
                checkmark={store.calendarViewType === 'day'}
                onClick={() => { store.setCalendarViewType('day'); onClose(); }}
            />
            <MenuItem
                label="Week"
                checkmark={store.calendarViewType === 'week'}
                onClick={() => { store.setCalendarViewType('week'); onClose(); }}
            />
            <MenuItem
                label="Month"
                checkmark={store.calendarViewType === 'month'}
                onClick={() => { store.setCalendarViewType('month'); onClose(); }}
            />

            <MenuSeparator />

            <MenuItem
                label="Number of days"
                arrow
                disabled
            />

            <MenuItem
                label="Show declined events"
                colorDot="#8B5CF6"
                onClick={() => { /* Toggle logic */ }}
            />

            <MenuSeparator />

            <MenuItem
                label="Zoom 100%"
                disabled
            // Custom children support in MenuItem isn't perfect in the shared component unless we extend it, 
            // but standard MenuItem is cleaner.
            />

            <MenuSeparator />

            <MenuItem
                label="Settings"
                arrow
                onClick={() => {
                    onClose();
                    store.openSettings('calendar');
                }}
            />
        </ContextMenu>
    );
});

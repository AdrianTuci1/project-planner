import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { ContextMenu, MenuItem, MenuSeparator, MenuSectionLabel, ToggleSwitch } from '../ContextMenu/ContextMenu';

interface CalendarViewMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number };
}

export const CalendarViewMenu = observer(({ isOpen, onClose, position }: CalendarViewMenuProps) => {
    const [isDaysMenuOpen, setIsDaysMenuOpen] = useState(false);
    const [submenuPosition, setSubmenuPosition] = useState<{ x: number, y: number } | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect();
            setSubmenuPosition({ x: rect.right, y: rect.top - 4 }); // Align slightly up
        }
        setIsDaysMenuOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsDaysMenuOpen(false);
        }, 100);
    };

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

            {/* Submenu Trigger */}
            <div
                ref={itemRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <MenuItem
                    label="Number of days"
                    arrow
                    onClick={() => { }}
                />
            </div>

            {/* Portal for Submenu */}
            {isDaysMenuOpen && submenuPosition && ReactDOM.createPortal(
                <div
                    className="context-menu"
                    style={{
                        position: 'fixed', // Fixed because it's in body
                        left: submenuPosition.x,
                        top: submenuPosition.y,
                        width: '120px',
                        marginLeft: '4px',
                        zIndex: 1001, // Higher than parent (1000)
                    }}
                    onMouseEnter={() => {
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    }}
                    onMouseLeave={handleMouseLeave}
                >
                    {[2, 3, 4, 5, 6, 7].map(days => (
                        <MenuItem
                            key={days}
                            label={`${days} Days`}
                            checkmark={store.daysToShow === days}
                            onClick={() => {
                                store.setDaysToShow(days);
                                onClose();
                            }}
                        />
                    ))}
                </div>,
                document.body
            )}

            <ToggleSwitch
                label="Show declined events"
                checked={store.showDeclinedEvents}
                onChange={() => store.toggleShowDeclinedEvents()}
            />

            <MenuSeparator />

            <MenuItem
                label="Zoom 100%"
                disabled
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

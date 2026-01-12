import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { RecurrenceType, Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';
import { store } from '../../models/store';
import { ContextMenu } from './ContextMenu';
import { format, startOfDay } from 'date-fns';
import { RecurrencePickerContent } from './RecurrencePickerContent';


interface MakeRecurringTaskContextProps {
    ui: TaskUIModel;
    task: Task;
}

export const MakeRecurringTaskContext = observer(({
    ui,
    task
}: MakeRecurringTaskContextProps) => {

    const selectedRecurrence = task.recurrence;
    const hasSpecificTime = !!task.scheduledTime;

    // Logic for specific time string
    const specificTime = (() => {
        if (task.scheduledTime) {
            const [h, m] = task.scheduledTime.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m);
            return format(d, 'h:mm a');
        }
        return '9:00 AM';
    })();

    const [timeEnabled, setTimeEnabled] = useState(hasSpecificTime); // Local state for immediate UI feedback before commit? 
    // Actually best to sync with task. But keeping local 'enable' state might be useful if we toggle it on/off without clearing task immediately? 
    // The previous implementation used callbacks. 
    // Let's stick to direct task manipulation for "enabled" if "enabled" equals "task has scheduledTime".
    // But wait, if I disable it, I should clear scheduledTime?
    // And if I enable it, I should set it?
    // Yes.

    // If we use derived state `hasSpecificTime`, we don't need `timeEnabled` state if updates are immediate.
    // However, the `select` value `time` needs to be managed or derived.

    const handleToggleTime = (enabled: boolean) => {
        setTimeEnabled(enabled); // Optimistic or local needed? 
        if (!enabled) {
            if (task.scheduledDate) {
                // Keep date, remove time
                task.setScheduling(task.scheduledDate, undefined);
            }
        } else {
            // Enable time. Default to 9 AM like before.
            const d = task.scheduledDate ? new Date(task.scheduledDate) : startOfDay(new Date());
            d.setHours(0, 0, 0, 0); // ensure date is pure if needed, or keep it.
            task.setScheduling(d, "09:00");
        }
    };

    const handleTimeChange = (timeStr: string) => {
        // timeStr is like "9:30 PM"
        const [time, period] = timeStr.split(' ');
        const [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr);
        const minutes = parseInt(minutesStr);
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const newTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        task.setScheduling(task.scheduledDate, newTime);
    };

    return (
        <ContextMenu
            isOpen={ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'set'}
            onClose={() => ui.closeRecurrenceContext()}
            position={ui.recurrenceContext.position}
        >
            <RecurrencePickerContent
                selectedRecurrence={selectedRecurrence}
                onSelectRecurrence={(type) => {
                    task.recurrence = type;
                    store.checkAndGenerateRecurringTasks();
                    ui.closeRecurrenceContext();
                }}
                hasSpecificTime={hasSpecificTime}
                onToggleSpecificTime={handleToggleTime}
                specificTime={specificTime}
                onChangeTime={handleTimeChange}
                onClose={() => ui.closeRecurrenceContext()}
                baseDate={task.scheduledDate || new Date()}
            />
        </ContextMenu>
    );
});

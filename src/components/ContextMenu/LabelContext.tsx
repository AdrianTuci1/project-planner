import React from 'react';
import { observer } from 'mobx-react-lite';
import { ContextMenu } from './ContextMenu';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';
import { LabelPickerContent } from './LabelPickerContent';

interface LabelContextProps {
    ui: TaskUIModel;
    task: Task;
}

export const LabelContext = observer(({
    ui,
    task
}: LabelContextProps) => {
    const handleSelect = (labelId: string) => {
        const currentLabels = task.labels || [];
        if (currentLabels.includes(labelId)) {
            task.labels = currentLabels.filter(id => id !== labelId);
        } else {
            task.labels = [...currentLabels, labelId];
        }
        // Don't close automatically to allow multi-select
    };

    return (
        <ContextMenu
            isOpen={ui.labelContext.isOpen}
            onClose={() => ui.closeLabelContext()}
            position={ui.labelContext.position}
        >
            <LabelPickerContent
                onSelect={handleSelect}
                onClose={() => ui.closeLabelContext()}
                selectedLabelIds={task.labels || []}
            />
        </ContextMenu>
    );
});

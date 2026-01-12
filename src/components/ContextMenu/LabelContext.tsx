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
        task.labels = [labelId];
        ui.closeLabelContext();
    };

    return (
        <ContextMenu
            isOpen={ui.labelContext.isOpen}
            onClose={() => ui.closeLabelContext()}
            position={ui.labelContext.position}
        >
            <LabelPickerContent onSelect={handleSelect} onClose={() => ui.closeLabelContext()} />
        </ContextMenu>
    );
});

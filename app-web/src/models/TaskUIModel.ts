import { makeAutoObservable } from 'mobx';
import { Task } from './core';

export class TaskUIModel {
    isHovered: boolean = false;
    isSubtaskMode: boolean = false;
    isTimeExpanded: boolean = false;
    newSubtaskTitle: string = '';
    draftTitle: string = '';

    // Context Menu State
    timeContext = {
        isOpen: false,
        type: 'estimated' as 'actual' | 'estimated',
        position: { x: 0, y: 0 }
    };

    labelContext = {
        isOpen: false,
        position: { x: 0, y: 0 }
    };

    listContext = {
        isOpen: false,
        position: { x: 0, y: 0 }
    };

    recurrenceContext = {
        isOpen: false,
        mode: 'set' as 'set' | 'actions', // 'set' for MakeRecurring, 'actions' for RecurringActions
        position: { x: 0, y: 0 }
    };


    actionContext = {
        isOpen: false,
        position: { x: 0, y: 0 }
    };

    dateTimePickerContext = {
        isOpen: false,
        target: 'scheduled' as 'scheduled' | 'due',
        position: { x: 0, y: 0 }
    };

    recurrenceWarningContext = {
        isOpen: false,
        position: { x: 0, y: 0 }
    };

    isContextMenuOpen: boolean = false;
    contextPosition = { x: 0, y: 0 };

    constructor() {
        makeAutoObservable(this);
    }

    setHovered(value: boolean) {
        this.isHovered = value;
    }

    setSubtaskMode(value: boolean) {
        this.isSubtaskMode = value;
    }

    setTimeExpanded(value: boolean) {
        this.isTimeExpanded = value;
    }

    setNewSubtaskTitle(value: string) {
        this.newSubtaskTitle = value;
    }

    setDraftTitle(value: string) {
        this.draftTitle = value;
    }

    openTimeContext(e: React.MouseEvent, type: 'actual' | 'estimated', pos?: { x: number; y: number }) {
        e.stopPropagation();
        this.timeContext = {
            isOpen: true,
            type,
            position: pos || { x: e.clientX, y: e.clientY }
        };
    }

    closeTimeContext() {
        this.timeContext.isOpen = false;
    }

    openLabelContext(e: React.MouseEvent, pos?: { x: number; y: number }) {
        e.stopPropagation();
        this.labelContext = {
            isOpen: true,
            position: pos || { x: e.clientX, y: e.clientY }
        };
    }

    closeLabelContext() {
        this.labelContext.isOpen = false;
    }

    openListContext(e: React.MouseEvent, pos?: { x: number; y: number }) {
        e.stopPropagation();
        this.listContext = {
            isOpen: true,
            position: pos || { x: e.clientX, y: e.clientY }
        };
    }

    closeListContext() {
        this.listContext.isOpen = false;
    }

    openRecurrenceContext(e: React.MouseEvent, mode: 'set' | 'actions', pos?: { x: number; y: number }) {
        e.stopPropagation();
        this.recurrenceContext = {
            isOpen: true,
            mode,
            position: pos || { x: e.clientX, y: e.clientY }
        };
    }

    closeRecurrenceContext() {
        this.recurrenceContext.isOpen = false;
    }

    openRecurrenceWarning(e: React.MouseEvent, pos?: { x: number; y: number }) {
        e.stopPropagation();
        this.recurrenceWarningContext = {
            isOpen: true,
            position: pos || { x: e.clientX, y: e.clientY }
        };
    }

    closeRecurrenceWarning() {
        this.recurrenceWarningContext.isOpen = false;
    }

    priorityContext = {
        isOpen: false,
        position: { x: 0, y: 0 }
    };

    openPriorityContext(e: React.MouseEvent, pos?: { x: number; y: number }) {
        e.stopPropagation();
        this.priorityContext = {
            isOpen: true,
            position: pos || { x: e.clientX, y: e.clientY }
        };
    }

    closePriorityContext() {
        this.priorityContext.isOpen = false;
    }


    openActionContext(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        this.actionContext = {
            isOpen: true,
            position: { x: e.clientX, y: e.clientY }
        };
    }

    closeActionContext() {
        this.actionContext.isOpen = false;
    }

    openDatePicker(e: React.MouseEvent, target: 'scheduled' | 'due' = 'scheduled', pos?: { x: number; y: number }) {
        e.stopPropagation();
        this.dateTimePickerContext = {
            isOpen: true,
            target,
            position: pos || { x: e.clientX, y: e.clientY }
        };
        // Also ensure generic context is open if needed, but we seem to use specific context now?
        // Wait, DateTimePickerContext in TaskModal uses `ui.isContextMenuOpen`.
        // We should transition to using `ui.dateTimePickerContext.isOpen` for better separation.
        // But for backward compatibility with current implementation:
        // Current impl uses `ui.isContextMenuOpen`.
        // Let's stick to the current pattern of generic `isContextMenuOpen` BUT storing the TARGET is crucial.
        // So `dateTimePickerContext` stores the target.
        // And we set `isContextMenuOpen = true`.
        this.isContextMenuOpen = true;
        this.contextPosition = pos || { x: e.clientX, y: e.clientY };
    }

    closeDatePicker() {
        this.dateTimePickerContext.isOpen = false;
        this.isContextMenuOpen = false;
    }

    setContextMenuOpen(value: boolean) {
        this.isContextMenuOpen = value;
    }

    setContextPosition(pos: { x: number; y: number }) {
        this.contextPosition = pos;
    }

    handleAddSubtask(e: React.KeyboardEvent, task?: Task) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (this.newSubtaskTitle.trim() && task) {
                task.addSubtask(this.newSubtaskTitle);
                this.newSubtaskTitle = '';
            }
        }
    }

    lastSubmitTime: number = 0;

    handleCreateTask(
        e: React.KeyboardEvent,
        onCreate?: (title: string) => void,
        onCancel?: () => void
    ) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (this.draftTitle.trim() && onCreate) {
                this.lastSubmitTime = Date.now();
                onCreate(this.draftTitle);
                this.draftTitle = '';
            } else if (onCancel) {
                onCancel();
            }
        } else if (e.key === 'Escape' && onCancel) {
            onCancel();
        }
    }

    handleBlur(e: React.FocusEvent, isCreating?: boolean, onCancel?: () => void, onCreate?: (title: string) => void) {
        // If we recently submitted (e.g. via Enter), ignore blur to prevent closing
        if (Date.now() - this.lastSubmitTime < 200) {
            // Keep focus if possible? Logic is just to avoid Cancel
            // Re-focus might be needed if focus was truly lost, but usually this is just preventing the side-effect
            // Actually, if we want to create multiple tasks, we want to stay.
            (e.target as HTMLElement).focus();
            return;
        }

        // If we are clicking inside a context menu or another part of the card, don't cancel
        // Also check if we are creating and have a title, we might want to create on blur
        if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }

        if (isCreating) {
            if (this.draftTitle.trim() && onCreate) {
                onCreate(this.draftTitle);
                // After creating on blur, we usually want to close/cancel the creation mode 
                // because focus is lost.
                if (onCancel) onCancel();
            } else if (onCancel) {
                onCancel();
            }
        }
        this.isSubtaskMode = false;
        this.isTimeExpanded = false;
    }
}

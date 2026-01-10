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

    actionContext = {
        isOpen: false,
        position: { x: 0, y: 0 }
    };

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

    openTimeContext(e: React.MouseEvent, type: 'actual' | 'estimated') {
        e.stopPropagation();
        this.timeContext = {
            isOpen: true,
            type,
            position: { x: e.clientX, y: e.clientY }
        };
    }

    closeTimeContext() {
        this.timeContext.isOpen = false;
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

    handleAddSubtask(e: React.KeyboardEvent, task?: Task) {
        if (e.key === 'Enter' && this.newSubtaskTitle.trim() && task) {
            task.addSubtask(this.newSubtaskTitle);
            this.newSubtaskTitle = '';
        }
    }

    handleCreateTask(
        e: React.KeyboardEvent,
        onCreate?: (title: string) => void,
        onCancel?: () => void
    ) {
        if (e.key === 'Enter') {
            if (this.draftTitle.trim() && onCreate) {
                onCreate(this.draftTitle);
                this.draftTitle = '';
            } else if (onCancel) {
                onCancel();
            }
        } else if (e.key === 'Escape' && onCancel) {
            onCancel();
        }
    }

    handleBlur(e: React.FocusEvent, isCreating?: boolean, onCancel?: () => void) {
        // If we are clicking inside a context menu or another part of the card, don't cancel
        if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }

        if (isCreating && !this.draftTitle.trim() && onCancel) {
            onCancel();
        }
        this.isSubtaskMode = false;
        this.isTimeExpanded = false;
    }
}

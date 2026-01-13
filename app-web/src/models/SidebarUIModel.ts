import { makeAutoObservable } from "mobx";

class SidebarUIModel {
    isMenuOpen: boolean = false;
    menuPosition: { x: number; y: number } = { x: 0, y: 0 };
    isAddingTask: boolean = false;
    sidebarView: 'main' | 'due' | 'templates' = 'main';

    constructor() {
        makeAutoObservable(this);
    }

    setMenuOpen(open: boolean) {
        this.isMenuOpen = open;
    }

    setMenuPosition(x: number, y: number) {
        this.menuPosition = { x, y };
    }

    setAddingTask(adding: boolean) {
        this.isAddingTask = adding;
    }

    setSidebarView(view: 'main' | 'due' | 'templates') {
        this.sidebarView = view;
    }

    handleListClick(e: React.MouseEvent) {
        const rect = e.currentTarget.getBoundingClientRect();
        this.setMenuPosition(rect.left, rect.bottom + 8);
        this.setMenuOpen(true);
    }

    isActionsMenuOpen: boolean = false;
    actionsMenuPosition: { x: number; y: number } = { x: 0, y: 0 };

    setActionsMenuOpen(open: boolean) {
        this.isActionsMenuOpen = open;
    }

    setActionsMenuPosition(x: number, y: number) {
        this.actionsMenuPosition = { x, y };
    }

    handleActionsClick(e: React.MouseEvent) {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        this.setActionsMenuPosition(rect.left, rect.bottom + 8);
        this.setActionsMenuOpen(true);
    }
}

export const sidebarUI = new SidebarUIModel();

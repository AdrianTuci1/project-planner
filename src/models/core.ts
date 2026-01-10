import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

// --- Interfaces ---

export interface ISubtask {
    id: string;
    title: string;
    isCompleted: boolean;
}

export interface ILabel {
    id: string;
    name: string;
    color: string;
}

export interface IParticipant {
    id: string;
    name: string;
    avatarUrl?: string; // Optional image
    initials: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface ITask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    duration?: number; // in minutes
    actualDuration?: number; // in minutes
    participants: IParticipant[];
    subtasks: ISubtask[];
    createdAt: Date;
    scheduledDate?: Date; // For Gantt/Calendar
    labels: string[];
    recurrence?: RecurrenceType;
}

export type RecurrenceType =
    | 'none'
    | 'daily'
    | 'weekday'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'yearly'
    | 'custom';

export interface IGroup {
    id: string;
    name: string;
    tasks: ITask[];
    participants: IParticipant[];
}

// --- Classes ---

export class Subtask implements ISubtask {
    id: string;
    title: string;
    isCompleted: boolean;

    constructor(title: string) {
        this.id = uuidv4();
        this.title = title;
        this.isCompleted = false;
        makeAutoObservable(this);
    }

    toggle() {
        this.isCompleted = !this.isCompleted;
    }
}

export class Task implements ITask {
    id: string;
    title: string;
    description: string = "";
    status: TaskStatus = 'todo';
    duration: number = 0;
    actualDuration: number = 0;
    participants: IParticipant[] = [];
    subtasks: ISubtask[] = [];
    createdAt: Date;
    scheduledDate?: Date;
    labels: string[] = [];
    recurrence: RecurrenceType = 'none';

    constructor(title: string) {
        this.id = uuidv4();
        this.title = title;
        this.createdAt = new Date();
        makeAutoObservable(this);
    }

    addSubtask(title: string) {
        const subtask = new Subtask(title);
        this.subtasks.push(subtask);
    }

    removeSubtask(subtaskId: string) {
        this.subtasks = this.subtasks.filter(s => s.id !== subtaskId);
    }

    assignParticipant(participant: IParticipant) {
        if (!this.participants.find(p => p.id === participant.id)) {
            this.participants.push(participant);
        }
    }

    reorderSubtask(fromIndex: number, toIndex: number) {
        if (fromIndex < 0 || fromIndex >= this.subtasks.length || toIndex < 0 || toIndex >= this.subtasks.length) return;
        const [moved] = this.subtasks.splice(fromIndex, 1);
        this.subtasks.splice(toIndex, 0, moved);
    }

    toggleStatus() {
        this.status = this.status === 'done' ? 'todo' : 'done';
    }

    clone() {
        const newTask = new Task(this.title);
        newTask.description = this.description;
        newTask.status = this.status;
        newTask.duration = this.duration;
        newTask.actualDuration = this.actualDuration;
        newTask.participants = [...this.participants];
        newTask.subtasks = this.subtasks.map(s => {
            const newSub = new Subtask(s.title);
            newSub.isCompleted = s.isCompleted;
            return newSub;
        });
        newTask.scheduledDate = this.scheduledDate ? new Date(this.scheduledDate) : undefined;
        newTask.labels = [...this.labels];
        newTask.recurrence = this.recurrence;
        return newTask;
    }
}

export class Group implements IGroup {
    id: string;
    name: string;
    tasks: Task[] = [];
    participants: IParticipant[] = [];

    constructor(name: string) {
        this.id = uuidv4();
        this.name = name;
        makeAutoObservable(this);
    }

    addTask(task: Task) {
        this.tasks.push(task);
    }

    removeTask(taskId: string) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
    }

    duplicateTask(taskId: string) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index > -1) {
            const task = this.tasks[index];
            const clone = task.clone();
            this.tasks.splice(index + 1, 0, clone);
            return clone;
        }
    }

    addParticipant(participant: IParticipant) {
        if (!this.participants.find(p => p.id === participant.id)) {
            this.participants.push(participant);
        }
    }
}

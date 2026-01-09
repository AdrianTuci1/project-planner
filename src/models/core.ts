import { v4 as uuidv4 } from 'uuid';

// --- Interfaces ---

export interface ISubtask {
    id: string;
    title: string;
    isCompleted: boolean;
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
    participants: IParticipant[];
    subtasks: ISubtask[];
    createdAt: Date;
    scheduledDate?: Date; // For Gantt/Calendar
    labels: string[];
}

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
    participants: IParticipant[] = [];
    subtasks: ISubtask[] = [];
    createdAt: Date;
    scheduledDate?: Date;
    labels: string[] = [];

    constructor(title: string) {
        this.id = uuidv4();
        this.title = title;
        this.createdAt = new Date();
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

    toggleStatus() {
        this.status = this.status === 'done' ? 'todo' : 'done';
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
    }

    addTask(task: Task) {
        this.tasks.push(task);
    }

    addParticipant(participant: IParticipant) {
        if (!this.participants.find(p => p.id === participant.id)) {
            this.participants.push(participant);
        }
    }
}

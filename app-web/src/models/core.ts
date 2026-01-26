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
    scheduledDate?: Date | null; // For Gantt/Calendar
    scheduledTime?: string | null; // Format "HH:mm"
    dueDate?: Date;
    labelId?: string | null;
    recurrence?: RecurrenceType;
    priority: PriorityType;
    attachments: IAttachment[];
    workspaceId?: string;
    groupId?: string | null;
    isTemplate: boolean;
}

export interface IAttachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    key: string; // S3 Key
    createdAt: Date;
}

// ... existing code ...



export type PriorityType = 'high' | 'medium' | 'low' | 'none';

export type RecurrenceType =
    | 'none'
    | 'daily'
    | 'weekday'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'yearly'
    | 'custom';

export type GroupType = 'personal' | 'team';

export interface IGroup {
    id: string;
    name: string;
    icon: string;
    type: GroupType;
    workspaceId?: string;
    defaultLabelId?: string;
    autoAddLabelEnabled: boolean;
    tasks: ITask[];
    participants: IParticipant[];
    createdBy?: string;
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
    scheduledDate?: Date | null = undefined;
    dueDate?: Date = undefined; // New field
    labelId?: string | null = undefined;
    recurrence: RecurrenceType = 'none';
    priority: PriorityType = 'none';
    attachments: IAttachment[] = [];
    workspaceId?: string = undefined;
    groupId?: string | null = undefined;
    isTemplate: boolean = false;

    scheduledTime?: string | null = undefined; // Format "HH:mm"

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
        if (this.status === 'done') {
            this.status = 'todo';
            this.actualDuration = 0; // Reset
        } else {
            this.status = 'done';
            // Logic: If actual time < 1 min, use estimated if available
            if ((this.actualDuration || 0) < 1 && this.duration && this.duration > 0) {
                this.actualDuration = this.duration;
            }
        }
    }

    setScheduling(date?: Date | null, time?: string | null) {
        this.scheduledDate = date;
        this.scheduledTime = time;
    }

    clone() {
        const newTask = new Task(this.title);
        newTask.description = this.description;
        newTask.status = 'todo'; // Reset status
        newTask.duration = this.duration;
        newTask.actualDuration = 0; // Reset actual duration
        newTask.participants = [...this.participants];
        newTask.subtasks = this.subtasks.map(s => {
            const newSub = new Subtask(s.title);
            newSub.isCompleted = s.isCompleted;
            return newSub;
        });
        newTask.scheduledDate = this.scheduledDate ? new Date(this.scheduledDate) : undefined;
        newTask.scheduledTime = this.scheduledTime;
        newTask.labelId = this.labelId;
        newTask.recurrence = this.recurrence;
        newTask.priority = this.priority;
        newTask.attachments = this.attachments.map(a => ({ ...a }));
        newTask.workspaceId = this.workspaceId;
        newTask.groupId = this.groupId;
        newTask.isTemplate = this.isTemplate;
        return newTask;
    }

    addAttachment(attachmentData: { name: string, size: number, type: string, url: string, key: string }) {
        const attachment: IAttachment = {
            id: uuidv4(),
            name: attachmentData.name,
            size: attachmentData.size,
            type: attachmentData.type,
            url: attachmentData.url,
            key: attachmentData.key,
            createdAt: new Date()
        };
        this.attachments.push(attachment);
    }

    removeAttachment(id: string) {
        this.attachments = this.attachments.filter(a => a.id !== id);
    }
}

export class Group implements IGroup {
    id: string;
    name: string;
    icon: string;
    type: GroupType;
    workspaceId?: string = undefined;
    defaultLabelId?: string;
    autoAddLabelEnabled: boolean = false;
    tasks: Task[] = [];
    participants: IParticipant[] = [];
    createdBy?: string;

    constructor(name: string, icon: string = '📝', type: GroupType = 'personal', workspaceId?: string, defaultLabelId?: string, autoAddLabelEnabled: boolean = false, createdBy?: string) {
        this.id = uuidv4();
        this.name = name;
        this.icon = icon;
        this.type = type;
        this.workspaceId = workspaceId;
        this.defaultLabelId = defaultLabelId;
        this.autoAddLabelEnabled = autoAddLabelEnabled;
        this.createdBy = createdBy;
        makeAutoObservable(this);
    }

    addTask(task: Task) {
        // Apply auto-label if enabled and label exists
        if (this.autoAddLabelEnabled && this.defaultLabelId) {
            // Overwrite existing label or only set if empty?
            // "Add label" implies adding, but now we have strict single label.
            // If task has no label, we add it. If it has one... use default?
            // Let's assume if it has NO label, we use default.
            if (!task.labelId) {
                task.labelId = this.defaultLabelId;
            }
        }
        // Ensure workspaceId is set
        if (!task.workspaceId) {
            task.workspaceId = this.workspaceId;
        }
        task.groupId = this.id; // Assign group ID
        this.tasks.push(task);
    }

    removeTask(taskId: string) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.groupId = null;
        }
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

export type WorkspaceType = 'personal' | 'team';

export interface IWorkspace {
    id: string;
    name: string;
    type: WorkspaceType;
    groups: Group[];
    dumpAreaTasks: Task[];
    members?: string[];
    ownerId?: string;
    avatarUrl?: string;
}

export class Workspace implements IWorkspace {
    id: string;
    name: string;
    type: WorkspaceType;
    groups: Group[] = [];
    dumpAreaTasks: Task[] = [];
    members: string[] = [];
    ownerId: string = "";
    avatarUrl?: string;

    constructor(name: string, type: WorkspaceType, id?: string) {
        this.id = id || type;
        this.name = name;
        this.type = type;
        makeAutoObservable(this);
    }

    // Proxy methods for easier access, but logic can remain in Store or move here fully later
    createGroup(name: string, icon?: string, defaultLabelId?: string, autoAddLabelEnabled: boolean = false) {
        // GroupType is inferred from Workspace type
        const group = new Group(name, icon || '📝', this.type as any, this.id, defaultLabelId, autoAddLabelEnabled);
        this.groups.push(group);
        return group;
    }

    addGroup(group: Group) {
        this.groups.push(group);
    }

    addTaskToDump(title: string) {
        const task = new Task(title);
        task.workspaceId = this.id;
        task.groupId = null; // Ensure no group, explicitly null for sync
        this.dumpAreaTasks.push(task);
        return task;
    }
}

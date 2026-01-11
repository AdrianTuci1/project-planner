import { Task } from '../core';

export interface DragData {
    type: string;
    date?: Date;
    hour?: number;
    minute?: number;
    groupId?: string | null;
    containerData?: DragData;
    task?: Task;
    origin?: string;
    [key: string]: any;
}

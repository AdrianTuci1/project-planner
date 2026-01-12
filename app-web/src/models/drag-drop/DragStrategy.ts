import { DragEndEvent } from '@dnd-kit/core';
import { Task } from '../core';
import { DragData } from './types';

export interface DragStrategy {
    handle(
        task: Task,
        overData: DragData,
        event: DragEndEvent,
        context: { activeId: string; overId: string; isReordering: boolean }
    ): void;
}

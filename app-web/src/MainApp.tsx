import React from 'react';
import { AppLayout } from './components/Layout/AppLayout';
import { MainView } from './components/MainView';
import { DndContext, PointerSensor, useSensor, useSensors, pointerWithin, DragOverlay } from '@dnd-kit/core';
import { useAppDragEnd } from './hooks/useAppDragEnd';
import './index.css';
import './animations.css';
import { observer } from 'mobx-react-lite';
import { store } from './models/store';
import { TaskCardBase } from './components/Gantt/TaskCard/TaskCardBase';


export const MainApp = observer(() => {
    const { handleDragEnd, handleDragOver } = useAppDragEnd();
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [overId, setOverId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
        store.setDraggingTaskId(event.active.id);
    };

    const handleDragOverWrapper = (event: any) => {
        handleDragOver(event);
        setOverId(event.over?.id || null);
    };

    const handleDragEndWrapper = (event: any) => {
        handleDragEnd(event);
        setActiveId(null);
        setOverId(null);
        store.setDraggingTaskId(null);
        store.setDragOverLocation(null);
    };

    const activeTask = activeId ? store.getTaskById(activeId.startsWith('calendar-') ? activeId.replace('calendar-', '') : activeId) : null;

    // Determine if we are dragging over a calendar-like area
    const isOverCalendar = overId?.startsWith('calendar-') || overId?.startsWith('timebox-');

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEndWrapper}
            onDragOver={handleDragOverWrapper}
            autoScroll={false}
        >
            <AppLayout>
                <MainView />
            </AppLayout>
            <DragOverlay dropAnimation={null}>
                {activeTask && activeId && !activeId.startsWith('calendar-') && !activeId.startsWith('timebox-') ? (
                    isOverCalendar || overId?.startsWith('month-cell') || overId?.startsWith('calendar-cell') ? null : (
                        <div style={{ cursor: 'grabbing', pointerEvents: 'none' }}>
                            <TaskCardBase
                                task={activeTask}
                                isDragging={false}
                                className="drag-overlay-card"
                            />
                        </div>
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
});

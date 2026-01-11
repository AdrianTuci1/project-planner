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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEndWrapper = (event: any) => {
        handleDragEnd(event);
        setActiveId(null);
    };

    const activeTask = activeId ? store.allTasks.find(t => t.id === (activeId.startsWith('calendar-') ? activeId.replace('calendar-', '') : activeId)) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEndWrapper}
            onDragOver={handleDragOver}
            autoScroll={false}
        >
            <AppLayout>
                <MainView />
            </AppLayout>
            <DragOverlay dropAnimation={null}>
                {activeTask && activeId && !activeId.startsWith('calendar-') && !activeId.startsWith('timebox-') ? (
                    <div style={{ cursor: 'grabbing' }}>
                        <TaskCardBase
                            task={activeTask}
                            isDragging={false} /* Overlay looks solid */
                            className="drag-overlay-card"
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
});

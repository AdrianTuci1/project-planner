
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { SidebarTaskList } from './SidebarTaskList';
import { Plus, X } from 'lucide-react';
import { Task } from '../../models/core';
import { useDroppable } from '@dnd-kit/core';

export const TemplatesView = observer(() => {
    console.log('Templates in view:', store.templates.length, store.templates);
    const handleCreate = () => {
        // Create a blank template locally (not in store yet)
        const newTemplate = new Task("");
        // Open modal in creation mode
        store.openTaskModal(newTemplate, true);
    };

    const { setNodeRef } = useDroppable({
        id: 'templates-list',
        data: {
            type: 'templates-list',
        }
    });

    return (
        <div className="sidebar-tasks-container">
            <div className="sidebar-section-header" style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>TEMPLATES</span>
                <div
                    onClick={handleCreate}
                    style={{ cursor: 'pointer', borderRadius: '4px' }}
                >
                    <Plus size={14} />
                </div>
            </div>

            <div
                ref={setNodeRef}
                className="sidebar-tasks-list"
            >
                <SidebarTaskList
                    tasks={store.templates}
                    activeGroup={null}
                    isSortable={true}
                    id="templates-list"
                    containerData={{ type: 'templates-list' }}
                />

                {store.templates.length === 0 && (
                    <div style={{
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        textAlign: 'center',
                        marginTop: '20px',
                        fontStyle: 'italic'
                    }}>
                        No templates yet. Click + to create one.
                    </div>
                )}
            </div>
        </div>
    );
});

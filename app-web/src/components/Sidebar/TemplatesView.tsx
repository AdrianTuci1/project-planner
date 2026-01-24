import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { SidebarTaskList } from './SidebarTaskList';
import { Plus, X } from 'lucide-react';
import { Task } from '../../models/core';

export const TemplatesView = observer(() => {
    console.log('Templates in view:', store.templates.length, store.templates);
    const handleCreate = () => {
        // Create a blank template locally (not in store yet)
        const newTemplate = new Task("");
        newTemplate.workspaceId = store.activeWorkspace.id;
        // Open modal in creation mode
        store.openTaskModal(newTemplate, true);
    };

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

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {store.templates.length === 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        opacity: 1,
                        marginTop: '10px',
                        paddingTop: '0px',
                        marginBottom: '10px'
                    }}>
                        <img
                            src="/templates.png"
                            alt="No templates"
                            style={{
                                maxWidth: '80%',
                                height: 'auto',
                                marginBottom: '10px'
                            }}
                        />
                        <span style={{
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                            textAlign: 'center',
                            fontStyle: 'italic'
                        }}>
                            You can create a template any time
                        </span>
                    </div>
                )}

                <SidebarTaskList
                    tasks={store.templates}
                    activeGroup={null}
                    isSortable={true}
                    onDuplicate={(t: Task) => store.duplicateTask(t)}
                    onDelete={(t: Task) => store.deleteTask(t.id)}
                    id="templates-list"
                    containerData={{ type: 'templates-list' }}
                />
            </div>
        </div>
    );
});

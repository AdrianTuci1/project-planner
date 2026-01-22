import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Flag,
    Link2,
    RotateCw,
} from 'lucide-react';
import { TaskUIModel } from '../../../models/TaskUIModel';
import './TaskCard.css';
import { ContextMenu } from '../../ContextMenu/ContextMenu';
import { LabelPickerContent } from '../../ContextMenu/LabelPickerContent';
import { RecurrencePickerContent } from '../../ContextMenu/RecurrencePickerContent';
import { RecurrenceWarningContext } from '../../ContextMenu/RecurrenceWarningContext';

interface CreatingTaskCardProps {
    onCreate?: (title: string, labelId?: string | null) => void;
    onCancel?: () => void;
    style?: React.CSSProperties;
    className?: string;
}

export const CreatingTaskCard = observer(({
    onCreate,
    onCancel,
    style,
    className
}: CreatingTaskCardProps) => {
    const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);

    const handleCreate = (title: string) => {
        if (onCreate) {
            const labelId = selectedLabelIds.length > 0 ? selectedLabelIds[0] : null;
            onCreate(title, labelId);
        }
    };

    const ui = useMemo(() => new TaskUIModel(), []);

    const containerRef = React.useRef<HTMLDivElement>(null);

    // Handle click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // If context menus are open, ignore (let them handle their own closing if needed, or if they are portals)
                // Note: If context menus are Portals, they might NOT be inside containerRef.
                // If they are inside, contains works.
                // Assuming ContextMenu creates a Portal or is somewhere else in DOM?
                // The `ContextMenu` component likely uses a Portal or fixed positioning.
                // If it's a Portal, clicking it is "outside" containerRef.
                // But we check `ui.labelContext.isOpen`.
                if (ui.labelContext.isOpen || ui.recurrenceContext.isOpen) return;

                if (ui.draftTitle.trim()) {
                    handleCreate(ui.draftTitle);
                    if (onCancel) onCancel(); // Save & Close on click outside
                } else if (onCancel) {
                    onCancel();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [handleCreate, onCancel, ui.labelContext.isOpen, ui.recurrenceContext.isOpen, ui.draftTitle]);

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            className={`task-card creating hovered ${className || ''}`}
            style={style}
            onBlur={(e) => {
                // Keep accessibility support for Tabbing out
                // Use RAF to allow focus to settle
                requestAnimationFrame(() => {
                    if (containerRef.current?.contains(document.activeElement)) return;
                    if (ui.labelContext.isOpen || ui.recurrenceContext.isOpen) return;

                    if (ui.draftTitle.trim()) {
                        handleCreate(ui.draftTitle);
                        if (onCancel) onCancel(); // Save & Close on blur
                    } else if (onCancel) {
                        onCancel();
                    }
                });
            }}
        >
            <div className="tc-header">
                <input
                    autoFocus
                    className="tc-title-input"
                    placeholder="Task name"
                    value={ui.draftTitle}
                    onChange={e => ui.setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (ui.draftTitle.trim()) {
                                handleCreate(ui.draftTitle);
                                ui.setDraftTitle(''); // Clear for rapid entry
                            } else if (onCancel) {
                                onCancel();
                            }
                        }
                        if (e.key === 'Escape' && onCancel) {
                            onCancel();
                        }
                    }}
                    onClick={e => e.stopPropagation()}
                />
            </div>

            <div className="tc-footer">
                <div
                    className="tc-label"
                    onClick={(e) => ui.openLabelContext(e)}
                >
                    {selectedLabelIds.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                            {/* Quick preview of colors/names? For now just count or name */}
                            {selectedLabelIds.length} Label{selectedLabelIds.length > 1 ? 's' : ''}
                        </div>
                    ) : (
                        "Select Label"
                    )}
                </div>
                <div className="tc-actions">
                    <Flag size={14} className="tc-action-icon" />
                    <Link2
                        size={14}
                        className="tc-action-icon"
                        onClick={(e) => { e.stopPropagation(); ui.setSubtaskMode(!ui.isSubtaskMode); }}
                    />
                    <RotateCw
                        size={14}
                        className="tc-action-icon"
                        onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            ui.openRecurrenceWarning(e, { x: rect.left, y: rect.bottom + 8 });
                        }}
                        onMouseLeave={() => ui.closeRecurrenceWarning()}
                        onClick={(e) => {
                            e.stopPropagation();
                            // In Sidebar (where CreatingTaskCard is used), recurrence is disabled
                            // as tasks are not associated with a date yet.
                            // ui.openRecurrenceContext(e, 'set');
                        }}
                    />
                </div>
            </div>

            <ContextMenu
                isOpen={ui.labelContext.isOpen}
                onClose={() => ui.closeLabelContext()}
                position={ui.labelContext.position}
            >
                <LabelPickerContent
                    onSelect={(labelId) => {
                        // Enforce single label selection
                        if (selectedLabelIds.includes(labelId)) {
                            // Deselect if already selected
                            setSelectedLabelIds([]);
                        } else {
                            // Select new one (replace others)
                            setSelectedLabelIds([labelId]);
                        }
                        // Close after selection since it's single select
                        ui.closeLabelContext();
                    }}
                    onClose={() => ui.closeLabelContext()}
                    selectedLabelIds={selectedLabelIds}
                />
            </ContextMenu>

            <ContextMenu
                isOpen={ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'set'}
                onClose={() => ui.closeRecurrenceContext()}
                position={ui.recurrenceContext.position}
            >
                <RecurrencePickerContent
                    selectedRecurrence={'none'} // default
                    hasSpecificTime={false}
                    specificTime={'9:00 AM'}
                    onSelectRecurrence={() => ui.closeRecurrenceContext()}
                    onToggleSpecificTime={() => { }}
                    onChangeTime={() => { }}
                    onClose={() => ui.closeRecurrenceContext()}
                    baseDate={new Date()}
                />
            </ContextMenu>

            <RecurrenceWarningContext ui={ui} />
        </div>
    );
});

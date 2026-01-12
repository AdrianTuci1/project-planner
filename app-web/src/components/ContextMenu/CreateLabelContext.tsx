import React, { useState, useRef } from 'react';
import { ContextMenu, MenuHeader } from './ContextMenu';
import { ColorPickerContext, PRESET_COLORS } from './ColorPickerContext';

interface CreateLabelContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    onCreateLabel?: (name: string, color: string) => void;
}

export const CreateLabelContext: React.FC<CreateLabelContextProps> = ({
    isOpen,
    onClose,
    position,
    onCreateLabel,
}) => {
    const [labelName, setLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

    // Color picker state
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
    const colorButtonRef = useRef<HTMLButtonElement>(null);

    const handleCreate = () => {
        if (labelName.trim()) {
            onCreateLabel?.(labelName.trim(), selectedColor);
            setLabelName('');
            setSelectedColor(PRESET_COLORS[0]);
            onClose();
        }
    };

    const handleCancel = () => {
        setLabelName('');
        setSelectedColor(PRESET_COLORS[0]);
        onClose();
    };

    const handleOpenColorPicker = () => {
        if (colorButtonRef.current) {
            const rect = colorButtonRef.current.getBoundingClientRect();
            // Position above the button, centered horizontally if possible, or just aligned left
            // We want it "outside" this context menu.
            // Let's try positioning it slightly above the button.
            setColorPickerPosition({
                x: rect.left,
                y: rect.top - 180 // Approximate height of color picker, or use calculation dynamically
            });
            setIsColorPickerOpen(true);
        }
    };

    return (
        <>
            <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
                <MenuHeader title="Create label" onClose={handleCancel} />
                <div style={{ padding: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <button
                            ref={colorButtonRef}
                            className="color-trigger-btn"
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                backgroundColor: selectedColor,
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                flexShrink: 0
                            }}
                            onClick={handleOpenColorPicker}
                            title="Select color"
                        />
                        <input
                            type="text"
                            className="context-menu-input"
                            placeholder="Label name"
                            style={{ margin: 0, flex: 1 }}
                            value={labelName}
                            onChange={(e) => setLabelName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate();
                                if (e.key === 'Escape') handleCancel();
                            }}
                            autoFocus
                        />
                    </div>
                </div>
            </ContextMenu>

            <ColorPickerContext
                isOpen={isColorPickerOpen}
                onClose={() => setIsColorPickerOpen(false)}
                position={colorPickerPosition}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
            />
        </>
    );
};

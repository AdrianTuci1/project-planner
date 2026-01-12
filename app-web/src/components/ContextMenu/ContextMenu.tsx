import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

interface ContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    children: React.ReactNode;
    className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    isOpen,
    onClose,
    position = { x: 0, y: 0 },
    children,
    className = '',
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !menuRef.current) return;

        // Adjust position to keep menu in viewport
        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = position.x;
        let adjustedY = position.y;

        if (rect.right > viewportWidth) {
            adjustedX = viewportWidth - rect.width - 10;
        }

        if (rect.bottom > viewportHeight) {
            adjustedY = viewportHeight - rect.height - 10;
        }

        menu.style.left = `${Math.max(10, adjustedX)}px`;
        menu.style.top = `${Math.max(10, adjustedY)}px`;
    }, [isOpen, position]);

    if (!isOpen) return null;

    return (
        <>
            <div
                className="context-menu-backdrop"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            <div
                ref={menuRef}
                className={`context-menu ${className}`}
                style={{ left: position.x, top: position.y }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>
    );
};

interface MenuItemProps {
    icon?: React.ReactNode;
    label: string;
    meta?: string;
    arrow?: boolean;
    checkmark?: boolean;
    selected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    colorDot?: string;
    color?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    meta,
    arrow,
    checkmark,
    selected,
    disabled,
    onClick,
    colorDot,
    color,
}) => {
    return (
        <div
            className={`context-menu-item ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={disabled ? undefined : onClick}
            style={color ? { color } : undefined}
        >
            {colorDot && (
                <span
                    className="context-menu-color-dot"
                    style={{ backgroundColor: colorDot }}
                />
            )}
            {icon && <span className="context-menu-item-icon">{icon}</span>}
            <span className="context-menu-item-label">{label}</span>
            {meta && <span className="context-menu-item-meta">{meta}</span>}
            {arrow && (
                <span className="context-menu-item-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </span>
            )}
            {checkmark && (
                <span className="context-menu-item-checkmark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </span>
            )}
        </div>
    );
};

export const MenuSeparator: React.FC = () => {
    return <div className="context-menu-separator" />;
};

interface MenuHeaderProps {
    title: string;
    onClose?: () => void;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ title, onClose }) => {
    return (
        <div className="context-menu-header">
            <span>{title}</span>
            {onClose && (
                <div className="context-menu-close" onClick={onClose}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </div>
            )}
        </div>
    );
};

interface MenuSearchProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
}

export const MenuSearch: React.FC<MenuSearchProps> = ({
    placeholder = 'Search...',
    value,
    onChange,
}) => {
    return (
        <div className="context-menu-search">
            <span className="context-menu-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
            </span>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    label,
    checked,
    onChange,
}) => {
    return (
        <div className="context-menu-toggle">
            <span>{label}</span>
            <div
                className={`toggle-switch ${checked ? 'active' : ''}`}
                onClick={() => onChange(!checked)}
            >
                <div className="toggle-switch-thumb" />
            </div>
        </div>
    );
};

export const MenuSectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div className="context-menu-section-label">{children}</div>;
};

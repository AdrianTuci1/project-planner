import React, { useState } from 'react';
import { IAttachment } from '../../../models/core';
import { FileText, Image, MoreVertical, Download, Trash2, Eye } from 'lucide-react';

interface AttachmentCardProps {
    attachment: IAttachment;
    onDelete: () => void;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isImage = attachment.type.startsWith('image/');

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = () => {
        if (isImage) {
            // Simple full screen preview
            const win = window.open();
            if (win) {
                win.document.write('<img src="' + attachment.url + '" style="width:100%; height:100%; object-fit:contain; background:black;" />');
            }
        } else {
            handleDownload();
        }
    };

    return (
        <div className="attachment-card" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            background: 'var(--bg-secondary)',
            borderRadius: '6px',
            marginBottom: '8px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
            border: '1px solid transparent'
        }}
            onClick={handlePreview}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
            {/* Thumbnail */}
            <div style={{
                width: '40px',
                height: '40px',
                background: isImage ? `url(${attachment.url}) no-repeat center/cover` : 'var(--bg-tertiary)',
                borderRadius: '4px',
                marginRight: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {!isImage && <FileText size={20} color="var(--text-secondary)" />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: 'var(--text-primary)'
                }}>
                    {attachment.name}
                </div>
                <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                }}>
                    {formatSize(attachment.size)}
                </div>
            </div>

            {/* Menu Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                }}
            >
                <MoreVertical size={16} />
            </button>

            {/* Context Menu */}
            {showMenu && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        right: '0',
                        top: '100%',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        zIndex: 101,
                        padding: '4px',
                        minWidth: '120px'
                    }}>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                                setShowMenu(false);
                            }}
                            style={{
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'background 0.1s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Download size={14} /> Download
                        </div>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                                setShowMenu(false);
                            }}
                            style={{
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: '#EF4444',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'background 0.1s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-highlight)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Trash2 size={14} /> Delete
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

import React, { useState } from 'react';
import { IAttachment } from '../../../models/core';
import { FileText, Image, MoreVertical, Download, Trash2, Eye, FileCode, FileSpreadsheet, FileVideo, Music, File, ImageOff } from 'lucide-react';
import { ContextMenu, MenuItem } from '../../ContextMenu/ContextMenu';
import { api } from '../../../services/api';

interface AttachmentCardProps {
    attachment: IAttachment;
    onDelete: () => void;
}

import { ImagePreviewOverlay } from './ImagePreviewOverlay';
import './AttachmentCard.css';

export const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [showPreview, setShowPreview] = useState(false);

    const [imageError, setImageError] = useState(false);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getIcon = () => {
        if (imageError) return <ImageOff size={24} color="var(--text-secondary)" />;
        if (attachment.type.startsWith('image/')) return <Image size={24} color="var(--accent)" />;
        if (attachment.type.includes('pdf')) return <FileText size={24} color="#EF4444" />;
        if (attachment.type.includes('word') || attachment.type.includes('document')) return <FileText size={24} color="#3B82F6" />;
        if (attachment.type.includes('excel') || attachment.type.includes('sheet')) return <FileSpreadsheet size={24} color="#10B981" />;
        if (attachment.type.includes('video')) return <FileVideo size={24} color="#8B5CF6" />;
        if (attachment.type.includes('audio')) return <Music size={24} color="#F59E0B" />;
        return <File size={24} color="var(--text-secondary)" />;
    };

    const getUrl = () => {
        if (attachment.key) {
            return api.getFileUrl(attachment.key);
        }
        return attachment.url;
    };

    const handleDownload = () => {
        const url = getUrl();
        // Append download=true if it's from our backend
        const downloadUrl = url.includes('/storage/files/')
            ? `${url}${url.includes('?') ? '&' : '?'}download=true`
            : url;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = attachment.name; // This doesn't work for cross-origin without headers, but our backend proxy sets headers.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = () => {
        if (attachment.type.startsWith('image/')) {
            setShowPreview(true);
        } else {
            handleDownload(); // Changed behavior: Click on non-image = Download
        }
    };

    return (
        <>
            <div
                className="attachment-card"
                onClick={handlePreview}
            >
                {/* Thumbnail */}
                <div className="attachment-thumbnail">
                    {attachment.type.startsWith('image/') && !imageError ? (
                        <img
                            src={getUrl()}
                            alt={attachment.name}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        getIcon()
                    )}
                </div>

                {/* Info */}
                <div className="attachment-info">
                    <div className="attachment-name" title={attachment.name}>
                        {attachment.name.length > 24 ? `${attachment.name.substring(0, 24)}...` : attachment.name}
                    </div>
                    <div className="attachment-size">
                        {formatSize(attachment.size)}
                    </div>
                </div>

                {/* Menu Button */}
                <button
                    className="attachment-more-btn"
                    ref={buttonRef}
                    aria-expanded={showMenu}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (buttonRef.current) {
                            const rect = buttonRef.current.getBoundingClientRect();
                            setMenuPosition({ x: rect.right, y: rect.bottom });
                        }
                        setShowMenu(!showMenu);
                    }}
                >
                    <MoreVertical size={16} />
                </button>

                {/* Context Menu */}
                {showMenu && (
                    <ContextMenu
                        isOpen={showMenu}
                        onClose={() => setShowMenu(false)}
                        position={menuPosition}
                    >
                        <MenuItem
                            icon={<Download size={14} />}
                            label="Download"
                            onClick={() => {
                                handleDownload();
                                setShowMenu(false);
                            }}
                        />
                        <MenuItem
                            icon={<Trash2 size={14} />}
                            label="Delete"
                            color="#EF4444"
                            onClick={() => {
                                onDelete();
                                setShowMenu(false);
                            }}
                        />
                    </ContextMenu>
                )}
            </div>

            {showPreview && (
                <ImagePreviewOverlay
                    imageUrl={getUrl()}
                    imageName={attachment.name}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </>
    );
};

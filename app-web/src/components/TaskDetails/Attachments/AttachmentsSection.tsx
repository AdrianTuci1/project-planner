import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import { Paperclip, Plus } from 'lucide-react';
import { AttachmentCard } from './AttachmentCard';

interface AttachmentsSectionProps {
    task: Task;
}

export const AttachmentsSection = observer(({ task }: AttachmentsSectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Mock Upload Process
            setUploading(true);
            setProgress(0);

            let p = 0;
            const interval = setInterval(() => {
                p += 10;
                setProgress(p);
                if (p >= 100) {
                    clearInterval(interval);
                    task.addAttachment(file);
                    setUploading(false);
                }
            }, 100);
        }
    };

    return (
        <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '12px'
            }}>
                <Paperclip size={16} />
                <span>Attachments</span>
            </div>

            {task.attachments.length === 0 ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px dashed var(--border)',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <Plus size={16} /> Click to add attachment
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {task.attachments.map(attachment => (
                        <AttachmentCard
                            key={attachment.id}
                            attachment={attachment}
                            onDelete={() => task.removeAttachment(attachment.id)}
                        />
                    ))}

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: '1px dashed var(--border)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            background: 'transparent',
                            transition: 'background 0.2s',
                            height: '56px' // Match roughly with card height including padding
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--bg-secondary)',
                            borderRadius: '4px'
                        }}>
                            <Plus size={20} color="var(--text-secondary)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Add more</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Max 25 MB</span>
                        </div>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {uploading && (
                <div style={{ marginTop: '8px', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'var(--accent)',
                        transition: 'width 0.1s linear'
                    }} />
                </div>
            )}
        </div>
    );
});

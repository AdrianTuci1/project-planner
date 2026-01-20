import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import { Paperclip, Plus } from 'lucide-react';
import { AttachmentCard } from './AttachmentCard';
import { api } from '../../../services/api';

interface AttachmentsSectionProps {
    task: Task;
}

export const AttachmentsSection = observer(({ task }: AttachmentsSectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // 1. Validation (25MB)
            const MAX_SIZE = 25 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                alert("File is too large. Max 25MB allowed.");
                return;
            }

            setUploading(true);
            setProgress(0);

            try {
                // 2. Get Presigned URL
                const { url, key, publicUrl } = await api.getUploadUrl(file.type, file.name);

                // 3. Upload to S3
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', url, true);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        setProgress(percentComplete);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        // 4. Add to Task
                        task.addAttachment({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            url: publicUrl,
                            key: key
                        });
                        setUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    } else {
                        console.error("Upload failed", xhr.statusText);
                        alert("Upload failed. Please try again.");
                        setUploading(false);
                    }
                };

                xhr.onerror = () => {
                    console.error("Upload error");
                    alert("Upload error. Please check your connection.");
                    setUploading(false);
                };

                xhr.send(file);

            } catch (err) {
                console.error(err);
                alert("Failed to initiate upload.");
                setUploading(false);
            }
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
                            onDelete={async () => {
                                if (window.confirm("Delete this attachment?")) {
                                    if (attachment.key) {
                                        await api.deleteFile(attachment.key);
                                    }
                                    task.removeAttachment(attachment.id);
                                }
                            }}
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

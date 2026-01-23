import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import { Paperclip, Plus } from 'lucide-react';
import { AttachmentCard } from './AttachmentCard';
import { api } from '../../../services/api';
import './AttachmentsSection.css';

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

            // 1. Validation (25MB total per task)
            const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
            const currentTotalSize = task.attachments.reduce((sum, att) => sum + att.size, 0);

            if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
                alert(`Total attachments size exceeds ${MAX_TOTAL_SIZE / (1024 * 1024)}MB. Currently: ${(currentTotalSize / (1024 * 1024)).toFixed(2)}MB.`);
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
        <div className="attachments-section">
            <div className="attachments-header">
                <Paperclip size={16} />
                <span>Attachments</span>
            </div>

            {task.attachments.length === 0 ? (
                <div
                    className="add-attachment-placeholder"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Plus size={16} /> Click to add attachment
                </div>
            ) : (
                <>
                    <div className="attachments-list">
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
                            className="add-attachment-button"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="add-attachment-icon">
                                <Plus size={20} />
                            </div>
                            <div className="add-attachment-text">
                                <span className="add-attachment-primary">Add more</span>
                                <span className="add-attachment-secondary">Max 25 MB</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {uploading && (
                <div className="upload-progress-container">
                    <div
                        className="upload-progress-bar"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
});

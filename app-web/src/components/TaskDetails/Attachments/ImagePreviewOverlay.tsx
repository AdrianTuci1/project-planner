import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, ZoomIn, ZoomOut, Download, ImageOff } from 'lucide-react';

interface ImagePreviewOverlayProps {
    imageUrl: string;
    imageName: string;
    onClose: () => void;
}

export const ImagePreviewOverlay: React.FC<ImagePreviewOverlayProps> = ({ imageUrl, imageName, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = imageName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const content = (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={onClose}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0, 0, 0, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
            {/* Close Button Top Right */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
                style={{ position: 'absolute', top: '16px', right: '16px', padding: '8px', color: 'rgba(255,255,255,0.7)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
                <X size={24} />
            </button>

            {/* Image Container */}
            <div
                className="flex-1 w-full h-full flex items-center justify-center overflow-hidden p-8"
                onClick={(e) => e.stopPropagation()}
                style={{ flex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '32px' }}
            >
                {!imageError ? (
                    <img
                        src={imageUrl}
                        alt={imageName}
                        onError={() => setImageError(true)}
                        style={{
                            transform: `scale(${zoom})`,
                            transition: 'transform 0.2s ease-out',
                            maxWidth: '90%',
                            maxHeight: '85%',
                            objectFit: 'contain',
                            pointerEvents: 'auto'
                        }}
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'rgba(255,255,255,0.5)' }}>
                        <ImageOff size={64} strokeWidth={1} style={{ opacity: 0.5 }} />
                        <span>Preview not available</span>
                    </div>
                )}
            </div>

            {/* Bottom Dock */}
            <div
                className="absolute bottom-8 flex items-center gap-4 px-6 py-3 bg-[#1F2937] rounded-full shadow-lg border border-white/10"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'absolute', bottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', background: '#1F2937', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                <button
                    onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    title="Zoom Out"
                    disabled={imageError}
                    style={{ background: 'transparent', border: 'none', color: imageError ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)', cursor: imageError ? 'not-allowed' : 'pointer', display: 'flex' }}
                >
                    <ZoomOut size={20} />
                </button>
                <span className="text-white/50 text-sm w-12 text-center" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', width: '40px', textAlign: 'center' }}>
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    title="Zoom In"
                    disabled={imageError}
                    style={{ background: 'transparent', border: 'none', color: imageError ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)', cursor: imageError ? 'not-allowed' : 'pointer', display: 'flex' }}
                >
                    <ZoomIn size={20} />
                </button>

                <div className="w-px h-6 bg-white/10" style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                <button
                    onClick={handleDownload}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    title="Download"
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex' }}
                >
                    <Download size={20} />
                </button>

                <div className="w-px h-6 bg-white/10" style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                <button
                    onClick={onClose}
                    className="p-2 text-white/70 hover:text-red-400 transition-colors"
                    title="Close"
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
};

import React from 'react';
import { useCachedImage } from '../../utils/ImageCache';

interface CachedAvatarProps {
    url?: string;
    alt?: string;
    fallback?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    borderRadius?: string | number;
}

export const CachedAvatar: React.FC<CachedAvatarProps> = ({
    url,
    alt = 'Avatar',
    fallback,
    className,
    style,
    borderRadius
}) => {
    const { cachedUrl, isLoading } = useCachedImage(url);

    if (isLoading && !cachedUrl) {
        return (
            <div
                className={className}
                style={{
                    ...style,
                    borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-elevated)',
                    opacity: 0.6
                }}
            >
                {/* Optional: Small spinner or pulse effect */}
            </div>
        );
    }

    if (!cachedUrl) {
        return (
            <div
                className={className}
                style={{
                    ...style,
                    borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {fallback}
            </div>
        );
    }

    return (
        <img
            src={cachedUrl}
            alt={alt}
            className={className}
            style={{
                ...style,
                borderRadius,
                objectFit: 'cover'
            }}
        />
    );
};

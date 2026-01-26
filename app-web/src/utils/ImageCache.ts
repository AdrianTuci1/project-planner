/**
 * Simple image caching utility using the browser's Cache API.
 */

const CACHE_NAME = 'simplu-image-cache-v1';

export const ImageCache = {
    /**
     * Gets a cached image URL or fetches and caches it if not present.
     * Returns a blob URL for the image.
     */
    async getCachedImage(url: string): Promise<string> {
        if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
            return url;
        }

        try {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                const blob = await cachedResponse.blob();
                return URL.createObjectURL(blob);
            }

            // Fetch and cache
            const response = await fetch(url, { mode: 'no-cors' }); // no-cors might be needed for external avatars
            // But if it's no-cors, we can't read the blob easily... 
            // If it's a signed URL from S3 (our app), it should be CORS enabled.

            // Re-fetch with cors for readability if possible
            const corsResponse = await fetch(url);
            if (!corsResponse.ok) throw new Error('Fetch failed');

            const clonedResponse = corsResponse.clone();
            await cache.put(url, clonedResponse);

            const blob = await corsResponse.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.warn('[ImageCache] Caching failed, returning original URL', error);
            return url;
        }
    },

    /**
     * Preloads an array of image URLs.
     */
    async preloadImages(urls: string[]): Promise<void> {
        const cache = await caches.open(CACHE_NAME);
        const promises = urls.map(async (url) => {
            try {
                const match = await cache.match(url);
                if (!match) {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                    }
                }
            } catch (e) {
                console.warn('[ImageCache] Preload failed for', url, e);
            }
        });
        await Promise.all(promises);
    }
};

/**
 * Custom hook for using cached images in React components.
 */
import { useState, useEffect } from 'react';

export const useCachedImage = (url: string | undefined) => {
    const [cachedUrl, setCachedUrl] = useState<string | undefined>(url);
    const [isLoading, setIsLoading] = useState<boolean>(!!url);

    useEffect(() => {
        if (!url) {
            setCachedUrl(undefined);
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        ImageCache.getCachedImage(url).then((resolvedUrl) => {
            if (isMounted) {
                setCachedUrl(resolvedUrl);
                setIsLoading(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [url]);

    return { cachedUrl, isLoading };
};

import { Request, Response } from 'express';
import { StorageService } from '../services/storage.service';
import path from 'path';

const storageService = new StorageService();

export const getPresignedUrl = async (req: Request, res: Response) => {
    try {
        const { contentType, fileName } = req.body;
        if (!contentType || !fileName) {
            return res.status(400).json({ error: "ContentType and FileName are required" });
        }

        const data = await storageService.getUploadUrl(contentType, fileName);
        res.json(data);
    } catch (error: any) {
        console.error("Error generating presigned URL:", error);
        res.status(500).json({ error: error.message || "Failed to generate upload URL" });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        if (!key) {
            return res.status(400).json({ error: "File key is required" });
        }

        await storageService.deleteFile(key);
        res.json({ message: "File deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: error.message || "Failed to delete file" });
    }
};

export const handleLocalUpload = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        if (!key) return res.status(400).json({ error: "Key is required" });

        const buffer = req.body;

        if (!buffer || !(buffer instanceof Buffer) || buffer.length === 0) {
            return res.status(400).json({ error: "Empty or invalid file body. Ensure Content-Type matches or use raw body." });
        }

        await storageService.saveLocalFile(key, buffer);
        res.json({ message: "File uploaded successfully" });
    } catch (error: any) {
        console.error("Local upload error:", error);
        res.status(500).json({ error: "Failed to save file locally" });
    }
};

export const serveLocalFile = async (req: Request, res: Response) => {
    // Deprecated route, redirecting or handle normally?
    // We are replacing this with the unified serveFile logic below or reusing.
    // Let's implement generic serveFile.
    return serveFile(req, res);
};

export const serveFile = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        // Handle "attachments/" prefix if encoded in URL or passed raw
        // If key comes from :key(*), it might be full path.

        const fileStream = await storageService.getFileStream(key);

        res.setHeader('Content-Type', fileStream.contentType);
        if (fileStream.contentLength) {
            res.setHeader('Content-Length', fileStream.contentLength);
        }

        // Handle download query
        if (req.query.download === 'true') {
            // Extract filename from key or query? Key is uuid usually.
            // Ideally we should pass original name, but storage doesn't know it.
            // It's fine, browser handles it or we'd need to store metadata.
            // For now, let's set attachment.
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(key)}"`);
        }

        // Pipe stream
        if (fileStream.stream.pipe) {
            fileStream.stream.pipe(res);
        } else if (fileStream.stream.transformToWebStream) {
            // If web stream (rare in node but possible in V3 mixed envs)
            // But S3 client in Node returns IncomingMessage (readable) usually.
            // For safety with AWS SDK v3:
            const body = fileStream.stream as any;
            body.pipe(res);
        } else {
            // Buffer or other
            res.send(fileStream.stream);
        }

    } catch (error: any) {
        console.error("Serve file error:", error);
        res.status(404).json({ error: "File not found" });
    }
};

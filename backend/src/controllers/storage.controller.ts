import { Request, Response } from 'express';
import { StorageService } from '../services/storage.service';

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

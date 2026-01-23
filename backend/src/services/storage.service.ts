import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export class StorageService {
    private s3Client: S3Client | null = null;
    private bucketName: string;
    private uploadDir: string;
    private isLocal: boolean = false;

    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET || '';
        this.uploadDir = path.join(process.cwd(), 'uploads');

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !this.bucketName) {
            console.warn("[StorageService] S3 not fully configured. Using local storage.");
            this.isLocal = true;
            if (!fs.existsSync(this.uploadDir)) {
                fs.mkdirSync(this.uploadDir, { recursive: true });
            }
        } else {
            this.s3Client = new S3Client({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
                }
            });
        }
    }

    public async getUploadUrl(contentType: string, fileName: string) {
        const extension = fileName.split('.').pop();
        const key = `${uuidv4()}.${extension}`;

        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

        // Always return backend proxy URL for "publicUrl" effectively hiding S3
        // For Local: /api/storage/files/:key
        // For S3: /api/storage/files/:key (Start using this consistency)

        // NOTE: For S3 uploads, we still use presigned PUT url for efficiency if possible, 
        // OR we could proxy upload too. The user said "eliminate routes that sent us to S3". 
        // If they meant for READING, changing publicUrl is enough. 
        // If they meant for WRITING, we should probably keep presigned PUT for performance unless explicitly asked to proxy PUT.
        // Given the context "allow user to access files... I don't need to access bucket", it usually refers to READ permissions.
        // However, to be safe and consistent with "eliminate routes", let's ensure the 'publicUrl' stored in DB is the backend one.

        const proxyUrl = `${baseUrl}/api/storage/files`; // Base for retrieval

        if (this.isLocal) {
            const url = `${baseUrl}/api/storage/upload/${key}`;
            const publicUrl = `${proxyUrl}/${key}`;
            return {
                url,
                key,
                publicUrl
            };
        }

        if (!this.s3Client || !this.bucketName) {
            throw new Error("S3 Client not initialized properly");
        }

        const s3Key = `attachments/${key}`;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            ContentType: contentType
        });

        const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        // CHANGED: No longer returning direct S3 URL. Returning backend proxy URL.
        // The key stored in DB will be 'attachments/uuid.ext'. 
        // The proxy URL needs to handle this encoding or we pass the key.
        // We will return the encoded key in the URL.
        const publicUrl = `${proxyUrl}/${encodeURIComponent(s3Key)}`;

        return {
            url, // Presigned PUT URL (Direct S3 upload) - Keeping this for now as it doesn't require public bucket *access* (only signed)
            key: s3Key,
            publicUrl
        };
    }

    public async getFileStream(key: string): Promise<{ stream: any, contentType: string, contentLength?: number }> {
        if (this.isLocal) {
            const filePath = path.join(this.uploadDir, key);
            if (!fs.existsSync(filePath)) {
                throw new Error("File not found");
            }
            const stat = fs.statSync(filePath);
            const stream = fs.createReadStream(filePath);
            // Try to guess content type or default
            return { stream, contentType: 'application/octet-stream', contentLength: stat.size };
        }

        if (!this.s3Client || !this.bucketName) {
            throw new Error("S3 Config missing");
        }

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        try {
            const response = await this.s3Client.send(command);
            return {
                stream: response.Body,
                contentType: response.ContentType || 'application/octet-stream',
                contentLength: response.ContentLength
            };
        } catch (error) {
            console.error("S3 Get Error:", error);
            throw new Error("File not found or access denied");
        }
    }

    public async saveLocalFile(key: string, buffer: Buffer) {
        const filePath = path.join(this.uploadDir, key);
        fs.writeFileSync(filePath, buffer);
    }

    public getLocalFilePath(key: string) {
        // Deprecated in favor of getFileStream for consistency, but keeping for now
        const filePath = path.join(this.uploadDir, key);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
        return null;
    }

    public async deleteFile(key: string) {
        if (this.isLocal) {
            const filePath = path.join(this.uploadDir, key);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return;
        }

        if (!this.s3Client || !this.bucketName) return;

        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        await this.s3Client.send(command);
    }
}

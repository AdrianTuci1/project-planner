import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        this.bucketName = process.env.AWS_S3_BUCKET || '';
    }

    public async getUploadUrl(contentType: string, fileName: string) {
        if (!this.bucketName) {
            throw new Error("AWS_S3_BUCKET is not configured");
        }

        const extension = fileName.split('.').pop();
        const key = `attachments/${uuidv4()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType
        });

        const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        const publicUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        return {
            url,
            key,
            publicUrl
        };
    }

    public async deleteFile(key: string) {
        if (!this.bucketName) {
            throw new Error("AWS_S3_BUCKET is not configured");
        }

        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        await this.s3Client.send(command);
    }
}

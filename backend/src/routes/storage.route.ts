import express, { Router } from 'express';
import { getPresignedUrl, deleteFile, handleLocalUpload, serveLocalFile } from '../controllers/storage.controller';
import { Routes } from './routes.interface';

export class StorageRoute implements Routes {
    public path = '/storage';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/presigned-url`, getPresignedUrl);
        this.router.put(
            `${this.path}/upload/:key`,
            express.raw({ type: '*/*', limit: '25mb' }),
            handleLocalUpload
        );
        this.router.get(`${this.path}/files/:key(*)`, serveLocalFile); // Modified to use unified serveFile logic via wrapper
        this.router.delete(`${this.path}/files/:key(*)`, deleteFile); // (*) allows slashes in key
    }
}

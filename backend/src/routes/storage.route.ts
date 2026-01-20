import { Router } from 'express';
import { getPresignedUrl, deleteFile } from '../controllers/storage.controller';
import { Routes } from './routes.interface';

export class StorageRoute implements Routes {
    public path = '/api/storage';
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/presigned-url`, getPresignedUrl);
        this.router.delete(`${this.path}/files/:key(*)`, deleteFile); // (*) allows slashes in key
    }
}

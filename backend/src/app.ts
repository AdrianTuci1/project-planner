import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { Routes } from './routes/routes.interface';
import { helmetConfig, corsConfig } from './config/security.config';

dotenv.config();

export class App {
    public app: Application;
    public port: number;

    constructor(routes: Routes[], port: number) {
        this.app = express();
        this.port = port;

        this.initializeMiddlewares();
        this.initializeRoutes(routes);
    }

    private initializeMiddlewares() {
        this.app.use(helmet(helmetConfig));
        this.app.use(cors(corsConfig));
        this.app.use(morgan('dev'));
        this.app.use(express.json({
            limit: '25mb',
            verify: (req: any, res, buf) => {
                req.rawBody = buf;
            }
        }));
        this.app.use(express.urlencoded({ limit: '25mb', extended: true }));

        // Serve API Documentation
        const docsPath = path.join(__dirname, '../api-documentation');
        this.app.use('/docs', express.static(docsPath));
        this.app.get('/docs', (req, res) => {
            res.sendFile(path.join(docsPath, 'index.html'));
        });
    }

    private initializeRoutes(routes: Routes[]) {
        routes.forEach((route) => {
            this.app.use('/api', route.router);
        });
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`Server started! App listening on the port ${this.port}`);
        });
    }
}

import { NextFunction, Request, Response } from 'express';

export function errorMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';
    console.error(error);
    res.status(status).send({
        status,
        message,
    });
}

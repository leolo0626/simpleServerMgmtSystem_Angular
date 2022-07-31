import { Server } from './server';

export interface CustomResponse {
    timeStamp: Date;
    statusCode : Number;
    status: string;
    reason: string;
    message: string;
    developerMessage: string;
    data: { servers?: Server[], server?: Server };
}
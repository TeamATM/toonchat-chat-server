import { Request } from "express";

export interface RequestWrapper extends Request {
    data: {
        userId: string;
        remoteAddress: string;
    }
}

import { Request } from "express";
import { Socket } from "socket.io";

export function generateRandomId() : string {
    return Math.random().toString(36).substring(2, 10);
}

export function getCurrentDate(today: Date) {
    const startDay = new Date(today);
    startDay.setHours(0, 0, 0, 0);
    return startDay;
}

export function getClientIpAddress(req: Request | Socket) {
    return req.data.remoteAddress || (req as Request).ip || (req as Socket).handshake.address;
}

export function getHeaders(target: Socket | Request) {
    return (target as Request).headers || (target as Socket).handshake.headers;
}

export function getHeader(target: Socket | Request, headerName: string) {
    return getHeaders(target)[headerName];
}

export function getIpAddress(target: Socket | Request) {
    return (target as Request).ip || (target as Socket).handshake.address;
}

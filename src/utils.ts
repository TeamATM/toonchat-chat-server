/* eslint-disable no-param-reassign */
import assert from "assert";
import { Request } from "express";
import { logger } from "./logging/logger";
import { TypeSocket } from "./types";

export const url = "https://api.openai.com/v1/embeddings";
export const openaiKey = process.env.OPENAI_API_KEY;

assert(openaiKey);

export function generateRandomId() : string {
    return Math.random().toString(36).substring(2, 10);
}

export function getCurrentDate(today: Date) {
    const startDay = new Date(today);
    startDay.setHours(0, 0, 0, 0);
    return startDay;
}

export function getClientIpAddress(req: Request | TypeSocket) {
    if (!req.data.remoteAddress) {
        setIpAddress(req);
    }
    return req.data.remoteAddress;
}

export function setIpAddress(req: Request | TypeSocket) {
    if (!req.data) {
        req.data = { userId: "", remoteAddress: "" };
    }
    const clientIpAddress = getHeader(req, "x-forwarded-for");
    if (clientIpAddress) {
        req.data.remoteAddress = Array.isArray(clientIpAddress) ? clientIpAddress.join(" ") : clientIpAddress;
    } else {
        logger.warn({ headers: getHeaders(req) }, "Can not find x-forwarded-for header in request");
        req.data.remoteAddress = getIpAddress(req);
    }
}

function getHeaders(target: TypeSocket | Request) {
    if ("headers" in target) {
        return target.headers;
    }
    if ("handshake" in target) {
        return target.handshake.headers;
    }
    throw new TypeError("type of target is not TypeSocket or Request");
}

function getHeader(target: TypeSocket | Request, headerName: string) {
    if ("headers" in target) {
        return target.headers[headerName];
    }
    if ("handshake" in target) {
        return target.handshake.headers[headerName];
    }
    throw new TypeError("type of target is not TypeSocket or Request");
}

function getIpAddress(target: TypeSocket | Request) {
    if ("ip" in target) {
        return target.ip;
    }
    if ("handshake" in target) {
        return target.handshake.address;
    }
    throw new TypeError("type of target is not TypeSocket or Request");
}

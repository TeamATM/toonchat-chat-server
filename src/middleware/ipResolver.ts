import { RequestHandler } from "express";
import { TypeSocket } from "../types";
import { setIpAddress } from "../utils";

// eslint-disable-next-line no-unused-vars
export const resolveSocketIpAddress = (socket:TypeSocket, next: (err?: Error) => void) => {
    setIpAddress(socket);
    next();
};

export const resolveRequestIpAddress:RequestHandler = (req, res, next) => {
    setIpAddress(req);
    next();
};

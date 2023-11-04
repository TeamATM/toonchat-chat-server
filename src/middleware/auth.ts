/* eslint-disable no-param-reassign */
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Request, RequestHandler } from "express";
import { validateAndDecodeJwtToken } from "../jwt";
import { TypeSocket } from "../types";
import { logger } from "../config";
import { getClientIpAddress } from "../utils";

function handleError(err:Error|unknown, remoteAddr?:string|string[]) {
    if (err instanceof Error) {
        if (err instanceof TokenExpiredError) {
            // TODO: Do something
        }

        logger.warn({ remoteHost: remoteAddr }, `Authentication failed: ${err.message}`);
    } else {
        logger.warn({ remoteHost: remoteAddr }, `Authentication failed: ${err}`);
    }
}

function handleAuthentication(token: string, target: TypeSocket | Request): void {
    const decodedToken = validateAndDecodeJwtToken(token);
    if (typeof decodedToken.sub !== "string") {
        throw new JsonWebTokenError("Subject field is not defined");
    }
    target.data.userId = decodedToken.sub;
}

// eslint-disable-next-line no-unused-vars
export const authenticateSocket = (socket:TypeSocket, next: (err?: Error) => void) => {
    const { token } = socket.handshake.auth;

    try {
        handleAuthentication(token, socket);
        next();
    } catch (err) {
        handleError(err, getClientIpAddress(socket));
        socket.disconnect(true);
        next(new Error("Authentication failed"));
    }
};

export const authenticateRequest:RequestHandler = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN" 형태
        handleAuthentication(token!, req);
        next();
    } catch (err) {
        handleError(err, getClientIpAddress(req));
        res.sendStatus(401); // 인증 정보 없음
    }
};

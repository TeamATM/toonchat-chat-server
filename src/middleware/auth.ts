/* eslint-disable no-param-reassign */
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { RequestHandler } from "express";
import { validateAndDecodeJwtToken } from "../jwt";
import { TypeSocket } from "../socket";
import logger from "../logger";
import { getRemoteHost } from "../utils";

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

// eslint-disable-next-line no-unused-vars
export const authenticateSocket = (socket:TypeSocket, next: (err?: Error) => void) => {
    const { token } = socket.handshake.auth;

    try {
        const decodedToken = validateAndDecodeJwtToken(token);
        if (typeof decodedToken.sub !== "string") {
            throw new JsonWebTokenError("Subject field is not defined");
        }
        socket.data.username = decodedToken.sub;
        next();
    } catch (err) {
        handleError(err, getRemoteHost(socket));
        socket.disconnect(true);
        next(new Error("Authentication failed"));
    }
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        export interface Request {
            userId?: string;
        }
    }
}

export const authenticateRequest:RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(" ")[1]; // "Bearer TOKEN" 형태

        try {
            const decodedToken = validateAndDecodeJwtToken(token);
            if (typeof decodedToken.sub !== "string") {
                throw new JsonWebTokenError("Subject field is not defined");
            }

            req.userId = decodedToken.sub;
            next();
        } catch (err) {
            handleError(err, getRemoteHost(req));
            res.sendStatus(401); // 인증 정보 없음
        }
    } else {
        res.sendStatus(401); // 인증 정보 없음
    }
};

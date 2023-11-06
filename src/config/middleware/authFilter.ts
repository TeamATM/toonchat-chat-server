/* eslint-disable no-param-reassign */
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Inject, Service } from "typedi";
import { RequestHandler } from "express";
import { Socket } from "socket.io";
import { JwtUtil } from "../../jwt";
import { SocketRequestHandler, RequestWrapper, Filter } from "../../types";
import { logger } from "..";
import { getClientIpAddress } from "../../utils";

@Service()
export class AuthenticationFilter implements Filter {
    // eslint-disable-next-line no-useless-constructor
    @Inject()
    private jwtUtil:JwtUtil;

    doFilter:RequestHandler = (req, res, next) => {
        if (req.path === "/health") {
            next();
            return;
        }
        try {
            const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN" 형태
            this.handleAuthentication(token!, req);
            next();
        } catch (err) {
            handleError(err, getClientIpAddress(req));
            res.sendStatus(401); // 인증 정보 없음
        }
    };

    doSocketFilter:SocketRequestHandler = (socket, next) => {
        const { token } = socket.handshake.auth;

        try {
            this.handleAuthentication(token, socket);
            next();
        } catch (err) {
            handleError(err, getClientIpAddress(socket));
            socket.disconnect(true);
            next(new Error("Authentication failed"));
        }
    };

    private handleAuthentication = (token: string, target: Socket | RequestWrapper): void => {
        const decodedToken = this.jwtUtil.validateAndDecodeJwtToken(token);
        if (typeof decodedToken.sub !== "string") {
            throw new JsonWebTokenError("Subject field is not defined");
        }
        target.data.userId = decodedToken.sub;
    };
}

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

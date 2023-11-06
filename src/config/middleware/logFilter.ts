import { RequestHandler } from "express";
import { Service } from "typedi";
import { logger } from "..";
import { getClientIpAddress } from "../../utils";
import { SocketRequestHandler, Filter } from "../../types";

@Service()
export class LogFilter implements Filter {
    doFilter:RequestHandler = (req, res, next) => {
        if (req.path === "/health") {
            next();
            return;
        }

        const {
            method, url, params, query, body,
        } = req;

        next();

        logger.info({
            method, url, params, query, body, remoteHost: getClientIpAddress(req), statusCode: res.statusCode,
        });
    };

    doSocketFilter: SocketRequestHandler;
}

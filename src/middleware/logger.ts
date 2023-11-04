import { RequestHandler } from "express";
import { logger } from "../logging";
import { getClientIpAddress } from "../utils";

export const httpLogger:RequestHandler = (req, res, next) => {
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

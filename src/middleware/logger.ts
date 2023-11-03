import { RequestHandler } from "express";
import logger from "../logging/logger";
import { getRemoteHost } from "../utils";

// eslint-disable-next-line import/prefer-default-export
export const loggerMiddleware:RequestHandler = (req, res, next) => {
    if (req.path === "/health") {
        next();
        return;
    }

    const {
        method, url, params, query, body,
    } = req;

    next();

    logger.info({
        method, url, params, query, body, remoteHost: getRemoteHost(req), statusCode: res.statusCode,
    });
};

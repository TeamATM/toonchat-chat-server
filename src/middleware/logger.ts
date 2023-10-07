import { RequestHandler } from "express";
import logger from "../logger";
import { getRemoteHost } from "../utils";

const loggerMiddleware:RequestHandler = (req, res, next) => {
    if (req.path === "/health") {
        next();
        return;
    }

    const {
        method, url, params, query, body,
    } = req;

    logger.info({
        method, url, params, query, body, remoteHost: getRemoteHost(req),
    });

    next();
};

export default loggerMiddleware;

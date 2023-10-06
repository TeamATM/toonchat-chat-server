import { RequestHandler } from "express";
import logger from "../logger";

const loggerMiddleware:RequestHandler = (req, res, next) => {
    const {
        method, url, params, query, body,
    } = req;

    logger.info({
        method, url, params, query, body, remoteHost: req.ip,
    });

    next();
};

export default loggerMiddleware;

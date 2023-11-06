import { Service } from "typedi";
import { Response, NextFunction } from "express";
import { Socket } from "socket.io";
import {
    SocketRequestHandler,
    RequestWrapper, Filter,
} from "../../types";
import { getHeader, getHeaders, getIpAddress } from "../../utils";
import { logger } from "..";

@Service()
export class IpResolveFilter implements Filter {
    doFilter = (req: RequestWrapper, res: Response, next: NextFunction) => {
        this.setIpAddress(req);
        next();
    };

    doSocketFilter:SocketRequestHandler = (socket, next) => {
        this.setIpAddress(socket);
        next();
    };

    private setIpAddress = (req: RequestWrapper | Socket) => {
        if (!req.data) {
            req.data = { userId: "", remoteAddress: "" };
        }
        const clientIpAddress = getHeader(req, "x-forwarded-for");
        if (clientIpAddress) {
            req.data.remoteAddress = Array.isArray(clientIpAddress) ? clientIpAddress[0] : clientIpAddress;
        } else {
            logger.warn({ headers: getHeaders(req) }, "Can not find x-forwarded-for header in request");
            req.data.remoteAddress = getIpAddress(req);
        }
    };
}

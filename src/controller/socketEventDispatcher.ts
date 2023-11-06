import { Service } from "typedi";
import { Socket } from "socket.io";
import { logger } from "../config";
import { CustomErrorError, CustomWarnError } from "../exceptions";
import { ChatFromClient, FucntionMap, EventFunction } from "../types";

@Service()
export class SocketEventDispatcher {
    eventMap: FucntionMap = {};

    public handleEvent = async (ev:string, socket:Socket, ...args: (string | ChatFromClient | undefined)[]) => {
        if (ev in this.eventMap === false) {
            logger.error({ ev }, "No event handler exist");
            return;
        }

        this.eventMap[ev](socket, ...args)
            .catch((err) => this.handleError(err, socket, args));
    };

    registEvent = (event: string, fn:EventFunction) => {
        logger.debug({ event }, "socket event register");
        this.eventMap[event] = fn;
    };

    private handleError(err: unknown, socket:Socket, args: (string | ChatFromClient | undefined)[]) {
        if (err instanceof CustomWarnError) {
            logger.warn({ userId: socket.data.userId, args }, err.message);
            throw err;
        } else if (err instanceof CustomErrorError) {
            logger.error(err, err.message);
            throw err;
        } else {
            logger.fatal(err, "Unhandled Exception while processing function handleOnPublishMessage.");
            socket.disconnect(true);
        }
    }
}

/* eslint-disable no-unused-vars */
import { Service } from "typedi";
import { Socket } from "socket.io";
import { TypeServer, Filter } from "./types";
import { SocketEventDispatcher } from "./controller/socketEventDispatcher";
import { CustomError } from "./exceptions";
import { logger } from "./config";
import { ChatRoomService } from "./service";

@Service()
export class SocketServer {
    constructor(
        private socketEventDispatcher:SocketEventDispatcher,
        private chatRoomService:ChatRoomService,
        private socketServer:TypeServer,
        ...filters:Array<Filter>
    ) {
        this.configureSocket(filters);
    }

    private configureSocket = (filters:Array<Filter>) => {
        filters.forEach((filter) => {
            logger.debug({ filter }, "socket filter registered");
            this.socketServer.use(filter.doSocketFilter);
        });
        this.socketServer.on("connection", this.handleConnection);
    };

    private handleConnection = async (socket: Socket) => {
        this.socketEventDispatcher.handleEvent("connect", socket)
            .catch((err) => {
                if (err instanceof CustomError) {
                    this.chatRoomService.sendEventToRoom(socket.data.userId, "error", { content: err.message });
                }
            });

        socket.onAny((event, ...args) => {
            this.socketEventDispatcher.handleEvent(event, socket, ...args)
                .catch((err) => {
                    if (err instanceof CustomError) {
                        this.chatRoomService.sendEventToRoom(socket.data.userId, "error", { content: err.message });
                    }
                });
        });

        socket.on("disconnecting", () => this.socketEventDispatcher.handleEvent("disconnect", socket));
    };
}

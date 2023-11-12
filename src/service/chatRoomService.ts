import { Inject, Service } from "typedi";
import { logger } from "../config";
import { ErrorToClient, ChatToClient, TypeServer } from "../types";

@Service()
export class ChatRoomService {
    private roomConsumerTag = new Map<string, string>();

    @Inject()
    private socketServer:TypeServer;

    public isRoomExist = (roomName: string) => this.roomConsumerTag.has(roomName);

    public getConsumerTag = (roomName: string) => this.roomConsumerTag.get(roomName);

    public updateConsumerTag = (roomName:string, consumerTag:string) => this.roomConsumerTag.set(roomName, consumerTag);

    public deleteConsumerTag = (roomName: string) => this.roomConsumerTag.delete(roomName);

    public getUserCountInRoom = (roomName: string) => {
        const userCount = this.socketServer.sockets.adapter.rooms.get(roomName)?.size;
        logger.debug({ roomName, userCount }, "Count of user in room");
        return userCount;
    };

    public sendEventToRoom = (
        roomName: string,
        eventName: "subscribe" | "error",
        message: ChatToClient | ErrorToClient,
    ) => {
        logger.info({ roomName, message }, "Send event to room");
        return this.socketServer.in(roomName).emit(eventName, message);
    };
}

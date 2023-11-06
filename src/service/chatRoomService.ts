import { Inject, Service } from "typedi";
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

    public getUserCountInRoom = (roomName: string) => this.socketServer.sockets.adapter.rooms.get(roomName)?.size;

    public sendEventToRoom = (
        roomName: string,
        eventName: "subscribe" | "error",
        message: ChatToClient | ErrorToClient,
    ) => this.socketServer.to(roomName).emit(eventName, message);
}

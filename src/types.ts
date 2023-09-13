/* eslint-disable no-unused-vars */
import { Socket } from "socket.io";
import { Chat } from "./message_queue/types";

export interface MessageFromClient {
    content: string,
    characterId: number,
}

export interface MessageToClient extends Chat {
    messageId: string;
    characterId: number;
    createdAt: Date;
}

export interface ServerToClientEvents {
    subscribe: (message: MessageToClient) => void;
}

export interface ClientToServerEvents {
    publish: (message: MessageFromClient) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    username: string;
    role: string;
    consumerTag: string;
}

export type TypeSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>

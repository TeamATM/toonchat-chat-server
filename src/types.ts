/* eslint-disable no-unused-vars */
import { Server, Socket } from "socket.io";
import { Chat, MessageFromMQ } from "./message_queue/types";

export interface MessageFromClient {
    content: string,
    characterId: number,
}

export interface MessageToClient extends Chat {
    messageId: string;
    characterId: number;
    createdAt: Date;
    /**
     * Chat 내용
     * conent: string,
     * fromUser: boolean,
     */
}

export interface ErrorToClient {
    content: string;
}

export interface ServerToClientEvents {
    subscribe: (message: MessageToClient) => void;
    error: (message: ErrorToClient) => void;
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

export class TypeServer
    extends Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {}

export type SubscribeProcessType = (message:MessageFromMQ) => Promise<boolean>;

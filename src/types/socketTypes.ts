import { Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from ".";

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    userId: string;
    role: string;
    consumerTag: string;
    remoteAddress: string;
}

export type TypeSocket = Socket<
    ClientToServerEvents, ServerToClientEvents,
    InterServerEvents, SocketData
>;

import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import {
    ClientToServerEvents, InterServerEvents,
    ServerToClientEvents, SocketData,
} from ".";

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
export type EventFunction = (socket: Socket, ...args: any) => Promise<void>;
export type FucntionMap = {
    [key: string]: EventFunction;
};
export type SocketRequestHandler = (
    // eslint-disable-next-line no-unused-vars
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    // eslint-disable-next-line no-unused-vars
    next: (err?: ExtendedError | undefined) => void,
) => void;

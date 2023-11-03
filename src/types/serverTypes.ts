import { Server } from "socket.io";
import {
    ClientToServerEvents, ServerToClientEvents,
    InterServerEvents, SocketData,
} from ".";

export class TypeServer
    extends Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
}

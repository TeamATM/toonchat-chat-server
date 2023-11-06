import Container from "typedi";
import { ChatRoomService } from "../service";
import { SocketServer } from "../socketServer";
import { AuthenticationFilter, IpResolveFilter } from "../config/middleware";
import { SocketEventDispatcher } from "../controller/socketEventDispatcher";
import { Server } from "../server";
import { TypeServer } from "../types";

Container.get(Server);
Container.set(SocketServer, new SocketServer(
    Container.get(SocketEventDispatcher),
    Container.get(ChatRoomService),
    Container.get(TypeServer),
    Container.get(IpResolveFilter),
    Container.get(AuthenticationFilter),
));

import("../controller");

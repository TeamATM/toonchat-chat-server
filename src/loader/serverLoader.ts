import express from "express";
import http from "http";
import Container from "typedi";
import { TypeServer } from "../types";
import { EnvConfig } from "../config/config";

const app = express();
const httpServer = http.createServer(app);
const socketServer = new TypeServer(httpServer, {
    path: "/ws",
    cors: {
        origin: Container.get(EnvConfig).corsAllowOrigin,
    },
    serveClient: false,
    // transports: ['websocket'],
});

Container.set("app", app);
Container.set(http.Server, httpServer);
Container.set(TypeServer, socketServer);

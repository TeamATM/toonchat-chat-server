/* eslint-disable no-param-reassign */
import cors from "cors";
import helmet from "helmet";
import http from "http";
import express from "express";
import { logger } from "./config";
import { subscribe, unsubscribe } from "./message_queue";
import { handleOnPublishMessage, subscribeMessageQueue } from "./controller/socket";
import { connectToMongo } from "./mongo";
import { chatRouter } from "./controller/routes";
import {
    authenticateSocket, authenticateRequest, httpLogger,
    resolveSocketIpAddress, resolveRequestIpAddress,
} from "./middleware";
import {
    MessageFromClient, TypeServer, TypeSocket,
} from "./types";
import { CustomWarnError, CustomErrorError } from "./exceptions/exception";
import { generateRandomId, getClientIpAddress } from "./utils";
import { onMessageToDefaultListener, onCharacterUpdateMessageRecieved } from "./message_queue/eventListener";

export default function initServer() {
    const port = process.env.PORT || 3000;
    const corsOrigin = process.env.CORS_ALLOW_ORIGIN || "http://localhost:3000";
    logger.info(`allowed cors origin: ${corsOrigin}`);

    const app = express();

    app.use(helmet({ hsts: true, frameguard: true, xXssProtection: true }), cors({
        origin: corsOrigin,
    }), resolveRequestIpAddress, httpLogger);

    app.use("/chat", authenticateRequest, chatRouter);
    app.get("/health", (_, res) => res.status(200).send("ok"));

    const server = http.createServer(app);
    server.listen(port, () => { logger.info(`Server is running on port ${port}`); });

    const io = new TypeServer(server, {
        path: "/ws",
        cors: {
            origin: corsOrigin,
        },
        serveClient: false,
        // transports: ['websocket'],
    });

    // middleware로 토큰 검증
    io.use(resolveSocketIpAddress);
    io.use(authenticateSocket);
    io.on("connection", handleConnection);

    connectToMongo();
    subscribe("defaultListener", "#", { durable: true, autoDelete: false }, onMessageToDefaultListener);
    subscribe(
        "characterEventListener",
        "characterUpdate",
        { durable: true, autoDelete: false },
        onCharacterUpdateMessageRecieved,
        "toonchatEvent",
    );
}

async function handleConnection(socket: TypeSocket) {
    socket.data.userId ??= `anonymous_${generateRandomId()}`;
    socket.data.remoteAddress = getClientIpAddress(socket);

    logger.info({ connection: "connected", remoteHost: socket.data.remoteAddress });

    try {
        await subscribeMessageQueue(socket);
    } catch (err) {
        logger.fatal({ err, ...socket.data }, "failed to subscribe message queue");
        socket.disconnect(true);
        return;
    }

    socket.on("publish", (data: MessageFromClient) => {
        try {
            handleOnPublishMessage(socket, data);
        } catch (err) {
            if (err instanceof CustomWarnError) {
                logger.warn({ userId: socket.data.userId, content: data.content }, err.message);
                socket.emit("error", { content: err.message });
            } else if (err instanceof CustomErrorError) {
                logger.error(err, err.message);
                socket.emit("error", { content: err.message });
            } else {
                logger.fatal(err, "Unhandled Exception while processing function handleOnPublishMessage.");
                socket.disconnect(true);
            }
        }
    });

    socket.on("disconnect", () => {
        // 소켓 연결 해제시 구독 취소
        unsubscribe(socket.data.consumerTag);
        logger.info({ connection: "disconnected", remoteHost: socket.data.remoteAddress });
    });
}

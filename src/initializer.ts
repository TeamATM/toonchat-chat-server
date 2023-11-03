import cors from "cors";
import helmet from "helmet";
import http from "http";
import express from "express";
import { logger } from "./logging/logger";
import { buildBotMessage, subscribeCharacterUpdateMessage, subscribeChatMessage } from "./message_queue";
import { authenticateSocket, authenticateRequest, loggerMiddleware } from "./middleware";
import { Message, MessageFromInferenceServer, TypeServer } from "./types";
import { updateHistory, updateMessage } from "./service";
import { handleConnection } from "./socket";
import { connectToMongo } from "./mongo";
import { chatRouter } from "./routes";

async function onMessageToDefaultListener(message: MessageFromInferenceServer) {
    if (message.fromUser === false && updateBotMessageAndHistory(message) === undefined) return false;
    return true;
}

async function updateBotMessageAndHistory(messageFromMQ: MessageFromInferenceServer) {
    const msg: Message = buildBotMessage(messageFromMQ.content, messageFromMQ.messageId);

    logger.debug(messageFromMQ);

    try {
        updateMessage(messageFromMQ.userId, messageFromMQ.characterId, msg);
        return updateHistory(messageFromMQ.userId, messageFromMQ.characterId, msg);
    } catch (err) {
        logger.error(err, "failed to update bot message.");
        return undefined;
    }
}

export default function initServer() {
    const port = process.env.PORT || 3000;
    const corsOrigin = process.env.CORS_ALLOW_ORIGIN || "http://localhost:3000";
    logger.info(`allowed cors origin: ${corsOrigin}`);

    const app = express();

    app.use(helmet({ hsts: true, frameguard: true, xXssProtection: true }), cors({
        origin: corsOrigin,
    }), loggerMiddleware);

    app.use("/chat", authenticateRequest, chatRouter);
    app.get("/health", (req, res) => res.status(200).send("ok"));

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
    io.use(authenticateSocket);
    io.on("connection", handleConnection);

    connectToMongo();

    subscribeChatMessage("defaultListener", "#", { durable: true, autoDelete: false }, onMessageToDefaultListener)
        .catch((err) => logger.fatal(err, "failed to subscribe defaultQueue"));

    subscribeCharacterUpdateMessage(
        "characterEventListener",
        "characterUpdate",
        { durable: true, autoDelete: false },
        "toonchatEvent",
    ).catch((err) => logger.fatal(err, "failed to subscribe event"));
}

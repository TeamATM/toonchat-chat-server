/* eslint-disable no-param-reassign */
import express from "express";
import http from "http";

import "./config";
import cors from "cors";
import { subscribe } from "./message_queue/broker";
import { authenticateSocket, authenticateRequest } from "./middleware/auth";
import { connectToMongo, saveBotMessage } from "./mongo/mongodb";
import { TypeServer } from "./types";
import router from "./chat/chatRouter";
import { handleConnection } from "./socket/handler";
import logger from "./logger";
import loggingMiddleware from "./middleware/logger";

const port = process.env.PORT || 3000;

const app = express();
const corsOrigin = process.env.CORS_ALLOW_ORIGIN || "http://localhost:3000";
app.use(cors({
    origin: corsOrigin,
}), loggingMiddleware);
logger.info(`allowed cors origin: ${corsOrigin}`);
// app.use(loggingMiddleware);
app.use("/chat", authenticateRequest, router);
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

connectToMongo();

subscribe("defaultListener", "#", { durable: true, autoDelete: false }, async (msg) => saveBotMessage(msg)
    .then(() => true)
    .catch((err) => {
        logger.error(err, `failed to save message:\n${msg}`);
        return false;
    }))
    .catch((err) => logger.fatal(err, "failed to subscribe defaultQueue"));

// middleware로 토큰 검증
io.use(authenticateSocket);
io.on("connection", handleConnection);

/* eslint-disable no-param-reassign */
import express from "express";
import http from "http";
import { Server } from "socket.io";

import "./config";
import {
    publish, sub, unsubscribe,
} from "./message_queue/broker";
import * as auth from "./middleware/auth";
import {
    connectToMongo, getChatHistory, saveBotMessage, saveUserMessage,
} from "./mongo/mongodb";
import { existMessageInProcess } from "./redis/redis";
import {
    ClientToServerEvents,
    InterServerEvents,
    MessageFromClient,
    ServerToClientEvents,
    SocketData,
    TypeSocket,
} from "./types";
import { generateRandomId } from "./utils";
import { buildMessage } from "./message_queue/util";

const maxMessageLength = 100;
const port = process.env.PORT || 3000;

const server = http.createServer(express());
server.listen(port, () => { console.log(`Server is running on port ${port}`); });

const io = new Server<
ClientToServerEvents,
ServerToClientEvents,
InterServerEvents,
SocketData
>(server, {
    path: "/ws",
    cors: {
        origin: [process.env.CORS_ALLOW_ORIGIN || "http://localhost:3000"],
    },
    serveClient: false,
    // transports: ['websocket'],
});

connectToMongo();

// async function tmp(msg:MessageFromMQ) {
//     return saveBotMessage(msg)
//         .then(() => true)
//         .catch(() => false);
// }

sub("defaultListener", { durable: true, autoDelete: false }, async (msg) => saveBotMessage(msg).then(() => true).catch((err) => { console.error(err); return false; }));
// middleware로 토큰 검증
io.use(auth.default);

io.on("connection", async (socket:TypeSocket) => {
    if (!socket.data.username) socket.data.username = `anonymous_${generateRandomId()}`;

    console.log(`User ${socket.data.username} connected`);

    // 구독 && 구독 취소를 위한 정보 저장
    const consumerTag = await sub(`${socket.data.username}_${generateRandomId()}`, { durable: false, autoDelete: true }, async (msg) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { userId, ...messageToClient } = msg;
        return socket.emit("subscribe", messageToClient);
    });
    socket.data.consumerTag = consumerTag;

    socket.on("publish", (data: MessageFromClient) => {
        const { username } = socket.data;

        // 글자수 제한
        if (!data.content || data.content.length > maxMessageLength) {
            socket.emit("error", { content: `Message is empty or too long\nsender: ${username}\nmessage: ${data.content}` });
            console.error(`Message length exceeded from user: ${username}, message: ${data.content}`);
            return;
        }

        // 한 계정당 동시 요청 가능 개수 제한
        if (existMessageInProcess(username)) {
            socket.emit("error", { content: "아직 처리중인 메시지가 있습니다. 이전 요청이 처리된 이후에 다시 시도하세요" });
            console.error(`Too many requests from user: ${username}`);
            return;
        }

        // 몽고디비 연결해서 메시지 저장 & 이전 대화내역 가져오기 => 메시지큐 전달
        Promise.all([
            saveUserMessage(username, data.characterId, data.content),
            getChatHistory(username, data.characterId),
        ]).then((result) => {
            const [message, history] = result;

            console.log(`Message from ${username}: ${message.content}`);
            // ACK를 위한 pub
            publish("amq.topic", username, buildMessage(message));
            // 추론을 위한 pub
            publish("celery", "celery", buildMessage(message, history));
        }).catch(console.error);
    });

    socket.on("disconnect", () => {
        // 소켓 연결 해제시 구독 취소
        unsubscribe(socket.data.consumerTag);
        console.log(`User ${socket.data.username} disconnected`);
    });
});

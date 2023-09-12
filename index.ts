import express from "express";
import http from "http";
import { Server } from "socket.io";
import { publish, subscribe, unsubscribe } from "./broker";
import { authenticateSocket } from "./middleware/auth";
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, TypeSocket } from "./types";
import { generateRandomId } from "./utils";
import { existMessageInProcess } from "./redis";

const maxMessageLength = 100;
const port = process.env.PORT || 3000;

const server = http.createServer(express());
server.listen(port, () => { console.log(`Server is running on port ${port}`) });

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> (server, {
    path: "/ws",
    cors: {
        origin: [process.env.CORS_ALLOW_ORIGIN || "http://localhost:3000"]
    },
    serveClient: false,
    // transports: ['websocket'],
});

// middleware로 토큰 검증
io.use(authenticateSocket);

io.on("connection", async (socket:TypeSocket) => {
    if (!socket.data.username) socket.data.username = `anonymous_${generateRandomId()}`;

    console.log(`User ${socket.data.username} connected`);

    // 구독 && 구독 취소를 위한 정보 저장
    const consumerTag = await subscribe(socket);
    socket.data.consumerTag = consumerTag;

    socket.on("publish", (msg:string) => {
        const username = socket.data.username;
        
        // 글자수 제한
        if (!msg || msg.length > maxMessageLength) {
            console.error(`Message is empty or too long\nsender: ${username}\nmessage: ${msg}`);
            return
        }

        // 한 계정당 동시 요청 가능 개수 제한
        if (existMessageInProcess(username)) {
            console.error("아직 처리중인 메시지가 있습니다. 이전 요청이 처리된 이후에 다시 시도하세요");
            return;
        }

        // TODO: 몽고디비 연결해서 메시지 저장 & 이전 대화내역 가져오기
        
        // 메시지 발행
        console.log(`Message from ${username}: ${msg}`);
        publish(username, msg, "celery");
    });

    socket.on("disconnect", () => {
        // 소켓 연결 해제시 구독 취소
        unsubscribe(socket.data.consumerTag);
        console.log(`User ${socket.data.username} disconnected`);
    });
});


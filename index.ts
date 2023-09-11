import { Server, Socket } from "socket.io";

import express from "express";
import http from "http";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { isTokenExist } from "./redis";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: "/ws",
    cors: {
        origin: [process.env.CORS_ALLOW_ORIGIN || "http://localhost:3000"]
    },
    serveClient: false,
    // transports: ['websocket'],
});

const secret = process.env.SECRET || "secret";

function decodeJwtToken(token:string|undefined) {
    // token 존재 확인
    if (token == undefined) {
        console.log("Token is not given");
        throw new JsonWebTokenError("Token is not given");
    }

    // redis에 토큰 존재하는지 확인
    const tokenExistInRedis = isTokenExist(token);
    if (!tokenExistInRedis) {
        console.log("Token has been expired");
        throw new JsonWebTokenError("Token has been expired");
    }

    const decodedToken = jwt.verify(token, secret);
    console.log(`User ${decodedToken} connected`);
    return decodedToken;
}

const authenticateSocket = (socket:Socket, next: (err?: Error) => void) => {
    const token:string|undefined = socket.handshake.auth.token;

    try {
        const decodedToken = decodeJwtToken(token);
        console.log(decodedToken);
        socket.data.user = decodedToken;
        next();
    } catch (err) {
        // 실패시 소켓 연결 종료
        console.log("Authentication failed:", err);
        socket.disconnect(true);
        next(new Error("Authentication failed"));
    }
}

// middleware로 토큰 검증
// io.use(authenticateSocket);

io.on("connection", (socket:Socket) => {
    console.log("user connected");
    
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
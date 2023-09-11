import { Server, Socket } from "socket.io";

import express from "express";
import http from "http";

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
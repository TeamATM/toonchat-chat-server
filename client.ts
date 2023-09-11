import { io } from "socket.io-client";

const socket = io("http://localhost:3000/", {path: "/ws"});

socket.on("connect", () => {
    console.log(`connect ${socket.id}`);
})
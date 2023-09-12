import { Socket, io } from "socket.io-client";
import jwt from "jsonwebtoken";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

const secret = process.env.SECRET || "secret";
const token = jwt.sign({sub: "user1", role: "user"}, secret);

const socket:Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000/", {
    path: "/ws",
    auth: {
        // token: token,
    }
});

socket.on("connect", () => {
    console.log(`connect ${socket.id}`);

    setTimeout(()=>{
        socket.emit("publish", "hello")
    }, 1000)

    setInterval(()=> {
        socket.emit("publish", "A");
    }, 5000);

    socket.on("subscribe", msg => {
        console.log(msg);
    })
})
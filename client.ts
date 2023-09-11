import { io } from "socket.io-client";
import jwt from "jsonwebtoken";

const secret = process.env.SECRET || "secret";
const token = jwt.sign({username: "user1", role: "user"}, secret);

const socket = io("http://localhost:3000/", {
    path: "/ws",
    auth: {
        token: token,
    }
});

socket.on("connect", () => {
    console.log(`connect ${socket.id}`);
})
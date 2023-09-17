import jwt from "jsonwebtoken";
import readline from "readline";
import "./src/config";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Socket, io } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./src/types";

const secret = process.env.SECRET || "secret";
const token = jwt.sign({ sub: "user1", role: "user" }, secret);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const socket:Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000/", {
    path: "/ws",
    auth: {
        token,
    },
});

function question(query:string) {
    return new Promise((resolve) => {
        rl.question(query, (ans) => {
        // rl.close();
            resolve(ans);
        });
    });
}

const header:Headers = new Headers();
header.set("Authorization", `Bearer ${token}`);
fetch("http://localhost:3000/chat/history/0", { headers: header }).then(async (res) => { console.log(await res.json()); });
fetch("http://localhost:3000/chat/recent", { headers: header }).then(async (res) => { console.log(await res.json()); });

socket.on("connect", async () => {
    console.log(`connect ${socket.id}`);

    socket.on("subscribe", (msg) => {
        console.log(msg);
    });

    // 에러 발생 ex) 길이 제한, 요청 제한...
    socket.on("error", (msg) => {
        console.error(`ERROR: ${msg.content}`);
    });

    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const input = String(await question("Input: "));
        socket.emit("publish", { content: input, characterId: 0 });
    }
});

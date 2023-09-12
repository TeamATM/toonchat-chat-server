import { Socket, io } from "socket.io-client";
import jwt from "jsonwebtoken";
import readline from "readline"
import { ClientToServerEvents, ServerToClientEvents } from "./src/types";

const secret = process.env.SECRET || "secret";
const token = jwt.sign({sub: "user1", role: "user"}, secret);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

const socket:Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000/", {
    path: "/ws",
    auth: {
        token: token,
    }
});


function question(query:string) {
    return new Promise(resolve => 
      rl.question(query, ans => {
        // rl.close();
        resolve(ans);
      })
    );
  }

socket.on("connect", async () => {
    console.log(`connect ${socket.id}`);

    socket.on("subscribe", msg => {
        console.log(msg);
    })

    while (true) {
        let input = String(await question("Input: "));
        socket.emit("publish", input, 1);
    }
})
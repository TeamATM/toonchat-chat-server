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
/**
[
  {
    _id: '6506c32143852e0fca0bbb16',
    replyMessageId: '6506c32143852e0fca0bbb17',
    content: '2',
    userId: 'user1',
    characterId: 0,
    fromUser: true,
    createdAt: '2023-09-17T09:13:05.703Z',
    __v: 0
  },
  {
    _id: '6506c32143852e0fca0bbb17',
    content: 'this is a message from botId: 0',
    userId: 'user1',
    characterId: 0,
    fromUser: false,
    createdAt: '2023-09-17T09:13:05.841Z',
    __v: 0
  },
  {
    _id: '6506e5f90f51f5e6188a20ae',
    replyMessageId: '6506e5f90f51f5e6188a20af',
    content: 'HI',
    userId: 'user1',
    characterId: 0,
    fromUser: true,
    createdAt: '2023-09-17T11:41:45.870Z',
    __v: 0
  },
  {
    _id: '6506e63bb7f32748ddbe8f4b',
    replyMessageId: '6506e63bb7f32748ddbe8f4c',
    content: 'HI',
    userId: 'user1',
    characterId: 0,
    fromUser: true,
    createdAt: '2023-09-17T11:42:51.837Z',
    __v: 0
  },
  {
    _id: '6506e641b7f32748ddbe8f4f',
    replyMessageId: '6506e641b7f32748ddbe8f50',
    content: 'zz',
    userId: 'user1',
    characterId: 0,
    fromUser: true,
    createdAt: '2023-09-17T11:42:57.369Z',
    __v: 0
  }
]
*/
fetch("http://localhost:3000/chat/recent", { headers: header }).then(async (res) => { console.log(await res.json()); });

/**
[
  {
    _id: 0,
    recentMessages: {
      _id: '6506e641b7f32748ddbe8f4f',
      replyMessageId: '6506e641b7f32748ddbe8f50',
      content: 'zz',
      characterId: 0,
      fromUser: true,
      createdAt: '2023-09-17T11:42:57.369Z'
    }
  },
  {
    _id: 1,
    recentMessages: {
      _id: '6506b58006d4f37377a7dafd',
      content: 'this is a message from botId: 1',
      characterId: 1,
      fromUser: false,
      createdAt: '2023-09-17T08:14:56.736Z'
    }
  }
]
 */
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

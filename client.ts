import jwt from "jsonwebtoken";
import readline from "readline";
import "./src/config";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Socket, io } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./src/socket";
import logger from "./src/logger";
import { Message } from "./src/message_queue";

// const host = "https://chat.webtoonchat.com";
const host = "http://localhost";
const secret = process.env.SECRET || "secret";
console.log(secret);
const token = jwt.sign({ sub: "user1", role: "user" }, `${secret}`);
console.log(token);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const socket:Socket<ServerToClientEvents, ClientToServerEvents> = io(host, {
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
fetch(
    `${host}/chat/history/0`,
    { headers: header },
).then(async (res) => {
    const j:Message[] = await res.json();
    const h = j.reduce((prev, cur) => { prev.push(cur.content); return prev; }, new Array<string>());
    console.log(h);
});
/**
[
  {
    messageId: '6512e67a8f76aa8d96c1cd0e',
    replyMessageId: '6512e67b8f76aa8d96c1cd13',
    fromUser: false,
    content: 'this is a message from botId: 0',
    createdAt: '2023-09-26T14:11:07.293Z'
  },
  {
    messageId: '6512e68a8f76aa8d96c1cd16',
    replyMessageId: '6512e68a8f76aa8d96c1cd17',
    fromUser: true,
    content: '1',
    createdAt: '2023-09-26T14:11:22.089Z'
  },
  {
    messageId: '6512e68a8f76aa8d96c1cd17',
    replyMessageId: '6512e68a8f76aa8d96c1cd1c',
    fromUser: false,
    content: 'this is a message from botId: 0',
    createdAt: '2023-09-26T14:11:22.569Z'
  },
  {
    messageId: '6512eba5341d9d3da502413b',
    replyMessageId: '6512eba5341d9d3da502413c',
    fromUser: true,
    content: 'lkdsfjlsdakfjsad',
    createdAt: '2023-09-26T14:33:09.335Z'
  },
  {
    messageId: '6512eba5341d9d3da502413c',
    replyMessageId: '6512eba5341d9d3da5024140',
    fromUser: false,
    content: 'this is a message from botId: 0',
    createdAt: '2023-09-26T14:33:09.952Z'
  }
]
*/
fetch(
    `${host}/chat/recent`,
    { headers: header },
).then(async (res) => { console.log(await res.json()); });

/**
[
  {
    lastMessage: {
      messageId: '6512ef254f7c8742fc8862a7',
      replyMessageId: '6512ef264f7c8742fc8862ab',
      fromUser: false,
      content: 'this is a message from botId: 1',
      createdAt: '2023-09-26T14:48:06.012Z'
    },
    characterId: 1
  },
  {
    lastMessage: {
      messageId: '6512eba5341d9d3da502413c',
      replyMessageId: '6512eba5341d9d3da5024140',
      fromUser: false,
      content: 'this is a message from botId: 0',
      createdAt: '2023-09-26T14:33:09.952Z'
    },
    characterId: 0
  }
]
 */
socket.on("connect", async () => {
    console.log(`connect ${socket.id}`);

    socket.on("subscribe", (msg) => {
        // logger.info(msg);
        console.log(msg);
        console.log(typeof msg.createdAt);
    });

    // 에러 발생 ex) 길이 제한, 요청 제한...
    socket.on("error", (msg) => {
        logger.error(`ERROR: ${msg.content}`);
    });

    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const input = String(await question("Input: "));
        socket.emit("publish", { content: input, characterId: 0 });
    }
});

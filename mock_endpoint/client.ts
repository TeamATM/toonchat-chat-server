import jwt from "jsonwebtoken";
import readline from "readline";
import "../src/config";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Socket, io } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../src/socket";
import logger from "../src/logger";
import { Message } from "../src/message_queue";

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
    // const h = j.reduce((prev, cur) => { prev.push(cur.content); return prev; }, new Array<string>());
    console.log(j);
});
/**
[
  {
    messageId: '6523ff7a4f50ead36acf9391',
    replyMessageId: '6523ff7a4f50ead36acf9392',
    fromUser: true,
    content: 'ㅎㅇ',
    createdAt: '2023-10-09T13:26:18.013Z'
  },
  {
    messageId: '6523ff7a4f50ead36acf9392',
    replyMessageId: '6523ff7d4f50ead36acf9396',
    fromUser: false,
    content: '안녕하세요! 그런데 왜 갑자기 말을 놓으시는 거예요',
    createdAt: '2023-10-09T13:26:21.379Z'
  },
  {
    messageId: '6523ff7e4f50ead36acf939a',
    replyMessageId: '6523ff7e4f50ead36acf939b',
    fromUser: true,
    content: '넌 누구니',
    createdAt: '2023-10-09T13:26:22.753Z'
  },
  {
    messageId: '6523ff7e4f50ead36acf939b',
    replyMessageId: '6523ff814f50ead36acf939f',
    fromUser: false,
    content: '전 이 그룹에서 부회장을 맡고 있는 이영준이랍니다',
    createdAt: '2023-10-09T13:26:25.917Z'
  },
  {
    messageId: '6524de354f50ead36acf93b2',
    replyMessageId: '6524de354f50ead36acf93b3',
    fromUser: true,
    content: 'ㅇ',
    createdAt: '2023-10-10T05:16:37.283Z'
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
      messageId: '6523ffc44f50ead36acf93a4',
      replyMessageId: '6523ffc84f50ead36acf93a8',
      fromUser: false,
      content: '전 어릴 때부터 일을 했어요 그래서 그런지 머리가 좋은 편이거든요',
      createdAt: '2023-10-09T13:27:36.661Z'
    },
    characterInfo: {
      _id: 1,
      __v: 0,
      backgroundImageUrl: '/',
      hashTag: '#카카오페이지 #김비서가왜그럴까gdgdgd',
      name: '김미소',
      profileImageUrl: '/',
      stateMessage: '상태메시지'
    },
    characterId: 1
  },
  {
    lastMessage: {
      messageId: '652ff52f00c0058080989fb6',
      replyMessageId: null,
      fromUser: false,
      content: '근데 저만 그런 게 아니라 다들 그렇게 생각해요',
      createdAt: '2023-10-18T15:40:32.411Z'
    },
    characterInfo: {
      _id: 0,
      __v: 0,
      backgroundImageUrl: '/',
      hashTag: '#카카오페이지 #김비서가왜그럴까',
      name: '이영준',
      profileImageUrl: '/',
      stateMessage: '상태메시지'
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

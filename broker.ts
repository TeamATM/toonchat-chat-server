import * as amqp from "amqplib";
import { createPool, Pool } from "generic-pool";
import { Chat, MessageFromMQ, MessageToMQ, TypeSocket } from "./types";
import { generateRandomId } from "./utils";

const amqpUrl = process.env.AMQP_URL || "amqp://localhost:5672";
const exchangeNameForPublish = "celery";
const exchangeNameForSubscribe = "amq.topic";

// 커넥션 풀 생성 (커넥션 하나당 채널 하나)
const amqpPool: Pool<amqp.Channel> = createPool({
    create: async () => {
        const connection = await amqp.connect(amqpUrl);
        return await connection.createChannel();
    },
    destroy: async (channel:amqp.Channel) => {
        const connection = channel.connection;
        await channel.close();
        await connection.close();
    }
}, {
    min: 1,
    max: 10,
})

function buildMessage(history:Array<Chat> = [], username:string, message:string) {
    const msg: MessageToMQ = {
        id: "id",
        task: "inference",
        args: [
            {
                history,
                userId: username,
                content: message,
                messageFrom: username,
                messageTo: "1",
                characterName: "김미소",
                generationArgs: {
                    temperature: 0.3,
                    repetition_penalty: 1.5,
                }
            },
            false
        ],
        kwargs: new Map<string, string>()
    }
    
    return JSON.stringify(msg);
}

async function publish(username:string, message: string, routingKey: string = "celery") {  
    const channel = await amqpPool.acquire();

    try {
        // TODO: Exchange 검증 지우기
        await channel.assertExchange(exchangeNameForPublish, "direct", {durable: true});
        // 메시지 발행
        channel.publish(exchangeNameForPublish, routingKey, Buffer.from(buildMessage([], username, "HI")), {contentType: "application/json"});
    } catch (err) {
        console.error(`Error occured while sending message ${username}: ${message}`);
    } finally {
        // 커넥션풀 반환
        if (channel) {
            amqpPool.release(channel);
        }
    }
}

async function subscribe(socket:TypeSocket) {
    const channel = await amqpPool.acquire();
    // 접속자별로 큐 생성
    const randomQueueName = `${socket.data.username}_${generateRandomId()}`;

    let consumerTag:string = "";
    try {
        // 큐를 생성(존재하지 않으면)하고 Exchange에 username을 라우팅키로 바인드
        // durable -> 메시지 저장소에 저장(재시작시에도 남아있음)
        // autoDelete -> consumer가 없다면 큐 삭제
        await channel.assertQueue(randomQueueName, {durable: true, autoDelete: true});
        await channel.bindQueue(randomQueueName, exchangeNameForSubscribe, socket.data.username);

        // consumerTag = 소켓 연결이 끊어졌을때 구독 취소를 위한 정보
        consumerTag = (await channel.consume(randomQueueName, msg => {
            if (msg === null) return;
            // console.log('Received message:', msg.content.toString("utf-8"));

            // 클라이언트에게 메시지 전달
            const messageFromMq:MessageFromMQ = JSON.parse(msg.content.toString("utf-8"));
            socket.emit("subscribe", messageFromMq);
            // 정상적으로 수신 완료
            channel.ack(msg);
        })).consumerTag;
        
    } catch (err) {
        console.error(err);
    } finally {
        // 커넥션풀에 반환
        if (channel) {
            amqpPool.release(channel);
        }
    }

    return consumerTag;
}

function unsubscribe(consumerTag: string) {
    amqpPool.acquire().then(channel => {
        channel.cancel(consumerTag)
        .catch(console.error)
        .finally(()=>{
            if (channel) amqpPool.release(channel);
        })
    })
}

export { publish, subscribe, unsubscribe };

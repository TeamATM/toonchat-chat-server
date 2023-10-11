// eslint-disable-next-line object-curly-newline
import { Options, Channel, connect, ConsumeMessage } from "amqplib";
import { createPool, Pool } from "generic-pool";
import { SubscribeProcessType } from "../socket";
import { MessageFromMQ, PublishMessage } from "./types";
import logger from "../logger";

const amqpUrl = process.env.AMQP_URL || "amqp://localhost:5672";
const defaultSubscribeExchange = "amq.topic";

// 커넥션 풀 생성 (커넥션 하나당 채널 하나)
const amqpPool: Pool<Channel> = createPool({
    create: async () => {
        const connection = await connect(amqpUrl);
        const channel = await connection.createChannel();
        return channel;
    },
    destroy: async (channel:Channel) => {
        const { connection } = channel;
        await channel.close();
        await connection.close();
    },
}, { min: 1, max: 10 });

async function publish(exchangeName:string, routingKey: string, message:PublishMessage) {
    const channel = await amqpPool.acquire();

    try {
        // await channel.assertExchange(exchangeName, "direct");
        channel.publish(
            exchangeName,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { contentType: "application/json", contentEncoding: "utf-8" },
        );
    } catch (err) {
        logger.fatal(err, `Error occured while sending message ${exchangeName} -> ${routingKey}: ${message}`);
    } finally {
        // 커넥션풀 반환
        if (channel) {
            amqpPool.release(channel);
        }
    }
}

function unsubscribe(consumerTag: string) {
    amqpPool.acquire().then((channel) => {
        channel.cancel(consumerTag)
            .catch(logger.error)
            .finally(() => {
                if (channel) amqpPool.release(channel);
            });
    });
}

async function subscribe(
    queueName:string,
    bindPattern:string,
    queueOptions:Options.AssertQueue,
    onMessageRecieved:SubscribeProcessType,
    exchangeName?:string,
) {
    const channel = await amqpPool.acquire();

    const messageCallback = async (message:ConsumeMessage | null) => {
        if (message === null) return;
        const messageFromMq:MessageFromMQ = JSON.parse(message.content.toString("utf-8"));

        if (await onMessageRecieved(messageFromMq)) {
            channel.ack(message); // 정상적으로 수신 완료
        } else {
            logger.fatal("NACK");
            channel.nack(message); // 오류 발생
        }
    };

    let consumerTag:string = "";
    try {
        await channel.assertQueue(queueName, queueOptions);
        await channel.bindQueue(queueName, exchangeName || defaultSubscribeExchange, bindPattern);

        // consumerTag = 소켓 연결이 끊어졌을때 구독 취소를 위한 정보
        consumerTag = (await channel.consume(queueName, messageCallback)).consumerTag;
    } catch (err) {
        logger.fatal(err);
    } finally {
        // 커넥션풀에 반환
        if (channel) {
            amqpPool.release(channel);
        }
    }

    return consumerTag;
}

export {
    publish, subscribe, unsubscribe,
};

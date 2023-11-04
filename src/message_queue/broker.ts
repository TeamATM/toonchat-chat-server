import {
    Options, Channel,
    connect, ConsumeMessage,
} from "amqplib";
import { createPool, Pool } from "generic-pool";
import { ConsumeMessageCallback, PublishMessage } from "../types";
import { logger } from "../config";

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

// eslint-disable-next-line no-unused-vars
async function withAmqpConnection<T>(callback: (channel: Channel) => Promise<T>): Promise<T> {
    const channel = await amqpPool.acquire();
    try {
        return await callback(channel);
    } finally {
        amqpPool.release(channel);
    }
}

export async function publish(exchangeName:string, routingKey: string, message:PublishMessage) {
    return withAmqpConnection(async (channel) => {
        channel.publish(
            exchangeName,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { contentType: "application/json", contentEncoding: "utf-8" },
        );
    });
}

export function unsubscribe(consumerTag: string) {
    withAmqpConnection(async (channel) => {
        channel.cancel(consumerTag);
    }).catch((err) => {
        logger.error(err, "Error occured while unsubscribe");
    });
}

// TODO: Unhandled exception 단순 ack 아니고 따로 처리 or 다른 큐로 보내서 2차 시도 후 버리기
export async function subscribe(
    queueName: string,
    bindPattern: string,
    queueOptions: Options.AssertQueue,
    callback: ConsumeMessageCallback,
    exchangeName: string = defaultSubscribeExchange,
) {
    return withAmqpConnection(async (channel) => {
        await channel.assertQueue(queueName, queueOptions);
        await channel.bindQueue(queueName, exchangeName || defaultSubscribeExchange, bindPattern);

        const handleMessage = async (msg: ConsumeMessage | null) => {
            if (!msg) return;
            try {
                await callback(msg);
                channel.ack(msg);
            } catch (err) {
                channel.nack(msg);
                logger.fatal(err);
            }
        };

        // consumerTag = 소켓 연결이 끊어졌을때 구독 취소를 위한 정보
        const { consumerTag } = await channel.consume(queueName, handleMessage);
        return consumerTag;
    });
}

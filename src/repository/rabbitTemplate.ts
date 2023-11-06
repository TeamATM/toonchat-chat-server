import {
    Options, Channel,
    connect, ConsumeMessage, Connection,
} from "amqplib";
import Container, { Service } from "typedi";
import { ConsumeMessageCallback, PublishMessage } from "../types";
import { EnvConfig, logger } from "../config";

@Service()
export class RabbitTemplate {
    private amqpUri;

    private defaultExchange;

    private connection:Connection;

    private channel:Channel;

    constructor() {
        this.amqpUri = Container.get(EnvConfig).ampqUri;
        this.defaultExchange = "amq.topic";
        this.connect();
    }

    connect = async () => {
        this.connection = await connect(this.amqpUri);
        this.channel = await this.connection.createChannel();
    };

    // eslint-disable-next-line no-unused-vars
    withAmqpConnection = async <T>(callback: (channel: Channel) => Promise<T>): Promise<T> => {
        if (!this.channel) {
            await this.connect();
        }
        return callback(this.channel);
    };

    // eslint-disable-next-line arrow-body-style
    publish = async (exchangeName:string, routingKey: string, message:PublishMessage) => {
        return this.withAmqpConnection(async (channel) => {
            channel.publish(
                exchangeName,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                { contentType: "application/json", contentEncoding: "utf-8" },
            );
        });
    };

    unsubscribe = (consumerTag: string) => {
        this.withAmqpConnection(async (channel) => {
            channel.cancel(consumerTag);
        }).catch((err) => {
            logger.error(err, "Error occured while unsubscribe");
        });
    };

    // TODO: Unhandled exception 단순 ack 아니고 따로 처리 or 다른 큐로 보내서 2차 시도 후 버리기
    subscribe = async (
        queueName: string,
        bindPattern: string,
        queueOptions: Options.AssertQueue,
        callback: ConsumeMessageCallback,
        exchangeName: string = this.defaultExchange,
    ) => this.withAmqpConnection(async (channel) => {
        await channel.assertQueue(queueName, queueOptions);
        await channel.bindQueue(queueName, exchangeName, bindPattern);

        const handleMessage = async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            callback(msg)
                .then(() => channel.ack(msg))
                .catch((err) => {
                    channel.nack(msg);
                    logger.fatal(err);
                });
        };

        // consumerTag = 소켓 연결이 끊어졌을때 구독 취소를 위한 정보
        const { consumerTag } = await channel.consume(queueName, handleMessage);
        return consumerTag;
    });
}

// import { createPool, Pool } from "generic-pool";
// 커넥션 풀 생성 (커넥션 하나당 채널 하나)
// const amqpPool: Pool<Channel> = createPool({
//     create: async () => {
//         const connection = await connect(amqpUrl);
//         const channel = await connection.createChannel();
//         return channel;
//     },
//     destroy: async (channel:Channel) => {
//         const { connection } = channel;
//         await channel.close();
//         await connection.close();
//     },
// }, { min: 1, max: 10 });

// const withAmqpConnection = async <T>(callback: (channel: Channel) => Promise<T>): Promise<T> => {
//     const channel = await amqpPool.acquire();
//     try {
//         return await callback(channel);
//     } finally {
//         amqpPool.release(channel);
//     }
// };

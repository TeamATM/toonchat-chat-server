import { Options, Channel, connect } from "amqplib";
import { createPool, Pool } from "generic-pool";
import {
    CharacterUpdateMessage, ConsumeMessageCallback,
    MessageFromInferenceServer, PublishMessage, SubscribeProcessType,
} from "../types";
import { logger } from "../logging";
import { deleteCharacterInformation, upsertCharacterInformation } from "../service";

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

// TODO: Unhandled exception 단순 ack 아니고 따로 처리 or 다른 큐로 보내서 2차 시도 후 버리기
async function subscribe(
    queueName: string,
    bindPattern: string,
    queueOptions: Options.AssertQueue,
    callback: ConsumeMessageCallback,
    exchangeName: string = defaultSubscribeExchange,
) {
    const channel = await amqpPool.acquire();

    let consumerTag:string = "";
    try {
        await channel.assertQueue(queueName, queueOptions);
        await channel.bindQueue(queueName, exchangeName || defaultSubscribeExchange, bindPattern);

        // consumerTag = 소켓 연결이 끊어졌을때 구독 취소를 위한 정보
        consumerTag = (await channel.consume(
            queueName,
            (msg) => callback(channel, msg)
                .catch((reason) => { channel.ack(msg!); logger.fatal(reason); }),
        )).consumerTag;
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

async function subscribeChatMessage(
    queueName:string,
    bindPattern:string,
    queueOptions:Options.AssertQueue,
    onMessageRecieved:SubscribeProcessType,
    exchangeName?:string,
) {
    const callback:ConsumeMessageCallback = async (channel, message) => {
        if (message === null) return;
        const messageFromMq:MessageFromInferenceServer = JSON.parse(message.content.toString("utf-8"));

        if (await onMessageRecieved(messageFromMq)) {
            channel.ack(message); // 정상적으로 수신 완료
        } else {
            logger.fatal("NACK");
            channel.nack(message); // 오류 발생
        }
    };

    return subscribe(queueName, bindPattern, queueOptions, callback, exchangeName);
}

async function subscribeCharacterUpdateMessage(
    queueName:string,
    bindPattern:string,
    queueOptions:Options.AssertQueue,
    exchangeName?:string,
) {
    const callback:ConsumeMessageCallback = async (channel, message) => {
        if (!message) return;
        const characterUpdateMessage:CharacterUpdateMessage = JSON.parse(message.content.toString("utf-8"));

        const handler = characterUpdateMessage.op?.toLowerCase() === "delete"
            ? deleteCharacterInformation : upsertCharacterInformation;

        if (await handler(characterUpdateMessage)) {
            channel.ack(message);
        } else {
            logger.fatal("NACK");
            channel.nack(message);
        }
    };

    return subscribe(queueName, bindPattern, queueOptions, callback, exchangeName);
}

export {
    publish, subscribeChatMessage, subscribeCharacterUpdateMessage, unsubscribe,
};

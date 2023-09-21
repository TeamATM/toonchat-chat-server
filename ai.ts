import "./src/config";
import logger from "./src/logger";
import { sub, publish } from "./src/message_queue/broker";
import { MessageFromMQ, MessageToAI } from "./src/message_queue/types";

sub("celery", "celery", { durable: true, autoDelete: false }, async (msg) => {
    const tmp:MessageToAI = msg as unknown as MessageToAI;
    logger.info(tmp);

    try {
        const data:MessageFromMQ = {
            messageId: tmp.id,
            characterId: tmp.args[0].characterId,
            createdAt: new Date(),
            userId: tmp.args[0].userId,
            fromUser: false,
            content: `this is a message from botId: ${tmp.args[0].characterId}`,
        };
        return publish("amq.topic", data.userId, data).then(() => true).catch((err) => { logger.error(err, `failed to public message\n${data}`); return false; });
    } catch (err) {
        logger.error(err);
    }

    return Promise.resolve(true);
}, "celery").catch((err) => logger.error(err, "failed to subscribe"));

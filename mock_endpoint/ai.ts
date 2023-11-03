import "../src/config/config";
import logger from "../src/logging/logger";
// eslint-disable-next-line object-curly-newline
import { subscribeChatMessage, publish, MessageFromMQ, MessageToAI } from "../src/message_queue";

subscribeChatMessage("celery", "celery", { durable: true, autoDelete: false }, async (msg) => {
    const tmp:MessageToAI = msg as unknown as MessageToAI;
    logger.trace(tmp);

    try {
        const data:MessageFromMQ = {
            messageId: tmp.id,
            characterId: tmp.args[0].history.characterId,
            createdAt: new Date(),
            userId: tmp.args[0].history.userId,
            fromUser: false,
            content: `this is a message from botId: ${tmp.args[0].history.characterId}`,
        };
        return publish(
            "amq.topic",
            data.userId,
            data,
        ).then(() => true).catch((err) => { logger.error(err, `failed to public message\n${data}`); return false; });
    } catch (err) {
        logger.error(err);
    }

    return Promise.resolve(true);
}, "celery").catch((err) => logger.error(err, "failed to subscribe"));

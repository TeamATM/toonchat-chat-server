import "reflect-metadata";
import Container from "typedi";
import "../src/config/config";
import { RabbitTemplate } from "../src/repository";
import { logger } from "../src/config";
import { MessageFromInferenceServer, MessageToInferenceServer } from "../src/types";

const rabbitTemplate = Container.get(RabbitTemplate);
rabbitTemplate.subscribe("celery", "celery", { durable: true, autoDelete: false }, async (message) => {
    try {
        const tmp:MessageToInferenceServer = JSON.parse(message.content.toString("utf-8"));
        logger.trace(tmp);
        const data:MessageFromInferenceServer = {
            messageId: tmp.id,
            characterId: tmp.args[0].history.characterId,
            createdAt: new Date(),
            userId: tmp.args[0].history.userId,
            fromUser: false,
            content: `this is a message from botId: ${tmp.args[0].history.characterId}`,
        };
        rabbitTemplate.publish(
            "amq.topic",
            data.userId,
            data,
        ).then(() => true).catch((err) => { logger.error(err, `failed to public message\n${data}`); return false; });
    } catch (err) {
        logger.error(err);
    }
}, "celery").catch((err) => logger.error(err, "failed to subscribe"));

import { logger } from "../config";
import { buildBotMessage } from ".";
import {
    CharacterUpdateMessage, ConsumeMessageCallback,
    Message, MessageFromInferenceServer,
} from "../types";
import {
    deleteCharacterInformation, updateHistory,
    updateMessage, upsertCharacterInformation,
} from "../service";

export const onMessageToDefaultListener: ConsumeMessageCallback = async (message) => {
    if (!message.content) return;

    const messageFromMq: MessageFromInferenceServer = JSON.parse(message.content.toString("utf-8"));
    if (messageFromMq.fromUser === false) {
        updateBotMessageAndHistory(messageFromMq);
    }
};

export const onCharacterUpdateMessageRecieved: ConsumeMessageCallback = async (message) => {
    const characterUpdateMessage: CharacterUpdateMessage = JSON.parse(message.content.toString("utf-8"));

    const handler = characterUpdateMessage.op?.toLowerCase() === "delete"
        ? deleteCharacterInformation : upsertCharacterInformation;

    await handler(characterUpdateMessage);
};

async function updateBotMessageAndHistory(messageFromMQ: MessageFromInferenceServer) {
    const msg: Message = buildBotMessage(messageFromMQ.content, messageFromMQ.messageId);

    logger.debug(messageFromMQ);

    try {
        updateMessage(messageFromMQ.userId, messageFromMQ.characterId, msg);
        return updateHistory(messageFromMQ.userId, messageFromMQ.characterId, msg);
    } catch (err) {
        logger.error(err, "failed to update bot message.");
        return undefined;
    }
}

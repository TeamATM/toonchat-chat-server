import { Chat, Message, PublishMessage } from "./types";

function buildMessage(message: Message, history?:Chat[]):PublishMessage {
    if (history !== undefined) {
        return {
            id: String(message.replyMessageId!),
            task: "inference",
            args: [
                {
                    history,
                    persona: "",
                    userId: message.userId,
                    characterId: message.characterId,
                    content: message.content,
                    generationArgs: {
                        temperature: 0.3,
                        repetition_penalty: 1.5,
                    },
                },
                false,
            ],
            kwargs: new Map<string, string>(),
        };
    }
    return {
        // eslint-disable-next-line no-underscore-dangle
        messageId: String(message._id),
        characterId: message.characterId,
        createdAt: message.createdAt,
        content: message.content,
        fromUser: true,
    };
}

// eslint-disable-next-line import/prefer-default-export
export { buildMessage };

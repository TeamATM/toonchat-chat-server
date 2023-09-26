import { MongooseError } from "mongoose";
import { EmbeddingDocument, HistoryDocument, PersonaDocument } from "../mongo/types";
import { MessageToClient } from "../types";
import { MessageToAI } from "./types";

export function buildInferenceMessage(
    history:HistoryDocument,
    persona?:PersonaDocument,
    reference:EmbeddingDocument[] = [],
):MessageToAI {
    const lastMessage = history.messages.at(-1);
    if (!lastMessage) {
        throw new MongooseError("there is no last message in document");
    }

    return {
        id: String(lastMessage.replyMessageId!),
        task: "inference",
        args: [
            {
                history,
                persona: persona ? persona.persona.join(" ") : "",
                // eslint-disable-next-line max-len
                reference: reference.reduce((prev, cur) => { prev.push(cur.text); return prev; }, new Array<string>()),
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

export function buildEchoMessage(history:HistoryDocument):MessageToClient {
    const lastMessage = history.messages.at(-1);
    if (!lastMessage) {
        throw new MongooseError("there is no last message in document");
    }

    return {
        messageId: lastMessage.messageId.toString(),
        characterId: history.characterId,
        createdAt: lastMessage.createdAt,
        content: lastMessage.content,
        fromUser: lastMessage.fromUser,
    };
}

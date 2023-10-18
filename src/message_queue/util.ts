import { MongooseError, Types } from "mongoose";
import { EmbeddingDocument, HistoryDocument, CharacterDocument } from "../mongo";
import { MessageToClient } from "../socket";
import { Message, MessageToAI } from "./types";

export function buildInferenceMessage(
    history:HistoryDocument,
    persona?:CharacterDocument,
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

export function buildEchoMessage(message:Message, characterId:number):MessageToClient {
    return {
        messageId: message.messageId.toString(),
        characterId,
        createdAt: message.createdAt,
        content: message.content,
        fromUser: message.fromUser,
    };
}

function buildMessage(content:string, fromUser:boolean, messageId?:string):Message {
    return {
        messageId: new Types.ObjectId((messageId && Types.ObjectId.isValid(messageId)) ? messageId : undefined),
        replyMessageId: fromUser ? new Types.ObjectId() : undefined,
        fromUser,
        content,
        createdAt: new Date(),
    };
}

export function buildUserMessage(content:string) {
    return buildMessage(content, true, undefined);
}

export function buildBotMessage(content:string, messageId:string) {
    return buildMessage(content, false, messageId);
}

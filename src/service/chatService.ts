/* eslint-disable import/prefer-default-export */
import { Service } from "typedi";
import { Types } from "mongoose";
import { ChatModel } from "../repository";
import { ChatDocument, StoredChat } from "../types";
import { getCurrentDate } from "../utils";

@Service()
export class ChatService {
    private updateChat = async (userId: string, characterId: number, msg: StoredChat) => {
        // Start of day
        const startDay = getCurrentDate(msg.createdAt);

        return ChatModel.updateOne<ChatDocument>(
            { userId, characterId, date: startDay },
            { $push: { messages: msg } },
            { upsert: true },
        );
    };

    updateUserChat = (userId: string, characterId: number, content: string) => {
        const msg = buildUserStoredChat(content);
        this.updateChat(userId, characterId, msg);
        return msg;
    };

    updateBotChat = (userId: string, characterId: number, msg:StoredChat) => this
        .updateChat(userId, characterId, msg);
}

function buildStoredChat(content: string, fromUser: boolean, messageId?: string): StoredChat {
    return {
        messageId: new Types.ObjectId((messageId && Types.ObjectId.isValid(messageId)) ? messageId : undefined),
        replyMessageId: fromUser ? new Types.ObjectId() : undefined,
        fromUser,
        content,
        createdAt: new Date(),
    };
}

export function buildUserStoredChat(content: string) {
    return buildStoredChat(content, true, undefined);
}

export function buildBotStoredChat(content: string, messageId: string) {
    return buildStoredChat(content, false, messageId);
}

/* eslint-disable import/prefer-default-export */
import { Message } from "../message_queue";
import { MessageModel, MessageDocument } from "../mongo";
import { getCurrentDate } from "../utils";

export function updateMessage(userId: string, characterId: number, msg: Message) {
    // Start of day
    const startDay = getCurrentDate(msg.createdAt);

    return MessageModel.updateOne<MessageDocument>(
        { userId, characterId, date: startDay },
        { $push: { messages: msg } },
        { upsert: true },
    ).exec();
}

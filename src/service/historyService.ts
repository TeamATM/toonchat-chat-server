import logger from "../logger";
import { Message } from "../message_queue";
// eslint-disable-next-line object-curly-newline
import { historyLength, HistoryModel, MessageModel, HistoryDocument, MessageDocument } from "../mongo";

export async function updateHistory(userId: string, characterId: number, msg: Message) {
    try {
        return HistoryModel.findOneAndUpdate<HistoryDocument>(
            { userId, characterId },
            {
                $push: {
                    messages: {
                        $each: [msg],
                        $slice: -historyLength,
                    },
                },
            },
            { upsert: true, new: true },
        );
    } catch (err) {
        logger.error(err);
        return undefined;
    }
}

export function findHistoryByUserIdAndCharacterId(userId: string, characterId: number) {
    try {
        return HistoryModel.findOne<HistoryDocument>({ userId, characterId }).exec();
    } catch (err) {
        logger.error(err);
        return null;
    }
}

async function getChatHistoryLtDate(userId: string, characterId: number, dateBefore: Date, limit?: number) {
    let query = MessageModel
        .find<MessageDocument>({ userId, characterId, date: { $lt: dateBefore } })
        .sort({ date: 1 });
    if (limit) query = query.limit(limit);

    return query.exec();
}

export async function getChatHistoryAll(userId: string, characterId: number) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getChatHistoryLtDate(userId, characterId, tomorrow);
}

export async function getChatHistoryOfDay(userId: string, characterId: number, day: Date) {
    day.setHours(23, 59, 59, 999);
    return getChatHistoryLtDate(userId, characterId, day, 1);
}

export async function getRecentChat(userId: string) {
    try {
        const recentMessages = HistoryModel.aggregate([
            { $match: { userId } },
            { $unwind: "$messages" },
            {
                $group: {
                    _id: "$characterId",
                    lastMessage: { $last: "$messages" },
                },
            },
            {
                $project: {
                    _id: 0,
                    characterId: "$_id",
                    lastMessage: 1,
                },
            },
        ]).exec();

        return recentMessages;
    } catch (err) {
        logger.fatal(err, `failed to get recent chat of user: ${userId}`);
        return undefined;
    }
}
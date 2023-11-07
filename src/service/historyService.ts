import { Service } from "typedi";
import { EnvConfig, logger } from "../config";
import { HistoryModel, ChatModel } from "../repository";
import { HistoryDocument, ChatDocument, StoredChat } from "../types";

@Service()
export class HistoryService {
    private historyLength;

    constructor(envConfig:EnvConfig) {
        this.historyLength = envConfig.chatHistoryLength;
    }

    // eslint-disable-next-line arrow-body-style
    updateHistory = (userId: string, characterId: number, msg: StoredChat) => {
        return HistoryModel.findOneAndUpdate<HistoryDocument>(
            { userId, characterId },
            {
                $push: {
                    messages: {
                        $each: [msg],
                        $slice: -this.historyLength,
                    },
                },
            },
            { upsert: true, new: true },
        ).exec();
    };

    findHistoryByUserIdAndCharacterId = (userId: string, characterId: number) => {
        try {
            return HistoryModel.findOne<HistoryDocument>({ userId, characterId }).exec();
        } catch (err) {
            logger.error(err);
            return null;
        }
    };

    getChatHistoryLtDate = (userId: string, characterId: number, dateBefore: Date, limit?: number) => {
        let query = ChatModel
            .find<ChatDocument>({ userId, characterId, date: { $lt: dateBefore } })
            .sort({ date: 1 });
        if (limit) query = query.limit(limit);

        return query.exec();
    };

    getChatHistoryAll = (userId: string, characterId: number) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.getChatHistoryLtDate(userId, characterId, tomorrow);
    };

    getChatHistoryOfDay = (userId: string, characterId: number, day: Date) => {
        day.setHours(23, 59, 59, 999);
        return this.getChatHistoryLtDate(userId, characterId, day, 1);
    };

    getRecentChat = (userId: string) => {
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
                    $lookup: {
                        from: "characters",
                        localField: "_id",
                        foreignField: "_id",
                        as: "characterInfo",
                    },
                },
                { $unwind: "$characterInfo" },
                {
                    $project: {
                        _id: 0,
                        characterId: "$_id",
                        lastMessage: 1,
                        characterInfo: 1,
                    },
                },
                { $project: { "characterInfo.persona": 0 } },
                { $addFields: { "characterInfo.characterId": "$characterId" } },
                { $sort: { "messages.createdAt": -1 } },
            ]).exec();

            return recentMessages;
        } catch (err) {
            logger.fatal(err, `failed to get recent chat of user: ${userId}`);
            return undefined;
        }
    };
}
